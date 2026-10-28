"""Face part controls of the 40-control set: nose, lips, eyes and brows, Python reference.

Each control moves one part in the face-aligned frame of `geometry.frame`. The part is the
convex hull of its own landmarks (R4 contours, R5 midline and nose pairs, the iris); every
mesh point inside the hull follows the control exactly and points in a margin around it
follow with a smoothstep falloff, so neighbouring mesh points never pinch. A ring of fixed
pins sits outside the margin and only the mesh points inside the ring are triangulated, so
the R5 piecewise warp, its triangle-flip guard and its raster Jacobian guard (unchanged
thresholds) can change no pixel outside the ring. Pixels the warp leaves in place and the
alpha channel are copied from the input byte for byte.

The margin shrinks so that the ring stays clear of every other part and the face outline,
and the part is refused when that leaves too little room. Eye controls never change the
eye opening by more than 12%; no landmark moves more than 6% of the interocular distance.
After rendering, the identity proxy (`arena/identity.py` geometry signature) must find the
landmarks outside the edited parts where they were.

Opt-in only, never in a default preset. Every result is labelled a simulation; the nose
result is a decision preview and the lip result is framed for a talk with a professional.
Brow tint is not here: it belongs to the makeup route.
Face-mapping inspiration: FLAME (separate named shape parameters) and 3DDFA_V2 (dense mesh
driving an image warp); concept only, no code copied. Mesh index layout: MediaPipe Face
Landmarker (runtime data). Mirrored in `web/src/engines/shape/parts.ts`.
Author: John Khan.
"""

from __future__ import annotations

import json
import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ...arena import identity as identity_proxy
from ..core import regions
from ..proportions import anatomy
from ..warp import field as warp_field
from ..warp import mesh as warp_mesh
from ..warp.triangulate import delaunay
from .geometry import Frame, check_face, frame
from .shape_guard import MIN_STRENGTH

Floats = NDArray[np.float64]
PART_SPEC = Path(__file__).with_name("parts.json")
VERSION = "face-parts/1"
SIMULATION = "Face part simulation; results from one photo are not a prediction."
RING_FACTOR = 1.25          # fixed pins sit 1.25 margins out from the part hull; ASSUMED
LAYOUT_FACTOR = 1.1         # mesh points nearer than 1.1 margins join the local mesh; ASSUMED
CLEARANCE = 0.95            # other parts stay at least 1/0.95 ring widths away; ASSUMED
MIN_MARGIN_IOD = 0.025      # a tighter margin is refused as crowded; ASSUMED
MIN_PART_IOD = 0.05         # a part narrower than 5% IOD is refused as too small; ASSUMED
MAX_MOVE_IOD = 0.06         # no landmark moves more than 6% IOD; ASSUMED
APERTURE_CAP = 0.12         # eye opening change limit, either way (feature 41: +12%; the -12% is ASSUMED)
BAND_SOFT = 0.2             # soft edge of a control's band, in part-normalised units; ASSUMED
IDENTITY_MINIMUM = 0.99     # proxy geometry similarity of untouched landmarks; ASSUMED
ARC_STEP = math.pi / 8      # ring sampling around each hull corner
MOVED = 1e-9
ORDER = ("brows", "eyes", "nose", "lips")
L = anatomy.LANDMARKS


def spec() -> dict[str, Any]:
    """The single authored table; `api/scripts/make_face_part_vectors.py` mirrors it for TypeScript."""
    data: dict[str, Any] = json.loads(PART_SPEC.read_text(encoding="utf-8"))
    return data


SPEC = spec()
PARTS: dict[str, dict[str, Any]] = SPEC["parts"]
CONTROLS: tuple[dict[str, Any], ...] = tuple(SPEC["controls"])
CONTROL_BY_ID = {row["id"]: row for row in CONTROLS}
LABELS = {name: str(row["label"]) for name, row in PARTS.items()}

