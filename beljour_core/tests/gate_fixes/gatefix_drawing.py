"""Drawn test photos and fake detector sources for the C16 gate-fix tests.

Every image here is drawn with NumPy: an ellipse head on a grey ground, two
dark-blue eye dots and a mouth bar. The fake mesh source looks for the drawn
head in whatever patch it is handed and returns a 478-point ellipse around it,
but only when a test-chosen condition holds (for example, the eyes are level,
or the patch is at least 400 px). No model, download or real face is used.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Callable, Sequence

import numpy as np

SKIN = (200, 150, 110)
EYE = (30, 40, 210)
MOUTH = (150, 50, 60)
GROUND = (96, 96, 96)

Patch = np.ndarray
MeshOut = tuple[list[np.ndarray], list[dict[str, float]]]
Condition = Callable[[np.ndarray], bool]


def ellipse_mesh(cx: float, cy: float, rx: float, ry: float, depth: float = 0.02) -> np.ndarray:
    """478 points on an ellipse in normalized coordinates (a stand-in mesh)."""
    angles = np.arange(478) * (2 * np.pi / 478)
    return np.stack((cx + rx * np.cos(angles), cy + ry * np.sin(angles),
                     depth * np.cos(angles)), -1)


def draw_face(height: int, width: int, cx: float, cy: float, rx: float, ry: float, *,
              angle: float = 0.0, skin: tuple[int, int, int] = SKIN,
              ground: tuple[int, int, int] = GROUND) -> np.ndarray:
    """Head ellipse (pixels) with eyes and mouth, rotated by `angle` degrees (screen ccw)."""
    image = np.empty((height, width, 3), dtype=np.uint8)
    image[:] = ground
    yy, xx = np.mgrid[:height, :width].astype(np.float64)
    radians = math.radians(angle)
    cos, sin = math.cos(radians), math.sin(radians)
    # Face-frame coordinates: undo the screen rotation (y grows downward).
    u = (xx - cx) * cos - (yy - cy) * sin
    v = (xx - cx) * sin + (yy - cy) * cos
    image[(u / rx) ** 2 + (v / ry) ** 2 <= 1] = skin
    for ex in (-0.4, 0.4):
        image[((u - ex * rx) / (0.14 * rx)) ** 2 + ((v + 0.25 * ry) / (0.1 * ry)) ** 2 <= 1] = EYE
    image[(np.abs(u) <= 0.35 * rx) & (np.abs(v - 0.45 * ry) <= 0.06 * ry)] = MOUTH
    return image


def head_pixels(patch: np.ndarray) -> np.ndarray:
    data = patch.astype(np.int16)
    skin = (data[..., 0] - data[..., 2]) > 25
    eyes = (data[..., 2] - data[..., 0]) > 80
    return np.asarray(skin | eyes)


def eye_centres(patch: np.ndarray) -> list[tuple[float, float]]:
    """Centres of the two largest eye blobs (left to right by x), via connected components."""
    import cv2

    data = patch.astype(np.int16)
    eyes = ((data[..., 2] - data[..., 0]) > 80).astype(np.uint8)
    count, _, stats, centroids = cv2.connectedComponentsWithStats(eyes)
    blobs = sorted(range(1, count), key=lambda i: -int(stats[i, cv2.CC_STAT_AREA]))[:2]
    return sorted((float(centroids[i][0]), float(centroids[i][1])) for i in blobs)


def level_and_upright(patch: np.ndarray) -> bool:
    centres = eye_centres(patch)
    head = head_pixels(patch)
    if len(centres) != 2 or not head.any():
        return False
    (x0, y0), (x1, y1) = centres
    rows = np.nonzero(head.any(axis=1))[0]
    middle = (rows[0] + rows[-1]) / 2
    return abs(y1 - y0) <= 0.12 * abs(x1 - x0) and max(y0, y1) < middle


def enclosed(patch: np.ndarray) -> bool:
    head = head_pixels(patch)
    return bool(head.any()) and not (head[0].any() or head[-1].any()
                                     or head[:, 0].any() or head[:, -1].any())


class FakeMeshes:
    """Records every patch shape; returns an ellipse mesh around the drawn head when allowed."""

    def __init__(self, condition: Condition | None = None) -> None:
        self.condition = condition
        self.calls: list[tuple[int, ...]] = []

    def __call__(self, patch: np.ndarray) -> MeshOut:
        self.calls.append(tuple(patch.shape))
        head = head_pixels(patch)
        if not head.any() or (self.condition is not None and not self.condition(patch)):
            return [], []
        rows = np.nonzero(head.any(axis=1))[0]
        cols = np.nonzero(head.any(axis=0))[0]
        height, width = patch.shape[:2]
        cx = (cols[0] + cols[-1] + 1) / 2 / width
        cy = (rows[0] + rows[-1] + 1) / 2 / height
        rx = (cols[-1] - cols[0] + 1) / 2 / width
        ry = (rows[-1] - rows[0] + 1) / 2 / height
        return [ellipse_mesh(cx, cy, rx, ry)], [{"found": 1.0}]


def boxes_for(*rows: Sequence[float]) -> Callable[[np.ndarray], list[list[float]]]:
    def source(_: np.ndarray) -> list[list[float]]:
        return [list(row) for row in rows]
    return source


def head_box(cx: float, cy: float, rx: float, ry: float, score: float = 0.95) -> list[float]:
    return [cx - rx, cy - ry, 2 * rx, 2 * ry, score]
