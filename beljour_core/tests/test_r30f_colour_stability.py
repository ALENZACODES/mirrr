"""Two-to-six-reading fibre colour stability on drawn hair; coded refusals, no guessing.

Synthetic drawn patches and Lab values only. Author: John Khan.
"""
from __future__ import annotations

import pytest

from plumb_api.engines.concealer.colour_stability import (
    MAX_READINGS,
    assess_colour_stability,
    mixed_light_limit,
)
from plumb_api.engines.concealer.shade_support import FibreReading, plan_fibre_colour, read_fibre_colour
from plumb_api.engines.shade.finder import thresholds
from tests.test_r30f_fibre_colour import COOL, DAY, WARM, drawn_hair


def corrected(cast: tuple[float, float, float], seed: int = 0) -> FibreReading:
    photo, hair, card = drawn_hair(cast, seed=seed)
    return read_fibre_colour(photo, hair, neutral_mask=card)


def test_limit_is_the_committed_w6_zone_bound() -> None:
    conf = thresholds()["confidence"]
    assert mixed_light_limit() == conf["zone_delta_e_ok"] + conf["zone_delta_e_span"] == 10.0


def test_three_corrected_lights_agree_on_one_swatch() -> None:
    readings = [corrected(DAY), corrected(WARM, seed=1), corrected(COOL, seed=2)]
    result = assess_colour_stability(readings)
    assert result.stable and not result.refused and result.code is None
    assert result.plan is not None and result.plan.best is not None
    assert set(result.picks) == {result.plan.best.record.id}
    assert result.spread < 2.0
    body = result.public()
    assert body["readings"] == 3 and body["limit_delta_e"] == 10.0 and body["plan"]["refused"] is False


def test_an_uncorrected_reading_refuses_the_set() -> None:
    photo, hair, _ = drawn_hair(WARM)
    result = assess_colour_stability([corrected(DAY), read_fibre_colour(photo, hair)])
    assert result.code == "uncorrected_lighting" and result.plan is None and result.picks == ()


def test_far_apart_readings_are_mixed_lighting() -> None:
    result = assess_colour_stability([FibreReading((30, 8, 12), "neutral"), FibreReading((45, 8, 12), "neutral")])
    assert result.code == "mixed_lighting" and result.spread > 10.0 and result.plan is None


def test_readings_that_pick_different_swatches_refuse() -> None:
    result = assess_colour_stability([FibreReading((30, 8, 12), "neutral"),
                                      FibreReading((33, 9, 14), "grey_world")])
    assert result.code == "unstable_swatch" and result.plan is None
    assert len(set(result.picks)) == 2


def test_consensus_is_the_median_and_keeps_the_no_lightening_rule() -> None:
    readings = [FibreReading((25.4, 7.23, 3.96), "neutral"), FibreReading((25.5, 7.2, 4.0), "neutral")]
    held = assess_colour_stability(readings)
    approved = assess_colour_stability(readings, approve_lighter=True)
    assert held.plan is not None and approved.plan is not None
    assert held.plan.reading.lab == pytest.approx((25.45, 7.215, 3.98))
    assert held.plan.reading.white_mode == "neutral"
    assert held.plan.lighter_option is not None
    assert approved.plan.best is not None
    assert approved.plan.best.record.id == held.plan.lighter_option.record.id
    single = plan_fibre_colour(held.plan.reading)
    assert single.best is not None and held.plan.best is not None
    assert single.best.record.id == held.plan.best.record.id


def test_a_refused_consensus_plan_is_passed_on() -> None:
    result = assess_colour_stability([FibreReading((50, -60, 60), "neutral"), FibreReading((50, -59, 60), "neutral")])
    assert result.code == "too_far" and result.plan is not None and result.plan.refused


def test_count_and_type_checks() -> None:
    one = FibreReading((30, 8, 12), "neutral")
    for bad in ([one], [one] * (MAX_READINGS + 1), "ab", [one, (30, 8, 12)]):
        with pytest.raises(ValueError):
            assess_colour_stability(bad)  # type: ignore[arg-type]
    assert assess_colour_stability([one] * MAX_READINGS).stable