REFUSALS: dict[str, str] = {
    "not_opted_in": "Face part previews are opt-in. Turn them on to see one.",
    "part_too_small": "This part is too small in the photo to preview reliably. Use a closer photo.",
    "part_outside_photo": "Part of this feature lies outside the photo.",
    "part_crowded": "Another feature sits too close to this one to change it on its own.",
    "eye_closed": "This eye looks closed, so its size cannot be previewed.",
    "fold_guard": "This change would fold the photo, so it was not applied.",
    "identity_guard": "This change moved features it must leave alone, so it was not applied.",
}


class PartRefusal(ValueError):
    """A coded refusal: this photo and part cannot take the change; the original is kept."""

    def __init__(self, code: str, part: str, message: str | None = None) -> None:
        if code not in REFUSALS:
            raise ValueError(f"unknown part refusal code {code!r}")
        self.code = code
        self.part = part
        super().__init__(message or REFUSALS[code])

    def to_json(self) -> dict[str, Any]:
        return {"module": "face_parts", "refused": True, "reason_code": self.code, "part": self.part,
                "message": str(self)}


def _iris(centre: int, ring: Sequence[int]) -> tuple[int, ...]:
    return (centre, *ring)


NOSE_MIDLINE = anatomy.MIDLINE[anatomy.MIDLINE.index(L["nasion"]):anatomy.MIDLINE.index(L["subnasale"]) + 1]
NOSE_CORE = NOSE_MIDLINE + tuple(i for pair in anatomy.region_pairs()["nose"] for i in pair)
IRIS_IDS = {"right": _iris(regions.RIGHT_IRIS[0], regions.RIGHT_IRIS[1]),
            "left": _iris(regions.LEFT_IRIS[0], regions.LEFT_IRIS[1])}
INSTANCES: tuple[tuple[str, str, tuple[int, ...]], ...] = (
    ("brows", "right", regions.RIGHT_BROW),
    ("brows", "left", regions.LEFT_BROW),
    ("eyes", "right", regions.RIGHT_EYE + IRIS_IDS["right"]),
    ("eyes", "left", regions.LEFT_EYE + IRIS_IDS["left"]),
    ("nose", "centre", NOSE_CORE),
    ("lips", "centre", regions.LIPS_OUTER),
)
EYE_LIDS = {side: regions.EYE_LIDS[side][:2] for side in ("right", "left")}


@dataclass(frozen=True)
class PartRegion:
    """One part on one face: its hull, the falloff margin and the ring of fixed pins (pixels)."""

    part: str
    side: str
    core: tuple[int, ...]
    hull: Floats
    margin: float
    ring: Floats

    def to_json(self) -> dict[str, Any]:
        return {"part": self.part, "side": self.side, "margin": self.margin,
                "hull": self.hull.tolist(), "ring": self.ring.tolist()}


@dataclass(frozen=True)
class PartPlan:
    """Requested landmark motion for one part, after its caps and the global strength."""

    region: PartRegion
    displacement: Floats
    cap_scale: float
    aperture_before: float | None
    aperture_after: float | None


@dataclass(frozen=True)
class PartOutcome:
    image: NDArray[np.uint8]
    targets: Floats
    changed: NDArray[np.bool_]
    plans: tuple[PartPlan, ...]
    metrics: dict[str, Any]
    labels: tuple[str, ...]


def smoothstep(x: Floats | float) -> Floats:
    z = np.clip(np.asarray(x, dtype=np.float64), 0.0, 1.0)
    out: Floats = z * z * (3.0 - 2.0 * z)
    return out


def oriented_hull(points: Floats) -> Floats:
    """Counter-clockwise (positive shoelace area) convex hull from the core contour helper."""
    hull = regions.convex_hull(points)
    return np.asarray(hull, dtype=np.float64).reshape(-1, 2)


def hull_area(hull: Floats) -> float:
    x, y = hull[:, 0], hull[:, 1]
    return float(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1))) / 2


