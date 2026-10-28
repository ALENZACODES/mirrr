"""Exact Euclidean distance transform, round morphology and distance-based feathering.

`squared_edt` is Meijster, Roerdink and Hesselink (2000): one column pass and one
row pass, exact for every pixel. Squared distances are integers, so the Python and
TypeScript ports agree exactly. The row pass keeps one parabola stack per row and
advances every row together, so the work stays in NumPy rather than Python loops
over pixels.

Pixels "on" a mask are those with alpha >= the threshold (default 0.5).
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from .masks import Mask, as_mask

FEATHER_MODES = ("inside", "centered", "outside")


def _binary(mask: np.ndarray, threshold: float) -> NDArray[np.bool_]:
    if not 0 < threshold <= 1:
        raise ValueError("threshold must be in (0, 1]")
    return as_mask(mask) >= threshold


def _column_pass(on: NDArray[np.bool_], infinity: int) -> NDArray[np.int64]:
    """Distance along each column to the nearest on pixel (infinity if none)."""
    h = on.shape[0]
    g = np.where(on, 0, infinity).astype(np.int64)
    for y in range(1, h):
        g[y] = np.where(on[y], 0, np.minimum(g[y - 1] + 1, infinity))
    for y in range(h - 2, -1, -1):
        g[y] = np.minimum(g[y], g[y + 1] + 1)
    return g


def squared_edt(on: np.ndarray) -> NDArray[np.int64]:
    """Squared distance from each pixel to the nearest True pixel.

    With no True pixel at all every value is -1, which callers read as "no target"."""
    feature = np.asarray(on, dtype=bool)
    if feature.ndim != 2 or 0 in feature.shape:
        raise ValueError("expected a non-empty H x W boolean array")
    h, w = feature.shape
    if not feature.any():
        return np.full((h, w), -1, dtype=np.int64)
    infinity = h + w
    g2 = _column_pass(feature, infinity) ** 2
    rows = np.arange(h)
    s = np.zeros((h, w), dtype=np.int64)
    t = np.zeros((h, w), dtype=np.int64)
    q = np.zeros(h, dtype=np.int64)

    def f(x: np.ndarray, i: np.ndarray, r: np.ndarray) -> np.ndarray:
        return (x - i) ** 2 + g2[r, i]

    for u in range(1, w):
        u_arr = np.full(h, u, dtype=np.int64)
        while True:
            live = q >= 0
            r = rows[live]
            top_s, top_t = s[r, q[live]], t[r, q[live]]
            pop = f(top_t, top_s, r) > f(top_t, u_arr[live], r)
            if not pop.any():
                break
            q[r[pop]] -= 1
        empty = q < 0
        q[empty] = 0
        s[empty, 0] = u
        keep = ~empty
        r = rows[keep]
        si = s[r, q[keep]]
        sep = (u * u - si * si + g2[r, u] - g2[r, si]) // (2 * (u - si))
        start = sep + 1
        push = start < w
        rp = r[push]
        q[rp] += 1
        s[rp, q[rp]] = u
        t[rp, q[rp]] = start[push]
    out = np.zeros((h, w), dtype=np.int64)
    for u in range(w - 1, -1, -1):
        si = s[rows, q]
        out[:, u] = (u - si) ** 2 + g2[rows, si]
        q -= (t[rows, q] == u).astype(np.int64)
    return out


def distance_to(mask: np.ndarray, threshold: float = 0.5) -> NDArray[np.float64]:
    """Euclidean pixel distance to the nearest on pixel; 0 on it; inf if the mask is empty."""
    d2 = squared_edt(_binary(mask, threshold))
    out = np.sqrt(np.maximum(d2, 0).astype(np.float64))
    out[d2 < 0] = np.inf
    return out


def distance_inside(mask: np.ndarray, threshold: float = 0.5) -> NDArray[np.float64]:
    """Distance from each on pixel to the nearest off pixel; 0 off the mask.

    The image border is not treated as off, so a full mask has infinite depth."""
    on = _binary(mask, threshold)
    d2 = squared_edt(~on)
    out = np.sqrt(np.maximum(d2, 0).astype(np.float64))
    out[d2 < 0] = np.inf
    return np.where(on, out, 0.0)


def dilate(mask: np.ndarray, radius: float, threshold: float = 0.5) -> Mask:
    """Round (Euclidean disc) dilation; radius in pixels, 0 returns the binary mask."""
    if not np.isfinite(radius) or radius < 0:
        raise ValueError("radius must be finite and non-negative")
    return (distance_to(mask, threshold) <= radius).astype(np.float32)


def erode(mask: np.ndarray, radius: float, threshold: float = 0.5) -> Mask:
    """Round erosion: on pixels further than `radius` from every off pixel survive."""
    if not np.isfinite(radius) or radius < 0:
        raise ValueError("radius must be finite and non-negative")
    on = _binary(mask, threshold)
    if radius == 0:
        return on.astype(np.float32)
    return (distance_inside(mask, threshold) > radius).astype(np.float32)


def feather(mask: np.ndarray, radius: float, mode: str = "inside",
            threshold: float = 0.5) -> Mask:
    """Soft edge of `radius` pixels from the distance field, with a smoothstep ramp.

    inside   ramps from 0 at the edge to 1 at `radius` deep; nothing leaks outside
    centered ramps across the edge, half inside and half outside
    outside  full strength inside, ramping to 0 at `radius` beyond the edge
    """
    if mode not in FEATHER_MODES:
        raise ValueError(f"mode must be one of {', '.join(FEATHER_MODES)}")
    if not np.isfinite(radius) or radius < 0:
        raise ValueError("radius must be finite and non-negative")
    on = _binary(mask, threshold)
    if radius == 0:
        return on.astype(np.float32)
    depth = distance_inside(mask, threshold)      # >= 1 on, 0 off
    reach = distance_to(mask, threshold)          # 0 on, >= 1 off
    if mode == "inside":
        ramp = np.where(on, (depth - 0.5) / radius, 0.0)
    elif mode == "outside":
        ramp = np.where(on, 1.0, 1.0 - (reach - 0.5) / radius)
    else:
        ramp = 0.5 + np.where(on, depth - 0.5, 0.5 - reach) / radius
    ramp = np.clip(ramp, 0.0, 1.0)
    return (ramp * ramp * (3.0 - 2.0 * ramp)).astype(np.float32)
