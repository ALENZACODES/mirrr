"""Geometric self-occlusion tests on drawn heads, without face images.

Hidden features need corroborating turn evidence; frontal corruption remains a
failure. Test thresholds are the already written acceptance limits.
Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.core import regions
from plumb_api.engines.eyes.turn_audit import measure_mask_eligibility
from plumb_api.engines.eyes.turn_visibility import turn_evidence
from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shape.synthetic_heads import drawn_head
from plumb_api.engines.shape.turn_field import silhouette_depth


def turned(seed: int, degrees: float) -> tuple[np.ndarray, np.ndarray]:
    """Rotate a fabricated XYZ mesh, keeping the same synthetic source pixels."""
    xyz, photo = drawn_head(seed)
    original = xyz.copy()
    x_origin = float(np.mean(original[:, 0]))
    z_origin = silhouette_depth(original)
    x = original[:, 0] - x_origin
    z = original[:, 2] - z_origin
    theta = math.radians(degrees)
    cosine, sine = math.cos(theta), math.sin(theta)
    xyz[:, 0] = x_origin + x * cosine + z * sine
    xyz[:, 2] = z_origin - x * sine + z * cosine
    return xyz, photo


@pytest.mark.parametrize("seed", (0, 2, 5))
@pytest.mark.parametrize("degrees", (0.0, 35.0, 45.0, 60.0))
def test_frontal_and_partial_turns_do_not_gain_a_hidden_eye(seed: int, degrees: float) -> None:
    xyz, source = turned(seed, degrees)
    guess = turn_evidence(xyz[:, :2], xyz, regions.EYE_LIDS, regions.CONTOURS)
    assert guess.candidate is None
    states = regions.region_states(xyz, *source.shape[:2], normalized=False, supersample=1)
    assert states["right_eye"] == "visible"
    assert states["left_eye"] == "visible"
    assert states["right_iris"] == "visible"
    assert states["left_iris"] == "visible"


@pytest.mark.parametrize("degrees,hidden", ((80.0, "right"), (-80.0, "left")))
@pytest.mark.parametrize("seed", (0, 1, 2))
def test_profile_turn_exempts_only_measured_far_side(
    seed: int, degrees: float, hidden: str
) -> None:
    xyz, source = turned(seed, degrees)
    evidence = turn_evidence(xyz[:, :2], xyz, regions.EYE_LIDS, regions.CONTOURS)
    assert evidence.candidate == hidden
    assert evidence.width_ratio <= 0.40
    assert evidence.supported_by_depth
    other = "left" if hidden == "right" else "right"
    states = regions.region_states(xyz, *source.shape[:2], normalized=False, supersample=1)
    masks = regions.region_masks(xyz, *source.shape[:2], normalized=False, supersample=1)
    diagnostic = regions.region_diagnostics(
        xyz, *source.shape[:2], normalized=False, supersample=1
    )
    for part in ("eye", "iris", "brow"):
        assert states[hidden + "_" + part] == "not_visible:hidden_by_turn"
        assert not masks[hidden + "_" + part].any()
        assert states[other + "_" + part] == "visible"
        assert masks[other + "_" + part].any()
    assert not diagnostic["invalid_geometry"]
    assert diagnostic["eyes_inside"] >= 0.95
    assert 0.45 <= diagnostic["skin_share"] <= 0.97
    assert diagnostic["not_visible"][hidden + "_eye"] == "hidden_by_turn"


@pytest.mark.parametrize("degrees,hidden", ((80.0, "right"), (-80.0, "left")))
def test_depthless_mesh_needs_independent_face_contour_support(
    degrees: float, hidden: str
) -> None:
    xyz, source = turned(0, degrees)
    xy = xyz[:, :2]
    evidence = turn_evidence(xy, xy, regions.EYE_LIDS, regions.CONTOURS)
    assert evidence.candidate == hidden
    assert evidence.depth_ratio is None
    assert not evidence.supported_by_depth
    states = regions.region_states(xy, *source.shape[:2], normalized=False, supersample=1)
    assert states[hidden + "_eye"] == "not_visible:hidden_by_turn"


def test_frontal_displaced_eye_is_still_invalid() -> None:
    points = symmetric_face()
    points[list(regions.RIGHT_EYE), 0] -= 160
    points[[468, 469, 470, 471, 472], 0] -= 160
    diagnostic = regions.region_diagnostics(points, 500, 400, normalized=False, supersample=1)
    states = regions.region_states(points, 500, 400, normalized=False, supersample=1)
    assert diagnostic["invalid_geometry"]
    assert states["right_eye"] == "empty"
    assert "right_eye" not in diagnostic["not_visible"]


def test_frontal_empty_eye_does_not_inherit_turn_exemption() -> None:
    points = symmetric_face()
    eye = list(regions.RIGHT_EYE)
    points[eye, 1] = -50.0
    points[[468, 469, 470, 471, 472], 1] = -50.0
    states = regions.region_states(points, 500, 400, normalized=False, supersample=1)
    diagnostic = regions.region_diagnostics(points, 500, 400, normalized=False, supersample=1)
    assert states["right_eye"] == "empty"
    assert diagnostic["invalid_geometry"]


@pytest.mark.parametrize("seed", (0, 3))
def test_mask_geometry_does_not_use_image_appearance(seed: int) -> None:
    xyz, source = turned(seed, 80.0)
    first = regions.region_masks(xyz, *source.shape[:2], normalized=False, supersample=1)
    for value in (15, 50, 100, 140, 180, 225, 250):
        drawn = np.full(source.shape, value, dtype=np.uint8)
        assert drawn.shape == source.shape
        again = regions.region_masks(xyz, *drawn.shape[:2], normalized=False, supersample=1)
        for name in regions.REGIONS:
            np.testing.assert_array_equal(first[name], again[name])


def test_no_mesh_or_nonfinite_points_cannot_claim_hidden_evidence() -> None:
    xyz, _ = turned(0, 80.0)
    missing = xyz[:12]
    missing_evidence = turn_evidence(
        missing[:, :2], missing, regions.EYE_LIDS, regions.CONTOURS
    )
    assert missing_evidence.candidate is None
    corrupt = xyz.copy()
    corrupt[133, 0] = np.nan
    evidence = turn_evidence(corrupt[:, :2], corrupt, regions.EYE_LIDS, regions.CONTOURS)
    assert evidence.candidate is None


def test_equality_to_reference_contour_not_a_demographic_classifier() -> None:
    xyz, source = turned(0, 0.0)
    diag = regions.region_diagnostics(xyz, *source.shape[:2], normalized=False, supersample=1)
    assert not diag["invalid_geometry"]
    assert not diag["not_visible"]
    assert diag["colour_dependent"] is False


def test_normalized_xyz_depth_is_scaled_like_projected_face_width() -> None:
    xyz, source = turned(0, 80.0)
    normalized = xyz.copy()
    normalized[:, 0] /= source.shape[1]
    normalized[:, 1] /= source.shape[0]
    normalized[:, 2] /= source.shape[1]
    pixel_states = regions.region_states(xyz, *source.shape[:2], normalized=False, supersample=1)
    unit_states = regions.region_states(
        normalized, *source.shape[:2], normalized=True, supersample=1
    )
    assert unit_states == pixel_states
    diagnostic = regions.region_diagnostics(
        normalized, *source.shape[:2], normalized=True, include_reasons=True
    )
    assert diagnostic["not_visible"]["right_eye"] == "hidden_by_turn"
    assert diagnostic["invalid_reasons"] == []


@pytest.mark.parametrize("side", ("right", "left"))
def test_invalid_geometry_exposes_only_reason_codes(side: str) -> None:
    points = symmetric_face()
    moved = list(regions.RIGHT_EYE if side == "right" else regions.LEFT_EYE)
    points[moved, 0] -= 250
    diagnostic = regions.region_diagnostics(
        points, 500, 400, normalized=False, supersample=1, include_reasons=True
    )
    assert diagnostic["invalid_geometry"]
    assert any(r.startswith(side + "_eye:") for r in diagnostic["invalid_reasons"])
    assert all("face" not in r for r in diagnostic["invalid_reasons"])


def test_independent_pixel_mask_checker_verifies_profile_turn() -> None:
    xyz, image = turned(0, 80.0)
    masks = regions.region_masks(xyz, *image.shape[:2], normalized=False, supersample=1)
    diagnostic = regions.region_diagnostics(
        xyz, *image.shape[:2], normalized=False, supersample=1
    )
    report = measure_mask_eligibility(
        masks, regions.REGIONS,
        not_visible=diagnostic["not_visible"],
        invalid_geometry=diagnostic["invalid_geometry"],
    )
    assert report.eligible
    assert not report.empty_without_reason
    assert not report.contradictory_visibility
    assert report.to_json()["release_status"] == "UNPROVEN"


def test_independent_mask_checker_rejects_missing_far_eye_declaration() -> None:
    xyz, image = turned(0, 80.0)
    masks = regions.region_masks(xyz, *image.shape[:2], normalized=False, supersample=1)
    report = measure_mask_eligibility(
        masks, regions.REGIONS, not_visible={}, invalid_geometry=False
    )
    assert not report.eligible
    assert "right_eye" in report.empty_without_reason
    assert "right_brow" in report.empty_without_reason
    assert "right_iris" in report.empty_without_reason


def test_independent_checker_does_not_excuse_frontal_bad_geometry() -> None:
    xyz, image = turned(0, 0.0)
    masks = regions.region_masks(xyz, *image.shape[:2], normalized=False, supersample=1)
    with_incorrect_state = measure_mask_eligibility(
        masks, regions.REGIONS,
        not_visible={"left_eye": "hidden_by_turn"}, invalid_geometry=False,
    )
    assert not with_incorrect_state.eligible
    assert "left_eye" in with_incorrect_state.contradictory_visibility


def test_independent_checker_refuses_corrupt_mask_values() -> None:
    xyz, image = turned(0, 0.0)
    masks = regions.region_masks(xyz, *image.shape[:2], normalized=False, supersample=1)
    broken = {name: value.copy() for name, value in masks.items()}
    broken["skin"][0, 0] = float("nan")
    with pytest.raises(ValueError, match="finite"):
        measure_mask_eligibility(
            broken, regions.REGIONS, not_visible={}, invalid_geometry=False
        )
    broken["skin"][0, 0] = 1.2
    with pytest.raises(ValueError, match="0..1"):
        measure_mask_eligibility(
            broken, regions.REGIONS, not_visible={}, invalid_geometry=False
        )


def test_independent_checker_requires_unchanged_region_contract() -> None:
    xyz, image = turned(0, 0.0)
    masks = regions.region_masks(xyz, *image.shape[:2], normalized=False, supersample=1)
    with pytest.raises(ValueError, match="exactly once"):
        measure_mask_eligibility(
            masks, regions.REGIONS[1:], not_visible={}, invalid_geometry=False
        )
    wrong = {name: value.copy() for name, value in masks.items()}
    wrong["right_iris"] = wrong["right_iris"][:12]
    with pytest.raises(ValueError, match="dimensions"):
        measure_mask_eligibility(
            wrong, regions.REGIONS, not_visible={}, invalid_geometry=False
        )


@pytest.mark.parametrize(
    "skin,contained,eligible",
    (
        (0.4501, 0.9501, True),
        (0.9699, 1.0, True),
        (0.4499, 0.95, False),
        (0.9701, 0.95, False),
        (0.45, 0.9499, False),
    ),
)
def test_independent_masks_keep_exact_written_fraction_boundaries(
    skin: float, contained: float, eligible: bool
) -> None:
    oval = np.ones((8, 8), dtype=np.float64)
    oval[3, 3] = contained
    skin_mask = oval * skin
    eyes = np.zeros_like(oval)
    eyes[3, 3] = 1
    masks = {"face_oval": oval, "skin": skin_mask, "eyes": eyes}
    report = measure_mask_eligibility(
        masks, ("face_oval", "skin", "eyes"),
        not_visible={}, invalid_geometry=False,
    )
    assert report.eligible is eligible
    assert report.skin_share == pytest.approx(skin)
    assert report.eyes_inside == pytest.approx(contained)


def test_an_undeclared_empty_mask_never_becomes_valid_on_small_photos() -> None:
    masks = {
        "face_oval": np.ones((8, 8), dtype=np.float64),
        "skin": np.full((8, 8), 0.8, dtype=np.float64),
        "eyes": np.zeros((8, 8), dtype=np.float64),
    }
    report = measure_mask_eligibility(
        masks, ("face_oval", "skin", "eyes"),
        not_visible={}, invalid_geometry=False,
    )
    assert not report.eligible
    assert report.eyes_inside == 0.0
    assert report.empty_without_reason == ("eyes",)


def test_an_explicitly_closed_pair_can_have_zero_measured_eyes() -> None:
    masks = {
        "face_oval": np.ones((8, 8), dtype=np.float64),
        "skin": np.full((8, 8), 0.8, dtype=np.float64),
        "eyes": np.zeros((8, 8), dtype=np.float64),
    }
    report = measure_mask_eligibility(
        masks, ("face_oval", "skin", "eyes"),
        not_visible={"eyes": "closed"}, invalid_geometry=False,
    )
    assert report.eligible
    assert report.eyes_inside == 1.0
    assert report.to_json()["release_status"] == "UNPROVEN"


def test_bad_visibility_labels_never_authorize_synthetic_mask_acceptance() -> None:
    masks = {
        "face_oval": np.ones((8, 8), dtype=np.float64),
        "skin": np.full((8, 8), 0.8, dtype=np.float64),
        "eyes": np.zeros((8, 8), dtype=np.float64),
    }
    with pytest.raises(ValueError, match="known geometric categories"):
        measure_mask_eligibility(
            masks, ("face_oval", "skin", "eyes"),
            not_visible={"eyes": "occluded_for_unknown_reason"},
            invalid_geometry=False,
        )
    with pytest.raises(ValueError, match="known geometric categories"):
        measure_mask_eligibility(
            masks, ("face_oval", "skin", "eyes"),
            not_visible={"not_a_region": "closed"}, invalid_geometry=False,
        )
