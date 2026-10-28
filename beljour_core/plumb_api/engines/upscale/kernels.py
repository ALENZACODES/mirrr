"""Interpolation kernels and bounded convolution. Author: John Khan."""
from __future__ import annotations

from functools import lru_cache

import numpy as np


def cubic_weight(x: float, a: float = -0.5) -> float:
    t = abs(x)
    if t <= 1:
        return (a + 2) * t**3 - (a + 3) * t**2 + 1
    if t < 2:
        return a * t**3 - 5 * a * t**2 + 8 * a * t - 4 * a
    return 0.0


def _cubic_weight_array(values: np.ndarray, a: float = -0.5) -> np.ndarray:
    """Vectorized equivalent of :func:`cubic_weight` for finite arrays."""

    t = np.abs(np.asarray(values, dtype=np.float64))
    result = np.zeros_like(t)
    inner = t <= 1
    outer = (t > 1) & (t < 2)
    ti = t[inner]
    to = t[outer]
    result[inner] = (a + 2) * ti**3 - (a + 3) * ti**2 + 1
    result[outer] = a * to**3 - 5 * a * to**2 + 8 * a * to - 4 * a
    return result


@lru_cache(maxsize=64)
def _axis_taps(length: int, scale: int) -> tuple[np.ndarray, np.ndarray]:
    """Return immutable clipped source indices and normalized cubic weights."""

    if length < 1:
        raise ValueError("axis length must be positive")
    if scale not in (2, 4):
        raise ValueError("scale must be 2 or 4")
    output_length = length * scale
    positions = (np.arange(output_length, dtype=np.float64) + 0.5) / scale - 0.5
    base = np.floor(positions).astype(np.int64)
    offsets = np.arange(-1, 3, dtype=np.int64)
    raw_indices = base[:, None] + offsets[None, :]
    distances = positions[:, None] - raw_indices.astype(np.float64)
    weights = _cubic_weight_array(distances)
    sums = np.sum(weights, axis=1, keepdims=True)
    weights = weights / np.maximum(sums, 1e-12)
    indices = np.clip(raw_indices, 0, length - 1)
    indices.setflags(write=False)
    weights.setflags(write=False)
    return indices, weights


def cubic_resize_reference(channel: np.ndarray, scale: int) -> np.ndarray:
    """Scalar reference retained for parity tests; not used in the hot path."""

    src = np.asarray(channel, dtype=np.float64)
    if src.ndim != 2:
        raise ValueError("channel must be two-dimensional")
    if scale not in (2, 4):
        raise ValueError("scale must be 2 or 4")
    height, width = src.shape
    output_height, output_width = (height * scale, width * scale)
    out = np.empty((output_height, output_width), dtype=np.float64)
    for output_y in range(output_height):
        source_y = (output_y + 0.5) / scale - 0.5
        y0 = int(np.floor(source_y))
        for output_x in range(output_width):
            source_x = (output_x + 0.5) / scale - 0.5
            x0 = int(np.floor(source_x))
            total = 0.0
            weight = 0.0
            for kernel_y in range(-1, 3):
                yy = min(max(y0 + kernel_y, 0), height - 1)
                weight_y = cubic_weight(source_y - (y0 + kernel_y))
                for kernel_x in range(-1, 3):
                    xx = min(max(x0 + kernel_x, 0), width - 1)
                    combined = weight_y * cubic_weight(source_x - (x0 + kernel_x))
                    total += src[yy, xx] * combined
                    weight += combined
            out[output_y, output_x] = total / max(weight, 1e-12)
    return out


def cubic_resize(channel: np.ndarray, scale: int) -> np.ndarray:
    """Separable vectorized cubic resize equivalent to the scalar reference."""

    src = np.asarray(channel, dtype=np.float64)
    if src.ndim != 2:
        raise ValueError("channel must be two-dimensional")
    y_indices, y_weights = _axis_taps(int(src.shape[0]), scale)
    x_indices, x_weights = _axis_taps(int(src.shape[1]), scale)
    # Horizontal gather: [height, output_width, 4]. The weighted sum creates
    # one intermediate instead of the old per-pixel 4x4 Python loop.
    horizontal_samples = np.take(src, x_indices, axis=1)
    horizontal = np.sum(horizontal_samples * x_weights[None, :, :], axis=2)
    # Vertical gather: [output_height, 4, output_width].
    vertical_samples = np.take(horizontal, y_indices, axis=0)
    return np.sum(vertical_samples * y_weights[:, :, None], axis=1)


def cubic_resize_image(image: np.ndarray, scale: int) -> np.ndarray:
    """Vectorize separable cubic interpolation across all image channels at once."""
    src = np.asarray(image, dtype=np.float64)
    if src.ndim != 3 or src.shape[2] not in (3, 4):
        raise ValueError("image must be HxWx3 or HxWx4")
    y_indices, y_weights = _axis_taps(int(src.shape[0]), scale)
    x_indices, x_weights = _axis_taps(int(src.shape[1]), scale)
    horizontal_samples = np.take(src, x_indices, axis=1)
    horizontal = np.sum(horizontal_samples * x_weights[None, :, :, None], axis=2)
    vertical_samples = np.take(horizontal, y_indices, axis=0)
    return np.sum(vertical_samples * y_weights[:, :, None, None], axis=1)


def box_blur(channel: np.ndarray) -> np.ndarray:
    src = np.asarray(channel, dtype=np.float64)
    if src.ndim != 2:
        raise ValueError("channel must be two-dimensional")
    pad = np.pad(src, 1, mode="edge")
    out = np.zeros_like(src)
    for delta_y in range(3):
        for delta_x in range(3):
            out += pad[delta_y : delta_y + src.shape[0], delta_x : delta_x + src.shape[1]]
    return out / 9
