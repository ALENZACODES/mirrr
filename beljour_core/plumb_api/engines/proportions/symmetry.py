"""E10 symmetry analysis on the 478-point mesh: a midline, a per-region asymmetry map and
symmetry targets for the E06 warp. Descriptive only: no score, no ranking.

1. The midline is the principal axis of the midline landmarks (nose bridge, lips, chin).
2. Each (right, left) pair: the right point is mirrored across the midline and compared
   with its left partner. The offset is split into "across" (perpendicular to the midline)
   and "along" (down the face), and divided by the inter-pupil distance (IOD; eye-corner
   centres on a 468-point mesh). across > 0: the left point sits nearer the midline than
   the mirrored right one; along > 0: the left point sits higher.
3. A region's asymmetry is the mean offset size of its pairs, in IOD.
4. `targets` moves pairs toward mirror images of each other by `strength` (0..1), keeping
   the subject's right, left or the average as the master, and pulls midline points onto
   the line. Every pair offset, and so every region's asymmetry, shrinks by exactly
   (1 - strength), which is plan M20's check ("drops by strength x (1 +/- 10%)").
5. `controls` turns two point sets into warp control pairs for E06 (MLS similarity).
6. `safe_targets` (R13) is what the product uses: it refuses turned or tilted heads with
   a reason and caps every move at 15% of the eye distance by scaling the whole field.

Readings depend on the head facing the camera: `facing_camera` is False when the nose tip
is off the face's centre by more than 8% of face width (yaw), as Plumb's photo check does.

Face-mapping credits (licences.json "concepts"): runtime data from MediaPipe Face
Landmarker (Bucket A); concept only, no code copied: OpenFace and dlib (left/right
landmark pairs by facial part), InsightFace (comparing faces in a normalised frame) and
Farkas anthropometry (midline and paired measurements), from publications and docs.
Mirrored in `web/src/engines/proportions/symmetry.ts`.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..core.refusal import DegenerateInput
from . import anatomy

Floats = NDArray[np.float64]
SIDES = ("average", "right", "left")
FACING_LIMIT = 0.08


@dataclass(frozen=True)
class Line:
    """A point on the line and its unit direction, pointing down the face (dy >= 0)."""
    cx: float
    cy: float
    dx: float
    dy: float

    def reflect(self, pts: np.ndarray) -> Floats:
        p = np.asarray(pts, dtype=np.float64)
        v = p - [self.cx, self.cy]
        along = v[..., 0] * self.dx + v[..., 1] * self.dy
        foot = np.stack([self.cx + along * self.dx, self.cy + along * self.dy], -1)
        out: Floats = 2 * foot - p
        return out

    def project(self, pts: np.ndarray) -> Floats:
        p = np.asarray(pts, dtype=np.float64)
        v = p - [self.cx, self.cy]
        along = v[..., 0] * self.dx + v[..., 1] * self.dy
        out: Floats = np.stack([self.cx + along * self.dx, self.cy + along * self.dy], -1)
        return out

    def frame(self, vectors: np.ndarray) -> tuple[Floats, Floats]:
        """(across, along) components; across points from the subject's right to left."""
        v = np.asarray(vectors, dtype=np.float64)
        across = v[..., 0] * self.dy - v[..., 1] * self.dx
        along = v[..., 0] * self.dx + v[..., 1] * self.dy
        return across, along

    @property
    def tilt_degrees(self) -> float:
        return math.degrees(math.atan2(self.dx, self.dy))

    def to_json(self) -> dict[str, float]:
        return {"cx": self.cx, "cy": self.cy, "dx": self.dx, "dy": self.dy}


def mesh(points: object, minimum: int = 468) -> Floats:
    p = np.asarray(points, dtype=np.float64)
    if p.ndim != 2 or p.shape[1] < 2 or len(p) < minimum or len(p) > anatomy.MESH_POINTS:
        raise ValueError(f"need a face mesh of {minimum} to {anatomy.MESH_POINTS} (x, y) points")
    p = p[:, :2]
    if not np.all(np.isfinite(p)):
        raise ValueError("landmarks must be finite")
    return p.copy()