def hull_distance(hull: Floats, pts: Floats) -> Floats:
    """Distance from each point to the convex hull; zero inside it."""
    p = np.asarray(pts, dtype=np.float64).reshape(-1, 2)
    inside = np.ones(len(p), dtype=bool)
    best = np.full(len(p), np.inf)
    n = len(hull)
    for i in range(n):
        a, b = hull[i], hull[(i + 1) % n]
        e = b - a
        length2 = float(e @ e)
        inside &= e[0] * (p[:, 1] - a[1]) - e[1] * (p[:, 0] - a[0]) >= -1e-12
        t = np.clip(((p[:, 0] - a[0]) * e[0] + (p[:, 1] - a[1]) * e[1]) / length2, 0.0, 1.0)
        best = np.minimum(best, np.hypot(p[:, 0] - a[0] - t * e[0], p[:, 1] - a[1] - t * e[1]))
    out: Floats = np.where(inside, 0.0, best)
    return out


def dilated_ring(hull: Floats, radius: float) -> Floats:
    """Points on the hull grown by `radius`: arcs at corners, offset edges between."""
    n = len(hull)
    normals = []
    for i in range(n):
        e = hull[(i + 1) % n] - hull[i]
        length = math.hypot(float(e[0]), float(e[1]))
        normals.append((float(e[1]) / length, -float(e[0]) / length))
    out: list[tuple[float, float]] = []
    for i in range(n):
        vx, vy = float(hull[i][0]), float(hull[i][1])
        prev, nxt = normals[i - 1], normals[i]
        a0 = math.atan2(prev[1], prev[0])
        delta = math.atan2(nxt[1], nxt[0]) - a0
        while delta <= -math.pi:
            delta += 2 * math.pi
        while delta > math.pi:
            delta -= 2 * math.pi
        k = max(1, math.ceil(abs(delta) / ARC_STEP - 1e-9))
        for j in range(k + 1):
            angle = a0 + delta * j / k
            out.append((vx + radius * math.cos(angle), vy + radius * math.sin(angle)))
        wx, wy = float(hull[(i + 1) % n][0]), float(hull[(i + 1) % n][1])
        steps = math.ceil(math.hypot(wx - vx, wy - vy) / radius - 1e-9)
        for j in range(1, steps):
            out.append((vx + (wx - vx) * j / steps + radius * nxt[0], vy + (wy - vy) * j / steps + radius * nxt[1]))
    kept: list[tuple[float, float]] = []
    for p in out:
        if not kept or math.hypot(p[0] - kept[-1][0], p[1] - kept[-1][1]) > 1e-9:
            kept.append(p)
    if len(kept) > 1 and math.hypot(kept[0][0] - kept[-1][0], kept[0][1] - kept[-1][1]) <= 1e-9:
        kept.pop()
    return np.asarray(kept, dtype=np.float64)


def validate_values(values: Mapping[str, float], strength: float) -> None:
    if not (isinstance(strength, (int, float)) and not isinstance(strength, bool)
            and math.isfinite(strength) and 0 <= strength <= 1):
        raise ValueError("strength must be in [0,1]")
    if not isinstance(values, Mapping):
        raise ValueError("part amounts must be a mapping")
    for name, value in values.items():
        if (name not in CONTROL_BY_ID or not isinstance(value, (int, float)) or isinstance(value, bool)
                or not math.isfinite(value) or not -100 <= value <= 100):
            raise ValueError(f"unknown or invalid part amount: {name}")


def protected_ids(part: str, side: str) -> list[int]:
    """Landmarks this part must not reach: every other part and the face outline."""
    own = next(set(core) for p, s, core in INSTANCES if p == part and s == side)
    ids = {i for p, s, core in INSTANCES if (p, s) != (part, side) for i in core}
    ids.update(regions.FACE_OVAL)
    return sorted(ids - own)


def part_region(face: Floats, f: Frame, part: str, side: str, core: tuple[int, ...]) -> PartRegion:
    hull = oriented_hull(face[list(core)])
    extent = 0.0 if len(hull) < 3 else float(np.max(np.ptp(hull, axis=0)))
    if len(hull) < 3 or hull_area(hull) <= 1e-9 or extent < MIN_PART_IOD * f.iod:
        raise PartRefusal("part_too_small", part)
    nominal = float(PARTS[part]["margin_iod"]) * f.iod
    nearest = float(np.min(hull_distance(hull, face[protected_ids(part, side)])))
    margin = min(nominal, CLEARANCE * nearest / RING_FACTOR)
    if margin < MIN_MARGIN_IOD * f.iod:
        raise PartRefusal("part_crowded", part)
    return PartRegion(part, side, core, hull, margin, dilated_ring(hull, RING_FACTOR * margin))


