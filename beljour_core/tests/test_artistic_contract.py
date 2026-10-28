"""Boundary, determinism, alpha and no-mutation gates. Author: John Khan.

Pass definition: docs/artistic/PASS_DEFINITIONS.md. Synthetic images only.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.filters.artistic import EFFECTS, EffectUnavailable, render
from plumb_api.filters.artistic.types import (
    MAX_PIXELS,
    bilinear,
    byte_round,
    hash_noise,
    integer,
    landmarks,
    mask,
    number,
    parameters,
    photo,
)
from tests.artistic_helpers import drawn


@pytest.mark.parametrize("effect", EFFECTS)
@pytest.mark.parametrize("rgba", [False, True])
def test_neutral_is_exact_and_non_aliasing(effect: str, rgba: bool) -> None:
    image, mesh, hair, eyes = drawn(rgba=rgba)
    params = {"amount": 0, **({"adult_confirmed": True} if effect == "rain-expression" else {})}
    output = render(effect, image, landmarks=mesh, hair_mask=hair, eye_mask=eyes, params=params)
    np.testing.assert_array_equal(output.image, image)
    assert output.image is not image and not np.shares_memory(output.image, image)
    assert np.max(output.support, initial=0) == 0
    assert output.metrics["changed_pixels"] == 0
    assert "simulation" in output.label.lower()


@pytest.mark.parametrize("effect", EFFECTS)
@pytest.mark.parametrize("tone", [28, 100, 190])
def test_default_changes_somewhere_and_repeat_is_identical(effect: str, tone: int) -> None:
    image, mesh, hair, eyes = drawn(tone=tone, rgba=True)
    before = tuple(x.copy() for x in (image, mesh, hair, eyes))
    params = {"adult_confirmed": True} if effect == "rain-expression" else {}
    first = render(effect, image, landmarks=mesh, hair_mask=hair, eye_mask=eyes, params=params)
    again = render(effect, image, landmarks=mesh, hair_mask=hair, eye_mask=eyes, params=params)
    assert first.metrics["changed_pixels"] > 0
    assert first.metrics["finite"] is True
    np.testing.assert_array_equal(first.image, again.image)
    for value, original in zip((image, mesh, hair, eyes), before, strict=True):
        np.testing.assert_array_equal(value, original)
    np.testing.assert_array_equal(first.image[..., 3], image[..., 3])
    np.testing.assert_array_equal(first.image[image[..., 3] == 0], image[image[..., 3] == 0])
    np.testing.assert_array_equal(first.image[first.support == 0], image[first.support == 0])


@pytest.mark.parametrize("value", [True, False, "0.5", None, float("nan"), float("inf"), -0.1, 1.1])
def test_numeric_parameters_reject_invalid_values(value: object) -> None:
    with pytest.raises(ValueError):
        number(value, "amount", 0, 1)


@pytest.mark.parametrize("value", [1.1, 2.9, True, "3", None])
def test_integer_parameters_do_not_truncate(value: object) -> None:
    with pytest.raises(ValueError):
        integer(value, "radius", 1, 12)


def test_bad_image_dimensions_types_and_channel_count() -> None:
    for image in (np.zeros((4, 4)), np.zeros((4, 4, 3)), np.zeros((4, 4, 5), np.uint8),
                  np.zeros((1, 4, 3), np.uint8), np.zeros((4, 0, 3), np.uint8)):
        with pytest.raises(ValueError):
            photo(image)
    assert MAX_PIXELS == 4_194_304
    with pytest.raises(ValueError):
        photo(np.zeros((2049, 2048, 3), np.uint8))


@pytest.mark.parametrize("value", [None, [], [1], [[0, 0], [0, float("nan")]], [[0, 0], [0, 1.01]]])
def test_mask_errors_are_explicit(value: object) -> None:
    with pytest.raises(ValueError):
        mask(value, (2, 2), "hair_mask")


def test_missing_observations_have_codes_and_cannot_be_bypassed_with_zero_strength() -> None:
    image, mesh, _, _ = drawn()
    with pytest.raises(EffectUnavailable) as error:
        render("meadow-crown", image, landmarks=mesh, params={"amount": 0})
    assert error.value.code == "missing_hair_mask"
    with pytest.raises(EffectUnavailable, match="face mesh"):
        render("rain-expression", image, params={"amount": 0, "adult_confirmed": True})


@pytest.mark.parametrize("params", [{}, {"adult_confirmed": False}, {"adult_confirmed": False, "amount": 0}])
def test_expression_refuses_missing_or_negative_adult_confirmation(params: dict) -> None:
    image, mesh, _, _ = drawn()
    with pytest.raises(EffectUnavailable) as error:
        render("rain-expression", image, landmarks=mesh, params=params)
    assert error.value.code == "adult_confirmation_required"


@pytest.mark.parametrize("value", ["true", 1, None, [], float("nan")])
def test_expression_does_not_coerce_adult_confirmation(value: object) -> None:
    image, mesh, _, _ = drawn()
    with pytest.raises(ValueError, match="explicit boolean"):
        render("rain-expression", image, landmarks=mesh, params={"adult_confirmed": value})
    with pytest.raises(EffectUnavailable, match="eye mask"):
        render("ink-study", image, hair_mask=np.zeros(image.shape[:2]))


def test_unknown_effect_and_parameter_keys_are_rejected() -> None:
    image, _, _, _ = drawn()
    with pytest.raises(ValueError, match="unknown"):
        render("third-party-look", image)
    with pytest.raises(ValueError, match="unknown"):
        render("pigment-oil", image, params={"silently_ignored": True})
    with pytest.raises(ValueError):
        parameters([], {"amount": 0.5})


@pytest.mark.parametrize("bad", [np.zeros((477, 2)), np.full((478, 2), np.nan),
                               np.full((478, 2), 2), np.zeros((478, 4))])
def test_landmark_boundary_does_not_clip_or_invent_faces(bad: np.ndarray) -> None:
    with pytest.raises(ValueError):
        landmarks(bad, (80, 80))


def test_degenerate_eye_distance_refuses_without_edit() -> None:
    _, mesh, _, _ = drawn()
    mesh[473] = mesh[468]
    with pytest.raises(EffectUnavailable) as error:
        landmarks(mesh, (96, 80))
    assert error.value.code == "mesh_too_small"


def test_byte_rounding_is_explicit_at_midpoints() -> None:
    values = np.array([-5, 0, 0.49, 0.5, 1.5, 2.5, 254.49, 254.5, 300])
    np.testing.assert_array_equal(byte_round(values), [0, 0, 0, 1, 2, 3, 254, 255, 255])


def test_bilinear_constant_and_corner_oracle() -> None:
    image = np.array([[[0, 10, 20], [100, 110, 120]], [[200, 210, 220], [40, 50, 60]]], dtype=np.uint8)
    x = np.array([[0.0, 0.5], [1.0, -4]])
    y = np.array([[0.0, 0.5], [1.0, 0]])
    expected = np.array([[[0, 10, 20], [85, 95, 105]], [[40, 50, 60], [0, 10, 20]]])
    np.testing.assert_allclose(bilinear(image, x, y), expected, atol=0)


def test_coordinate_noise_does_not_depend_on_call_order() -> None:
    x, y = np.meshgrid(np.arange(17), np.arange(11))
    whole = hash_noise(x, y, 2147483647)
    patch = hash_noise(x[3:9, 4:12], y[3:9, 4:12], 2147483647)
    np.testing.assert_array_equal(whole[3:9, 4:12], patch)
    assert np.min(whole) >= 0 and np.max(whole) <= 1
    assert not np.array_equal(whole, hash_noise(x, y, 1))


def test_strided_photo_is_supported_without_mutation() -> None:
    image, _, _, _ = drawn()
    view = image[::2, ::2]
    before = image.copy()
    got = render("pigment-oil", view)
    contiguous = render("pigment-oil", np.ascontiguousarray(view))
    np.testing.assert_array_equal(got.image, contiguous.image)
    np.testing.assert_array_equal(before, image)

