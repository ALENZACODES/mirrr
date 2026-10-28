"""E07 fast marching inpainting: fill a hole from its edge inwards.

Concept: Telea, "An image inpainting technique based on the fast marching method"
(Journal of Graphics Tools, 2004); our own code, written from the paper.

Hole pixels (mask >= 0.5) are reached in order of their arrival time T, the distance from
the hole's edge solved with the first-order eikonal update on the 4-neighbourhood. When a
pixel p is reached it takes a weighted mean of the already known pixels q within
`radius`, each extrapolated along its own gradient:

  I(p) = sum w(p, q) [I(q) + grad I(q) . (p - q)] / sum w(p, q)
  w = dir * dst * lev,  dir = |grad T(p) . (p - q)| / |p - q| (at least 1e-6 when <= 0.01),
                        dst = 1 / |p - q|^2,  lev = 1 / (1 + |T(q) - T(p)|)

Gradients use central differences between known neighbours, one-sided next to unknown
ones and 0 when neither side is known. `gradient=False` drops the extrapolation term
(steadier on noisy texture). Ties in T are broken by pixel index (row-major), so the
fill order, and the result, match `web/src/engines/fill/fmm.ts` exactly. Plain Python
loops keep the operation order identical in both languages; the Python mirror is the
reference, the browser runs the TypeScript.
Author: John Khan.
"""
from __future__ import annotations

import heapq
import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..core.masks import as_mask

Floats = NDArray[np.float64]
KNOWN, BAND, INSIDE = 0, 1, 2
MAX_RADIUS = 32


@dataclass(frozen=True)
class FastMarchingResult:
    image: Floats                # same shape as the input
    arrival: Floats              # T: 0 outside the hole, distance from its edge inside
    order: tuple[int, ...]       # hole pixels (row-major index) in the order they were filled


def as_values(values: np.ndarray) -> tuple[Floats, bool]:
    """(H x W x C float copy, was it 2-D)."""
    arr = np.asarray(values, dtype=np.float64)
    if not np.all(np.isfinite(arr)):
        raise ValueError("values must be finite")
    if arr.ndim == 2:
        return arr[..., None].copy(), True
    if arr.ndim != 3 or arr.shape[2] < 1 or arr.shape[2] > 4 or 0 in arr.shape:
        raise ValueError("values must be H x W or H x W x C with 1 to 4 channels")
    if not np.all(np.isfinite(arr)):
        raise ValueError("values must be finite")
    return arr.copy(), False


def hole_of(mask: np.ndarray, shape: tuple[int, int]) -> NDArray[np.bool_]:
    hole: NDArray[np.bool_] = as_mask(mask, shape) >= 0.5
    if hole.all():
        raise ValueError("the hole covers the whole image; nothing to fill from")
    return hole


def _eikonal(t: list[float], flag: list[int], x: int, y: int, w: int, h: int) -> float:
    i = y * w + x
    a = math.inf
    if x > 0 and flag[i - 1] == KNOWN:
        a = t[i - 1]
    if x < w - 1 and flag[i + 1] == KNOWN:
        a = min(a, t[i + 1])
    b = math.inf
    if y > 0 and flag[i - w] == KNOWN:
        b = t[i - w]
    if y < h - 1 and flag[i + w] == KNOWN:
        b = min(b, t[i + w])
    if a == math.inf and b == math.inf:
        return math.inf
    if a == math.inf:
        return b + 1.0
    if b == math.inf:
        return a + 1.0
    if abs(a - b) >= 1.0:
        return min(a, b) + 1.0
    return (a + b + math.sqrt(2.0 - (a - b) * (a - b))) / 2.0


def _diff(get: list[float], flag: list[int], i: int, step: int, lo_ok: bool, hi_ok: bool) -> float:
    """Derivative of `get` at i along one axis using neighbours that are not INSIDE."""
    lo = lo_ok and flag[i - step] != INSIDE
    hi = hi_ok and flag[i + step] != INSIDE
    if lo and hi:
        return (get[i + step] - get[i - step]) / 2.0
    if hi:
        return get[i + step] - get[i]
    if lo:
        return get[i] - get[i - step]
    return 0.0