def _anchor(face: Floats, part: str, side: str, name: str, core: tuple[int, ...]) -> Floats:
    if part == "nose":
        return face[L["nasion"]] if name == "top" else face[L["nose_tip"]]
    if part == "lips":
        if name == "mouth_line":
            return (face[L["stomion_upper"]] + face[L["stomion_lower"]]) / 2
        return (face[L["right_mouth"]] + face[L["left_mouth"]]) / 2
    if part == "eyes":
        return face[L["right_pupil"] if side == "right" else L["left_pupil"]]
    out: Floats = face[list(core)].mean(axis=0)
    return out


def _band(x: Floats, lo: float, hi: float) -> Floats:
    out = np.ones_like(x)
    if lo > 0:
        out = out * smoothstep((x - (lo - BAND_SOFT)) / BAND_SOFT)
    if hi < 1:
        out = out * (1.0 - smoothstep((x - hi) / BAND_SOFT))
    return out


def _span(values: Floats) -> tuple[float, float]:
    lo, hi = float(np.min(values)), float(np.max(values))
    return lo, max(hi - lo, 1e-9)


def control_displacement(face: Floats, f: Frame, region: PartRegion, control: Mapping[str, Any],
                         amount: float) -> Floats:
    """Unweighted motion of every mesh point for one control at a signed -100..100 amount."""
    part, side, core = region.part, region.side, region.core
    c = amount / 100.0 * float(control["cap"])
    anchor = _anchor(face, part, side, str(control["anchor"]), core)
    rel = face - anchor
    s = rel @ f.axis_across
    t = rel @ f.axis_down
    core_s, core_t = s[list(core)], t[list(core)]
    half = max(float(np.max(np.abs(core_s))), 1e-9)
    t_lo, t_span = _span(core_t)
    profile = np.ones(len(face))
    if "band_t" in control:
        lo, hi = control["band_t"]
        profile *= _band((t - t_lo) / t_span, float(lo), float(hi))
    if "band_s" in control:
        profile *= 1.0 - smoothstep((np.abs(s) / half - float(control["band_s"])) / BAND_SOFT)
    if control.get("half") == "upper":
        profile *= t <= 0
    elif control.get("half") == "lower":
        profile *= t >= 0
    mode = control["mode"]
    across, down = f.axis_across, f.axis_down
    lift = -c / 100.0 * f.iod
    if mode == "scale_x":
        amount_across, amount_down = c * s, np.zeros(len(face))
    elif mode == "scale_y":
        amount_across, amount_down = np.zeros(len(face)), c * t
    elif mode == "scale":
        amount_across, amount_down = c * s, c * t
    else:
        if mode == "shift_y":
            shape = np.ones(len(face))
        elif mode == "corner_y":
            shape = np.minimum(1.0, (s / half) ** 2)
        else:
            outward = -across if side == "right" else across
            u_lo, u_span = _span(rel[list(core)] @ outward)
            u = np.clip((rel @ outward - u_lo) / u_span, 0.0, 1.0)
            if mode == "tail_y":
                shape = u * u
            elif mode == "arch_y":
                peak = float(control["peak"])
                width = np.where(u <= peak, peak, 1.0 - peak)
                shape = np.clip(1.0 - ((u - peak) / width) ** 2, 0.0, 1.0)
            else:
                raise ValueError(f"unknown part mode {mode}")
        amount_across, amount_down = np.zeros(len(face)), lift * shape
    move: Floats = ((amount_across * profile)[:, None] * across[None, :]
                    + (amount_down * profile)[:, None] * down[None, :])
    return move


def _aperture(points: Floats, side: str) -> float:
    a, b = EYE_LIDS[side]
    return float(np.hypot(*(points[a] - points[b])))


