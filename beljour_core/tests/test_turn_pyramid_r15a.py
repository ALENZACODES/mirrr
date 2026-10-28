"""Pyramid render semantics with synthetic masks and guarded real turn. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.shape.turn_pyramid import _blur, _upsample, composite
from plumb_api.engines.shape import turn
from lab.python.beljour_lab.face_harness import synthetic_case


def image() -> np.ndarray:
    y, x = np.mgrid[:96, :100]
    return np.stack([(2*x+3*y)%255, (5*x+y)%255, (x+7*y)%255], -1).astype(np.uint8)


def test_gaussian_kernel_preserves_constant_and_isotropic_centre() -> None:
    block = np.ones((40, 50), dtype=np.float32) * 72
    np.testing.assert_allclose(_blur(block), block, atol=1e-6)
    delta = np.zeros_like(block)
    delta[20, 24] = 255
    out = _blur(delta)
    assert out[20, 24] > out[20, 23] > out[20, 22] > 0
    assert abs(float(out[19, 24] - out[21, 24])) < 1e-6


def test_bilinear_expansion_odd_dimensions_constant() -> None:
    expanded = _upsample(np.ones((9, 7, 3), dtype=np.float32) * 10, (17, 13))
    assert expanded.shape == (17, 13, 3)
    assert np.allclose(expanded, 10)


def test_full_and_empty_support_are_pixel_exact() -> None:
    src = image()
    dst = np.roll(src, 6, axis=1)
    np.testing.assert_array_equal(composite(src, dst, np.zeros(src.shape[:2])), src)
    np.testing.assert_array_equal(composite(src, dst, np.ones(src.shape[:2])), dst)


def test_hard_protected_regions_and_oval_rim_are_unchanged() -> None:
    src = image()
    dst = np.roll(src, 3, axis=0)
    yy, xx = np.indices(src.shape[:2])
    eligible = (yy > 15) & (yy < 76) & (xx > 17) & (xx < 84)
    mask = np.where(eligible, np.minimum(1, (yy-15)/12), 0)
    mask[(yy > 35) & (yy < 47) & (xx > 25) & (xx < 81)] = 0
    rendered = composite(src, dst, mask)
    np.testing.assert_array_equal(rendered[mask == 0], src[mask == 0])
    np.testing.assert_array_equal(rendered[mask == 1], dst[mask == 1])
    assert np.any(rendered[(mask > 0) & (mask < 1)] != src[(mask > 0) & (mask < 1)])


def test_alpha_outside_support_remains_pixel_exact() -> None:
    rgb = image()
    alpha = np.fromfunction(lambda y, x: (x + y * 7) % 255, rgb.shape[:2]).astype(np.uint8)
    src = np.concatenate([rgb, alpha[..., None]], -1)
    dst = np.roll(src, 2, axis=1)
    mask = np.zeros(rgb.shape[:2])
    mask[16:65, 17:70] = 1
    result = composite(src, dst, mask)
    np.testing.assert_array_equal(result[mask == 0], src[mask == 0])
    np.testing.assert_array_equal(result[mask == 1], dst[mask == 1])


@pytest.mark.parametrize("bad", [float("nan"), -0.02, 1.1])
def test_invalid_support_is_rejected(bad: float) -> None:
    src = image()
    mask = np.full(src.shape[:2], bad)
    with pytest.raises(ValueError, match="support"):
        composite(src, src, mask)


def test_true_turn_outputs_measured_composite_quality() -> None:
    mesh, _ = synthetic_case(1, width=144, height=160)
    y, x = np.mgrid[:160, :144]
    src = np.stack([(x*3 + y*2)%255, (x + y*4)%255, (x*4 + y)%255], -1).astype(np.uint8)
    result = turn.render_turn(src, mesh, yaw=8)
    assert result.metrics["pyramid_levels"] > 1
    assert result.checks["q1"]["passed"]
    assert result.checks["q4"]["passed"]
