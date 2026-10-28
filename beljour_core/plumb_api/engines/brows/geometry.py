"""Independent left/right brow frames from the existing mesh contour table.

No learned weights, anatomical ideal or inferred ethnicity is used. The contour
is runtime topology shared with the existing core. Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

import numpy as np

from ..core.regions import LEFT_BROW, RIGHT_BROW, convex_hull, landmark_points, polygon
from .contracts import F64


@dataclass(frozen=True)
class BrowFrame:
    side: str
    inner: tuple[float, float]
    tail: tuple[float, float]
    across: tuple[float, float]
    up: tuple[float, float]
    width: float
    height: float
    centre: tuple[float, float]
    contour: F64
    mask: F64

    def point(self, u: float, v: float) -> tuple[float, float]:
        return (self.inner[0] + self.across[0] * u * self.width + self.up[0] * v * self.width,
                self.inner[1] + self.across[1] * u * self.width + self.up[1] * v * self.width)

    def project(self, x: float, y: float) -> tuple[float, float]:
        dx, dy = x - self.inner[0], y - self.inner[1]
        return ((dx * self.across[0] + dy * self.across[1]) / self.width,
                (dx * self.up[0] + dy * self.up[1]) / self.width)


def brow_frames(landmarks: Any, height: int, width: int) -> tuple[BrowFrame, BrowFrame]:
    pts = landmark_points(landmarks, height, width)
    if len(pts) < 468 or len(pts) > 478:
        raise ValueError("brow placement needs at least 468 normalized face points")
    if np.any(pts < -0.5 * max(height, width)) or np.any(pts > 1.5 * max(height, width)):
        raise ValueError("brow landmarks fall outside the supported frame")
    eye_axis = pts[263] - pts[33]
    iod = math.hypot(float(eye_axis[0]), float(eye_axis[1]))
    if iod < 6:
        raise ValueError("eye line is too small for a brow preview")
    right_axis = eye_axis / iod
    face_up = np.array([right_axis[1], -right_axis[0]])
    nose = pts[168]
    out: list[BrowFrame] = []
    for side, indices in (("right", RIGHT_BROW), ("left", LEFT_BROW)):
        contour = convex_hull(pts[list(indices)])
        if len(contour) < 3:
            raise ValueError("brow contour is degenerate")
        proj = contour @ right_axis
        i0, i1 = int(np.argmin(proj)), int(np.argmax(proj))
        endpoints = [contour[i0], contour[i1]]
        if np.linalg.norm(endpoints[0] - nose) > np.linalg.norm(endpoints[1] - nose):
            endpoints.reverse()
        inner, tail = endpoints
        delta = tail - inner
        brow_width = math.hypot(float(delta[0]), float(delta[1]))
        if brow_width < 3 or brow_width > iod * 1.2:
            raise ValueError("brow width cannot support a reliable preview")
        axis = delta / brow_width
        up = np.array([-axis[1], axis[0]])
        if float(up @ face_up) < 0:
            up = -up
        vertical = (contour - inner) @ up
        brow_height = float(np.max(vertical) - np.min(vertical))
        if brow_height < 0.25 or brow_height > brow_width:
            raise ValueError("brow thickness is degenerate")
        support = polygon(height, width, contour, supersample=2).astype(np.float64)
        centre = np.mean(contour, axis=0)
        out.append(BrowFrame(side, tuple(inner), tuple(tail), tuple(axis), tuple(up),
                             brow_width, brow_height, tuple(centre), contour, support))
    return out[0], out[1]


def union(frames: tuple[BrowFrame, BrowFrame]) -> F64:
    return np.maximum(frames[0].mask, frames[1].mask)


def frame_summary(frame: BrowFrame) -> dict[str, Any]:
    return {"side": frame.side, "width_px": frame.width, "height_px": frame.height,
            "inner": list(frame.inner), "tail": list(frame.tail), "centre": list(frame.centre)}


def curve_points(frame: BrowFrame, *, arch: float, peak: float, tail: float,
                 steps: int = 33) -> list[tuple[float, float]]:
    """Continuous two-piece parabola with independently controlled peak position."""
    result = []
    for i in range(steps):
        u = i / (steps - 1)
        rise = arch * (1 - ((u - peak) / (peak if u <= peak else 1 - peak)) ** 2)
        result.append(frame.point(u * (1 + tail), rise))
    return result


def draw_path(alpha: F64, points: list[tuple[float, float]], width: float, opacity: float,
              clip: F64 | None = None) -> None:
    """Analytic segment distance coverage, deterministic in Python and TypeScript."""
    height, image_width = alpha.shape
    for a, b in zip(points[:-1], points[1:], strict=True):
        dx, dy = b[0] - a[0], b[1] - a[1]
        length2 = dx * dx + dy * dy
        radius = width / 2
        xmin = max(0, math.floor(min(a[0], b[0]) - radius - 1))
        xmax = min(image_width - 1, math.ceil(max(a[0], b[0]) + radius + 1))
        ymin = max(0, math.floor(min(a[1], b[1]) - radius - 1))
        ymax = min(height - 1, math.ceil(max(a[1], b[1]) + radius + 1))
        for y in range(ymin, ymax + 1):
            for x in range(xmin, xmax + 1):
                t = 0.0 if length2 == 0 else min(1.0, max(0.0, ((x + 0.5 - a[0]) * dx + (y + 0.5 - a[1]) * dy) / length2))
                distance = math.hypot(x + 0.5 - a[0] - t * dx, y + 0.5 - a[1] - t * dy)
                value = min(1.0, max(0.0, radius + 0.5 - distance)) * opacity
                if clip is not None:
                    value *= float(clip[y, x])
                alpha[y, x] = max(alpha[y, x], value)
