"""Gaussian and Laplacian pyramids (Burt and Adelson, 1983) with exact border rules.

  * `down`: 5-tap binomial blur [1, 4, 6, 4, 1] / 16 along rows then columns,
    reflect101 borders, then keep even rows and columns. Size ceil(n / 2).
  * `up`: to an explicit size; per axis, place the coarse samples on even positions
    of a zero signal of the target length, blur with the same kernel (reflect101 on
    the target length) and multiply by 2.
  * Laplacian level k = gaussian[k] - up(gaussian[k + 1]); the last level is the
    coarsest Gaussian. `collapse` inverts it exactly (up to float rounding).

Pyramids work on float arrays (H x W or H x W x C) in whatever space the caller
chose; blending uses linear light. Mirrored in `web/src/engines/core/pyramid.ts`.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from .filters import convolve

Floats = NDArray[np.float64]
KERNEL = np.array([1.0, 4.0, 6.0, 4.0, 1.0]) / 16.0
MIN_SIDE = 1


def _plane(values: np.ndarray) -> Floats:
    arr = np.asarray(values, dtype=np.float64)
    if arr.ndim not in (2, 3) or 0 in arr.shape or not np.all(np.isfinite(arr)):
        raise ValueError("expected a finite, non-empty H x W (x C) array")
    return arr


def blur(values: np.ndarray) -> Floats:
    arr = _plane(values)
    return convolve(convolve(arr, KERNEL, axis=1), KERNEL, axis=0)


def down(values: np.ndarray) -> Floats:
    return blur(values)[::2, ::2]


def _expand_axis(arr: Floats, length: int, axis: int) -> Floats:
    coarse = arr.shape[axis]
    if coarse != (length + 1) // 2:
        raise ValueError(f"cannot expand {coarse} samples to {length}")
    shape = list(arr.shape)
    shape[axis] = length
    zeros = np.zeros(shape)
    index = [slice(None)] * arr.ndim
    index[axis] = slice(0, length, 2)
    zeros[tuple(index)] = arr
    return 2.0 * convolve(zeros, KERNEL, axis=axis)


def up(values: np.ndarray, height: int, width: int) -> Floats:
    """Expand to exactly height x width; the input must be the matching coarse size."""
    arr = _plane(values)
    if height < 1 or width < 1:
        raise ValueError("target size must be positive")
    return _expand_axis(_expand_axis(arr, width, 1), height, 0)


def max_levels(height: int, width: int, min_side: int = 8) -> int:
    """Levels until the shorter side would drop below `min_side` (at least 1)."""
    if height < 1 or width < 1 or min_side < 1:
        raise ValueError("sizes must be positive")
    levels, h, w = 1, height, width
    while min((h + 1) // 2, (w + 1) // 2) >= min_side:
        h, w = (h + 1) // 2, (w + 1) // 2
        levels += 1
    return levels


def gaussian(values: np.ndarray, levels: int) -> list[Floats]:
    arr = _plane(values)
    if levels < 1:
        raise ValueError("levels must be at least 1")
    out = [arr]
    for _ in range(levels - 1):
        if min(out[-1].shape[:2]) <= MIN_SIDE:
            break
        out.append(down(out[-1]))
    return out


def laplacian(values: np.ndarray, levels: int) -> list[Floats]:
    gauss = gaussian(values, levels)
    bands = [g - up(gauss[k + 1], *g.shape[:2]) for k, g in enumerate(gauss[:-1])]
    bands.append(gauss[-1])
    return bands


def collapse(bands: list[np.ndarray]) -> Floats:
    if not bands:
        raise ValueError("an empty pyramid has nothing to collapse")
    out = _plane(bands[-1])
    for band in reversed(bands[:-1]):
        detail = _plane(band)
        out = detail + up(out, *detail.shape[:2])
    return out


def high_frequency(plane: np.ndarray) -> Floats:
    """Finest Laplacian band: detail a one-level blur removes (texture, noise, pores)."""
    arr = _plane(plane)
    if min(arr.shape[:2]) < 2:
        return np.zeros_like(arr)
    return arr - up(down(arr), *arr.shape[:2])