def _aperture_scale(face: Floats, move: Floats, side: str) -> float:
    """Largest share of `move` keeping the eye opening within +/-12% (the change is a quadratic)."""
    a, b = EYE_LIDS[side]
    v = face[a] - face[b]
    w = move[a] - move[b]
    before2 = float(v @ v)
    after2 = float((v + w) @ (v + w))
    limit = (1 + APERTURE_CAP) if after2 >= before2 else (1 - APERTURE_CAP)
    if abs(math.sqrt(after2 / before2) - 1) <= APERTURE_CAP:
        return 1.0
    qa, qb, qc = float(w @ w), 2 * float(v @ w), before2 * (1 - limit * limit)
    disc = max(qb * qb - 4 * qa * qc, 0.0)
    roots = [r for r in ((-qb + math.sqrt(disc)) / (2 * qa), (-qb - math.sqrt(disc)) / (2 * qa)) if 0 <= r <= 1]
    return min(roots) if roots else 0.0


def plan_parts(face: object, values: Mapping[str, float], *, strength: float = 1.0) -> tuple[PartPlan, ...]:
    """Capped landmark motion per part (brows, eyes, nose, lips order); no pixels yet."""
    src = check_face(face)
    validate_values(values, strength)
    f = frame(src)
    active = {name: float(v) for name, v in values.items() if abs(v) > 1e-12}
    plans: list[PartPlan] = []
    for part, side, core in sorted(INSTANCES, key=lambda item: ORDER.index(item[0])):
        chosen = [CONTROL_BY_ID[name] for name in CONTROL_BY_ID if name in active and CONTROL_BY_ID[name]["part"] == part]
        if not chosen or strength == 0:
            continue
        region = part_region(src, f, part, side, core)
        raw = np.zeros_like(src)
        for control in chosen:
            raw += control_displacement(src, f, region, control, active[control["id"]])
        weight = 1.0 - smoothstep(hull_distance(region.hull, src) / region.margin)
        move = raw * weight[:, None]
        before = after = None
        scale = 1.0
        if part == "eyes":
            before = _aperture(src, side)
            outer, inner = regions.EYE_LIDS[side][2:]
            if before < regions.EYE_CLOSED_RATIO * float(np.hypot(*(src[outer] - src[inner]))):
                raise PartRefusal("eye_closed", part)
            scale = _aperture_scale(src, move, side)
        largest = float(np.max(np.hypot(move[:, 0], move[:, 1]))) * scale
        if largest > MAX_MOVE_IOD * f.iod:
            scale *= MAX_MOVE_IOD * f.iod / largest
        move = move * (scale * strength)
        if part == "eyes":
            after = _aperture(src + move, side)
        plans.append(PartPlan(region, move, scale, before, after))
    return tuple(plans)


def target_mesh(face: object, values: Mapping[str, float], *, strength: float = 1.0) -> Floats:
    """Requested 478-point targets (before the fold guard). The input is not changed."""
    src = check_face(face)
    out = src.copy()
    for plan in plan_parts(src, values, strength=strength):
        out += plan.displacement
    return out


def local_layout(current: Floats, plan: PartPlan, width: int, height: int) -> tuple[list[int], warp_mesh.MeshLayout]:
    """Mesh points near the part plus its fixed ring, triangulated on their own."""
    del width, height  # the ring may leave the photo; the rasteriser clips
    region = plan.region
    near = np.flatnonzero(hull_distance(region.hull, current) < LAYOUT_FACTOR * region.margin)
    chosen: list[int] = []
    for idx in near.tolist():
        if all(math.hypot(*(current[idx] - current[j])) > 1e-6 for j in chosen):
            chosen.append(idx)
    points = np.vstack([current[chosen], region.ring])
    return chosen, warp_mesh.MeshLayout(points, len(chosen), delaunay(points.tolist()))


def identity_similarity(before: Floats, after: Floats, parts: Sequence[str]) -> tuple[float, tuple[int, ...]]:
    """Proxy geometry similarity of the landmarks outside every edited part (1 = unmoved)."""
    touched = {i for p, _, core in INSTANCES if p in parts for i in core}
    ids = tuple(i for i in identity_proxy.DEFAULT_PROTECTED if i not in touched)
    if len(ids) < 2:
        return 1.0, ids
    a, b = identity_proxy.signature(before, ids), identity_proxy.signature(after, ids)
    rms = float(np.sqrt(np.mean((a - b) ** 2)))
    return math.exp(-rms / identity_proxy.GEOMETRY_TAU), ids


