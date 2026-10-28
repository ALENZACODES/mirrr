"""Small separable filters shared by masks, pyramids and quality metrics.

Each filter has an exact border rule so the TypeScript port in
`web/src/engines/core/filters.ts` gives the same numbers (parity, CONTRACTS.md §16):

  * `box_mean`: mean over a (2r+1) window, image edges extended (replicate).
  * `convolve`: separable 1D kernel along one axis, border "reflect101" (dcb|abcd|cba).
  * `gradient`: central differences inside, one-sided differences on the first and
    last row/column (NumPy `np.gradient` with edge_order=1).
  * `quantile`: linear interpolation between order statistics (NumPy's default).

Author: John Khan.
"""
from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

Floats = NDArray[np.float64]

MAX_RADIUS = 512


def _float_plane(values: np.ndarray, *, allow_channels: bool = True) -> Floats:
    arr = np.asarray(values, dtype=np.float64)
    if arr.ndim not in ((2, 3) if allow_channels else (2,)) or 0 in arr.shape:
        raise ValueError("expected a non-empty H x W (or H x W x C) array")
    if not np.all(np.isfinite(arr)):
        raise ValueError("values must be finite")
    return arr


def reflect101(index: np.ndarray, length: int) -> np.ndarray:
    """Fold indices into [0, length) without repeating the edge sample."""
    if length <= 0:
        raise ValueError("length must be positive")
    idx = np.asarray(index, dtype=np.int64).copy()
    if length == 1:
        return np.zeros_like(idx)
    period = 2 * length - 2
    idx = np.mod(idx, period)
    return np.where(idx >= length, period - idx, idx)


def box_mean(values: np.ndarray, radius: int) -> Floats:
    """Separable box mean with replicated edges, via prefix sums (O(1) per pixel)."""
    source = _float_plane(values)
    if not 0 <= radius <= MAX_RADIUS:
        raise ValueError(f"radius must be between 0 and {MAX_RADIUS}")
    if radius == 0:
        return source.copy()
    width = 2 * radius + 1
    out = source
    for axis in (0, 1):
        pad = [(0, 0)] * out.ndim
        pad[axis] = (radius, radius)
        extended = np.pad(out, pad, mode="edge")
        prefix = np.cumsum(extended, axis=axis, dtype=np.float64)
        zero_shape = list(prefix.shape)
        zero_shape[axis] = 1
        prefix = np.concatenate([np.zeros(zero_shape), prefix], axis=axis)
        hi = [slice(None)] * out.ndim
        lo = [slice(None)] * out.ndim
        hi[axis] = slice(width, None)
        lo[axis] = slice(0, -width)
        out = (prefix[tuple(hi)] - prefix[tuple(lo)]) / width
    return out


def convolve(values: np.ndarray, kernel: np.ndarray, axis: int) -> Floats:
    """Correlate along `axis` with an odd-length kernel, reflect101 borders.

    Summation runs over kernel taps in order, so the TypeScript loop that adds
    w[0]*x[i-r] + w[1]*x[i-r+1] + ... reproduces the same rounding."""
    source = _float_plane(values)
    taps = np.asarray(kernel, dtype=np.float64)
    if taps.ndim != 1 or len(taps) % 2 == 0:
        raise ValueError("kernel must be 1D with odd length")
    if axis not in (0, 1):
        raise ValueError("axis must be 0 (rows) or 1 (columns)")
    radius = len(taps) // 2
    length = source.shape[axis]
    base = np.arange(length)
    out = np.zeros_like(source)
    for k, weight in enumerate(taps):
        idx = reflect101(base + k - radius, length)
        out = out + weight * np.take(source, idx, axis=axis)
    return out


def gradient(plane: np.ndarray) -> tuple[Floats, Floats]:
    """(d/dx, d/dy) of a single plane, NumPy edge_order=1 semantics."""
    arr = _float_plane(plane, allow_channels=False)
    h, w = arr.shape
    gx = np.zeros_like(arr)
    gy = np.zeros_like(arr)
    if w > 1:
        gx[:, 1:-1] = (arr[:, 2:] - arr[:, :-2]) / 2
        gx[:, 0] = arr[:, 1] - arr[:, 0]
        gx[:, -1] = arr[:, -1] - arr[:, -2]
    if h > 1:
        gy[1:-1, :] = (arr[2:, :] - arr[:-2, :]) / 2
        gy[0, :] = arr[1, :] - arr[0, :]
        gy[-1, :] = arr[-1, :] - arr[-2, :]
    return gx, gy


def gradient_magnitude(plane: np.ndarray) -> Floats:
    gx, gy = gradient(plane)
    return np.sqrt(gx * gx + gy * gy)


def quantile(values: np.ndarray, q: float) -> float:
    """Linear-interpolated quantile of a non-empty 1D sample."""
    data = np.sort(np.asarray(values, dtype=np.float64).ravel())
    if not data.size:
        raise ValueError("quantile of an empty sample")
    if not 0 <= q <= 1:
        raise ValueError("q must be in [0, 1]")
    pos = q * (data.size - 1)
    lo = int(np.floor(pos))
    hi = min(lo + 1, data.size - 1)
    frac = pos - lo
    return float(data[lo] + (data[hi] - data[lo]) * frac)
