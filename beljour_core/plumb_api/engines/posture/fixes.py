"""LS4: the seven posture fixes as control-point moves (plan §8.5, rows J10-J16).

Each fix computes the full "user-confirmed correction" (strength 1, Full) as a move per
control point; Subtle / Normal / Full apply 33 / 66 / 100% of it. A hard cap keeps every
point within 6% of torso height of where it was: if the strength would move a point
further, the whole move is scaled down together and `cap_scale` says by how much.

| Fix | View | What moves | Full correction |
|---|---|---|---|
| lean | front | shoulders, mid-chest, navel rotate about the hip midpoint | torso axis to vertical, at most 8 degrees |
| uneven_shoulders | front | the higher shoulder down (or the lower up, or both halfway) | shoulder line level |
| rounded_shoulders | side | shoulder back toward the ear-hip line (neck base half as far) | halfway to the line at Normal |
| forward_head | side | ear back over the shoulder (neck base half as far) | ear above the shoulder |
| slouch | side | mid-back toward the neck-base-to-hip chord | back curve cut by 50% |
| swayback | side | hip back toward the ankle-shoulder line (knee if no ankle) | halfway at Normal |
| pelvic_tilt | side | hip toward the mid-back-to-knee chord | lower curve cut by 40% |

"Halfway at Normal" means the Full correction is 0.5 / 0.66 of the distance, so Normal
(66%) lands exactly halfway. Each plan carries a before/after measure for its own fix
(degrees or pixels); these drive the edit and the checks and are never shown as scores.

Photo edit. Not a posture assessment and not medical advice. Pelvic tilt in particular
is a rough contour edit from one photo, never a measurement.
Mirrored in web/src/engines/local/posture.ts (parity vectors in parity/spikes-r7.json).
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

import numpy as np

from .points import LABEL, Controls, facing_normal, signed_offset

STOPS: dict[str, float] = {"subtle": 0.33, "normal": 0.66, "full": 1.0}
CAP_SHARE = 0.06
LEAN_MAX_DEGREES = 8.0
HALFWAY_AT_NORMAL = 0.5 / 0.66
SLOUCH_CUT = 0.5
PELVIC_CUT = 0.4
NECK_FOLLOW = 0.5
SHOULDER_MODES = ("higher", "lower", "both")

FIXES: dict[str, dict[str, Any]] = {
    "lean": {"view": "front", "id": "J10", "measure": "torso_tilt_degrees",
             "moves": ("right_shoulder", "left_shoulder", "mid_chest", "navel"),
             "pins": ("right_hip", "left_hip")},
    "uneven_shoulders": {"view": "front", "id": "J11", "measure": "shoulder_height_difference_px",
                         "moves": ("right_shoulder", "left_shoulder"),
                         "pins": ("right_hip", "left_hip", "mid_chest", "navel")},
    "rounded_shoulders": {"view": "side", "id": "J12", "measure": "shoulder_ahead_of_ear_hip_line_px",
                          "moves": ("shoulder", "neck_base"), "pins": ("ear", "mid_back", "hip", "knee")},
    "forward_head": {"view": "side", "id": "J13", "measure": "ear_ahead_of_shoulder_px",
                     "moves": ("ear", "neck_base"), "pins": ("shoulder", "mid_back", "hip", "knee")},
    "slouch": {"view": "side", "id": "J14", "measure": "upper_back_curve_px",
               "moves": ("mid_back",), "pins": ("ear", "neck_base", "shoulder", "hip", "knee")},
    "swayback": {"view": "side", "id": "J15", "measure": "hip_ahead_of_ankle_shoulder_line_px",
                 "moves": ("hip",), "pins": ("ear", "neck_base", "shoulder", "mid_back", "knee")},
    "pelvic_tilt": {"view": "side", "id": "J16", "measure": "lower_curve_px",
                    "moves": ("hip",), "pins": ("ear", "neck_base", "shoulder", "mid_back", "knee")},
}


@dataclass(frozen=True)
class PosturePlan:
    fix: str
    view: str
    strength: float
    before: Controls
    after: Controls
    moves: tuple[str, ...]
    pins: tuple[str, ...]
    requested_px: float          # largest point move at the requested strength, before the cap
    cap_px: float
    cap_scale: float             # 1 when under the cap
    measure_before: float
    measure_after: float
    notes: tuple[str, ...]
    label: str = LABEL

    @property
    def largest_move_px(self) -> float:
        return float(max((np.hypot(*(self.after.xy(n) - self.before.xy(n))) for n in self.moves), default=0.0))

    @property
    def reduction(self) -> float:
        """Share of the fix's own measure removed (0 when there was nothing to correct)."""
        if abs(self.measure_before) < 1e-9:
            return 0.0
        return 1.0 - abs(self.measure_after) / abs(self.measure_before)

    def source_target(self) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """(moved-from, moved-to, pinned) pixel arrays for the warp."""
        return self.before.array(self.moves), self.after.array(self.moves), self.before.array(self.pins)

    def to_json(self) -> dict[str, Any]:
        return {"fix": self.fix, "plan_id": FIXES[self.fix]["id"], "view": self.view,
                "strength": self.strength, "moves": list(self.moves), "pins": list(self.pins),
                "before": {n: [round(v, 4) for v in self.before.points[n]] for n in self.moves},
                "after": {n: [round(v, 4) for v in self.after.points[n]] for n in self.moves},
                "requested_px": round(self.requested_px, 4), "cap_px": round(self.cap_px, 4),
                "cap_scale": round(self.cap_scale, 6), "measure": FIXES[self.fix]["measure"],
                "measure_before": round(self.measure_before, 4), "measure_after": round(self.measure_after, 4),
                "reduction": round(self.reduction, 6), "notes": list(self.notes), "label": self.label}