def fit_midline(points: object) -> Line:
    """Principal axis of the midline landmarks (as Plumb's fitLine)."""
    p = mesh(points)[list(anatomy.MIDLINE)]
    cx, cy = float(p[:, 0].mean()), float(p[:, 1].mean())
    sxx = float(((p[:, 0] - cx) ** 2).sum())
    syy = float(((p[:, 1] - cy) ** 2).sum())
    sxy = float(((p[:, 0] - cx) * (p[:, 1] - cy)).sum())
    theta = 0.5 * math.atan2(2 * sxy, sxx - syy)
    dx, dy = math.cos(theta), math.sin(theta)
    if dy < 0:
        dx, dy = -dx, -dy
    return Line(cx, cy, dx, dy)


def interocular(points: object) -> float:
    """Inter-pupil distance; eye-corner centres when the mesh has no irises."""
    p = mesh(points)
    if len(p) >= anatomy.MESH_POINTS:
        a, b = p[anatomy.LANDMARKS["right_pupil"]], p[anatomy.LANDMARKS["left_pupil"]]
    else:
        a = (p[33] + p[133]) / 2
        b = (p[362] + p[263]) / 2
    d = float(np.hypot(*(b - a)))
    if d <= 1e-9:
        raise DegenerateInput("eyes_coincide", "the eyes coincide; the mesh is degenerate")
    return d


@dataclass(frozen=True)
class PairOffset:
    right: int
    left: int
    across: float          # IOD
    along: float           # IOD
    size: float            # IOD


@dataclass(frozen=True)
class RegionAsymmetry:
    name: str
    pairs: int
    mean: float            # mean offset size, IOD
    max: float
    across: float          # signed mean across offset, IOD
    along: float           # signed mean along offset, IOD


@dataclass(frozen=True)
class SymmetryReport:
    midline: Line
    tilt_degrees: float
    iod: float
    midline_spread: float          # RMS distance of midline points from the line, IOD
    regions: tuple[RegionAsymmetry, ...]
    pairs: tuple[PairOffset, ...]
    mean: float                    # mean of the region means, IOD (a measurement, not a score)
    yaw_share: float
    facing_camera: bool

    def region(self, name: str) -> RegionAsymmetry:
        for r in self.regions:
            if r.name == name:
                return r
        raise KeyError(name)

    def to_json(self) -> dict[str, object]:
        return {"midline": self.midline.to_json(), "tilt_degrees": self.tilt_degrees, "iod": self.iod,
                "midline_spread": self.midline_spread, "mean": self.mean, "yaw_share": self.yaw_share,
                "facing_camera": self.facing_camera,
                "regions": [r.__dict__ for r in self.regions], "pairs": [p.__dict__ for p in self.pairs]}


def _regions(names: Sequence[str] | None) -> list[str]:
    chosen = list(anatomy.SYMMETRY_REGIONS if names is None else names)
    unknown = [n for n in chosen if n not in anatomy.SYMMETRY_REGIONS]
    if unknown or not chosen:
        raise ValueError(f"regions must be among {', '.join(anatomy.SYMMETRY_REGIONS)}")
    return chosen


def yaw_share(points: object, line: Line) -> float:
    """Nose tip offset from the face-edge midpoint, across the midline, as a share of face width."""
    p = mesh(points)
    edge_r, edge_l = p[anatomy.LANDMARKS["right_face_edge"]], p[anatomy.LANDMARKS["left_face_edge"]]
    across, _ = line.frame(np.stack([edge_r, edge_l, p[anatomy.LANDMARKS["nose_tip"]]]) - [line.cx, line.cy])
    width = float(abs(across[1] - across[0]))
    if width <= 1e-9:
        raise DegenerateInput("no_face_width", "the face has no width; the mesh is degenerate")
    return float((across[2] - (across[0] + across[1]) / 2) / width)


