"""R28F observed fibre effect from the final guarded pixels, on drawn blocks only.

Pass definition: the observed fraction is measured from the shown pixels, not the
plan; a guard that restores the original gives exactly zero; leaked pixels, alpha
changes, sideways colour movement, low contrast and invalid masks refuse; no physical
coverage is inferred. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.concealer.cover import CoverDecision, CoverResult, CoverSession
from plumb_api.engines.concealer.observed import observe_cover, observe_cover_result, planned_effect_fraction
from tests.r31f_fibre_scene import HEAD, scene

PIGMENT = (63, 44, 38)


def marked() -> np.ndarray:
    _, region, scalp = scene()
    return (region > 0) & (scalp > 0)


def toward(share: float) -> np.ndarray:
    image, _, _ = scene()
    out = image.copy()
    mask = marked()
    out[mask] = np.floor(image[mask] * (1 - share) + np.asarray(PIGMENT) * share + 0.5).astype(np.uint8)
    return out


@pytest.mark.parametrize("share", [0.2, 0.5, 0.8, 1.0])
def test_observed_fraction_follows_the_shown_pixels(share: float) -> None:
    image, _, _ = scene()
    found = observe_cover(image, toward(share), marked(), PIGMENT)
    assert found.code is None
    assert found.observed_effect_fraction == pytest.approx(share, abs=0.01)
    assert (found.marked_pixels, found.contrast_pixels, found.changed_pixels) == (820, 820, 820)


class RestoringGuard:
    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> CoverDecision:
        return CoverDecision(before.copy(), 1.0, True)


def test_a_restoring_guard_gives_zero_not_the_plan() -> None:
    image, region, scalp = scene()
    result = CoverSession().render(image, region, scalp, level=4.0, landmarks=HEAD, guard=RestoringGuard())
    assert isinstance(result, CoverResult)
    evidence = observe_cover_result(image, result, marked())
    assert evidence["planned_effect_fraction"] > 0.5
    assert evidence["observation"]["observed_effect_fraction"] == 0.0
    assert evidence["observation"]["changed_pixels"] == 0


def test_planned_and_observed_from_the_default_guard() -> None:
    image, region, scalp = scene()
    result = CoverSession().render(image, region, scalp, level=3.0, landmarks=HEAD, palette_rgb=PIGMENT)
    assert isinstance(result, CoverResult)
    evidence = observe_cover_result(image, result, marked())
    assert planned_effect_fraction(result) == pytest.approx(evidence["planned_effect_fraction"], abs=1e-6)
    assert evidence["observation"]["observed_effect_fraction"] == pytest.approx(0.365588, abs=1e-6)
    assert evidence["provider_calls"] == 0


def test_leaks_alpha_and_sideways_movement_refuse() -> None:
    image, _, _ = scene()
    leaked = toward(0.5)
    leaked[0, 0] = (0, 0, 0)
    assert observe_cover(image, leaked, marked(), PIGMENT).code == "leaked_pixels"
    sideways = image.copy()
    sideways[marked(), 1] = 250
    assert observe_cover(image, sideways, marked(), PIGMENT).code == "unrelated_colour_movement"
    rgba, _, _ = scene(alpha=True)
    changed = rgba.copy()
    changed[40, 40, 3] = 0
    assert observe_cover(rgba, changed, marked(), PIGMENT).code == "alpha_changed"


def test_low_contrast_and_invalid_masks_refuse() -> None:
    image, _, _ = scene()
    near_scalp = (196, 150, 128)
    assert observe_cover(image, image, marked(), near_scalp).code == "insufficient_contrast"
    assert observe_cover(image, image, np.zeros((96, 96), dtype=bool), PIGMENT).code == "invalid_mask"
    assert observe_cover(image, image, np.ones((10, 10), dtype=bool), PIGMENT).code == "invalid_mask"
    with pytest.raises(ValueError):
        observe_cover(image, image[:10], marked(), PIGMENT)
    with pytest.raises(ValueError):
        observe_cover(image, image, marked(), (300, 0, 0))


def test_public_record_infers_no_physical_coverage() -> None:
    image, _, _ = scene()
    public = observe_cover(image, toward(0.5), marked(), PIGMENT).public()
    assert public["physical_coverage_inferred"] is False
    assert "image" not in public and "mask" not in public
