"""Eye geometry from the 478-point face mesh, shared by red eye, glasses glare and eye colour.

* An eye is open when its lid gap (159-145, 386-374) is at least EYE_OPEN_RATIO of its
  corner width (33-133, 263-362), the closed-eye ratio of engines/core/regions.py.
* The eye opening is the eye contour polygon (anti-aliased, 4x supersampled); a pixel is
  inside when its coverage is at least one half.
* The iris disk is centred on the iris centre point (468, 473) with the mean distance to
  its four ring points (469-472, 474-477) as the radius, tested at pixel centres.
* The visible iris is the disk inside the opening. A closed eye has no visible iris.

The mesh is in pixel coordinates. web/src/engines/local/eye-geometry.ts gives the same
masks. Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
from numpy.typing import NDArray

from ..core import regions

Floats = NDArray[np.float64]
Bools = NDArray[np.bool_]

SIDES = ("right", "left")  # the subject's right and left, as in the mesh
IRIS_CENTRE = {"right": 468, "left": 473}
IRIS_RING = {"right": (469, 470, 471, 472), "left": (474, 475, 476, 477)}
EYE_LIDS = {"right": (159, 145, 33, 133), "left": (386, 374, 263, 362)}
EYE_OPEN_RATIO = 0.08


def eye_width(points: Floats, side: str) -> float:
    _, _, a, b = EYE_LIDS[side]
    return math.hypot(points[a][0] - points[b][0], points[a][1] - points[b][1])


def eye_open(points: Floats, side: str) -> bool:
    top, bottom, _, _ = EYE_LIDS[side]
    width = eye_width(points, side)
    gap = math.hypot(points[top][0] - points[bottom][0], points[top][1] - points[bottom][1])
    return width > 1e-9 and gap / width >= EYE_OPEN_RATIO


def eye_coverage(points: Floats, side: str, height: int, width: int) -> NDArray[np.float32]:
    contour = [(float(points[i][0]), float(points[i][1])) for i in regions.CONTOURS[side + "_eye"]]
    cover: NDArray[np.float32] = regions.polygon(height, width, contour)
    return cover


def eye_opening(points: Floats, side: str, height: int, width: int) -> Bools:
    inside: Bools = eye_coverage(points, side, height, width) >= 0.5
    return inside


def iris_circle(points: Floats, side: str) -> tuple[float, float, float]:
    cx, cy = float(points[IRIS_CENTRE[side]][0]), float(points[IRIS_CENTRE[side]][1])
    total = 0.0
    for i in IRIS_RING[side]:
        total += math.hypot(points[i][0] - cx, points[i][1] - cy)
    return cx, cy, total / 4


def iris_disk(points: Floats, side: str, height: int, width: int, scale: float = 1.0) -> Bools:
    cx, cy, r = iris_circle(points, side)
    yy, xx = np.mgrid[:height, :width]
    dx = xx + 0.5 - cx
    dy = yy + 0.5 - cy
    rr = r * scale
    disk: Bools = dx * dx + dy * dy <= rr * rr
    return disk


def visible_iris(points: Floats, side: str, height: int, width: int) -> Bools:
    if not eye_open(points, side):
        return np.zeros((height, width), dtype=bool)
    out: Bools = iris_disk(points, side, height, width) & eye_opening(points, side, height, width)
    return out