def analyse(points: object, regions: Sequence[str] | None = None) -> SymmetryReport:
    p = mesh(points)
    line = fit_midline(p)
    iod = interocular(p)
    mid = p[list(anatomy.MIDLINE)]
    spread_across, _ = line.frame(mid - [line.cx, line.cy])
    spread = float(math.sqrt(float((spread_across ** 2).mean()))) / iod
    table = anatomy.region_pairs()
    out_regions, out_pairs = [], []
    for name in _regions(regions):
        pairs = table[name]
        right = p[[r for r, _ in pairs]]
        left = p[[li for _, li in pairs]]
        across, along = line.frame(line.reflect(right) - left)
        across, along = across / iod, along / iod
        size = np.hypot(across, along)
        out_regions.append(RegionAsymmetry(name, len(pairs), float(size.mean()), float(size.max()),
                                           float(across.mean()), float(along.mean())))
        out_pairs += [PairOffset(r, li, float(a), float(b), float(s))
                      for (r, li), a, b, s in zip(pairs, across, along, size, strict=True)]
    yaw = yaw_share(p, line)
    mean = float(np.mean([r.mean for r in out_regions]))
    return SymmetryReport(line, line.tilt_degrees, iod, spread, tuple(out_regions), tuple(out_pairs), mean, yaw,
                          abs(yaw) < FACING_LIMIT)


def targets(points: object, strength: float, *, side: str = "average", regions: Sequence[str] | None = None,
            midline: bool = True) -> Floats:
    """Points moved toward mirror symmetry by `strength` (0 = unchanged, 1 = mirrored)."""
    p = mesh(points)
    if not (math.isfinite(strength) and 0 <= strength <= 1):
        raise ValueError("strength must be in [0, 1]")
    if side not in SIDES:
        raise ValueError(f"side must be one of {', '.join(SIDES)}")
    line = fit_midline(p)
    out = p.copy()
    table = anatomy.region_pairs()
    for name in _regions(regions):
        for r, li in table[name]:
            mirror_r, mirror_l = line.reflect(p[r]), line.reflect(p[li])
            if side == "average":
                out[r] = p[r] + strength * (mirror_l - p[r]) / 2
                out[li] = p[li] + strength * (mirror_r - p[li]) / 2
            elif side == "right":
                out[li] = p[li] + strength * (mirror_r - p[li])
            else:
                out[r] = p[r] + strength * (mirror_l - p[r])
    if midline:
        idx = list(anatomy.MIDLINE)
        out[idx] = p[idx] + strength * (line.project(p[idx]) - p[idx])
    return out


# R13 gate 9: targets never move a point more than 15% of the eye distance, and the
# tool refuses heads turned more than 15 degrees or tilted more than 10 degrees,
# because a mirror target on a turned head would reshape the face, not balance it.
MAX_TARGET_MOVE_IOD = 0.15
YAW_LIMIT_DEGREES = 15.0
ROLL_LIMIT_DEGREES = 10.0
# Nose-tip depth as a share of face width, used to turn the 2D nose offset into
# degrees when no depth is supplied (ASSUMED average; 0.08 share is about 14 deg).
NOSE_DEPTH_SHARE = 0.33
REASONS = ("ok", "head_turned", "head_tilted", "no_movement")


@dataclass(frozen=True)
class SafeTargets:
    points: Floats
    refused: bool
    reason: str
    yaw_degrees: float
    roll_degrees: float
    scale: float               # share of the raw move kept by the 15% cap (1 = uncapped)
    max_move_iod: float        # largest move after the cap, in IOD
    raw_max_move_iod: float

    def to_json(self) -> dict[str, object]:
        return {"refused": self.refused, "reason": self.reason, "yaw_degrees": self.yaw_degrees,
                "roll_degrees": self.roll_degrees, "scale": self.scale, "max_move_iod": self.max_move_iod,
                "raw_max_move_iod": self.raw_max_move_iod, "cap_iod": MAX_TARGET_MOVE_IOD}