def strength_of(value: float | str) -> float:
    if isinstance(value, str):
        if value not in STOPS:
            raise ValueError(f"strength must be one of {', '.join(STOPS)} or 0..1")
        return STOPS[value]
    if not (isinstance(value, (int, float)) and math.isfinite(value) and 0 <= value <= 1):
        raise ValueError("strength must be 0..1")
    return float(value)


def _mid(c: Controls, a: str, b: str) -> np.ndarray:
    return (c.xy(a) + c.xy(b)) / 2


def torso_tilt(c: Controls) -> float:
    """Signed angle of the hip-mid to shoulder-mid axis from vertical, degrees (+ leans to image right)."""
    axis = _mid(c, "right_shoulder", "left_shoulder") - _mid(c, "right_hip", "left_hip")
    return math.degrees(math.atan2(axis[0], -axis[1]))


def measure(fix: str, c: Controls) -> float:
    """The fix's own before/after number, in degrees or pixels."""
    if fix == "lean":
        return torso_tilt(c)
    if fix == "uneven_shoulders":
        return float(c.xy("left_shoulder")[1] - c.xy("right_shoulder")[1])
    f = c.facing
    if fix == "rounded_shoulders":
        return signed_offset(c.xy("shoulder"), c.xy("ear"), c.xy("hip"), f)
    if fix == "forward_head":
        return float((c.xy("ear")[0] - c.xy("shoulder")[0]) * f)
    if fix == "slouch":
        return -signed_offset(c.xy("mid_back"), c.xy("neck_base"), c.xy("hip"), f)
    if fix == "swayback":
        return signed_offset(c.xy("hip"), _sway_base(c), c.xy("shoulder"), f)
    if fix == "pelvic_tilt":
        return signed_offset(c.xy("hip"), c.xy("mid_back"), c.xy("knee"), f)
    raise ValueError(f"unknown fix {fix!r}")


def _sway_base(c: Controls) -> np.ndarray:
    return c.xy("ankle") if "ankle" in c.points else c.xy("knee")


def _rotate(p: np.ndarray, centre: np.ndarray, degrees: float) -> np.ndarray:
    t = math.radians(degrees)
    d = p - centre
    return centre + np.array([d[0] * math.cos(t) - d[1] * math.sin(t), d[0] * math.sin(t) + d[1] * math.cos(t)])


