"""Lighting and stability harness tests (SKN-03, LGT-01, LGT-02, LGT-03, CAT-B3, RB2-01).

Pass definition: the harness runs the real shade engine on a tiny drawn plan
and returns tallies with mst_band and undertone axes; warning and guidance
rules read the engine's own words; a perfect chart reads zero error; cached
readings are reused. These prove the measuring code; the numbers are triage
only. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from lab.bqa_shade import bands, engine, lights, stability, synth


def reading(*, refused: bool, reason: str = "", notes: tuple[str, ...] = (),
            best_lab: tuple[float, float, float] | None = None) -> engine.Reading:
    return engine.Reading(refused=refused, reason=reason, measured_lab=(50.0, 10.0, 15.0),
                          undertone="warm", depth_band=5, best_id="S1" if best_lab else None,
                          best_lab=best_lab, best_step=3 if best_lab else None,
                          alternative_id=None, gains=(1.0, 1.0, 1.0), white_mode="grey_world",
                          notes=notes, lighting_usable=True, overall_confidence=0.5)


@pytest.fixture(scope="module")
def harness() -> stability.Harness:
    cells = tuple(c for c in bands.skin_grid() if (c[0], c[1]) in {(5, "warm"), (8, "olive")})
    plan = stability.Plan(cells, repeats=1, seed=3, width=160, height=200)
    return stability.Harness(engine.ShadeEngine(), plan)


def test_warning_and_guidance_rules() -> None:
    told = reading(refused=True, reason="The cheeks have incompatible lighting; retake in even "
                   "daylight.")
    assert stability.warned(told) and stability.guided(told)
    vague = reading(refused=True, reason="the closest reference shade is too far")
    assert not stability.warned(vague) and not stability.guided(vague)
    noted = reading(refused=False, notes=("Low light was detected.",), best_lab=(50, 10, 15))
    assert stability.warned(noted) and not stability.guided(noted)
    silent = reading(refused=False, best_lab=(50, 10, 15))
    assert not stability.warned(silent)


def test_acceptable_uses_ciede2000_limit() -> None:
    close = reading(refused=False, best_lab=(50.5, 10.0, 15.0))
    assert stability.acceptable(close, (50.0, 10.0, 15.0), 3.0)
    assert not stability.acceptable(close, (60.0, 10.0, 15.0), 3.0)
    assert not stability.acceptable(reading(refused=True), (50.0, 10.0, 15.0), 3.0)


def test_chart_error_is_zero_on_a_perfect_capture() -> None:
    scene = synth.draw_face((60.0, 12.0, 18.0), width=160, height=200, with_chart=True)
    image = synth.to_srgb8(scene.linear)
    assert stability.chart_error(image, scene, (1.0, 1.0, 1.0)) < 0.6
    assert stability.chart_error(image, scene, (1.3, 1.0, 0.8)) > 3.0
    plain = synth.draw_face((60.0, 12.0, 18.0), width=160, height=200)
    with pytest.raises(ValueError):
        stability.chart_error(image, plain, (1.0, 1.0, 1.0))


def test_chart_errors_per_light(harness: stability.Harness) -> None:
    measure = harness.chart_errors(3.0, ("daylight", "dim_evening"))
    assert measure.tally.n == 4
    assert measure.measured["chart_de00_mean_daylight"] < 3.0
    assert measure.measured["chart_de00_mean_dim_evening"] > 3.0


def test_poor_light_tallies(harness: stability.Harness) -> None:
    warn, guide = harness.poor_light()
    assert warn.tally.n == guide.tally.n == 2 * len(lights.poor_cases())
    assert guide.tally.passed <= warn.tally.n
    rows = [g.to_row() for g in warn.tally.groups(stability.ORDERS, minimum=1.0)]
    assert {r["axis"] for r in rows} == {"mst_band", "undertone", "light", "case_kind"}


def test_consistency_repeat_and_tone(harness: stability.Harness) -> None:
    measure = harness.consistency()
    assert measure.tally.n + measure.excluded == 2
    repeat = harness.repeat_stability(repeats=3)
    assert repeat.tally.n == 2
    tone, under = harness.tone_agreement()
    assert tone.tally.n == under.tally.n == 2
    assert tone.tally.passed == 2


def test_bathroom_gap_and_cache(harness: stability.Harness) -> None:
    before = harness.calls
    day, bath = harness.bathroom_gap(3.0)
    assert day.tally.n == bath.tally.n == 2
    calls = harness.calls
    harness.bathroom_gap(3.0)
    assert harness.calls == calls >= before


def test_quick_and_full_plans() -> None:
    quick = stability.Plan.quick()
    assert len(quick.cells) == 10
    assert {bands.band_of_step(c[0]) for c in quick.cells} == set(bands.REPORTING_BANDS)
    assert len(stability.Plan.full().cells) == len(bands.skin_grid())


def test_harness_needs_the_engine() -> None:
    class Missing(engine.ShadeEngine):
        def __init__(self) -> None:
            self.unavailable = engine.Unavailable(engine.NO_EXPORT, "find_reliable_shade")
            self._reader = None
            self._steps = {}

    with pytest.raises(RuntimeError):
        stability.Harness(Missing(), stability.Plan.quick())
    assert np.isfinite(lights.camera().max_gain)