def head_angles(points: object) -> tuple[float, float]:
    """(yaw, roll) in degrees, measured from the mesh.

    With depth (N x 3), yaw is the angle of the face-edge line in the x-z plane of the
    face frame. Without depth, yaw comes from the nose-tip offset (yaw_share) and an
    ASSUMED nose depth of 33% of face width. Roll is the pupil line's image angle.
    """
    raw = np.asarray(points, dtype=np.float64)
    p = mesh(raw)
    a, b = p[anatomy.LANDMARKS["right_pupil"]], p[anatomy.LANDMARKS["left_pupil"]]
    if len(p) < anatomy.MESH_POINTS:
        a, b = (p[33] + p[133]) / 2, (p[362] + p[263]) / 2
    roll = math.degrees(math.atan2(float(b[1] - a[1]), float(b[0] - a[0])))
    line = fit_midline(p)
    if raw.ndim == 2 and raw.shape[1] >= 3 and np.all(np.isfinite(raw[:, 2])):
        r_edge = raw[anatomy.LANDMARKS["right_face_edge"]]
        l_edge = raw[anatomy.LANDMARKS["left_face_edge"]]
        across, _ = line.frame((l_edge - r_edge)[:2])
        yaw = math.degrees(math.atan2(float(l_edge[2] - r_edge[2]), float(across)))
    else:
        share = yaw_share(p, line)
        yaw = math.degrees(math.asin(max(-1.0, min(1.0, share / NOSE_DEPTH_SHARE))))
    return yaw, roll


def safe_targets(points: object, strength: float, *, side: str = "average",
                 regions: Sequence[str] | None = None, midline: bool = True) -> SafeTargets:
    """Production symmetry targets: head-angle gated, whole move field capped at 15% IOD.

    The cap scales the entire move field by one factor, so the balanced shape stays
    coherent instead of clipping single points. A refusal returns the input points
    unchanged with a reason; strength 0 is the exact identity.
    """
    raw = np.asarray(points, dtype=np.float64)
    p = mesh(raw)
    if not (math.isfinite(strength) and 0 <= strength <= 1):
        raise ValueError("strength must be in [0, 1]")
    iod = interocular(p)
    yaw, roll = head_angles(raw)
    if abs(yaw) > YAW_LIMIT_DEGREES:
        return SafeTargets(p.copy(), True, "head_turned", yaw, roll, 0.0, 0.0, 0.0)
    if abs(roll) > ROLL_LIMIT_DEGREES:
        return SafeTargets(p.copy(), True, "head_tilted", yaw, roll, 0.0, 0.0, 0.0)
    moved = targets(p, strength, side=side, regions=regions, midline=midline)
    delta = moved - p
    raw_max = float(np.hypot(delta[:, 0], delta[:, 1]).max(initial=0.0)) / iod
    if raw_max <= 0:
        return SafeTargets(p.copy(), False, "no_movement", yaw, roll, 1.0, 0.0, 0.0)
    scale = 1.0
    if raw_max > MAX_TARGET_MOVE_IOD:
        # A hair under the cap so rounding can never put a point on the wrong side.
        scale = MAX_TARGET_MOVE_IOD * (1 - 1e-9) / raw_max
    out = p + delta * scale
    final = float(np.hypot(*(out - p).T).max()) / iod
    return SafeTargets(out, False, "ok", yaw, roll, scale, final, raw_max)


def controls(before: object, after: object, min_move: float = 0.05) -> tuple[Floats, Floats, list[int]]:
    """(from, to, indices) of the points that moved more than `min_move` px: E06 warp handles."""
    a, b = mesh(before), mesh(after)
    if a.shape != b.shape:
        raise ValueError("before and after must be the same mesh")
    moved = np.flatnonzero(np.hypot(*(b - a).T) > min_move)
    return a[moved], b[moved], [int(i) for i in moved]
