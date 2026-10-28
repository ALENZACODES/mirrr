"""Geometry and coverage properties on seeded drawn-only facial variants.
Author: John Khan.
"""

from __future__ import annotations

import hashlib

import numpy as np
import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.mask_checks import region_scores, side_scores
from lab.synth_diversity.morphology import (
    MorphologySpec,
    affine_matrix,
    apply_morphology,
    morphology_stats,
    seeded_specs,
    synthetic_morphology_grid,
    transform_landmarks,
)
from lab.synth_diversity.types import BaseFace, SyntheticInputError
from lab.synth_diversity.vitiligo import build_vitiligo_mask


@pytest.mark.parametrize("size", [(96, 96), (128, 144), (192, 224), (512, 512), (1024, 1024)])
def test_affine_keeps_landmarks_and_masks_registered(size: tuple[int, int]) -> None:
    fixture = make_drawn_face(size=size, seed=8)
    variant = apply_morphology(
        fixture,
        MorphologySpec(0.94, 1.05, 7.5, 0.015, -0.015),
        base_id="controlled_variant",
    )
    assert variant.base_id == "controlled_variant"
    assert variant.image.shape == fixture.image.shape
    assert variant.image.dtype == np.uint8
    assert variant.groups == fixture.groups
    assert variant.source_id == fixture.source_id == "S02"
    assert variant.landmarks is not None
    assert fixture.landmarks is not None
    assert variant.iris_mask is not None
    assert variant.hair_mask.shape == variant.skin_mask.shape
    assert np.count_nonzero(variant.skin_mask > 0.5) >= 100
    assert float(np.max(variant.skin_mask + variant.hair_mask)) <= 1.01
    stats = morphology_stats(fixture, variant)
    assert stats.landmark_count == len(fixture.landmarks)
    assert stats.mask_overlap_fraction == 0
    assert stats.skin_loss_fraction < 0.015
    assert stats.frame_touch_fraction == 0


def test_seeded_specs_reproduce_independent_drawings() -> None:
    first = seeded_specs(10, seed=19)
    second = seeded_specs(10, seed=19)
    third = seeded_specs(10, seed=20)
    assert first == second
    assert first != third
    assert len(set(first)) == 10
    assert all(-15 <= spec.roll_degrees <= 15 for spec in first)
    assert all(0.78 <= spec.height_scale <= 1.18 for spec in first)


def test_identical_source_and_spec_has_identical_image_bytes() -> None:
    fixture = make_drawn_face(seed=41)
    spec = MorphologySpec(0.87, 1.1, -8, -0.01, 0.02)
    first = apply_morphology(fixture, spec, "drawn_test_one")
    second = apply_morphology(fixture, spec, "drawn_test_two")
    assert hashlib.sha256(first.image.tobytes()).digest() == hashlib.sha256(
        second.image.tobytes()
    ).digest()
    np.testing.assert_array_equal(first.skin_mask, second.skin_mask)
    np.testing.assert_array_equal(first.hair_mask, second.hair_mask)
    np.testing.assert_array_equal(first.landmarks, second.landmarks)
    assert first.base_id != second.base_id


def test_transform_is_identity_for_identity_spec() -> None:
    fixture = make_drawn_face()
    matrix = affine_matrix((fixture.width, fixture.height), MorphologySpec())
    points = fixture.landmarks
    assert points is not None
    np.testing.assert_allclose(transform_landmarks(points, matrix), points, atol=1e-5)
    assert matrix.dtype == np.float32
    np.testing.assert_allclose(matrix[:, :2], np.eye(2), atol=1e-6)


def test_morphology_grid_has_reproducible_semantic_landmark_groups() -> None:
    fixture = make_drawn_face(seed=7)
    first = synthetic_morphology_grid(fixture, 5, seed=18)
    second = synthetic_morphology_grid(fixture, 5, seed=18)
    assert len(first) == 5
    assert len(set(face.base_id for face in first)) == 5
    for left, right in zip(first, second, strict=True):
        np.testing.assert_array_equal(left.image, right.image)
        np.testing.assert_array_equal(left.landmarks, right.landmarks)
        assert left.groups == fixture.groups
        assert left.base_id.startswith(fixture.base_id)


