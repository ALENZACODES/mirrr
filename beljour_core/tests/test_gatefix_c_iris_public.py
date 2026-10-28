"""Public iris-colour refusals and source-pixel invariants on artificial eyes.

One genuinely visible eye can be edited; unexplained missing support is a
refusal, not a substitute eye or a successful result.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.eyes import recolour_visible


SIZE = 64


def drawn_masks() -> tuple[np.ndarray, dict[str, np.ndarray]]:
    image = np.full((SIZE, SIZE, 3), (98, 92, 87), dtype=np.uint8)
    right = np.zeros((SIZE, SIZE), dtype=np.float64)
    left = np.zeros_like(right)
    yy, xx = np.mgrid[:SIZE, :SIZE]
    right[(xx - 18) ** 2 + (yy - 24) ** 2 <= 7 ** 2] = 1
    left[(xx - 45) ** 2 + (yy - 24) ** 2 <= 7 ** 2] = 1
    image[right > 0] = (45, 38, 29)
    image[left > 0] = (69, 62, 51)
    image[21, 16] = (255, 255, 255)
    image[21, 44] = (255, 255, 255)
    return image, {"right_iris": right, "left_iris": left}


def test_both_visible_edit_independently_with_catchlights_intact() -> None:
    image, masks = drawn_masks()
    original = image.copy()
    states = {"right_iris": "visible", "left_iris": "visible"}
    result = recolour_visible(image, masks, states)
    assert result.eligible
    assert result.visible_irises == 2
    assert result.changed > 0
    assert result.declared_not_visible == ()
    assert result.undeclared_missing == ()
    assert np.array_equal(image, original)
    assert np.array_equal(result.image[0, :], original[0, :])
    assert np.array_equal(result.image[21, 16], original[21, 16])
    assert np.array_equal(result.image[21, 44], original[21, 44])


@pytest.mark.parametrize("reason", ("closed", "hidden_by_turn"))
@pytest.mark.parametrize("missing_side", ("right", "left"))
def test_declared_missing_side_cannot_leak_pixels(
    reason: str, missing_side: str
) -> None:
    image, masks = drawn_masks()
    missing_key = missing_side + "_iris"
    opposite = "left" if missing_side == "right" else "right"
    masks[missing_key][:] = 0
    states = {missing_key: "not_visible:" + reason, opposite + "_iris": "visible"}
    original = image.copy()
    result = recolour_visible(image, masks, states)
    assert result.eligible
    assert result.visible_irises == 1
    assert missing_side + ":" + reason in result.declared_not_visible
    unchanged_region = original[:, :34] if missing_side == "right" else original[:, 34:]
    new_region = result.image[:, :34] if missing_side == "right" else result.image[:, 34:]
    np.testing.assert_array_equal(new_region, unchanged_region)
    np.testing.assert_array_equal(image, original)


def test_both_declared_missing_cannot_be_eligible() -> None:
    image, masks = drawn_masks()
    masks["right_iris"][:] = 0
    masks["left_iris"][:] = 0
    states = {"right_iris": "not_visible:closed", "left_iris": "not_visible:closed"}
    result = recolour_visible(image, masks, states)
    assert not result.eligible
    assert result.visible_irises == 0
    assert result.changed == 0
    assert np.array_equal(result.image, image)


def test_a_hidden_state_with_nonempty_mask_is_inconsistent_evidence() -> None:
    image, masks = drawn_masks()
    states = {"right_iris": "not_visible:hidden_by_turn", "left_iris": "visible"}
    result = recolour_visible(image, masks, states)
    assert not result.eligible
    assert "right:inconsistent_hidden_mask" in result.undeclared_missing


def test_unexplained_missing_mask_is_never_replaced_or_accepted() -> None:
    image, masks = drawn_masks()
    masks["right_iris"][:] = 0
    result = recolour_visible(
        image, masks, {"right_iris": "empty", "left_iris": "visible"}
    )
    assert not result.eligible
    assert "right:unobserved" in result.undeclared_missing
    assert result.changed == 0
    np.testing.assert_array_equal(result.image, image)
    assert np.count_nonzero(result.alpha) == 0


@pytest.mark.parametrize("bad", (-0.01, np.nan, np.inf, 1.2))
def test_invalid_mask_alpha_is_not_silently_clamped(bad: float) -> None:
    image, masks = drawn_masks()
    masks["left_iris"][2, 2] = bad
    with pytest.raises(ValueError, match="finite alpha"):
        recolour_visible(image, masks, {"right_iris": "visible", "left_iris": "visible"})


def test_public_api_rejects_missing_side_mask() -> None:
    image, masks = drawn_masks()
    del masks["left_iris"]
    with pytest.raises(ValueError, match="both measured iris"):
        recolour_visible(image, masks, {"right_iris": "visible"})


def test_unchanged_at_zero_strength_is_not_reported_as_a_success() -> None:
    image, masks = drawn_masks()
    result = recolour_visible(
        image, masks, {"right_iris": "visible", "left_iris": "visible"}, strength=0
    )
    assert not result.eligible
    assert result.changed == 0
    assert np.array_equal(result.image, image)


def test_colour_treatment_does_not_modify_an_alpha_channel() -> None:
    image, masks = drawn_masks()
    rgba = np.concatenate((image, np.full((SIZE, SIZE, 1), 255, dtype=np.uint8)), axis=2)
    with pytest.raises(ValueError, match="RGB"):
        recolour_visible(rgba, masks, {"right_iris": "visible", "left_iris": "visible"})


def test_invalid_scene_cannot_be_changed_before_rejection() -> None:
    image, masks = drawn_masks()
    original = image.copy()
    masks["right_iris"] = masks["right_iris"][:20]
    with pytest.raises(ValueError, match="dimensions"):
        recolour_visible(image, masks, {"right_iris": "visible", "left_iris": "visible"})
    np.testing.assert_array_equal(image, original)
