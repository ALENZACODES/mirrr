"""Geometry, expression direction and hair occlusion oracles. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.filters.artistic import EffectUnavailable, render
from plumb_api.filters.artistic.crown import crown_anchors
from plumb_api.filters.artistic.geometry import bound_field, face_frame, jacobian, path_distance, quadratic
from plumb_api.filters.artistic.rain import expression_field, tear_layers
from tests.artistic_helpers import drawn


def test_jacobian_matches_analytic_affine_displacement() -> None:
    yy, xx = np.mgrid[:9, :12].astype(float)
    dx = 0.1 * xx + 0.05 * yy
    dy = -0.02 * xx + 0.12 * yy
    expected = (1 - 0.1) * (1 - 0.12) - 0.05 * -0.02
    np.testing.assert_allclose(jacobian(dx, dy), expected, atol=1e-14)


def test_folded_test_field_is_reduced_to_written_floor() -> None:
    yy, xx = np.mgrid[:20, :30].astype(float)
    dx = xx * 1.8
    dy = yy * 0.4
    assert np.min(jacobian(dx, dy)) < 0
    fixed_x, fixed_y, scale = bound_field(dx, dy, 100)
    assert 0 < scale < 1
    assert np.min(jacobian(fixed_x, fixed_y)) >= 0.75
    np.testing.assert_allclose(fixed_x, dx * scale)
    np.testing.assert_allclose(fixed_y, dy * scale)


def test_displacement_budget_caps_a_translation_without_changing_direction() -> None:
    dx, dy = np.full((7, 8), 30.0), np.full((7, 8), 40.0)
    x, y, scale = bound_field(dx, dy, 5)
    assert scale == 0.1
    np.testing.assert_array_equal(x, 3)
    np.testing.assert_array_equal(y, 4)
    np.testing.assert_array_equal(jacobian(x, y), 1)


def test_quadratic_curve_endpoints_and_linear_special_case() -> None:
    start, control, end = np.array([1, 2]), np.array([5, 6]), np.array([9, 10])
    curve = quadratic(start, control, end, 9)
    np.testing.assert_array_equal(curve[0], start)
    np.testing.assert_array_equal(curve[-1], end)
    np.testing.assert_allclose(curve, np.stack([np.arange(1, 10), np.arange(2, 11)], axis=1))


def test_path_distance_uses_segments_not_only_curve_sample_points() -> None:
    x = np.array([[5.0, 5.0, 20.0]])
    y = np.array([[3.0, -2.0, 0.0]])
    path = np.array([[0.0, 0.0], [10.0, 0.0]])
    distance, progress = path_distance(x, y, path)
    np.testing.assert_array_equal(distance, [[3, 2, 10]])
    np.testing.assert_array_equal(progress, [[0.5, 0.5, 1]])


@pytest.mark.parametrize("roll", [-25, 0, 30])
@pytest.mark.parametrize("asymmetry", [-1, 0, 1])
def test_expression_field_finite_and_bounded_on_rotated_mesh(roll: float, asymmetry: float) -> None:
    image, mesh, _, _ = drawn(100, 120)
    points = mesh * (100, 120)
    a = np.deg2rad(roll)
    rot = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
    points = (points - (50, 60)) @ rot.T + (50, 60)
    dx, dy, checks = expression_field(points, image.shape[:2], amount=1, expression=1,
                                      asymmetry=asymmetry, phase=0.25)
    assert np.all(np.isfinite(dx)) and np.all(np.isfinite(dy))
    assert checks["min_jacobian"] >= 0.75 - 1e-9
    assert checks["displacement_iod"] <= 0.07 + 1e-9
    assert checks["maximum_displacement"] > 0


def test_brow_moves_up_and_mouth_corner_moves_down() -> None:
    image, mesh, _, _ = drawn(200, 240)
    points = mesh * (200, 240)
    dx, dy, _ = expression_field(points, image.shape[:2], amount=1, expression=1, asymmetry=0, phase=0)
    frame = face_frame(points)
    for index, expected_sign in ((55, -1), (285, -1), (61, 1), (291, 1)):
        x, y = np.floor(points[index]).astype(int)
        vertical = dx[y, x] * frame.down[0] + dy[y, x] * frame.down[1]
        assert vertical * expected_sign > 0.1


def test_asymmetry_and_tremble_are_effective_controls() -> None:
    image, mesh, _, _ = drawn(100, 120)
    one = render("rain-expression", image, landmarks=mesh, params={"asymmetry": 1, "phase": 0.25, "adult_confirmed": True})
    other = render("rain-expression", image, landmarks=mesh, params={"asymmetry": -1, "phase": 0.75, "adult_confirmed": True})
    assert not np.array_equal(one.image, other.image)
    assert not np.array_equal(one.geometry["displacement_x"], other.geometry["displacement_x"])


def test_tears_and_expression_can_be_disabled_independently() -> None:
    image, mesh, _, _ = drawn()
    dry = render("rain-expression", image, landmarks=mesh, params={"tears": 0, "adult_confirmed": True})
    wet = render("rain-expression", image, landmarks=mesh, params={"expression": 0, "adult_confirmed": True})
    zero = render("rain-expression", image, landmarks=mesh, params={"expression": 0, "tears": 0, "adult_confirmed": True})
    assert dry.metrics["tear_pixels"] == 0
    assert dry.metrics["maximum_displacement"] > 0
    assert wet.metrics["maximum_displacement"] == 0
    assert wet.metrics["tear_pixels"] > 0
    np.testing.assert_array_equal(zero.image, image)


def test_tear_support_does_not_enter_eyes_or_background() -> None:
    image, mesh, _, eyes = drawn()
    water, highlight, rim = tear_layers(mesh * (80, 96), image.shape[:2], amount=1,
                                        tears=1, length=0.65, asymmetry=1, phase=0.5)
    assert np.count_nonzero(water) > 0
    for layer in (water, highlight, rim):
        np.testing.assert_array_equal(layer[eyes > 0], 0)
        np.testing.assert_array_equal(layer[0], 0)
        assert np.min(layer) >= 0 and np.max(layer) <= 1


@pytest.mark.parametrize("angle", [-0.5, 0.25, 0.9])
@pytest.mark.parametrize("scale", [0.6, 1.0, 1.8])
def test_crown_anchors_follow_affine_similarity_exactly(angle: float, scale: float) -> None:
    _, mesh, _, _ = drawn()
    points = mesh * (80, 96)
    rotation = np.array([[np.cos(angle), -np.sin(angle)], [np.sin(angle), np.cos(angle)]])
    shift = np.array([17, -7])
    transformed = points @ rotation.T * scale + shift
    before = crown_anchors(points, count=7, size=1.1, height=0.05)
    after = crown_anchors(transformed, count=7, size=1.1, height=0.05)
    np.testing.assert_allclose(after, before @ rotation.T * scale + shift, atol=1e-7)


def test_foreground_hair_is_exact_even_with_full_strength_crown() -> None:
    image, mesh, hair, _ = drawn()
    out = render("meadow-crown", image, landmarks=mesh, hair_mask=hair, params={"amount": 1})
    np.testing.assert_array_equal(out.image[hair == 1], image[hair == 1])
    assert out.metrics["hair_foreground_max_error"] == 0
    assert out.metrics["occluded_fraction"] > 0
    assert out.metrics["changed_pixels"] > 0


def test_soft_hair_alpha_halves_art_coverage() -> None:
    image, mesh, _, _ = drawn()
    clear = render("meadow-crown", image, landmarks=mesh, hair_mask=np.zeros(image.shape[:2]), params={"amount": 1})
    soft = render("meadow-crown", image, landmarks=mesh, hair_mask=np.full(image.shape[:2], 0.5), params={"amount": 1})
    np.testing.assert_allclose(soft.support, clear.support * 0.5, atol=0)
    average = (clear.image.astype(float) + image.astype(float)) * 0.5
    assert np.max(np.abs(soft.image.astype(float) - average)) <= 1


def test_fully_hidden_crown_reports_no_visible_result() -> None:
    image, mesh, _, _ = drawn()
    output = render("meadow-crown", image, landmarks=mesh, hair_mask=np.ones(image.shape[:2]))
    np.testing.assert_array_equal(output.image, image)
    assert output.metrics["visible_alpha_sum"] == 0
    assert any("hidden" in text for text in output.warnings)
    with pytest.raises(EffectUnavailable):
        render("meadow-crown", image, landmarks=mesh)


@pytest.mark.parametrize("key,value", [("flowers", 2), ("flowers", 7.5), ("size", 2),
                                      ("height", 0.5), ("palette", "unknown"), ("seed", -1)])
def test_crown_validates_every_art_control(key: str, value: object) -> None:
    image, mesh, hair, _ = drawn()
    with pytest.raises(ValueError):
        render("meadow-crown", image, landmarks=mesh, hair_mask=hair, params={key: value})