def _no_op(image: NDArray[np.uint8], src: Floats, strength: float) -> PartOutcome:
    metrics = {"strength_requested": strength, "strength_used": strength, "guard_scale": 1.0,
               "changed_pixels": 0, "max_move_iod_percent": 0.0, "identity_similarity": 1.0}
    return PartOutcome(image.copy(), src.copy(), np.zeros(image.shape[:2], dtype=bool), (), metrics, (SIMULATION,))


def render(image: NDArray[np.uint8], face: object, values: Mapping[str, float], *, strength: float = 1.0,
           opted_in: bool = False) -> PartOutcome:
    """Guarded local preview. Raises `PartRefusal` (coded) rather than returning a bad picture."""
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError("image must be RGB or RGBA uint8")
    height, width = image.shape[:2]
    src = check_face(face)
    validate_values(values, strength)
    if strength == 0 or all(abs(v) <= 1e-12 for v in values.values()):
        return _no_op(image, src, strength)
    if opted_in is not True:
        raise PartRefusal("not_opted_in", "all")
    plans = plan_parts(src, values, strength=strength)
    for plan in plans:
        core = src[list(plan.region.core)]
        if np.any(core < 0) or np.any(core[:, 0] > width - 1) or np.any(core[:, 1] > height - 1):
            raise PartRefusal("part_outside_photo", plan.region.part)
    current, output = src.copy(), image.copy()
    changed = np.zeros((height, width), dtype=bool)
    rows: list[dict[str, Any]] = []
    for plan in plans:
        chosen, lay = local_layout(current, plan, width, height)
        before = current[chosen]
        warp = warp_mesh.mesh_warp(height, width, before, before + plan.displacement[chosen], lay=lay)
        if warp.strength_used < MIN_STRENGTH:
            raise PartRefusal("fold_guard", plan.region.part)
        moved = warp.result.field.move() > MOVED
        warped = warp_field.apply(output, warp.result.field)
        output[moved, :3] = warped[moved, :3]
        changed |= moved
        current = current + plan.displacement * warp.strength_used
        rows.append({"part": plan.region.part, "side": plan.region.side, "margin_px": plan.region.margin,
                     "guard_scale": warp.strength_used, "cap_scale": plan.cap_scale,
                     "min_area_ratio": warp.flips.min_area_ratio, "min_jacobian": warp.jacobian.min_det,
                     "guard_reason": warp.guard_reason})
    if image.shape[2] == 4:
        output[..., 3] = image[..., 3]
    parts = tuple(dict.fromkeys(plan.region.part for plan in plans))
    similarity, _ = identity_similarity(src, current, parts)
    if similarity < IDENTITY_MINIMUM:
        raise PartRefusal("identity_guard", ",".join(parts))
    f = frame(src)
    move = np.hypot(*(current - src).T)
    metrics: dict[str, Any] = {
        "strength_requested": strength,
        "strength_used": strength * min(row["guard_scale"] for row in rows),
        "guard_scale": min(row["guard_scale"] for row in rows),
        "min_area_ratio": min(row["min_area_ratio"] for row in rows),
        "min_jacobian": min(row["min_jacobian"] for row in rows),
        "changed_pixels": int(np.count_nonzero(changed)),
        "max_move_iod_percent": float(np.max(move)) / f.iod * 100,
        "identity_similarity": similarity,
        "parts": rows,
    }
    for side in ("right", "left"):
        if any(plan.region.part == "eyes" and plan.region.side == side for plan in plans):
            metrics[f"aperture_change_percent_{side}"] = (_aperture(current, side) / _aperture(src, side) - 1) * 100
    labels = (SIMULATION, *(LABELS[p] for p in parts))
    return PartOutcome(output, current, changed, plans, metrics, labels)
