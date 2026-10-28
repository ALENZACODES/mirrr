"""R31F two-swatch digital pigment plan on drawn values only: no products or photos.

Pass definition: mixes are 5 percent sRGB steps of two different chosen swatches;
the closest allowed mix by CIEDE2000 is chosen; lighter mixes need an explicit
opt-in; refusals are coded; the chosen mix is drawn by the existing guarded fibre
renderer. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.concealer.cover import CoverResult, CoverSession
from plumb_api.engines.concealer.shade_support import FibreReading
from plumb_api.engines.concealer.two_tone import STEPS, mix_rgb, plan_two_tone, render_two_tone
from plumb_api.engines.hair_palette.catalogue import require_shade
from plumb_api.engines.shade import colourspace as cs
from tests.r31f_fibre_scene import HEAD, scene

FIRST, SECOND = "natural-04-n", "copper-08-w"


def mix_reading(percent: int, lightness_offset: float = 0.0) -> FibreReading:
    rgb = mix_rgb(require_shade(FIRST).rgb, require_shade(SECOND).rgb, percent)
    lab = cs.srgb_to_lab(np.asarray(rgb, dtype=np.float64))
    return FibreReading((float(lab[0]) + lightness_offset, float(lab[1]), float(lab[2])), "neutral")


def test_mix_steps_and_rounding() -> None:
    assert STEPS == tuple(range(0, 101, 5))
    assert mix_rgb((0, 100, 255), (255, 0, 0), 50) == (128, 50, 128)
    assert mix_rgb((10, 20, 30), (200, 100, 0), 0) == (10, 20, 30)
    assert mix_rgb((10, 20, 30), (200, 100, 0), 100) == (200, 100, 0)
    with pytest.raises(ValueError):
        mix_rgb((0, 0, 0), (1, 1, 1), 7.5)  # type: ignore[arg-type]


@pytest.mark.parametrize("percent", [0, 35, 60])
def test_the_matching_mix_is_found(percent: int) -> None:
    plan = plan_two_tone(mix_reading(percent), FIRST, SECOND, approve_lighter=True)
    assert plan.best is not None and plan.best.percent == percent
    assert plan.best.delta_e == pytest.approx(0.0, abs=1e-9)
    assert plan.options_considered == 21


def test_lighter_mixes_need_an_explicit_opt_in() -> None:
    reading = mix_reading(60, lightness_offset=-3.0)
    guarded = plan_two_tone(reading, FIRST, SECOND)
    opened = plan_two_tone(reading, FIRST, SECOND, approve_lighter=True)
    assert guarded.reading_level == 6
    assert guarded.best is not None and (guarded.best.percent, guarded.best.level) == (50, 6)
    assert opened.best is not None and (opened.best.percent, opened.best.level) == (55, 7)
    assert opened.best.delta_e < guarded.best.delta_e
    deep = mix_reading(0, -14.0)
    assert plan_two_tone(deep, SECOND, "copper-08-n").code == "too_light"
    assert plan_two_tone(deep, SECOND, "copper-08-n", approve_lighter=True).code == "too_far"


def test_coded_refusals() -> None:
    assert plan_two_tone(mix_reading(20), FIRST, FIRST).code == "same_swatch"
    uncorrected = FibreReading(mix_reading(20).lab, "none")
    assert plan_two_tone(uncorrected, FIRST, SECOND).code == "uncorrected_lighting"
    far = FibreReading((60.0, -40.0, -40.0), "neutral")
    assert plan_two_tone(far, FIRST, SECOND, approve_lighter=True).code == "too_far"
    with pytest.raises(ValueError):
        plan_two_tone(mix_reading(20), FIRST, "not-a-swatch")


def test_chosen_mix_is_drawn_by_the_guarded_fibre_renderer() -> None:
    plan = plan_two_tone(mix_reading(35), FIRST, SECOND, approve_lighter=True)
    image, region, scalp = scene()
    result = render_two_tone(CoverSession(), image, region, scalp, plan, landmarks=HEAD, level=4.0)
    assert plan.best is not None and isinstance(result, CoverResult)
    assert result.measured_hair_rgb == plan.best.rgb
    assert result.provider_calls == 0
    refused = plan_two_tone(mix_reading(35), FIRST, FIRST)
    with pytest.raises(ValueError):
        render_two_tone(CoverSession(), image, region, scalp, refused, landmarks=HEAD)


def test_public_plan_is_labelled_screen_estimate() -> None:
    public = plan_two_tone(mix_reading(35), FIRST, SECOND, approve_lighter=True).public()
    assert public["tested_against_real_products"] is False
    assert "not a physical" in public["label"]
    assert public["best"]["second_percent"] == 35
