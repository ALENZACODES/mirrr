"""E06 Delaunay triangulation (Bowyer-Watson) and triangle helpers, in plain Python floats.

Points are inserted in index order into a large enclosing triangle; every triangle whose
circumcircle strictly contains the new point (squared distance < r^2 (1 - 1e-12)) is
removed and the hole is re-fanned from the point. Triangles touching the enclosing
vertices are dropped at the end. Each triangle is returned counter-clockwise in image
coordinates' maths sense (positive signed area with y pointing down means clockwise on
screen), rotated so its smallest index comes first, and the list is sorted, so the
TypeScript port (`web/src/engines/warp/triangulate.ts`) returns the identical list.

Plain floats (no NumPy) keep the operation order identical in both languages.
Concept: Bowyer (1981) and Watson (1981), "Computing the n-dimensional Delaunay
tessellation"; our own code.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Iterable, Sequence

from ..core.refusal import DegenerateInput

Triangle = tuple[int, int, int]
MAX_POINTS = 4096
INSIDE_MARGIN = 1e-12


def _xy(points: Iterable[Sequence[float]]) -> list[tuple[float, float]]:
    try:
        out = [(float(p[0]), float(p[1])) for p in points]
    except (TypeError, IndexError, ValueError) as exc:
        raise ValueError("points must be a sequence of (x, y) pairs") from exc
    if len(out) < 3:
        raise ValueError("a triangulation needs at least three points")
    if len(out) > MAX_POINTS:
        raise ValueError(f"at most {MAX_POINTS} points")
    if not all(math.isfinite(x) and math.isfinite(y) for x, y in out):
        raise ValueError("points must be finite")
    return out


def signed_area(a: Sequence[float], b: Sequence[float], c: Sequence[float]) -> float:
    """Twice the signed area of triangle abc (positive when a -> b -> c turns left)."""
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def circumcircle(a: Sequence[float], b: Sequence[float], c: Sequence[float]) -> tuple[float, float, float]:
    """(cx, cy, r^2); infinite radius for a degenerate triangle."""
    d = 2.0 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
    if d == 0.0:
        return (0.0, 0.0, math.inf)
    a2 = a[0] * a[0] + a[1] * a[1]
    b2 = b[0] * b[0] + b[1] * b[1]
    c2 = c[0] * c[0] + c[1] * c[1]
    cx = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d
    cy = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d
    dx = a[0] - cx
    dy = a[1] - cy
    return (cx, cy, dx * dx + dy * dy)


def _canonical(t: Triangle) -> Triangle:
    a, b, c = t
    if b < a and b < c:
        return (b, c, a)
    if c < a and c < b:
        return (c, a, b)
    return (a, b, c)


def delaunay(points: Iterable[Sequence[float]]) -> list[Triangle]:
    """Delaunay triangles of `points` as index triples (positive signed area)."""
    pts = _xy(points)
    n = len(pts)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    min_x, max_x, min_y, max_y = min(xs), max(xs), min(ys), max(ys)
    span = max(max_x - min_x, max_y - min_y, 1.0)
    mid_x = (min_x + max_x) / 2.0
    mid_y = (min_y + max_y) / 2.0
    work = pts + [(mid_x - 20.0 * span, mid_y - span), (mid_x + 20.0 * span, mid_y - span),
                  (mid_x, mid_y + 20.0 * span)]
    first = (n, n + 1, n + 2)
    if signed_area(work[n], work[n + 1], work[n + 2]) < 0:
        first = (n, n + 2, n + 1)
    tris: list[tuple[Triangle, tuple[float, float, float]]] = [
        (first, circumcircle(work[first[0]], work[first[1]], work[first[2]]))]
    for i in range(n):
        px, py = work[i]
        keep: list[tuple[Triangle, tuple[float, float, float]]] = []
        bad: list[Triangle] = []
        for tri, (cx, cy, r2) in tris:
            dx = px - cx
            dy = py - cy
            if dx * dx + dy * dy < r2 * (1.0 - INSIDE_MARGIN):
                bad.append(tri)
            else:
                keep.append((tri, (cx, cy, r2)))
        if not bad:
            raise DegenerateInput("duplicate_points", "points must be distinct")
        count: dict[tuple[int, int], int] = {}
        edges: list[tuple[int, int]] = []
        for a, b, c in bad:
            for e in ((a, b), (b, c), (c, a)):
                key = (min(e), max(e))
                count[key] = count.get(key, 0) + 1
                edges.append(e)
        for e0, e1 in edges:
            if count[(min(e0, e1), max(e0, e1))] != 1:
                continue
            if signed_area(work[e0], work[e1], work[i]) <= 0.0:
                raise DegenerateInput("duplicate_points", "points must be distinct")
            tri = (e0, e1, i)
            keep.append((tri, circumcircle(work[e0], work[e1], work[i])))
        tris = keep
    out = sorted(_canonical(t) for t, _ in tris if t[0] < n and t[1] < n and t[2] < n)
    if not out:
        raise ValueError("points are all on one line")
    return out


def barycentric(x: float, y: float, a: Sequence[float], b: Sequence[float],
                c: Sequence[float]) -> tuple[float, float, float] | None:
    """Barycentric coordinates of (x, y) in abc; None for a degenerate triangle."""
    det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
    if det == 0.0:
        return None
    l1 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / det
    l2 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / det
    return (l1, l2, 1.0 - l1 - l2)


def edges(triangles: Sequence[Triangle]) -> list[tuple[int, int]]:
    """Unique undirected edges, sorted."""
    seen = set()
    for a, b, c in triangles:
        for e in ((a, b), (b, c), (c, a)):
            seen.add((min(e), max(e)))
    return sorted(seen)


def hull_edges(triangles: Sequence[Triangle]) -> list[tuple[int, int]]:
    """Directed boundary edges (each used by exactly one triangle), in triangle order."""
    count: dict[tuple[int, int], int] = {}
    for a, b, c in triangles:
        for e in ((a, b), (b, c), (c, a)):
            key = (min(e), max(e))
            count[key] = count.get(key, 0) + 1
    out = []
    for a, b, c in triangles:
        for e in ((a, b), (b, c), (c, a)):
            if count[(min(e), max(e))] == 1:
                out.append(e)
    return out


def ring(cx: float, cy: float, rx: float, ry: float, count: int) -> list[tuple[float, float]]:
    """`count` anchor points on an ellipse, starting at angle 0 and going round."""
    if count < 3:
        raise ValueError("an anchor ring needs at least three points")
    return [(cx + rx * math.cos(2 * math.pi * k / count), cy + ry * math.sin(2 * math.pi * k / count))
            for k in range(count)]
