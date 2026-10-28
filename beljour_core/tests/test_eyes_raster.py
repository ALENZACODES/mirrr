"""Independent numerical checks for the eye renderer's paint primitives. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.eyes.raster import (
    bezier,
    combine,
    filled,
    paint,
    random_values,
    restore_trace_background,
    segment_distance,
    smoothstep,
    stroke,
)


def test_segment_distance_uses_the_finite_segment_not_an_infinite_line() -> None:
    x = np.array([-1., 1., 5.])
    y = np.array([0., 3., 0.])
    actual = segment_distance(x, y, (0., 0.), (4., 0.))
    assert np.allclose(actual, [1., 3., 1.])
    degenerate = segment_distance(x, y, (0., 0.), (0., 0.))
    assert np.allclose(degenerate, np.hypot(x, y))


def test_bezier_curve_keeps_endpoints_and_known_midpoint() -> None:
    points = bezier((0, 0), (2, 4), (4, 0), 4)
    assert points[0] == (0, 0)
    assert points[-1] == (4, 0)
    assert points[2] == (2, 2)
    assert len(points) == 5
    with pytest.raises(ValueError):
        bezier((0, 0), (1, 1), (2, 0), 65)


def test_half_up_paint_rounding_is_explicit_and_alpha_is_preserved() -> None:
    photo = np.array([[[100, 101, 103, 173], [50, 50, 50, 0]]], dtype=np.uint8)
    coverage = np.array([[.5, 1.]])
    before = photo.copy()
    output = paint(photo, coverage, (51, 52, 54))
    assert output[0, 0].tolist() == [76, 77, 79, 173]
    assert output[0, 1].tolist() == [50, 50, 50, 0]
    assert np.array_equal(photo, before)


def test_paint_accepts_a_spatial_pigment_field_and_preserves_zero_coverage() -> None:
    photo = np.full((2, 3, 3), 80, dtype=np.uint8)
    colour = np.zeros((2, 3, 3))
    colour[0, 0] = [200, 100, 50]
    colour[1, 2] = [50, 150, 250]
    mask = np.zeros((2, 3))
    mask[0, 0] = .25
    mask[1, 2] = 1
    actual = paint(photo, mask, colour)
    assert actual[0, 0].tolist() == [110, 85, 73]
    assert actual[1, 2].tolist() == [50, 150, 250]
    assert np.array_equal(actual[mask == 0], photo[mask == 0])


@pytest.mark.parametrize("mask", [np.ones((2, 2)), np.full((1, 2), np.nan), np.full((1, 2), -.1), np.full((1, 2), 1.1)])
def test_paint_rejects_invalid_mask_fields(mask: np.ndarray) -> None:
    with pytest.raises(ValueError):
        paint(np.zeros((1, 2, 3), dtype=np.uint8), mask, (0, 0, 0))


def test_coverage_union_matches_independent_probability_formula() -> None:
    a = np.array([[0., .25, 1.]])
    b = np.array([[.3, .5, .2]])
    actual = combine(a, b)
    assert np.allclose(actual, [[.3, .625, 1.]])
    assert np.allclose(actual, combine(b, a))
    assert np.array_equal(a, [[0., .25, 1.]])
    assert np.array_equal(b, [[.3, .5, .2]])


def test_antialiased_rectangle_uses_pixel_centres_and_subsamples() -> None:
    actual = filled(4, 5, [(1., 1.), (4., 1.), (4., 3.), (1., 3.)])
    expected = np.zeros((4, 5))
    expected[1:3, 1:4] = 1
    assert np.array_equal(actual, expected)
    shifted = filled(4, 5, [(1.5, 1.), (4., 1.), (4., 3.), (1.5, 3.)])
    assert np.all(shifted[1:3, 1] == .5)
    assert float(np.sum(shifted)) == 5


def test_stroke_is_translation_equivariant_and_never_wraps_at_image_edges() -> None:
    one = stroke(20, 20, [(4., 5.), (9., 7.)], 1)
    two = stroke(20, 20, [(6., 8.), (11., 10.)], 1)
    assert np.allclose(one[0:17, 0:18], two[3:, 2:])
    edge = stroke(20, 20, [(-3., 3.), (2., 5.)], 1)
    assert np.count_nonzero(edge[:, -5:]) == 0
    assert np.count_nonzero(edge) > 0
    assert float(np.max(edge)) <= 1


def test_taper_narrows_the_tip_without_moving_the_root() -> None:
    points = [(5., 10.), (8., 10.), (11., 10.), (14., 10.)]
    plain = stroke(20, 20, points, 1.5)
    tapered = stroke(20, 20, points, 1.5, taper=True)
    assert np.all(tapered <= plain + 1e-12)
    assert float(np.sum(tapered[:, 12:16])) < float(np.sum(plain[:, 12:16]))
    assert np.count_nonzero(tapered[:, 4:7]) > 0


def test_invalid_stroke_points_and_brush_values_are_rejected() -> None:
    for points, radius, softness in (([(1, 1)], 1, 1), ([(1, 1), (2, 2)], 0, 1),
                                     ([(1, 1), (2, 2)], 1, float("inf")), ([(1, 1), (np.nan, 2)], 1, 1)):
        with pytest.raises(ValueError):
            stroke(10, 10, points, radius, softness=softness)


def test_smoothstep_clamps_and_has_exact_endpoints_and_midpoint() -> None:
    output = smoothstep(0, 1, np.array([-2., 0., .5, 1., 3.]))
    assert np.array_equal(output, [0, 0, .5, 1, 1])
    assert np.all(np.diff(smoothstep(0, 1, np.linspace(-1, 2, 100))) >= 0)


def test_seeded_lash_variation_matches_hand_computed_first_state() -> None:
    seed = 17
    first = ((1664525 * seed + 1013904223) % (2**32)) / (2**32)
    sequence = random_values(seed, 20)
    assert sequence[0] == first
    assert sequence == random_values(seed, 20)
    assert sequence != random_values(seed + 1, 20)
    assert all(0 <= v < 1 for v in sequence)


def test_observed_trace_cleanup_preserves_protected_eye_and_other_pixels() -> None:
    photo = np.full((9, 9, 3), 170, dtype=np.uint8)
    photo[4, 4] = 20
    mask = np.zeros((9, 9))
    mask[4, 4] = 1
    protected = np.zeros((9, 9))
    result, missing = restore_trace_background(photo, mask, protected)
    assert result[4, 4].tolist() == [170, 170, 170]
    assert missing == 0
    assert np.array_equal(result[mask == 0], photo[mask == 0])
    protected[4, 4] = 1
    untouched, _ = restore_trace_background(photo, mask, protected)
    assert np.array_equal(untouched, photo)


def test_cleanup_without_available_background_reports_remnants() -> None:
    photo = np.full((3, 3, 3), 50, dtype=np.uint8)
    mask = np.ones((3, 3))
    result, missing = restore_trace_background(photo, mask, np.zeros((3, 3)))
    assert missing == 9
    assert np.array_equal(result, photo)
