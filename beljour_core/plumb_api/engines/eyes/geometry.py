"""Eye-local geometry derived from the existing face contour topology.

Original procedural landmark-conditioned cosmetic placement with piecewise
linear arc-length sampling; existing contour data is reused. Eye anatomy is selected by the person, never inferred
from ethnicity. Left and right frames are measured independently. Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

import numpy as np

from ..core import regions
from .contracts import validate_points


@dataclass(frozen=True)
class EyeFrame:
    side: str
    origin: tuple[float, float]
    axis: tuple[float, float]
    up: tuple[float, float]
    width: float
    aperture: float
    brow_space: float
    upper: tuple[tuple[float, float], ...]
    lower: tuple[tuple[float, float], ...]
    contour: tuple[tuple[float, float], ...]
    roll: float
    downturned: bool
    visible: bool

    def point(self, u: float, v: float) -> tuple[float, float]:
        return (self.origin[0] + self.width * (u * self.axis[0] + v * self.up[0]),
                self.origin[1] + self.width * (u * self.axis[1] + v * self.up[1]))

    def local(self, x: float, y: float) -> tuple[float, float]:
        dx, dy = x - self.origin[0], y - self.origin[1]
        return ((dx * self.axis[0] + dy * self.axis[1]) / self.width,
                (dx * self.up[0] + dy * self.up[1]) / self.width)

    def as_dict(self) -> dict[str, Any]:
        return {"side": self.side, "origin": list(self.origin), "axis": list(self.axis),
                "up": list(self.up), "width": self.width, "aperture": self.aperture,
                "brow_space": self.brow_space, "upper": [list(p) for p in self.upper],
                "lower": [list(p) for p in self.lower], "roll": self.roll,
                "downturned": self.downturned, "visible": self.visible}


def interpolate(points: tuple[tuple[float, float], ...], u: float) -> float:
    if u <= points[0][0]:
        return points[0][1]
    if u >= points[-1][0]:
        return points[-1][1]
    for (x0, y0), (x1, y1) in zip(points, points[1:], strict=False):
        if x0 <= u <= x1:
            return y0 if x1 - x0 < 1e-12 else y0 + (y1 - y0) * (u - x0) / (x1 - x0)
    return points[-1][1]


def frames(points: Any, width: int, height: int) -> tuple[EyeFrame, EyeFrame]:
    mesh = validate_points(points) * np.array((width, height))
    output = []
    for side, contour, brows in (("right", regions.RIGHT_EYE, regions.RIGHT_BROW),
                                 ("left", regions.LEFT_EYE, regions.LEFT_BROW)):
        outer = mesh[contour[0]]
        inner = mesh[contour[len(contour) // 2]]
        delta = outer - inner
        span = float(np.linalg.norm(delta))
        if span < 2:
            raise ValueError("eye width is too small or degenerate")
        axis = delta / span
        up = np.array((-axis[1], axis[0]))
        forehead = mesh[10] - (inner + outer) / 2
        if np.dot(up, forehead) < 0:
            up = -up
        local = np.array([((p - inner) @ axis / span, (p - inner) @ up / span) for p in mesh[list(contour)]])
        middle = len(contour) // 2
        arc_a = local[:middle + 1]
        arc_b = np.concatenate((local[middle:], local[:1]))
        upper, lower = (arc_a, arc_b) if np.mean(arc_a[:, 1]) > np.mean(arc_b[:, 1]) else (arc_b, arc_a)
        upper_points = tuple(sorted((float(x), float(y)) for x, y in upper))
        lower_points = tuple(sorted((float(x), float(y)) for x, y in lower))
        aperture = max(0.0, interpolate(upper_points, .5) - interpolate(lower_points, .5))
        brow_v = [float((mesh[i] - inner) @ up / span) for i in brows]
        brow_space = max(.08, min(.65, float(np.median(brow_v))))
        roll = math.degrees(math.atan2(float(delta[1]), abs(float(delta[0]))))
        output.append(EyeFrame(side, tuple(inner), tuple(axis), tuple(up), span, aperture, brow_space,
                               upper_points, lower_points, tuple((float(x), float(y)) for x, y in local),
                               roll, bool(delta[1] > .035 * span), aperture >= .08))
    return output[0], output[1]


def lid_height(frame: EyeFrame, anatomy: str, u: float) -> float:
    """Cosmetic canvas above the lash line, capped before the eyebrow.

    The fractional budgets are design assumptions. Hooded placement uses a narrow
    mobile lid; monolid placement follows a visible gradient without inventing a
    crease; deep-set placement stays below the brow shadow. No geometry moves.
    """
    upper = interpolate(frame.upper, u)
    free = max(.025, frame.brow_space - upper - .025)
    fraction = {"open": .58, "hooded": .28, "monolid": .74, "deep_set": .43}[anatomy]
    return min(.24, free * fraction)


def lid_bounds(frame: EyeFrame, anatomy: str, u: float) -> tuple[float, float]:
    bottom = interpolate(frame.upper, min(1, max(0, u))) + .008
    return bottom, bottom + lid_height(frame, anatomy, u)


def visible_canvas(frame: EyeFrame, anatomy: str) -> list[tuple[float, float]]:
    lower, upper = [], []
    for i in range(25):
        u = .035 + .93 * i / 24
        low, high = lid_bounds(frame, anatomy, u)
        lower.append(frame.point(u, low))
        upper.append(frame.point(u, high))
    return lower + list(reversed(upper))


def eye_protection(height: int, width: int, eye_frames: tuple[EyeFrame, EyeFrame]) -> np.ndarray:
    out = np.zeros((height, width), dtype=np.float64)
    for frame in eye_frames:
        polygon = [frame.point(u, v) for u, v in frame.contour]
        mask = regions.polygon(height, width, polygon, supersample=2)
        out = np.maximum(out, mask)
    return out


def native_placement(frame: EyeFrame, anatomy: str) -> dict[str, Any]:
    techniques = {
        "open": ("Follow the visible crease", "Keep the lower edge on your measured lash line."),
        "hooded": ("Open-eye batwing", "The connector crosses the fold as a small step; keep the mobile-lid band thin."),
        "monolid": ("Visible gradient", "Build depth from the lash line; no crease is drawn onto your eye."),
        "deep_set": ("Low crease and outer lift", "Keep the centre lighter and stay below the brow shadow."),
    }
    title, detail = techniques[anatomy]
    warnings = []
    if frame.downturned:
        warnings.append("The outer corner turns down. A shorter lifted tail avoids extending that direction.")
    if anatomy == "hooded":
        warnings.append("Check with eyes open. A long outer wing may disappear in the fold.")
    if not frame.visible:
        warnings.append("This eye is closed or too narrow to place this preview reliably.")
    return {"side": frame.side, "anatomy": anatomy, "technique": title, "why": detail,
            "warnings": warnings, "eye_width_px": frame.width, "aperture_ratio": frame.aperture,
            "canvas": [list(p) for p in visible_canvas(frame, anatomy)],
            "geometry_changed": False, "expert_validation": "Not tested with artists or real models"}
