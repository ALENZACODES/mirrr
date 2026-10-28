"""Visible-only depigmentation coverage under synthetic overlays and occlusion.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.mask_checks import effective_occlusion
from lab.synth_diversity.overlays import apply_overlays
from lab.synth_diversity.skin_tone import adjust_skin_tone
from lab.synth_diversity.types import SyntheticInputError
from lab.synth_diversity.visible_vitiligo import apply_visible_vitiligo, visible_skin_support


@pytest.mark.parametrize("tone", ["II", "V", "VI"])
@pytest.mark.parametrize("kind,fraction", [
    ("focal", 0.06), ("segmental", 0.14), ("generalised", 0.28)
])
def test_visible_coverage_targets_declared_uncovered_skin(
    tone: str, kind: str, fraction: float
) -> None:
    face = make_drawn_face(seed=13)
    starting = adjust_skin_tone(face.image, face.skin_mask, tone).image
    overlay = apply_overlays(starting, face, "none", "short", "clear", seed=2)
    blocked = effective_occlusion(overlay.beard_mask, overlay.glasses_mask)
    result = apply_visible_vitiligo(starting, face.skin_mask, blocked, kind, fraction, 18)
    assert abs(result.visible_coverage - fraction) <= 0.025
    assert result.visible_coverage >= result.full_skin_coverage
    assert result.blocked_fraction > 0
    assert np.all(result.result.patch_mask[result.blocked_skin_mask > 0.5] == 0)
    np.testing.assert_array_equal(
        result.result.image[result.blocked_skin_mask > 0.5],
        starting[result.blocked_skin_mask > 0.5],
    )
    np.testing.assert_array_equal(
        result.result.image[face.skin_mask == 0], starting[face.skin_mask == 0]
    )


@pytest.mark.parametrize("kind", ["focal", "generalised"])
def test_head_covering_and_eyewear_leave_eyes_and_visible_skin(kind: str) -> None:
    face = make_drawn_face()
    overlay = apply_overlays(face.image, face, "hijab", "none", "tinted", seed=26)
    blocked = effective_occlusion(overlay.head_covering_mask, overlay.glasses_mask)
    result = apply_visible_vitiligo(face.image, face.skin_mask, blocked, kind, 0.07, 11)
    assert abs(result.visible_coverage - 0.07) < 0.02
    assert result.result.patch_mask.max() > 0.9
    assert np.count_nonzero(result.visible_skin_mask > 0.5) > 500
    assert np.count_nonzero(result.blocked_skin_mask > 0.5) > 100


def test_determinism_is_byte_identical_for_partial_occlusion() -> None:
    face = make_drawn_face(seed=11)
    blocked = np.zeros_like(face.skin_mask)
    blocked[:, : face.width // 4] = 1.0
    first = apply_visible_vitiligo(
        face.image, face.skin_mask, blocked, "generalised", 0.30, 190,
        trichrome=True, hyperpigmented_rim=True
    )
    second = apply_visible_vitiligo(
        face.image, face.skin_mask, blocked, "generalised", 0.30, 190,
        trichrome=True, hyperpigmented_rim=True
    )
    np.testing.assert_array_equal(first.result.image, second.result.image)
    np.testing.assert_array_equal(first.result.patch_mask, second.result.patch_mask)
    np.testing.assert_array_equal(first.result.rim_mask, second.result.rim_mask)
    assert first.visible_coverage == second.visible_coverage
    assert first.result.rim_mask.sum() > 0


def test_all_clear_support_agrees_with_existing_builder() -> None:
    face = make_drawn_face()
    blocked = np.zeros_like(face.skin_mask)
    result = apply_visible_vitiligo(face.image, face.skin_mask, blocked,
                                    "focal", 0.055, 13)
    assert abs(result.visible_coverage - result.result.coverage) < 1e-9
    assert result.blocked_fraction == 0
    assert result.full_skin_coverage == result.visible_coverage
    assert np.array_equal(result.visible_skin_mask, face.skin_mask)


def test_transparent_clear_lenses_remain_visible_support() -> None:
    face = make_drawn_face()
    blocked = np.zeros_like(face.skin_mask)
    blocked[:, : face.width // 2] = 0.3
    visible, hidden = visible_skin_support(face.skin_mask, blocked)
    assert np.array_equal(visible, face.skin_mask)
    assert not hidden.any()
    blocked[:, : face.width // 2] = 0.5
    visible, hidden = visible_skin_support(face.skin_mask, blocked)
    assert visible.sum() < face.skin_mask.sum()
    assert hidden.sum() > 0
    assert np.array_equal(visible + hidden, face.skin_mask)


def test_refuse_occlusion_on_every_skin_pixel() -> None:
    face = make_drawn_face()
    blocked = np.ones_like(face.skin_mask)
    with pytest.raises(SyntheticInputError, match="too little visible"):
        apply_visible_vitiligo(face.image, face.skin_mask, blocked,
                               "generalised", 0.2, 18)


def test_occlusion_input_masks_strictly_validated() -> None:
    face = make_drawn_face()
    bad = np.ones_like(face.skin_mask) * -0.1
    with pytest.raises(SyntheticInputError, match=r"\[0,1\]"):
        visible_skin_support(face.skin_mask, bad)
    bad = face.skin_mask.copy()
    bad[0, 0] = float("nan")
    with pytest.raises(SyntheticInputError, match="nonfinite"):
        visible_skin_support(face.skin_mask, bad)
    with pytest.raises(SyntheticInputError, match="shape"):
        visible_skin_support(face.skin_mask, bad[:15, :15])
    with pytest.raises(SyntheticInputError, match="cutoff"):
        visible_skin_support(face.skin_mask, np.zeros_like(face.skin_mask), cut_off=2)


def test_other_valid_settings_are_noop_on_intended_covered_area() -> None:
    face = make_drawn_face()
    blocked = np.zeros_like(face.skin_mask)
    result = apply_visible_vitiligo(face.image, face.skin_mask, blocked,
                                    "none", 0, seed=20)
    assert result.visible_coverage == 0
    assert result.full_skin_coverage == 0
    np.testing.assert_array_equal(result.result.image, face.image)


def test_invalid_segmental_fraction_remains_rejected_under_partial_covering() -> None:
    face = make_drawn_face()
    blocked = np.zeros_like(face.skin_mask)
    blocked[:, : face.width // 3] = 1
    with pytest.raises(SyntheticInputError, match="segmental"):
        apply_visible_vitiligo(face.image, face.skin_mask, blocked,
                               "segmental", 0.70, seed=22)
