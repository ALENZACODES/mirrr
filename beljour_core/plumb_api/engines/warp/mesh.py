"""E06 face-mesh warp: piecewise affine over the triangulated 478-point mesh, held still by a
fixed anchor ring around the face and by the image border.

Layout = the mesh points, an elliptical anchor ring `ring_scale` times the face outline's
size (centred on the outline, along its principal axes) and the border pins. The layout is
triangulated once (Delaunay on the "before" positions; reuse `triangles` for every frame or
strength stop of the same face). Only the mesh points move; ring and border stay, so every
pixel outside the ring keeps exactly its place (Q1, Q12), and the guard lowers the strength
until no triangle flips or keeps less than 20% of its area AND the actual raster's
backward-map Jacobian remains strictly above 0.2. These are separate conditions:
positive forward triangle areas alone never certified the sampled inverse map.

Used by face turning (plan §8.1 step 4) and the E08 face-shape controls.
Face-mapping credits (licences.json "concepts"): runtime data from MediaPipe Face
Landmarker (mesh indices, Bucket A); concept only, no code copied: 3DDFA_V2 (dense face
mesh driving an image warp) and InsightFace (a face frame fixed by anchor points), from
their papers and READMEs. Mirrored in `web/src/engines/warp/mesh.ts`.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..core import regions
from . import fold
from .piecewise import PiecewiseResult, piecewise_affine
from .tps import border_pins, points
from .triangulate import Triangle, delaunay

Floats = NDArray[np.float64]
RING_POINTS = 24
MIN_RING_SCALE = 1.05


def anchor_ring(mesh: object, scale: float = 1.35, count: int = RING_POINTS) -> Floats:
    """Points on an ellipse around the face outline (FACE_OVAL), `scale` times its size."""
    p = points(mesh, "mesh")
    if not (math.isfinite(scale) and scale >= MIN_RING_SCALE):
        raise ValueError(f"ring scale must be at least {MIN_RING_SCALE}")
    if count < 8:
        raise ValueError("an anchor ring needs at least 8 points")
    if len(p) <= max(regions.FACE_OVAL):
        raise ValueError("the mesh is missing face outline points")
    oval = p[list(regions.FACE_OVAL)]
    centre = oval.mean(0)
    centred = oval - centre
    cov = centred.T @ centred / len(oval)
    values, vectors = np.linalg.eigh(cov)
    major = vectors[:, 1]
    if major[1] < 0:
        major = -major
    minor = np.array([major[1], -major[0]])
    # the outline's extent along each axis (its farthest point), not its spread
    a = float(np.abs(centred @ major).max()) * scale
    b = float(np.abs(centred @ minor).max()) * scale
    angles = 2 * np.pi * np.arange(count) / count
    out: Floats = centre + np.outer(np.cos(angles) * b, minor) + np.outer(np.sin(angles) * a, major)
    return out


@dataclass(frozen=True)
class MeshLayout:
    points: Floats              # mesh, then ring, then border pins
    mesh_count: int
    triangles: list[Triangle]


def layout(mesh: object, width: int, height: int, *, ring_scale: float = 1.35,
           ring_count: int = RING_POINTS) -> MeshLayout:
    """Triangulated layout for a face in a width x height image (ring points inside it only).

    A ring point outside [1, width - 2] x [1, height - 2] is dropped, not clipped onto the
    edge: on a face that fills the frame, clipped points coincided (DegenerateInput
    duplicate_points) or crowded the oval so edits backed off. The border pins already hold
    the frame edge. A ring wholly inside the photo gives exactly the same layout as before.
    """
    p = points(mesh, "mesh")
    ring = anchor_ring(p, ring_scale, ring_count)
    inside = ((ring[:, 0] >= 1.0) & (ring[:, 0] <= width - 2.0)
              & (ring[:, 1] >= 1.0) & (ring[:, 1] <= height - 2.0))
    ring = ring[inside]
    pins = border_pins(width, height)
    allp = np.vstack([p, ring, pins])
    return MeshLayout(allp, len(p), delaunay(allp.tolist()))


@dataclass(frozen=True)
class MeshWarp:
    result: PiecewiseResult
    flips: fold.FlipReport
    strength_used: float
    reduced: bool
    jacobian: fold.FoldReport
    guard_reason: str | None
    evaluations: int

    @property
    def refused(self) -> bool:
        return self.reduced and self.strength_used == 0


def _moved(lay: MeshLayout, after: Floats, strength: float) -> Floats:
    out = lay.points.copy()
    out[:lay.mesh_count] = lay.points[:lay.mesh_count] + strength * (after - lay.points[:lay.mesh_count])
    return out


def mesh_warp(height: int, width: int, before: object, after: object, *, lay: MeshLayout | None = None,
              strength: float = 1.0, guard: bool = True, iterations: int = 12) -> MeshWarp:
    """Backward field moving the mesh from `before` to `after` (ring and border fixed)."""
    b = points(before, "before")
    a = points(after, "after")
    if a.shape != b.shape:
        raise ValueError("before and after must be the same mesh")
    if not 0 <= strength <= 1:
        raise ValueError("strength must be in [0, 1]")
    if isinstance(iterations, bool) or not isinstance(iterations, int) or not 1 <= iterations <= 40:
        raise ValueError("iterations must be an integer from 1 to 40")
    lay = lay or layout(b, width, height)
    if lay.mesh_count != len(b) or not np.allclose(lay.points[:lay.mesh_count], b):
        raise ValueError("the layout was built for another mesh")
    dst = _moved(lay, a, strength)
    flips = fold.triangle_flips(lay.points, dst, lay.triangles)
    used, reduced = strength, False
    reason = None
    evaluations = 0
    if guard and not flips.passed:
        reduced = True
        reason = "triangle_area"
        lo, hi = 0.0, strength
        flips = fold.triangle_flips(lay.points, lay.points, lay.triangles)
        for _ in range(iterations):
            mid = (lo + hi) / 2
            rep = fold.triangle_flips(lay.points, _moved(lay, a, mid), lay.triangles)
            if rep.passed:
                lo, flips = mid, rep
            else:
                hi = mid
        used = lo
        dst = _moved(lay, a, used)
    result = piecewise_affine(height, width, lay.points, dst, lay.triangles)
    jacobian = fold.fold_report(result.field)
    evaluations += 1
    if guard and not jacobian.passed:
        # Q3 is evaluated on precisely the map that will be sampled. Scaling that
        # finished map would disconnect reported target points from the pixels, so
        # every candidate is rebuilt at its own forward landmark displacement.
        reduced = True
        reason = "triangle_area_and_raster_q3" if reason else "raster_q3"
        lo, hi = 0.0, used
        best = piecewise_affine(height, width, lay.points, lay.points, lay.triangles)
        best_jacobian = fold.fold_report(best.field)
        best_flips = fold.triangle_flips(lay.points, lay.points, lay.triangles)
        if not (best_flips.passed and best_jacobian.passed):
            raise ValueError("mesh layout cannot produce a valid identity warp")
        for _ in range(iterations):
            mid = (lo + hi) / 2
            candidate_dst = _moved(lay, a, mid)
            candidate_flips = fold.triangle_flips(lay.points, candidate_dst, lay.triangles)
            if not candidate_flips.passed:
                hi = mid
                continue
            candidate = piecewise_affine(height, width, lay.points, candidate_dst, lay.triangles)
            candidate_jacobian = fold.fold_report(candidate.field)
            evaluations += 1
            if candidate_jacobian.passed:
                lo, best, best_jacobian, best_flips = mid, candidate, candidate_jacobian, candidate_flips
            else:
                hi = mid
        used, result, jacobian, flips = lo, best, best_jacobian, best_flips
    return MeshWarp(result, flips, used, reduced, jacobian, reason, evaluations)
