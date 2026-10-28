"""Landmark-aware overlay bounds and independent occlusion acceptance tests.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.mask_checks import (
    effective_occlusion,
    overlay_scores,
    region_scores,
    side_scores,
)
from lab.synth_diversity.morphology import MorphologySpec, apply_morphology
from lab.synth_diversity.overlays import apply_overlays
from lab.synth_diversity.types import SyntheticInputError
from lab.synth_diversity.vitiligo import build_vitiligo_mask


@pytest.mark.parametrize("size", [(96, 96), (192, 224), (512, 512)])
def test_hijab_closes_hairline_without_blocking_eyes(size: tuple[int, int]) -> None:
    face = make_drawn_face(size=size)
    output = apply_overlays(face.image, face, "hijab", "none", "none", seed=5)
    checks = overlay_scores(
        face, output.head_covering_mask, output.beard_mask, output.glasses_mask
    )
    assert checks.headwear_around_hairline > 0.5
    assert checks.headwear_hair_occlusion > 0.5
    assert checks.headwear_skin_occlusion < 0.06
    assert checks.eye_open_fraction > 0.95
    assert checks.mouth_open_fraction > 0.95
    assert checks.forehead_open_fraction > 0.95
    assert np.count_nonzero(output.head_covering_mask) > 0
    np.testing.assert_array_equal(
        output.image[output.head_covering_mask == 0],
        face.image[output.head_covering_mask == 0],
    )


def test_turban_and_kippah_stay_near_top_of_head() -> None:
    face = make_drawn_face()
    for covering in ("turban", "kippah"):
        output = apply_overlays(face.image, face, covering, "none", "none", seed=8)
        scores = overlay_scores(
            face, output.head_covering_mask, output.beard_mask, output.glasses_mask
        )
        assert scores.headwear_around_hairline > 0.10
        assert scores.mouth_open_fraction > 0.99
        assert scores.eye_open_fraction > 0.99
        assert scores.headwear_skin_occlusion < 0.25


@pytest.mark.parametrize("beard", ["stubble", "short", "full"])
def test_facial_hair_stays_within_declared_skin(beard: str) -> None:
    face = make_drawn_face()
    drawn = apply_overlays(face.image, face, "none", beard, "none", seed=29)
    scores = overlay_scores(face, drawn.head_covering_mask, drawn.beard_mask, drawn.glasses_mask)
    assert scores.beard_lower_face_fraction > scores.beard_upper_face_fraction
    assert scores.beard_lower_face_fraction > 0.10
    assert not np.any(drawn.beard_mask[face.skin_mask == 0] > 0)
    assert np.count_nonzero(drawn.beard_mask > 0) > 100


def test_clear_lenses_keep_eye_pixels_nearly_original() -> None:
    face = make_drawn_face()
    clear = apply_overlays(face.image, face, "none", "none", "clear", seed=5)
    tinted = apply_overlays(face.image, face, "none", "none", "tinted", seed=5)
    score_clear = overlay_scores(
        face, clear.head_covering_mask, clear.beard_mask, clear.glasses_mask
    )
    score_tinted = overlay_scores(
        face, tinted.head_covering_mask, tinted.beard_mask, tinted.glasses_mask
    )
    assert score_clear.glasses_eye_proximity > 0
    assert score_tinted.glasses_eye_proximity > score_clear.glasses_eye_proximity
    assert np.count_nonzero(clear.glasses_mask > 0) > 100
    assert np.count_nonzero(tinted.glasses_mask > 0) > 100
    np.testing.assert_array_equal(clear.image[clear.glasses_mask == 0],
                                  face.image[clear.glasses_mask == 0])


def test_visible_patch_coverage_is_not_total_coverage() -> None:
    face = make_drawn_face()
    patch, _ = build_vitiligo_mask(face.skin_mask, "generalised", 0.3, seed=78)
    beard = apply_overlays(face.image, face, "none", "full", "none", seed=15)
    visible = region_scores(patch, face.skin_mask, occlusion=beard.beard_mask)
    total = region_scores(patch, face.skin_mask)
    assert abs(total.skin_coverage - 0.3) < 0.015
    assert total.visible_skin_coverage == total.skin_coverage
    assert visible.visible_skin_pixels < total.visible_skin_pixels
    assert visible.visible_skin_coverage != visible.skin_coverage
    assert visible.background_spill_pixels == 0


def test_occlusion_union_bounded_by_largest_input_and_sum() -> None:
    face = make_drawn_face()
    output = apply_overlays(face.image, face, "hijab", "stubble", "tinted", seed=8)
    masks = (output.head_covering_mask, output.beard_mask, output.glasses_mask)
    combined = effective_occlusion(*masks)
    assert combined.shape == face.skin_mask.shape
    assert np.all(combined >= np.maximum.reduce(masks))
    assert np.all(combined <= np.clip(sum(masks), 0, 1))
    assert combined.dtype == np.float32


@pytest.mark.parametrize("seed", [1, 17, 301])
def test_occlusion_scores_reproducible_after_seeded_geometry(seed: int) -> None:
    face = make_drawn_face(seed=seed)
    rotated = apply_morphology(face, MorphologySpec(0.92, 1.08, 7.0), "rotated")
    first = apply_overlays(rotated.image, rotated, "hijab", "none", "clear", seed=seed)
    second = apply_overlays(rotated.image, rotated, "hijab", "none", "clear", seed=seed)
    np.testing.assert_array_equal(first.image, second.image)
    np.testing.assert_array_equal(first.head_covering_mask, second.head_covering_mask)
    score = overlay_scores(
        rotated, first.head_covering_mask, first.beard_mask, first.glasses_mask
    )
    assert score.eye_open_fraction >= 0.95
    assert score.mouth_open_fraction >= 0.95


def test_segmental_has_no_wrong_side_pixels() -> None:
    face = make_drawn_face()
    for seed in (0, 4, 17, 79, 103):
        patch, side = build_vitiligo_mask(face.skin_mask, "segmental", 0.19, seed)
        score = side_scores(patch, face.skin_mask, expected_side=side)
        assert score.exclusivity_error == 0
        assert abs(score.left_mass + score.right_mass - 1) < 1e-6


def test_acceptance_guards_refuse_invalid_masks() -> None:
    face = make_drawn_face()
    bad_shape = np.ones((17, 17), dtype=np.float32)
    with pytest.raises(SyntheticInputError, match="finite HxW"):
        region_scores(bad_shape, face.skin_mask)
    with pytest.raises(SyntheticInputError, match="finite HxW"):
        overlay_scores(face, bad_shape, face.skin_mask, face.hair_mask)
    with pytest.raises(SyntheticInputError, match="at least one"):
        effective_occlusion()
    with pytest.raises(SyntheticInputError, match="left, right or both"):
        side_scores(face.skin_mask, face.skin_mask, expected_side="unlabelled")


def test_sides_refuse_invalid_midline_and_footprint() -> None:
    face = make_drawn_face()
    with pytest.raises(SyntheticInputError, match="midline"):
        side_scores(face.skin_mask, face.skin_mask, center_x=-1)
    invalid = face.skin_mask.copy()
    invalid[10, 10] = -0.1
    with pytest.raises(SyntheticInputError, match="[0,1]"):
        side_scores(invalid, face.skin_mask)
