"""E06 piecewise affine warp over a triangulation.

Every triangle of the output layout (`dst`) reads its matching source triangle (`src`)
through one affine map, so straight lines stay straight inside each triangle and the
mesh can move face regions independently (face turning §8.1 step 4, the 478-point mesh).

Rasterising: triangles are visited in list order; a pixel centre belongs to the first
non-degenerate output triangle whose barycentric coordinates are all >= -1e-9. Pixels in
no triangle keep the identity map and are reported as uncovered. The barycentric formula
is `triangulate.barycentric`, evaluated with the same operations in the TypeScript port
(`web/src/engines/warp/piecewise.ts`), so both claim the same pixels.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Iterable, Sequence
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from . import field as fields
from .tps import points
from .triangulate import Triangle, signed_area

Floats = NDArray[np.float64]
EDGE_TOLERANCE = 1e-9
DEGENERATE_AREA = 1e-12


@dataclass(frozen=True)
class PiecewiseResult:
    field: fields.Field
    owner: NDArray[np.int32]          # triangle index per pixel, -1 where uncovered

    @property
    def covered(self) -> NDArray[np.bool_]:
        out: NDArray[np.bool_] = self.owner >= 0
        return out

    def covered_share(self) -> float:
        return float(self.covered.mean())


def check_triangles(triangles: Iterable[Sequence[int]], count: int) -> list[Triangle]:
    try:
        out = [(int(t[0]), int(t[1]), int(t[2])) for t in triangles]
    except (TypeError, IndexError, ValueError) as exc:
        raise ValueError("triangles must be index triples") from exc
    for t in out:
        if min(t) < 0 or max(t) >= count or len(set(t)) != 3:
            raise ValueError("triangle indices must be three distinct point indices")
    return out


def affine_between(src_tri: Sequence[Sequence[float]], dst_tri: Sequence[Sequence[float]]) -> Floats:
    """2 x 3 matrix M with M @ [x, y, 1] = source point for each output vertex."""
    s = points(src_tri, "src triangle")
    d = points(dst_tri, "dst triangle")
    if len(s) != 3 or len(d) != 3:
        raise ValueError("triangles have three vertices")
    a = np.hstack([d, np.ones((3, 1))])
    if abs(np.linalg.det(a)) <= DEGENERATE_AREA:
        raise ValueError("degenerate triangle")
    out: Floats = np.asarray(np.linalg.solve(a, s).T, dtype=np.float64)
    return out


def piecewise_affine(height: int, width: int, src: object, dst: object,
                     triangles: Iterable[Sequence[int]]) -> PiecewiseResult:
    """Backward field mapping each `dst` triangle onto its `src` triangle."""
    s = points(src, "src")
    d = points(dst, "dst")
    if s.shape != d.shape:
        raise ValueError("src and dst must have the same number of points")
    tris = check_triangles(triangles, len(s))
    if height < 1 or width < 1:
        raise ValueError("field size must be positive")
    map_x, map_y = np.mgrid[0:height, 0:width].astype(np.float64)[::-1]
    map_x = map_x.copy()
    map_y = map_y.copy()
    owner = np.full((height, width), -1, dtype=np.int32)
    for index, (ia, ib, ic) in enumerate(tris):
        a, b, c = d[ia], d[ib], d[ic]
        if abs(signed_area(a, b, c)) <= DEGENERATE_AREA:
            continue
        x0 = max(0, int(np.ceil(min(a[0], b[0], c[0]) - EDGE_TOLERANCE)))
        x1 = min(width - 1, int(np.floor(max(a[0], b[0], c[0]) + EDGE_TOLERANCE)))
        y0 = max(0, int(np.ceil(min(a[1], b[1], c[1]) - EDGE_TOLERANCE)))
        y1 = min(height - 1, int(np.floor(max(a[1], b[1], c[1]) + EDGE_TOLERANCE)))
        if x0 > x1 or y0 > y1:
            continue
        yy, xx = np.mgrid[y0:y1 + 1, x0:x1 + 1].astype(np.float64)
        det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        l1 = ((b[1] - c[1]) * (xx - c[0]) + (c[0] - b[0]) * (yy - c[1])) / det
        l2 = ((c[1] - a[1]) * (xx - c[0]) + (a[0] - c[0]) * (yy - c[1])) / det
        l3 = 1.0 - l1 - l2
        inside = (l1 >= -EDGE_TOLERANCE) & (l2 >= -EDGE_TOLERANCE) & (l3 >= -EDGE_TOLERANCE)
        free = owner[y0:y1 + 1, x0:x1 + 1] < 0
        take = inside & free
        if not take.any():
            continue
        sa, sb, sc = s[ia], s[ib], s[ic]
        region_x = map_x[y0:y1 + 1, x0:x1 + 1]
        region_y = map_y[y0:y1 + 1, x0:x1 + 1]
        region_x[take] = (l1 * sa[0] + l2 * sb[0] + l3 * sc[0])[take]
        region_y[take] = (l1 * sa[1] + l2 * sb[1] + l3 * sc[1])[take]
        owner[y0:y1 + 1, x0:x1 + 1][take] = index
    return PiecewiseResult(fields.Field(map_x, map_y), owner)


def triangle_areas(pts: object, triangles: Iterable[Sequence[int]]) -> Floats:
    p = points(pts)
    tris = check_triangles(triangles, len(p))
    return np.array([signed_area(p[a], p[b], p[c]) / 2.0 for a, b, c in tris], dtype=np.float64)
