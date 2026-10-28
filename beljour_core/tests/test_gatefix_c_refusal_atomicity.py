"""Atomic refusal and annotation-boundary checks on artificial iris and hair data.

These tests exercise public local edit contracts without holding photographs or
constructing face-identity attributes. All image arrays are synthetic pixels.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.eyes import recolour_visible
from plumb_api.engines.haircolour.recolour import geometry_checks


@pytest.fixture
def observed_scene() -> tuple[np.ndarray, dict[str, np.ndarray]]:
    image = np.full((48, 88, 3), (105, 96, 85), dtype=np.uint8)
    right = np.zeros(image.shape[:2], dtype=np.float64)
    left = np.zeros_like(right)
    yy, xx = np.indices(right.shape)
    right[(xx - 18) ** 2 + (yy - 24) ** 2 < 7 ** 2] = 1.0
    left[(xx - 66) ** 2 + (yy - 24) ** 2 < 7 ** 2] = 1.0
    image[right > 0] = (35, 41, 47)
    image[left > 0] = (87, 73, 62)
    image[22, 18] = (252, 252, 252)
    image[22, 66] = (252, 252, 252)
    return image, {"right_iris": right, "left_iris": left}


@pytest.mark.parametrize("hidden_side", ("right", "left"))
@pytest.mark.parametrize("reason", ("closed", "hidden_by_turn"))
def test_declared_one_eye_absent_is_eligible_without_source_mutation(
    observed_scene: tuple[np.ndarray, dict[str, np.ndarray]],
    hidden_side: str,
    reason: str,
) -> None:
    image, masks = observed_scene
    original = image.copy()
    masks[hidden_side + "_iris"][:] = 0.0
    states = {"right_iris": "visible", "left_iris": "visible"}
    states[hidden_side + "_iris"] = "not_visible:" + reason
    edited = recolour_visible(image, masks, states, shade="amber")
    assert edited.eligible
    assert edited.visible_irises == 1
    assert edited.changed > 0
    np.testing.assert_array_equal(image, original)
    support = np.maximum(masks["right_iris"], masks["left_iris"])
    np.testing.assert_array_equal(edited.image[support == 0], original[support == 0])
    assert edited.declared_not_visible == (hidden_side + ":" + reason,)


@pytest.mark.parametrize("missing_side", ("right", "left"))
def test_undeclared_empty_eye_refuses_without_partial_output(
    observed_scene: tuple[np.ndarray, dict[str, np.ndarray]],
    missing_side: str,
) -> None:
    image, masks = observed_scene
    masks[missing_side + "_iris"][:] = 0.0
    result = recolour_visible(
        image,
        masks,
        {"right_iris": "visible", "left_iris": "visible"},
        shade="cocoa",
    )
    assert not result.eligible
    assert result.changed == 0
    assert result.visible_irises == 0
    assert missing_side + ":unobserved" in result.undeclared_missing
    assert not np.any(result.alpha)
    np.testing.assert_array_equal(result.image, image)
    assert result.image is not image


@pytest.mark.parametrize("missing_side", ("right", "left"))
def test_hidden_state_with_observed_support_refuses_without_partial_output(
    observed_scene: tuple[np.ndarray, dict[str, np.ndarray]],
    missing_side: str,
) -> None:
    image, masks = observed_scene
    state = {"right_iris": "visible", "left_iris": "visible"}
    state[missing_side + "_iris"] = "not_visible:hidden_by_turn"
    result = recolour_visible(image, masks, state)
    assert not result.eligible
    assert result.changed == 0
    assert missing_side + ":inconsistent_hidden_mask" in result.undeclared_missing
    np.testing.assert_array_equal(result.image, image)


def test_one_shared_pixel_between_two_observed_irises_refuses(
    observed_scene: tuple[np.ndarray, dict[str, np.ndarray]],
) -> None:
    image, masks = observed_scene
    masks["left_iris"][24, 18] = 1.0
    response = recolour_visible(
        image, masks, {"right_iris": "visible", "left_iris": "visible"}
    )
    assert not response.eligible
    assert response.changed == 0
    assert response.undeclared_missing == ("iris_masks_overlap",)
    np.testing.assert_array_equal(response.image, image)


def test_soft_alpha_overlap_below_observation_threshold_is_not_an_iris(
    observed_scene: tuple[np.ndarray, dict[str, np.ndarray]],
) -> None:
    image, masks = observed_scene
    masks["left_iris"][24, 18] = 0.49
    response = recolour_visible(
        image, masks, {"right_iris": "visible", "left_iris": "visible"}
    )
    assert response.eligible
    assert response.changed > 0
    assert response.undeclared_missing == ()


@pytest.mark.parametrize("bad", (-1, 100.1, np.nan, np.inf, -np.inf, "65"))
def test_strength_validates_even_if_both_irises_are_hidden(
    observed_scene: tuple[np.ndarray, dict[str, np.ndarray]],
    bad: object,
) -> None:
    image, masks = observed_scene
    for value in masks.values():
        value[:] = 0.0
    with pytest.raises(ValueError, match="strength"):
        recolour_visible(
            image, masks,
            {"right_iris": "not_visible:closed", "left_iris": "not_visible:closed"},
            strength=bad,
        )


def test_shade_validates_even_if_nothing_can_be_rendered(
    observed_scene: tuple[np.ndarray, dict[str, np.ndarray]],
) -> None:
    image, masks = observed_scene
    masks["right_iris"][:] = 0.0
    masks["left_iris"][:] = 0.0
    with pytest.raises(ValueError, match="shade"):
        recolour_visible(
            image, masks,
            {"right_iris": "not_visible:closed", "left_iris": "not_visible:closed"},
            shade="unknown_selection",
        )


def test_non_numeric_iris_plane_is_a_typed_validation_error(
    observed_scene: tuple[np.ndarray, dict[str, np.ndarray]],
) -> None:
    image, masks = observed_scene
    masks["left_iris"] = np.full(image.shape[:2], "not_a_number", dtype=object)
    with pytest.raises(ValueError, match="finite alpha"):
        recolour_visible(
            image, masks, {"right_iris": "visible", "left_iris": "visible"}
        )


@pytest.mark.parametrize("boundary", (0.0, 0.2, 0.49))
def test_geometry_audit_rejects_edits_below_observed_hair_support(boundary: float) -> None:
    original = np.full((25, 25, 3), (104, 96, 88), dtype=np.uint8)
    mask = np.zeros(original.shape[:2], dtype=np.float64)
    mask[5:20, 5:20] = 1.0
    mask[5:20, 5:8] = boundary
    altered = original.copy()
    altered[12, 6, 0] += 1
    report = geometry_checks(original, altered, mask)
    assert not report["outside_unchanged"]
    assert not report["geometry_lock"]
    assert not report["silhouette_unchanged"]


def test_geometry_audit_does_not_count_observed_hair_as_background() -> None:
    original = np.full((25, 25, 3), (104, 96, 88), dtype=np.uint8)
    mask = np.zeros(original.shape[:2], dtype=np.float64)
    mask[5:20, 5:20] = 1.0
    mask[12, 6] = 0.5
    altered = original.copy()
    altered[12, 6, 0] += 1
    report = geometry_checks(original, altered, mask)
    assert report["outside_unchanged"]
    assert report["silhouette_unchanged"]


@pytest.mark.parametrize("bad", (float("nan"), -0.1, 1.1))
def test_geometry_audit_rejects_invalid_coverage(bad: float) -> None:
    original = np.full((25, 25, 3), (104, 96, 88), dtype=np.uint8)
    mask = np.zeros(original.shape[:2], dtype=np.float64)
    mask[12, 12] = bad
    with pytest.raises(ValueError, match="finite alpha"):
        geometry_checks(original, original, mask)


def test_geometry_audit_rejects_mismatched_frame_shape() -> None:
    original = np.full((25, 25, 3), (104, 96, 88), dtype=np.uint8)
    mask = np.ones((25, 25), dtype=np.float64)
    with pytest.raises(ValueError, match="matching"):
        geometry_checks(original, original[:24], mask)


def test_geometry_audit_rejects_mismatched_mask_shape() -> None:
    original = np.full((25, 25, 3), (104, 96, 88), dtype=np.uint8)
    mask = np.ones((24, 25), dtype=np.float64)
    with pytest.raises(ValueError, match="mask must match"):
        geometry_checks(original, original, mask)
