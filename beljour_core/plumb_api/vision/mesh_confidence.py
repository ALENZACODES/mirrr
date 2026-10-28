"""Geometric confidence for a restored 478-point mesh, recorded as a diagnostic only.

The score combines four measurements of the restored mesh: the share of points
inside the photo, its association with the detector box that asked for it, the
spread between the outer eye corners, and how two-dimensional the point cloud
is. It is written to the count-only attempt record so retries can be audited.
It never accepts, rejects or reorders a mesh: the frozen validator, the 98%
in-frame rule and the association threshold stay the only acceptance rules.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

MESH_POINTS = 478
# MediaPipe Face Mesh outer eye corners, the same indices the proportions and
# brow engines use.
RIGHT_EYE_OUTER = 33
LEFT_EYE_OUTER = 263
# Outer-eye spread, as a share of the mesh extent on each axis, below which the
# eyes are treated as collapsed. ASSUMED; not measured on the frozen set.
MIN_EYE_SPREAD = 0.3
# Minor / major axis ratio of the 2D point cloud below which the mesh is treated
# as flattened into a line. ASSUMED.
MIN_SPAN_RATIO = 0.5


@dataclass(frozen=True, slots=True)
class MeshConfidence:
    """Component measurements, each in [0, 1], and their geometric mean."""

    score: float
    coverage: float
    association: float
    eye_spread: float
    span: float


def _unit(value: float) -> float:
    return min(1.0, max(0.0, value)) if math.isfinite(value) else 0.0


def _eye_spread(points: np.ndarray, extent: np.ndarray) -> float:
    """Outer-eye distance with each axis scaled by the mesh extent on that axis.

    Scaling per axis keeps the measure independent of the photo aspect, since
    restored coordinates are normalised separately by width and height.
    """
    if (extent <= 0).any():
        return 0.0
    delta = (points[LEFT_EYE_OUTER, :2] - points[RIGHT_EYE_OUTER, :2]) / extent
    return _unit(float(np.hypot(delta[0], delta[1])) / MIN_EYE_SPREAD)


def _span(points: np.ndarray) -> float:
    """Ratio of the minor to the major principal axis of the 2D point cloud.

    Unlike the eye spread this is measured in normalised photo coordinates:
    scaling each axis by its own extent would hide a mesh flattened along x
    or y. Photo aspect therefore shifts the ratio, by at most the aspect.
    """
    centred = points[:, :2] - points[:, :2].mean(axis=0)
    eigen = np.linalg.eigvalsh(np.cov(centred, rowvar=False))
    if not np.isfinite(eigen).all() or eigen[-1] <= 0:
        return 0.0
    return _unit(math.sqrt(max(0.0, float(eigen[0])) / float(eigen[-1])) / MIN_SPAN_RATIO)


def score_mesh(points: object, association: float = 1.0) -> MeshConfidence:
    """Measure a restored mesh in normalised photo coordinates.

    ``association`` is the caller's box association score, clamped to [0, 1]; a
    full-image retry without a box passes 1.0. Any zero component gives a zero
    score. A mesh that is not a finite 478 by 3 array raises ValueError.
    """
    data = np.asarray(points, dtype=np.float64)
    if data.shape != (MESH_POINTS, 3) or not np.isfinite(data).all():
        raise ValueError("a finite 478 by 3 mesh is required")
    inside = (data[:, 0] >= 0) & (data[:, 0] < 1) & (data[:, 1] >= 0) & (data[:, 1] < 1)
    extent = np.ptp(data[:, :2], axis=0)
    coverage = float(inside.mean())
    linked = _unit(float(association))
    eyes = _eye_spread(data, extent)
    span = _span(data)
    parts = (coverage, linked, eyes, span)
    score = 0.0 if min(parts) <= 0 else math.prod(parts) ** (1 / len(parts))
    return MeshConfidence(_unit(score), coverage, linked, eyes, span)
