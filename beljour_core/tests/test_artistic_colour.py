"""Independent band, edge, quadrant and paint tests. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.filters.artistic import EffectUnavailable, render
from plumb_api.filters.artistic.ink import cel_rgb, sobel
from plumb_api.filters.artistic.oil import integral, kuwahara, paint_texture, rectangle_sums
from tests.artistic_helpers import direct_quadrants, drawn


def test_cel_grey_ramp_has_exact_quantization_levels_without_ink_or_shadow() -> None:
    levels = 5
    ramp = np.linspace(0, 255, 257)
    rgb = np.repeat(ramp[None, :, None], 3, axis=2)
    painted, _ = cel_rgb(rgb, levels=levels, ink=0, edge_threshold=0.1, edge_softness=0.1, shadow=0)
    expected = np.floor(ramp / 255 * (levels - 1) + 0.5) / (levels - 1) * 255
    # At exact arithmetic band midpoints, a floating luminance dot product may
    # fall one ulp either side; non-midpoints must agree with the scalar oracle.
    non_midpoint = np.abs((ramp / 255 * 4) % 1 - 0.5) > 1e-12
    np.testing.assert_allclose(painted[0, non_midpoint, 0], expected[non_midpoint], atol=1e-10)
    assert painted[0, 0, 0] == 0
    assert abs(painted[0, -1, 0] - 255) < 1e-10


def test_sobel_flat_patch_and_unit_step_oracle() -> None:
    constant = np.full((8, 8), 0.71)
    np.testing.assert_allclose(sobel(constant), 0, atol=1e-16)
    step = np.zeros((7, 9))
    step[:, 5:] = 1
    edge = sobel(step)
    expected = np.zeros_like(step)
    expected[:, 4:6] = 0.5
    np.testing.assert_array_equal(edge, expected)


def test_positive_soft_hair_and_eye_alpha_copy_exact_pixels() -> None:
    image, _, hair, eyes = drawn()
    hair[30, 20] = 1e-12
    eyes[60, 44] = 0.001
    output = render("ink-study", image, hair_mask=hair, eye_mask=eyes, params={"amount": 1})
    protected = (hair > 0) | (eyes > 0)
    np.testing.assert_array_equal(output.image[protected], image[protected])
    assert np.any(output.image[~protected] != image[~protected])
    assert output.metrics["hair_max_error"] == output.metrics["eye_max_error"] == 0


def test_mesh_eye_mask_and_explicit_eye_mask_agree() -> None:
    image, mesh, hair, eyes = drawn()
    explicit = render("ink-study", image, hair_mask=hair, eye_mask=eyes)
    automatic = render("ink-study", image, hair_mask=hair, landmarks=mesh)
    np.testing.assert_array_equal(explicit.image, automatic.image)


def test_missing_hair_does_not_become_an_unprotected_cel_render() -> None:
    image, mesh, _, _ = drawn()
    with pytest.raises(EffectUnavailable) as error:
        render("ink-study", image, landmarks=mesh)
    assert error.value.code == "missing_hair_mask"


def test_more_ink_darkens_edge_but_not_flat_middle() -> None:
    image = np.zeros((20, 30, 3), dtype=np.uint8)
    image[:] = (50, 100, 150)
    image[:, 15:] = (200, 160, 120)
    empty = np.zeros(image.shape[:2])
    low = render("ink-study", image, hair_mask=empty, eye_mask=empty, params={"amount": 1, "ink": 0})
    high = render("ink-study", image, hair_mask=empty, eye_mask=empty, params={"amount": 1, "ink": 1, "edge_threshold": 0.01})
    assert np.mean(high.image[:, 14:16]) < np.mean(low.image[:, 14:16])
    np.testing.assert_array_equal(high.image[:, 3:10], low.image[:, 3:10])


@pytest.mark.parametrize("radius", [1, 2, 4, 12])
@pytest.mark.parametrize("shape", [(2, 2), (4, 7), (7, 5)])
def test_kuwahara_matches_direct_variance_oracle(radius: int, shape: tuple[int, int]) -> None:
    random = np.random.default_rng(813 + radius + shape[0])
    image = random.integers(0, 256, (*shape, 3)).astype(float)
    expected = direct_quadrants(image, radius)
    actual, _ = kuwahara(image, radius)
    np.testing.assert_allclose(actual, expected, atol=1e-10, rtol=0)


def test_quadrant_tie_selects_north_west_and_keeps_constant_colour() -> None:
    rgb = np.full((11, 9, 3), [40, 80, 160], dtype=float)
    painted, chosen = kuwahara(rgb, 3)
    np.testing.assert_array_equal(painted, rgb)
    np.testing.assert_array_equal(chosen, 0)


def test_integral_rectangle_uses_half_open_corners() -> None:
    values = np.arange(4 * 7 * 3, dtype=float).reshape(4, 7, 3)
    table = integral(values)
    x0, x1, y0, y1 = np.array(2), np.array(6), np.array(1), np.array(4)
    actual = rectangle_sums(table, y0, x0, y1, x1)
    np.testing.assert_array_equal(actual, np.sum(values[1:4, 2:6], axis=(0, 1)))
    np.testing.assert_array_equal(table[0], 0)
    np.testing.assert_array_equal(table[:, 0], 0)


def test_quadrant_filter_keeps_sharp_step_without_colour_bleed() -> None:
    rgb = np.zeros((15, 20, 3))
    rgb[:, :10] = (20, 30, 40)
    rgb[:, 10:] = (210, 180, 160)
    out, _ = kuwahara(rgb, 4)
    np.testing.assert_array_equal(out, rgb)


def test_texture_is_visible_at_native_scale_and_seeded() -> None:
    image = np.full((30, 30, 3), [120, 100, 80], np.uint8)
    neutral = render("pigment-oil", image, params={"texture": 0, "amount": 1})
    textured = render("pigment-oil", image, params={"texture": 1, "amount": 1, "seed": 17})
    other = render("pigment-oil", image, params={"texture": 1, "amount": 1, "seed": 18})
    np.testing.assert_array_equal(neutral.image, image)
    assert np.std(textured.image[..., 0]) > 1
    assert textured.metrics["texture_rms"] > 0
    assert not np.array_equal(other.image, textured.image)
    assert textured.metrics["geometry_displacement"] == 0


@pytest.mark.parametrize("extreme", [0, 255])
def test_paint_texture_does_not_halo_black_or_white(extreme: int) -> None:
    image = np.full((9, 11, 3), extreme, np.uint8)
    output = render("pigment-oil", image, params={"amount": 1, "texture": 1})
    np.testing.assert_array_equal(output.image, image)


def test_canvas_orientation_and_scale_control_actual_pattern() -> None:
    normal = paint_texture((30, 40), seed=17, brush_angle=0, canvas_scale=1)
    rotated = paint_texture((30, 40), seed=17, brush_angle=1, canvas_scale=1)
    bigger = paint_texture((30, 40), seed=17, brush_angle=0, canvas_scale=3)
    assert not np.allclose(normal, rotated)
    assert not np.allclose(normal, bigger)
    assert np.max(np.abs(normal)) < 10