def fast_marching(values: np.ndarray, mask: np.ndarray, *, radius: int = 5,
                  gradient: bool = True) -> FastMarchingResult:
    """Fill the hole in `values` (float H x W or H x W x C) marked by `mask` >= 0.5."""
    data, flat2d = as_values(values)
    h, w, channels = data.shape
    if not isinstance(radius, int) or isinstance(radius, bool) or not 1 <= radius <= MAX_RADIUS:
        raise ValueError(f"radius must be a whole number from 1 to {MAX_RADIUS}")
    hole = hole_of(mask, (h, w))
    n = h * w
    flag = [INSIDE if v else KNOWN for v in hole.ravel().tolist()]
    t = [math.inf if v else 0.0 for v in hole.ravel().tolist()]
    planes = [data[..., c].ravel().tolist() for c in range(channels)]
    heap: list[tuple[float, int]] = []
    for i in range(n):
        if flag[i] != KNOWN:
            continue
        x, y = i % w, i // w
        if ((x > 0 and flag[i - 1] == INSIDE) or (x < w - 1 and flag[i + 1] == INSIDE)
                or (y > 0 and flag[i - w] == INSIDE) or (y < h - 1 and flag[i + w] == INSIDE)):
            flag[i] = BAND
            heap.append((0.0, i))
    heapq.heapify(heap)
    offsets = [(dx, dy) for dy in range(-radius, radius + 1) for dx in range(-radius, radius + 1)
               if 0 < dx * dx + dy * dy <= radius * radius]
    order: list[int] = []

    def inpaint(p: int) -> None:
        px, py = p % w, p // w
        gtx = _diff(t, flag, p, 1, px > 0, px < w - 1)
        gty = _diff(t, flag, p, w, py > 0, py < h - 1)
        sums = [0.0] * channels
        total = 0.0
        for dx, dy in offsets:
            qx, qy = px + dx, py + dy
            if qx < 0 or qx >= w or qy < 0 or qy >= h:
                continue
            q = qy * w + qx
            if flag[q] == INSIDE:
                continue
            rx, ry = float(px - qx), float(py - qy)
            len2 = rx * rx + ry * ry
            direction = abs(rx * gtx + ry * gty) / math.sqrt(len2)
            if direction <= 0.01:
                direction = 1e-6
            weight = direction * (1.0 / len2) * (1.0 / (1.0 + abs(t[q] - t[p])))
            total += weight
            for c in range(channels):
                plane = planes[c]
                value = plane[q]
                if gradient:
                    gx = _diff(plane, flag, q, 1, qx > 0, qx < w - 1)
                    gy = _diff(plane, flag, q, w, qy > 0, qy < h - 1)
                    value += gx * rx + gy * ry
                sums[c] += weight * value
        if total > 0:
            for c in range(channels):
                planes[c][p] = sums[c] / total

    while heap:
        tp, i = heapq.heappop(heap)
        if flag[i] == KNOWN or tp != t[i]:
            continue
        flag[i] = KNOWN
        x, y = i % w, i // w
        for j, ok in ((i - 1, x > 0), (i + 1, x < w - 1), (i - w, y > 0), (i + w, y < h - 1)):
            if not ok or flag[j] == KNOWN:
                continue
            tj = _eikonal(t, flag, j % w, j // w, w, h)
            if flag[j] == INSIDE:
                t[j] = tj
                inpaint(j)          # still INSIDE here, so its stale value is never read
                flag[j] = BAND
                order.append(j)
                heapq.heappush(heap, (tj, j))
            elif tj < t[j]:
                t[j] = tj
                heapq.heappush(heap, (tj, j))
    out = np.stack([np.asarray(p, dtype=np.float64).reshape(h, w) for p in planes], -1)
    arrival = np.asarray(t, dtype=np.float64).reshape(h, w)
    return FastMarchingResult(out[..., 0] if flat2d else out, arrival, tuple(order))
