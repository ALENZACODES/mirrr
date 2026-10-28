"""Local displacement regularization for opt-in face geometry, independent of skin colour.

The old recipe capped each vertex at 12% of pupil distance, even when two adjacent
vertices were less than one pixel apart. A legal individual move could therefore
stretch or invert a tiny triangle. We first cap against local spacing, diffuse the
displacement (not the face coordinates), and project neighbour differences onto a
bounded slope. Pupil/nose-root pins never move. The final raster still needs Q3;
this regularizer is not a substitute for the Jacobian or triangle guard.

Face-mapping inspiration: FLAME (independent shape parameters), 3DDFA_V2 (dense
correspondence), MediaPipe Face Landmarker (mesh layout); concept only, no code copied.
Mirrored in web/src/engines/warp/regularize.ts. Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Iterable
from dataclasses import dataclass
from functools import lru_cache

import numpy as np

from .tps import points

NEIGHBOURS = 6
DIFFUSION_STEPS = 3
PROJECTION_STEPS = 8
LOCAL_CAP_SHARE = 0.65
EDGE_SLOPE_LIMIT = 0.40
GLOBAL_CAP_SHARE = 0.12
MAX_GRAPH_POINTS = 4096


@dataclass(frozen=True)
class NeighbourGraph:
    neighbours: tuple[tuple[int, ...], ...]
    weights: tuple[tuple[float, ...], ...]
    edges: tuple[tuple[int, int, float], ...]
    spacing: np.ndarray


@dataclass(frozen=True)
class RegularizedTargets:
    points: np.ndarray
    capped_landmarks: int
    smoothed_landmarks: int
    requested_max: float
    applied_max: float
    max_edge_slope: float
    pinned: tuple[int, ...]

    def to_json(self) -> dict[str, object]:
        return {
            "method": "local-spacing-diffusion-projection/1",
            "capped_landmarks": self.capped_landmarks,
            "smoothed_landmarks": self.smoothed_landmarks,
            "requested_max": self.requested_max,
            "applied_max": self.applied_max,
            "max_edge_slope": self.max_edge_slope,
            "pinned": list(self.pinned),
            "raster_q3_required": True,
        }


def neighbour_graph(before: object, reference_scale: float,
                    neighbours: int = NEIGHBOURS) -> NeighbourGraph:
    """Deterministic local graph, memoised per exact input (see `_graph`)."""
    src = points(before, "before")
    if isinstance(neighbours, bool) or not isinstance(neighbours, int):
        raise ValueError("neighbours must be an integer from 1 to 24")
    return _graph(src.tobytes(), src.shape, float(reference_scale), neighbours)


@lru_cache(maxsize=16)
def _graph(raw: bytes, shape: tuple[int, ...], reference_scale: float, neighbours: int) -> NeighbourGraph:
    # Keyed by the exact float bytes: an engine that re-solves one face many times
    # (per-region bisection) builds the O(n^2) graph once. The result is immutable.
    return _build_graph(np.frombuffer(raw, dtype=np.float64).reshape(shape), reference_scale, neighbours)


def _build_graph(before: object, reference_scale: float,
                 neighbours: int = NEIGHBOURS) -> NeighbourGraph:
    """Deterministic local graph; equal distances break ties by landmark index.

    Distance keys are quantized at 1e-12 of squared reference scale so mirrored
    Python/TypeScript calculations make identical choices on symmetric fixtures.
    Exact duplicate vertices are connected, rather than silently discarded.
    """
    src = points(before, "before")
    if not 3 <= len(src) <= MAX_GRAPH_POINTS:
        raise ValueError("regularization needs 3..4096 points")
    if not math.isfinite(reference_scale) or reference_scale <= 0:
        raise ValueError("reference scale must be finite and positive")
    if isinstance(neighbours, bool) or not isinstance(neighbours, int) or not 1 <= neighbours <= 24:
        raise ValueError("neighbours must be an integer from 1 to 24")
    count = min(neighbours, len(src) - 1)
    distances = np.sum((src[:, None, :] - src[None, :, :]) ** 2, axis=2)
    scale2 = reference_scale * reference_scale
    rows: list[tuple[int, ...]] = []
    weights: list[tuple[float, ...]] = []
    edges: dict[tuple[int, int], float] = {}
    spacing = np.zeros(len(src), dtype=np.float64)
    for i in range(len(src)):
        # Stable sorting preserves the authored tie break by vertex index. The
        # elementwise arithmetic follows the scalar key expression in order.
        keys = np.floor(distances[i] / scale2 * 1e12 + 0.5)
        keys[i] = np.inf
        selected = np.argsort(keys, kind="stable")[:count].tolist()
        rows.append(tuple(selected))
        positive = sorted(math.sqrt(float(distances[i, j])) for j in selected
                          if distances[i, j] > scale2 * 1e-20)
        if positive:
            spacing[i] = positive[(len(positive) - 1) // 2]
        raw = [1 / max(float(distances[i, j]), scale2 * 1e-6) for j in selected]
        total = sum(raw)
        weights.append(tuple(w / total for w in raw))
        for j in selected:
            edges[min(i, j), max(i, j)] = math.sqrt(float(distances[i, j]))
    spacing.setflags(write=False)
    return NeighbourGraph(tuple(rows), tuple(weights),
                          tuple((i, j, edges[i, j]) for i, j in sorted(edges)), spacing)


def _pin_indices(pinned: Iterable[int], count: int) -> tuple[int, ...]:
    values = tuple(pinned)
    if any(isinstance(i, bool) or not isinstance(i, (int, np.integer)) or not 0 <= i < count for i in values):
        raise ValueError("pins must be valid landmark indices")
    return tuple(sorted(set(int(i) for i in values)))


def _cap(delta: np.ndarray, caps: np.ndarray) -> np.ndarray:
    lengths = np.linalg.norm(delta, axis=1)
    return delta * np.minimum(1.0, caps / np.maximum(lengths, 1e-30))[:, None]


def regularize_targets(before: object, requested: object, *, reference_scale: float,
                       pinned: Iterable[int] = ()) -> RegularizedTargets:
    """Return bounded targets and auditable diagnostics without changing either input.

    This is deliberately direction-neutral: exactly the same policy handles the
    feminine and masculine recipes. No ethnicity, skin value or inferred gender is
    an input. Zero requested movement remains an exact identity.
    """
    src, target = points(before, "before"), points(requested, "requested")
    if src.shape != target.shape:
        raise ValueError("before and requested must have matching points")
    graph = neighbour_graph(src, reference_scale)
    pins = _pin_indices(pinned, len(src))
    locked = set(pins)
    raw = target - src
    raw_lengths = np.linalg.norm(raw, axis=1)
    requested_max = float(np.max(raw_lengths))
    caps = np.minimum(reference_scale * GLOBAL_CAP_SHARE, graph.spacing * LOCAL_CAP_SHARE)
    if pins:
        caps[list(pins)] = 0.0
    base = _cap(raw, caps)
    delta = base.copy()
    # Each graph row has the same degree. Accumulate neighbours in the original
    # order, vectorising across vertices only, so the arithmetic and parity stay
    # unchanged while bisection avoids thousands of tiny temporary row arrays.
    neighbour_indices = np.asarray(graph.neighbours, dtype=np.intp)
    neighbour_weights = np.asarray(graph.weights, dtype=np.float64)
    for _ in range(DIFFUSION_STEPS):
        mean = np.zeros_like(delta)
        for neighbour_column in range(neighbour_indices.shape[1]):
            mean += delta[neighbour_indices[:, neighbour_column]] * neighbour_weights[:, neighbour_column, None]
        updated = 0.65 * base + 0.35 * mean
        if pins:
            updated[list(pins)] = 0.0
        delta = _cap(updated, caps)
    # Project local differences. A pinned endpoint gives the entire correction to
    # its neighbour. Coincident vertices must share a displacement, including pins.
    # Plain float lists: the edge loop runs ~30k times per call, and NumPy row
    # objects cost far more than the arithmetic. Same operations, same order.
    edges = graph.edges
    for _ in range(PROJECTION_STEPS):
        xs, ys = delta[:, 0].tolist(), delta[:, 1].tolist()
        for i, j, length in edges:
            dx, dy = xs[j] - xs[i], ys[j] - ys[i]
            magnitude = math.sqrt(dx * dx + dy * dy)
            limit = EDGE_SLOPE_LIMIT * length
            if magnitude <= limit + 1e-14:
                continue
            if i in locked and j in locked:
                continue
            k = 1 - limit / magnitude
            cx, cy = dx * k, dy * k
            if i in locked:
                xs[j] -= cx
                ys[j] -= cy
            elif j in locked:
                xs[i] += cx
                ys[i] += cy
            else:
                xs[i] += cx * 0.5
                ys[i] += cy * 0.5
                xs[j] -= cx * 0.5
                ys[j] -= cy * 0.5
        delta = _cap(np.column_stack([xs, ys]), caps)
    # All duplicate vertices are reconciled exactly. A duplicate of an identity
    # pin is itself fixed, so Delaunay can choose either index without a jump.
    duplicate_groups: dict[tuple[float, float], list[int]] = {}
    for i, point in enumerate(src):
        duplicate_groups.setdefault((float(point[0]), float(point[1])), []).append(i)
    for indices in duplicate_groups.values():
        if len(indices) > 1:
            if any(i in locked for i in indices):
                delta[indices] = 0.0
            else:
                shared = delta[indices].mean(axis=0)
                magnitude = float(np.linalg.norm(shared))
                cap = float(np.min(caps[indices]))
                delta[indices] = shared * min(1.0, cap / max(magnitude, 1e-30))
    if pins:
        delta[list(pins)] = 0.0
    edges_array = np.asarray(graph.edges, dtype=np.float64)
    kept_edges = edges_array[edges_array[:, 2] > reference_scale * 1e-10]
    if len(kept_edges):
        differences = delta[kept_edges[:, 1].astype(np.intp)] - delta[kept_edges[:, 0].astype(np.intp)]
        slope = float(np.max(np.linalg.norm(differences, axis=1) / kept_edges[:, 2]))
    else:
        slope = 0.0
    return RegularizedTargets(src + delta, int(np.sum(raw_lengths > caps + 1e-12)),
                              int(np.sum(np.linalg.norm(delta - raw, axis=1) > 1e-12)),
                              requested_max, float(np.max(np.linalg.norm(delta, axis=1))), slope, pins)
