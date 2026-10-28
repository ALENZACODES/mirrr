"""Small geometric kernels for owned expression and floral drawing. Author: John Khan.

This is a clean-room use of ordinary vectors, compact radial basis functions,
quadratic curves and signed ellipse distances. Shared region topology is read
from engines.core.regions; the anatomical index table is never copied.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np

from .types import Plane, smooth01


@dataclass(frozen=True)
class FaceFrame:
    centre: Plane
    across: Plane
    down: Plane
    iod: float
    roll: float


def face_frame(points: Plane) -> FaceFrame:
    left, right = points[468], points[473]
    across = right - left
    if across[0] < 0:
        across = -across
    iod = float(np.linalg.norm(across))
    across = across / iod
    down = np.array([-across[1], across[0]])
    return FaceFrame((left + right) * 0.5, across, down, iod,
                     float(np.arctan2(across[1], across[0])))


def quadratic(start: Plane, control: Plane, end: Plane, count: int = 33) -> Plane:
    t = np.linspace(0, 1, count)[:, None]
    return (1 - t) ** 2 * start + 2 * (1 - t) * t * control + t * t * end


def path_distance(x: Plane, y: Plane, points: Plane, *,
                  max_distance: float | None = None) -> tuple[Plane, Plane]:
    best = np.full(x.shape, np.inf)
    progress = np.zeros(x.shape, dtype=np.float64)
    lengths = np.sqrt(np.sum(np.diff(points, axis=0) ** 2, axis=1))
    total = max(1e-12, float(np.sum(lengths)))
    before = 0.0
    for i in range(len(points) - 1):
        a, b = points[i], points[i + 1]
        delta = b - a
        denominator = max(1e-12, float(np.dot(delta, delta)))
        area = (slice(None), slice(None))
        if max_distance is not None:
            # Optional fast path is for the regular pixel-centre drawing grid.
            padding = max_distance + 1
            left = max(0, int(np.floor(min(a[0], b[0]) - padding)))
            right = min(x.shape[1], int(np.ceil(max(a[0], b[0]) + padding)))
            top = max(0, int(np.floor(min(a[1], b[1]) - padding)))
            bottom = min(x.shape[0], int(np.ceil(max(a[1], b[1]) + padding)))
            area = (slice(top, max(top, bottom)), slice(left, max(left, right)))
        gx, gy = x[area], y[area]
        t = np.clip(((gx - a[0]) * delta[0] + (gy - a[1]) * delta[1]) / denominator, 0, 1)
        distance = (gx - a[0] - t * delta[0]) ** 2 + (gy - a[1] - t * delta[1]) ** 2
        use = distance < best[area]
        best[area][use] = distance[use]
        location = (before + t * lengths[i]) / total
        progress[area][use] = location[use]
        before += float(lengths[i])
    return np.sqrt(best), progress


def field_derivatives(dx: Plane, dy: Plane) -> tuple[Plane, Plane, Plane, Plane]:
    # np.gradient defaults to first-order differences at an edge; match that in TS.
    dx_y, dx_x = np.gradient(dx)
    dy_y, dy_x = np.gradient(dy)
    return (np.asarray(dx_x, dtype=np.float64), np.asarray(dx_y, dtype=np.float64),
            np.asarray(dy_x, dtype=np.float64), np.asarray(dy_y, dtype=np.float64))


def jacobian(dx: Plane, dy: Plane) -> Plane:
    xx, xy, yx, yy = field_derivatives(dx, dy)
    return (1 - xx) * (1 - yy) - xy * yx


def bound_field(dx: Plane, dy: Plane, maximum: float,
                minimum_jacobian: float = 0.75) -> tuple[Plane, Plane, float]:
    size = float(np.max(np.hypot(dx, dy), initial=0))
    scale = min(1.0, maximum / max(size, 1e-12))
    # Bisection reduces only this expression's field, never another editor layer.
    if float(np.min(jacobian(dx * scale, dy * scale))) < minimum_jacobian:
        lo, hi = 0.0, scale
        for _ in range(24):
            mid = (lo + hi) / 2
            if float(np.min(jacobian(dx * mid, dy * mid))) >= minimum_jacobian:
                lo = mid
            else:
                hi = mid
        scale = lo
    return dx * scale, dy * scale, scale


def ellipse_alpha(x: Plane, y: Plane, cx: float, cy: float,
                  rx: float, ry: float, angle: float, feather: float = 0.28) -> Plane:
    co, si = np.cos(angle), np.sin(angle)
    out = np.zeros(x.shape, dtype=np.float64)
    radius_bound = max(rx, ry) + 1
    left, right = max(0, int(np.floor(cx - radius_bound))), min(x.shape[1], int(np.ceil(cx + radius_bound)))
    top, bottom = max(0, int(np.floor(cy - radius_bound))), min(x.shape[0], int(np.ceil(cy + radius_bound)))
    if right <= left or bottom <= top:
        return out
    area = (slice(top, bottom), slice(left, right))
    px, py = x[area] - cx, y[area] - cy
    u, v = (px * co + py * si) / rx, (-px * si + py * co) / ry
    radius = np.sqrt(u * u + v * v)
    out[area] = smooth01((1 - radius) / feather)
    return out


def over(rgb: Plane, total_alpha: Plane, colour: Sequence[float],
         alpha: Plane) -> tuple[Plane, Plane]:
    """Premultiplied compositing of an original-art layer over earlier layers."""
    a = np.clip(alpha, 0, 1)
    return rgb * (1 - a[..., None]) + np.array(colour) * a[..., None], 1 - (1 - total_alpha) * (1 - a)