def full_moves(fix: str, c: Controls, *, shoulder: str = "higher") -> tuple[dict[str, np.ndarray], list[str]]:
    """Per-point move (pixels) of the Full correction, and notes about it."""
    if fix not in FIXES:
        raise ValueError(f"unknown fix {fix!r}; choose one of {', '.join(FIXES)}")
    if FIXES[fix]["view"] != c.view:
        raise ValueError(f"{fix} needs a {FIXES[fix]['view']} view")
    zero = {n: np.zeros(2) for n in FIXES[fix]["moves"]}
    notes: list[str] = []
    f = c.facing
    if fix == "lean":
        tilt = torso_tilt(c)
        turn = -max(-LEAN_MAX_DEGREES, min(LEAN_MAX_DEGREES, tilt))
        if abs(tilt) > LEAN_MAX_DEGREES:
            notes.append(f"lean is limited to {LEAN_MAX_DEGREES:g} degrees")
        # In image axes (y down) the axis of tilt t is (sin t, -cos t); turning it by -t
        # with the usual rotation matrix makes it vertical.
        centre = _mid(c, "right_hip", "left_hip")
        for n in zero:
            zero[n] = _rotate(c.xy(n), centre, turn) - c.xy(n)
        return zero, notes
    if fix == "uneven_shoulders":
        if shoulder not in SHOULDER_MODES:
            raise ValueError("shoulder must be higher, lower or both")
        right, left = c.xy("right_shoulder"), c.xy("left_shoulder")
        gap = left[1] - right[1]                     # > 0: the left shoulder is lower
        higher, lower = ("right_shoulder", "left_shoulder") if gap > 0 else ("left_shoulder", "right_shoulder")
        size = abs(gap)
        if shoulder == "higher":
            zero[higher] = np.array([0.0, size])
        elif shoulder == "lower":
            zero[lower] = np.array([0.0, -size])
        else:
            zero[higher] = np.array([0.0, size / 2])
            zero[lower] = np.array([0.0, -size / 2])
        return zero, notes
    if fix == "rounded_shoulders":
        ahead = measure(fix, c)
        if ahead > 0:
            n = facing_normal(c.xy("ear"), c.xy("hip"), f)
            zero["shoulder"] = -n * ahead * HALFWAY_AT_NORMAL
            zero["neck_base"] = zero["shoulder"] * NECK_FOLLOW
        else:
            notes.append("shoulder is not ahead of the ear-hip line; nothing to move")
        return zero, notes
    if fix == "forward_head":
        ahead = measure(fix, c)
        if ahead > 0:
            zero["ear"] = np.array([-f * ahead, 0.0])
            zero["neck_base"] = zero["ear"] * NECK_FOLLOW
        else:
            notes.append("ear is not ahead of the shoulder; nothing to move")
        return zero, notes
    if fix == "slouch":
        curve = measure(fix, c)
        if curve > 0:
            n = facing_normal(c.xy("neck_base"), c.xy("hip"), f)
            zero["mid_back"] = n * curve * SLOUCH_CUT
        else:
            notes.append("upper back is not curved behind the neck-to-hip line; nothing to move")
        return zero, notes
    if fix == "swayback":
        if "ankle" not in c.points:
            notes.append("no ankle point: the knee stands in for the ankle")
        ahead = measure(fix, c)
        if ahead > 0:
            n = facing_normal(_sway_base(c), c.xy("shoulder"), f)
            zero["hip"] = -n * ahead * HALFWAY_AT_NORMAL
        else:
            notes.append("hip is not ahead of the reference line; nothing to move")
        return zero, notes
    # pelvic_tilt
    ahead = measure(fix, c)
    if ahead > 0:
        n = facing_normal(c.xy("mid_back"), c.xy("knee"), f)
        zero["hip"] = -n * ahead * PELVIC_CUT
    else:
        notes.append("hip is not ahead of the mid-back-to-knee line; nothing to move")
    notes.append("rough contour edit from one photo, not a measurement")
    return zero, notes


def plan(controls: Controls, fix: str, strength: float | str = "normal", *, shoulder: str = "higher",
         cap_share: float = CAP_SHARE) -> PosturePlan:
    """The fix at a strength, capped at `cap_share` of torso height per point."""
    s = strength_of(strength)
    if not (0 < cap_share <= 0.2):
        raise ValueError("cap share must be in (0, 0.2]")
    moves, notes = full_moves(fix, controls, shoulder=shoulder)
    cap = cap_share * controls.torso_height
    requested = max(float(np.hypot(*(s * m))) for m in moves.values())
    scale = 1.0 if requested <= cap or requested == 0 else cap / requested
    if scale < 1:
        notes.append(f"capped at {cap_share * 100:g}% of torso height")
    after = controls.moved({n: tuple(controls.xy(n) + s * scale * m) for n, m in moves.items()})
    spec = FIXES[fix]
    return PosturePlan(fix, controls.view, s, controls, after, tuple(spec["moves"]), tuple(spec["pins"]),
                       requested, cap, scale, measure(fix, controls), measure(fix, after), tuple(notes))


def j11_check(p: PosturePlan, tolerance: float = 0.10) -> dict[str, Any]:
    """Plan J11: shoulder height difference reduced by strength +/- 10% (of the strength)."""
    if p.fix != "uneven_shoulders":
        raise ValueError("the J11 check is for uneven_shoulders")
    passed = abs(p.reduction - p.strength) <= tolerance * p.strength + 1e-9
    return {"check": "J11", "passed": bool(passed), "measured": {"reduction": round(p.reduction, 6),
            "strength": p.strength, "cap_scale": round(p.cap_scale, 6)},
            "rule": f"shoulder height difference reduced by strength +/- {tolerance * 100:g}%"}


def plans_for(controls: Controls, *, shoulder: str = "higher") -> dict[str, dict[str, PosturePlan]]:
    """Every fix that suits the view, at each named stop."""
    out: dict[str, dict[str, PosturePlan]] = {}
    for fix, spec in FIXES.items():
        if spec["view"] == controls.view:
            out[fix] = {stop: plan(controls, fix, stop, shoulder=shoulder) for stop in STOPS}
    return out


def describe(fixes: Mapping[str, Any] = FIXES) -> list[dict[str, Any]]:
    return [{"fix": k, "plan_id": v["id"], "view": v["view"], "measure": v["measure"],
             "moves": list(v["moves"]), "pins": list(v["pins"])} for k, v in fixes.items()]
