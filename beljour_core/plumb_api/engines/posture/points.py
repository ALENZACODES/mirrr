"""LS4 control points for the posture fixes (plan §8.5), front and side views.

Front view, 6 points: right and left shoulder, right and left hip, mid-chest, navel.
Side view, 6 points: ear, neck base, shoulder, mid-back, hip, knee, plus an optional ankle
(swayback uses the ankle-shoulder line; without an ankle it falls back to the knee and
says so). "Right" and "left" are the subject's own sides, so in a front photo the
subject's right shoulder is on the image's left.

`from_pose` prefills the points from MediaPipe Pose's 33 normalised landmarks (Bucket A
runtime; its weights are still pending in the model registry, so manual points are the
default). Mid-chest, navel, neck base and mid-back are not pose landmarks: they are
estimated from the others and listed in `estimated` so the screen asks the person to
confirm them. Points whose landmark visibility is under 0.5 are listed in `manual`.
Side views start with manual points, as the plan says.

The numbers here drive the edit only; they are never shown as a score.
Photo edit. Not a posture assessment and not medical advice.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

import numpy as np

VIEWS = ("front", "side")
FRONT = ("right_shoulder", "left_shoulder", "right_hip", "left_hip", "mid_chest", "navel")
SIDE = ("ear", "neck_base", "shoulder", "mid_back", "hip", "knee")
SIDE_OPTIONAL = ("ankle",)
POSE_INDEX = {"nose": 0, "left_ear": 7, "right_ear": 8, "left_shoulder": 11, "right_shoulder": 12,
              "left_hip": 23, "right_hip": 24, "left_knee": 25, "right_knee": 26,
              "left_ankle": 27, "right_ankle": 28}
POSE_POINTS = 33
VISIBLE = 0.5
MIN_TORSO_PX = 8.0
# Estimated points, as shares along the torso (shoulder line to hip line).
CHEST_SHARE = 0.30
NAVEL_SHARE = 0.72
NECK_SHARE = 0.30          # neck base: share of the way from shoulder to ear
BACK_SHARE = 0.45          # mid-back: share of the way from shoulder to hip
BACK_DEPTH = 0.12          # mid-back sits behind the shoulder by this share of torso height
LABEL = "Simulation. Photo edit only, not medical advice."

Point = tuple[float, float]


@dataclass(frozen=True)
class Controls:
    """One view's control points in pixels, plus which ones need the person's confirmation."""
    view: str
    points: Mapping[str, Point]
    width: int
    height: int
    facing: int = 0                       # side view: +1 faces image right, -1 left; front: 0
    estimated: tuple[str, ...] = field(default=())
    manual: tuple[str, ...] = field(default=())

    def __post_init__(self) -> None:
        validate(self.view, self.points, self.width, self.height, self.facing)

    def xy(self, name: str) -> np.ndarray:
        return np.array(self.points[name], dtype=np.float64)

    def array(self, names: Sequence[str]) -> np.ndarray:
        return np.array([self.points[n] for n in names], dtype=np.float64).reshape(-1, 2)

    @property
    def torso_height(self) -> float:
        return torso_height(self.view, self.points)

    @property
    def names(self) -> tuple[str, ...]:
        base = FRONT if self.view == "front" else SIDE
        return base + tuple(n for n in SIDE_OPTIONAL if n in self.points and self.view == "side")

    def moved(self, changes: Mapping[str, Point]) -> Controls:
        merged = dict(self.points)
        merged.update({k: (float(v[0]), float(v[1])) for k, v in changes.items()})
        return Controls(self.view, merged, self.width, self.height, self.facing, self.estimated, self.manual)

    def to_json(self) -> dict[str, Any]:
        return {"view": self.view, "facing": self.facing, "width": self.width, "height": self.height,
                "points": {k: [round(v[0], 4), round(v[1], 4)] for k, v in self.points.items()},
                "estimated": list(self.estimated), "manual": list(self.manual)}


def torso_height(view: str, points: Mapping[str, Point]) -> float:
    """Shoulder-line midpoint to hip-line midpoint (front) or shoulder to hip (side), px."""
    if view == "front":
        sx = (points["right_shoulder"][0] + points["left_shoulder"][0]) / 2
        sy = (points["right_shoulder"][1] + points["left_shoulder"][1]) / 2
        hx = (points["right_hip"][0] + points["left_hip"][0]) / 2
        hy = (points["right_hip"][1] + points["left_hip"][1]) / 2
    else:
        sx, sy = points["shoulder"]
        hx, hy = points["hip"]
    return math.hypot(hx - sx, hy - sy)


def validate(view: str, points: Mapping[str, Any], width: int, height: int, facing: int = 0) -> None:
    if view not in VIEWS:
        raise ValueError("view must be front or side")
    if not (isinstance(width, int) and isinstance(height, int) and 8 <= width <= 16384 and 8 <= height <= 16384):
        raise ValueError("image size must be whole numbers from 8 to 16384")
    required = FRONT if view == "front" else SIDE
    allowed = set(required) | (set(SIDE_OPTIONAL) if view == "side" else set())
    missing = [n for n in required if n not in points]
    extra = [n for n in points if n not in allowed]
    if missing or extra:
        raise ValueError(f"{view} view needs points {', '.join(required)}; missing {missing}, unknown {extra}")
    for name, value in points.items():
        if len(value) != 2 or not all(isinstance(v, (int, float)) and math.isfinite(v) for v in value):
            raise ValueError(f"point {name} must be two finite numbers")
        x, y = value
        if not (-0.5 <= x <= width - 0.5 and -0.5 <= y <= height - 0.5):
            raise ValueError(f"point {name} lies outside the photo")
    if torso_height(view, points) < MIN_TORSO_PX:
        raise ValueError("the torso is too small to edit (under 8 px)")
    if view == "front":
        if facing != 0:
            raise ValueError("front view has no facing direction")
        shoulders = max(points["right_shoulder"][1], points["left_shoulder"][1])
        hips = min(points["right_hip"][1], points["left_hip"][1])
        if shoulders >= hips:
            raise ValueError("both shoulders must sit above both hips")
    else:
        if facing not in (-1, 1):
            raise ValueError("side view needs facing -1 (image left) or +1 (image right)")
        order = [points[n][1] for n in ("ear", "shoulder", "hip", "knee")]
        if not all(a < b for a, b in zip(order, order[1:], strict=False)):
            raise ValueError("side points must run top to bottom: ear, shoulder, hip, knee")
        if "ankle" in points and points["ankle"][1] <= points["knee"][1]:
            raise ValueError("the ankle must sit below the knee")


def _landmark(item: Any) -> tuple[float, float, float]:
    """(x, y, visibility) from a pose landmark given as a mapping or a sequence."""
    if isinstance(item, Mapping):
        x, y = item.get("x"), item.get("y")
        vis = item.get("visibility", 1.0)
    elif isinstance(item, Sequence) and len(item) >= 2:
        x, y = item[0], item[1]
        vis = item[3] if len(item) >= 4 else 1.0
    else:
        raise ValueError("pose landmarks must be {x, y, visibility} or [x, y, z, visibility]")
    out: list[float] = []
    for value in (x, y, 1.0 if vis is None else vis):
        if not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value):
            raise ValueError("pose landmarks must be finite numbers")
        out.append(float(value))
    return out[0], out[1], out[2]


def from_pose(landmarks: Sequence[Any], width: int, height: int, view: str, *,
              side: str | None = None) -> Controls:
    """Prefill one view's control points from 33 normalised pose landmarks.

    `side` (side view only) picks the subject's "left" or "right" body side facing the
    camera; by default the side whose ear, shoulder, hip and knee are more visible."""
    if len(landmarks) != POSE_POINTS:
        raise ValueError("MediaPipe Pose gives 33 landmarks")
    marks = {name: _landmark(landmarks[i]) for name, i in POSE_INDEX.items()}

    def px(name: str) -> np.ndarray:
        x, y, _ = marks[name]
        return np.array([min(max(x, 0.0), 1.0) * (width - 1), min(max(y, 0.0), 1.0) * (height - 1)])

    def low(name: str) -> bool:
        return marks[name][2] < VISIBLE

    if view == "front":
        pts = {"right_shoulder": px("right_shoulder"), "left_shoulder": px("left_shoulder"),
               "right_hip": px("right_hip"), "left_hip": px("left_hip")}
        sm = (pts["right_shoulder"] + pts["left_shoulder"]) / 2
        hm = (pts["right_hip"] + pts["left_hip"]) / 2
        pts["mid_chest"] = sm + CHEST_SHARE * (hm - sm)
        pts["navel"] = sm + NAVEL_SHARE * (hm - sm)
        manual = tuple(n for n in ("right_shoulder", "left_shoulder", "right_hip", "left_hip") if low(n))
        return Controls("front", {k: (float(v[0]), float(v[1])) for k, v in pts.items()}, width, height, 0,
                        ("mid_chest", "navel"), manual)
    if view != "side":
        raise ValueError("view must be front or side")
    if side is None:
        score = {s: sum(marks[f"{s}_{p}"][2] for p in ("ear", "shoulder", "hip", "knee")) for s in ("left", "right")}
        side = "left" if score["left"] >= score["right"] else "right"
    if side not in ("left", "right"):
        raise ValueError("side must be left or right")
    ear, shoulder, hip, knee = (px(f"{side}_{p}") for p in ("ear", "shoulder", "hip", "knee"))
    nose = px("nose")
    facing = 1 if nose[0] >= ear[0] else -1
    torso = float(np.linalg.norm(hip - shoulder))
    neck = shoulder + NECK_SHARE * (ear - shoulder)
    back = shoulder + BACK_SHARE * (hip - shoulder) - np.array([facing * BACK_DEPTH * torso, 0.0])
    pts = {"ear": ear, "neck_base": neck, "shoulder": shoulder, "mid_back": back, "hip": hip, "knee": knee}
    if not low(f"{side}_ankle"):
        pts["ankle"] = px(f"{side}_ankle")
    # Side views open with manual points by default (plan §8.5): every pose-read point
    # is listed for confirmation, the derived ones as estimated.
    manual = tuple(n for n in ("ear", "shoulder", "hip", "knee") if low(f"{side}_{n}")) or ("ear", "shoulder", "hip", "knee")
    return Controls("side", {k: (float(v[0]), float(v[1])) for k, v in pts.items()}, width, height, facing,
                    ("neck_base", "mid_back"), manual)


def signed_offset(point: np.ndarray, a: np.ndarray, b: np.ndarray, facing: int) -> float:
    """Perpendicular distance of `point` from the line a-b, positive on the facing side."""
    return float(np.dot(point - a, facing_normal(a, b, facing)))


def facing_normal(a: np.ndarray, b: np.ndarray, facing: int) -> np.ndarray:
    """Unit normal of line a-b pointing towards the facing side (front of the body)."""
    d = b - a
    length = float(np.hypot(d[0], d[1]))
    if length < 1e-9:
        raise ValueError("reference line needs two distinct points")
    n = np.array([-d[1], d[0]]) / length
    if n[0] * facing < 0 or (n[0] == 0 and facing < 0):
        n = -n
    return n