@pytest.mark.parametrize(
    "kind,share", [("focal", 0.04), ("segmental", 0.16), ("generalised", 0.32)]
)
def test_rotated_morphology_preserves_vitiligo_coverage(kind: str, share: float) -> None:
    fixture = make_drawn_face(seed=12)
    for variant in synthetic_morphology_grid(fixture, 4, seed=39):
        patch, side = build_vitiligo_mask(variant.skin_mask, kind, share, seed=11)
        scores = region_scores(patch, variant.skin_mask)
        assert abs(scores.skin_coverage - share) < 0.015
        assert scores.background_spill_pixels == 0
        assert 0 <= scores.visible_skin_coverage <= 1
        if kind == "segmental":
            scores = side_scores(patch, variant.skin_mask, expected_side=side)
            assert scores.exclusivity_error == 0
        else:
            assert side == "both"


def test_generalised_roughly_balanced_on_symmetric_base() -> None:
    fixture = make_drawn_face()
    patch, _ = build_vitiligo_mask(fixture.skin_mask, "generalised", 0.29, seed=99)
    sides = side_scores(patch, fixture.skin_mask)
    assert sides.symmetry_error < 0.12
    assert abs(sides.left_fraction - sides.right_fraction) < 0.12


def test_morphology_does_not_mutate_original_semantic_labels() -> None:
    fixture = make_drawn_face(seed=2)
    rgb = fixture.image.copy()
    skin = fixture.skin_mask.copy()
    hair = fixture.hair_mask.copy()
    assert fixture.landmarks is not None
    points = fixture.landmarks.copy()
    apply_morphology(fixture, MorphologySpec(0.8, 1.15, 4.0), "new_variant")
    np.testing.assert_array_equal(fixture.image, rgb)
    np.testing.assert_array_equal(fixture.skin_mask, skin)
    np.testing.assert_array_equal(fixture.hair_mask, hair)
    np.testing.assert_array_equal(fixture.landmarks, points)


@pytest.mark.parametrize(
    "invalid",
    [
        dict(width_scale=0.1),
        dict(height_scale=1.5),
        dict(roll_degrees=23),
        dict(shift_x_fraction=-0.5),
        dict(shift_y_fraction=0.3),
        dict(roll_degrees=float("nan")),
    ],
)
def test_spec_refuses_impossible_raster_geometry(invalid: dict[str, float]) -> None:
    with pytest.raises(SyntheticInputError):
        MorphologySpec(**invalid)


def test_variant_rejects_unsafe_id_and_background() -> None:
    fixture = make_drawn_face()
    with pytest.raises(SyntheticInputError, match="base_id"):
        apply_morphology(fixture, MorphologySpec(), "unsafe/path")
    with pytest.raises(SyntheticInputError, match="background"):
        apply_morphology(fixture, MorphologySpec(), background=(1, 2, 256))
    with pytest.raises(SyntheticInputError, match="background"):
        apply_morphology(fixture, MorphologySpec(), background=(True, 5, 6))


def test_affine_rejects_non_2d_points() -> None:
    with pytest.raises(SyntheticInputError, match="Nx2"):
        transform_landmarks(np.zeros((3, 4), dtype=np.float32), np.eye(2, 3, dtype=np.float32))


def test_source_rejects_cropped_unsafe_landmarks() -> None:
    fixture = make_drawn_face()
    points = fixture.landmarks.copy()
    points[0] = [0.0, 0.0]
    modified = BaseFace(
        fixture.image,
        fixture.skin_mask,
        fixture.hair_mask,
        base_id="edge_case",
        landmarks=points,
        groups=fixture.groups,
    )
    with pytest.raises(SyntheticInputError, match="crop"):
        apply_morphology(modified, MorphologySpec(1.0, 1.0, 0, -0.03, 0))
