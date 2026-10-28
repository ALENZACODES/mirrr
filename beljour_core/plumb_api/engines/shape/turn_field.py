"""R13 turn field: make the requested small turn safe instead of backing it off.

R12 measured on 983 real faces showed 968 of 3,752 turns ending below strength 0.05
because the global Q3 guard bisected the whole turn down. This module keeps Q3 > 0.2
(unchanged) and instead removes the causes of low Jacobians:

1. Rotation pivot at the silhouette depth (median z of the face-oval contour), not at
   the nose root. A head turns about an axis well behind the face; with the old pivot
   the oval rim carried the largest displacement and was then faded away, so most of
   the requested movement could never arrive.
2. Landmark displacement regularised over the mesh graph: two Taubin Laplacian passes and a
   per-vertex cap so a vertex moves at most 35% of its shortest adjacent edge relative
   to its neighbours (the same rule the gender warp uses).
3. An oval-edge ramp that widens with |yaw| and |pitch|, never below 12% of face width.
4. Per-region bisection: only connected areas whose Jacobian is still low are scaled
   down, with a smooth bump, never the whole face. The global guard still runs last.

Strength is reported against the unregularised request, so the regulariser cannot
make a weaker edit look stronger. Face-mapping inspiration: 3DDFA_V2 (dense head
pose), FLAME (rigid head transform about a neck axis); concept only, no code copied.
Mirrored in web/src/engines/warp/turn-field.ts. Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..core import regions
from ..core.distance import distance_to
from ..core.filters import gradient
from ..warp import field as fields
from ..warp.falloff import curve
from ..warp.regularize import NeighbourGraph, neighbour_graph

Floats = NDArray[np.float64]

EDGE_STRAIN_SHARE = 0.35
SMOOTHING_PASSES = 2
# Taubin's two-step Laplacian: shrink by lambda, then inflate by mu (|mu| > lambda),
# so the nose peak keeps its height while landmark jitter is removed.
SMOOTHING_LAMBDA = 0.5
SMOOTHING_MU = -0.53
PROJECTION_PASSES = 6
RAMP_MIN_FACE_SHARE = 0.12
RAMP_FULL_TURN_FACE_SHARE = 0.16
RAMP_PLATEAU_SHARE = 0.45
YAW_FULL = 8.0
PITCH_FULL = 6.0
LOCAL_TARGET_DET = 0.25
LOCAL_ROUNDS = 3
LOCAL_BISECTIONS = 10
LOCAL_RADIUS_IOD_SHARE = 0.25
LOCAL_MIN_RADIUS_PX = 6.0
MAX_COMPONENTS = 64


def silhouette_depth(xyz: Floats) -> float:
    """Median depth of the face-oval contour; the pivot for small head turns."""
    oval = np.asarray(xyz, dtype=np.float64)[list(regions.FACE_OVAL), 2]
    return float(np.median(oval))


def face_width(points: Floats, across: Floats) -> float:
    oval = np.asarray(points, dtype=np.float64)[list(regions.FACE_OVAL)]
    span = oval @ across
    return float(np.max(span) - np.min(span))


def ramp_px(width_px: float, yaw: float, pitch: float, deepest_px: float, rim_px: float) -> float:
    """Inward blend width: grows with the turn, at least 12% of the face width.

    The ramp is capped so that a plateau of full weight still exists inside the
    oval (at most 45% of the deepest inside distance after the preserved rim).
    """
    if not all(math.isfinite(v) for v in (width_px, yaw, pitch, deepest_px, rim_px)):
        raise ValueError("ramp inputs must be finite")
    amount = min(1.0, max(abs(yaw) / YAW_FULL, abs(pitch) / PITCH_FULL))
    share = RAMP_MIN_FACE_SHARE + (RAMP_FULL_TURN_FACE_SHARE - RAMP_MIN_FACE_SHARE) * amount
    wanted = share * width_px
    ceiling = RAMP_PLATEAU_SHARE * max(deepest_px - rim_px, 0.0)
    return float(max(4.0, min(wanted, ceiling)))


def interior_features() -> tuple[int, ...]:
    """Landmarks a viewer reads a turn from: eyes, irises, brows, nose and lips."""
    from ..proportions import anatomy
    ids: set[int] = set(regions.RIGHT_EYE) | set(regions.LEFT_EYE) | set(regions.LIPS_OUTER)
    ids |= set(regions.RIGHT_BROW) | set(regions.LEFT_BROW)
    for pair in anatomy.FEATURE_PAIRS["nose"]:
        ids |= set(pair)
    ids |= {1, 4, 5, 6, 168, 195, 197, 468, 473}
    return tuple(sorted(ids))


INTERIOR_FEATURES = interior_features()


def feature_retention(before: Floats, requested: Floats, applied: Floats) -> float:
    """Mean over interior features of the applied share of each requested move.

    Each share is the projection of the applied move on the requested one, clipped
    to [0, 1]: moving the wrong way counts as zero, overshooting counts as one. A
    single glitched landmark cannot dominate it the way a maximum would.
    """
    ids = list(INTERIOR_FEATURES)
    req = np.asarray(requested, dtype=np.float64)[ids] - np.asarray(before, dtype=np.float64)[ids]
    app = np.asarray(applied, dtype=np.float64)[ids] - np.asarray(before, dtype=np.float64)[ids]
    size = np.sum(req * req, axis=1)
    keep = size > 1e-12
    if not keep.any():
        return 1.0
    share = np.sum(app[keep] * req[keep], axis=1) / size[keep]
    return float(np.clip(share, 0.0, 1.0).mean())


@dataclass(frozen=True)
class TargetReport:
    points: Floats
    requested_max: float
    applied_max: float
    capped_vertices: int
    max_strain: float
    retention: float

    def to_json(self) -> dict[str, float | int]:
        return {"requested_max": self.requested_max, "applied_max": self.applied_max,
                "capped_vertices": self.capped_vertices, "max_strain": self.max_strain,
                "retention": self.retention}


def _neighbour_mean(delta: Floats, graph: NeighbourGraph) -> Floats:
    """Weighted neighbour mean, accumulated in neighbour order (as the TS mirror)."""
    mean = np.zeros_like(delta)
    width = max((len(row) for row in graph.neighbours), default=0)
    if width and all(len(row) == width for row in graph.neighbours):
        index = np.asarray(graph.neighbours, dtype=np.intp)
        weight = np.asarray(graph.weights, dtype=np.float64)
        for k in range(width):
            mean += delta[index[:, k]] * weight[:, k, None]
        return mean
    for i, (indices, weights) in enumerate(zip(graph.neighbours, graph.weights, strict=True)):
        for j, w in zip(indices, weights, strict=True):
            mean[i] += delta[j] * w
    return mean


def _shortest_edges(src: Floats, graph: NeighbourGraph) -> Floats:
    shortest = np.full(len(src), np.inf)
    for i, j, length in graph.edges:
        if length <= 1e-9:
            continue
        shortest[i] = min(shortest[i], length)
        shortest[j] = min(shortest[j], length)
    shortest[~np.isfinite(shortest)] = 0.0
    return shortest


def regularise_targets(before: object, proposed: object, reference_scale: float, *,
                       share: float = EDGE_STRAIN_SHARE, pinned: tuple[int, ...] = (),
                       smooth_strained_only: bool = False) -> TargetReport:
    """Two Laplacian passes, then cap each vertex's move relative to its neighbours.

    A rigid motion has zero relative move, so a clean turn passes through unchanged;
    only noisy or steep local depth differences are limited. Coincident landmarks
    always share one displacement so the mesh cannot tear.
    """
    src = np.asarray(before, dtype=np.float64)
    dst = np.asarray(proposed, dtype=np.float64)
    if src.shape != dst.shape or src.ndim != 2 or src.shape[1] != 2:
        raise ValueError("before and proposed must be matching N x 2 arrays")
    if not (np.all(np.isfinite(src)) and np.all(np.isfinite(dst))):
        raise ValueError("turn targets must be finite")
    if not 0 < share <= 1:
        raise ValueError("strain share must be in (0, 1]")
    graph = neighbour_graph(src, reference_scale)
    pins = sorted({int(i) for i in pinned})
    if any(not 0 <= i < len(src) for i in pins):
        raise ValueError("pins must be valid landmark indices")
    locked = np.zeros(len(src), dtype=bool)
    locked[pins] = True
    raw = dst - src
    delta = raw.copy()
    delta[locked] = 0.0
    unsmoothed = delta.copy()
    for _ in range(SMOOTHING_PASSES):
        for factor in (SMOOTHING_LAMBDA, SMOOTHING_MU):
            delta = delta + factor * (_neighbour_mean(delta, graph) - delta)
            delta[locked] = 0.0
    shortest = _shortest_edges(src, graph)
    if smooth_strained_only:
        # Authored local patterns (an eyelid opening, a lip line) keep their shape;
        # only vertices already over the strain cap, and their neighbours, are smoothed.
        relative = unsmoothed - _neighbour_mean(unsmoothed, graph)
        strained = np.hypot(relative[:, 0], relative[:, 1]) > share * shortest + 1e-12
        spread = strained.copy()
        for k in np.flatnonzero(strained):
            spread[list(graph.neighbours[int(k)])] = True
        delta = np.where(spread[:, None], delta, unsmoothed)
    capped = np.zeros(len(src), dtype=bool)
    means = _neighbour_mean(delta, graph)
    for i in range(len(src)):
        mean = means[i]
        relative = delta[i] - mean
        size = float(np.hypot(relative[0], relative[1]))
        limit = share * shortest[i]
        if not locked[i] and size > limit + 1e-12:
            delta[i] = mean + relative * (limit / size)
            capped[i] = True
    # Keep the ordered Gauss-Seidel projections, but work in scalar lists so the
    # edge loop does not allocate NumPy rows for every pair and every candidate.
    xs, ys = delta[:, 0].tolist(), delta[:, 1].tolist()
    pin_set = set(pins)
    for _ in range(PROJECTION_PASSES):
        changed = False
        for i, j, length in graph.edges:
            dx, dy = xs[j] - xs[i], ys[j] - ys[i]
            size = math.hypot(dx, dy)
            limit = share * length
            if size <= limit + 1e-12:
                continue
            if i in pin_set and j in pin_set:
                continue
            multiplier = 1 - limit / size
            cx, cy = dx * multiplier, dy * multiplier
            if i in pin_set:
                xs[j] -= cx
                ys[j] -= cy
            elif j in pin_set:
                xs[i] += cx
                ys[i] += cy
            else:
                xs[i] += cx * 0.5
                ys[i] += cy * 0.5
                xs[j] -= cx * 0.5
                ys[j] -= cy * 0.5
            capped[i] = capped[j] = True
            changed = True
        if not changed:
            break
    delta = np.column_stack([xs, ys])
    groups: dict[tuple[float, float], list[int]] = {}
    for i, p in enumerate(src):
        groups.setdefault((float(p[0]), float(p[1])), []).append(i)
    for members in groups.values():
        if len(members) > 1:
            delta[members] = 0.0 if locked[members].any() else delta[members].mean(axis=0)
    strain = 0.0
    for i, j, length in graph.edges:
        if length > 1e-9:
            d = delta[j] - delta[i]
            strain = max(strain, float(np.hypot(d[0], d[1])) / length)
    out = src + delta
    retention = feature_retention(src, dst, out) if len(src) == 478 else 1.0
    return TargetReport(out, float(np.max(np.linalg.norm(raw, axis=1), initial=0.0)),
                        float(np.max(np.linalg.norm(delta, axis=1), initial=0.0)), int(capped.sum()), strain,
                        retention)


def _components(bad: NDArray[np.bool_]) -> list[NDArray[np.intp]]:
    """8-connected components as flat index arrays, ordered by first raster pixel."""
    h, w = bad.shape
    flat = bad.ravel()
    seen = np.zeros(flat.size, dtype=bool)
    out: list[NDArray[np.intp]] = []
    for first in np.flatnonzero(flat):
        start = int(first)
        if seen[start]:
            continue
        stack = [start]
        seen[start] = True
        members: list[int] = []
        while stack:
            p = stack.pop()
            members.append(p)
            y, x = divmod(p, w)
            for dy in (-1, 0, 1):
                ny = y + dy
                if ny < 0 or ny >= h:
                    continue
                for dx in (-1, 0, 1):
                    nx = x + dx
                    if (dy == 0 and dx == 0) or nx < 0 or nx >= w:
                        continue
                    q = ny * w + nx
                    if flat[q] and not seen[q]:
                        seen[q] = True
                        stack.append(q)
        out.append(np.array(sorted(members), dtype=np.intp))
    return out


def _det(dx: Floats, dy: Floats, x0: int, y0: int) -> Floats:
    """Jacobian of the backward map from a displacement crop (same stencil as Q3)."""
    hh, ww = dx.shape
    mx = dx + (np.arange(ww, dtype=np.float64) + x0)[None, :]
    my = dy + (np.arange(hh, dtype=np.float64) + y0)[:, None]
    gx_x, gx_y = gradient(mx)
    gy_x, gy_y = gradient(my)
    return gx_x * gy_y - gx_y * gy_x


@dataclass(frozen=True)
class LocalRelax:
    field: fields.Field
    attenuation: Floats
    regions_scaled: int
    rounds: int
    min_scale: float

    def to_json(self) -> dict[str, float | int]:
        return {"regions_scaled": self.regions_scaled, "rounds": self.rounds,
                "min_scale": self.min_scale, "target_det": LOCAL_TARGET_DET}


def relax_low_jacobian(field: fields.Field, iod: float, *, target: float = LOCAL_TARGET_DET,
                       rounds: int = LOCAL_ROUNDS) -> LocalRelax:
    """Scale down only the connected areas whose determinant is at or below `target`.

    Each area gets a smooth bump (1 inside, 0 beyond the radius) and its own
    bisection on the bump depth, measured with exact central differences on a padded
    crop. Areas are solved independently against the same field and combined by
    minimum, so the result does not depend on labelling order.
    """
    if not math.isfinite(iod) or iod <= 0:
        raise ValueError("iod must be positive")
    h, w = field.height, field.width
    dx_full, dy_full = field.displacement()
    att = np.ones((h, w), dtype=np.float64)
    radius = max(LOCAL_MIN_RADIUS_PX, LOCAL_RADIUS_IOD_SHARE * iod)
    reach = int(math.ceil(radius)) + 2
    scaled = 0
    done = 0
    for _ in range(rounds):
        det = _det(dx_full * att, dy_full * att, 0, 0)
        bad = det <= target
        if not bad.any():
            break
        done += 1
        comps = _components(bad)
        if len(comps) > MAX_COMPONENTS:
            # Too fragmented for local repair: leave it to the global guard.
            break
        factor = np.ones((h, w), dtype=np.float64)
        for comp in comps:
            ys, xs = np.divmod(comp, w)
            x0, x1 = max(0, int(np.min(xs)) - reach), min(w, int(np.max(xs)) + reach + 1)
            y0, y1 = max(0, int(np.min(ys)) - reach), min(h, int(np.max(ys)) + reach + 1)
            region = np.zeros((y1 - y0, x1 - x0), dtype=np.float32)
            region[ys - y0, xs - x0] = 1
            bump = np.asarray(curve(1 - distance_to(region) / radius), dtype=np.float64)
            # Evaluate on a one-pixel padded crop so borders use full central differences.
            px0, px1 = max(0, x0 - 1), min(w, x1 + 1)
            py0, py1 = max(0, y0 - 1), min(h, y1 + 1)
            cdx = dx_full[py0:py1, px0:px1]
            cdy = dy_full[py0:py1, px0:px1]
            catt = att[py0:py1, px0:px1]
            inner = (slice(y0 - py0, y0 - py0 + (y1 - y0)), slice(x0 - px0, x0 - px0 + (x1 - x0)))

            def passes(s: float, cdx: Floats = cdx, cdy: Floats = cdy, catt: Floats = catt,
                       bump: Floats = bump, inner: tuple[slice, slice] = inner,
                       px0: int = px0, py0: int = py0) -> bool:
                local = catt.copy()
                local[inner] *= 1 - (1 - s) * bump
                d = _det(cdx * local, cdy * local, px0, py0)[inner]
                return bool(np.min(d) > target)

            lo, hi = 0.0, 1.0
            if passes(1.0):
                continue
            for _ in range(LOCAL_BISECTIONS):
                mid = (lo + hi) / 2
                if passes(mid):
                    lo = mid
                else:
                    hi = mid
            scaled += 1
            sub = factor[y0:y1, x0:x1]
            np.minimum(sub, 1 - (1 - lo) * bump, out=sub)
        att *= factor
    relaxed = fields.Field(np.arange(w, dtype=np.float64)[None, :] + dx_full * att,
                           np.arange(h, dtype=np.float64)[:, None] + dy_full * att)
    return LocalRelax(relaxed, att, scaled, done, float(np.min(att)))
