"""R18B vectorized cubic-upscale regression and performance tests. Author: John Khan."""
from __future__ import annotations

import time

import numpy as np
import pytest

from plumb_api.engines.upscale.engine import upscale
from plumb_api.engines.upscale.kernels import _axis_taps, cubic_resize, cubic_resize_reference


@pytest.mark.parametrize("shape", ((8, 9), (17, 13), (31, 29)))
@pytest.mark.parametrize("scale", (2, 4))
def test_vectorized_cubic_matches_scalar_reference(shape: tuple[int, int], scale: int) -> None:
    rng = np.random.default_rng(shape[0] * 100 + shape[1] * 10 + scale)
    channel = rng.integers(0, 256, size=shape, dtype=np.uint8)
    reference = cubic_resize_reference(channel, scale)
    candidate = cubic_resize(channel, scale)
    np.testing.assert_allclose(candidate, reference, rtol=0, atol=2e-12)


def test_axis_taps_are_normalized_and_cached() -> None:
    first_indices, first_weights = _axis_taps(37, 4)
    second_indices, second_weights = _axis_taps(37, 4)
    assert first_indices is second_indices
    assert first_weights is second_weights
    np.testing.assert_allclose(first_weights.sum(axis=1), 1.0, rtol=0, atol=1e-14)
    assert first_indices.flags.writeable is False
    assert first_weights.flags.writeable is False


def test_axis_taps_reject_bad_scale() -> None:
    with pytest.raises(ValueError, match="scale"):
        _axis_taps(20, 3)


def test_rgba_upscale_preserves_shape_and_alpha() -> None:
    rng = np.random.default_rng(44)
    image = rng.integers(0, 256, size=(18, 21, 4), dtype=np.uint8)
    image[..., 3] = 177
    result = upscale(image, scale=2, detail=0.5)
    assert result.shape == (36, 42, 4)
    assert np.all(result[..., 3] == 177)


def _median_runtime(operation: object, repeats: int = 3) -> float:
    if not callable(operation):
        raise TypeError("operation must be callable")
    values: list[float] = []
    for _ in range(repeats):
        started = time.perf_counter()
        operation()
        values.append(time.perf_counter() - started)
    return sorted(values)[len(values) // 2]


def test_vectorized_cubic_is_materially_faster_than_scalar_reference() -> None:
    rng = np.random.default_rng(2)
    channel = rng.integers(0, 256, size=(32, 32), dtype=np.uint8)
    # Warm caches and NumPy dispatch before timing.
    cubic_resize(channel, 2)
    cubic_resize_reference(channel, 2)
    vectorized = _median_runtime(lambda: cubic_resize(channel, 2), repeats=5)
    scalar = _median_runtime(lambda: cubic_resize_reference(channel, 2), repeats=3)
    assert vectorized < scalar * 0.35, f"vectorized={vectorized:.6f}s scalar={scalar:.6f}s"


def test_constant_channel_stays_constant() -> None:
    for scale in (2, 4):
        source = np.full((12, 15), 91, dtype=np.uint8)
        result = cubic_resize(source, scale)
        np.testing.assert_allclose(result, 91.0, rtol=0, atol=1e-12)


def test_impulse_is_finite_and_bounded_reasonably() -> None:
    source = np.zeros((15, 15), dtype=np.float64)
    source[7, 7] = 255
    result = cubic_resize(source, 4)
    assert np.all(np.isfinite(result))
    # Catmull-Rom can ring slightly around an impulse; retain a broad mathematical bound.
    assert float(np.min(result)) > -40
    assert float(np.max(result)) < 300
