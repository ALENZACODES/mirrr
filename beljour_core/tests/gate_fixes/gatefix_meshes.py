"""Drawn 478-point meshes and matching drawn photos for the C16 engine tests.

The mesh is the repository's synthetic symmetric face (no person), placed and
scaled in pixels, optionally turned about a vertical cylinder to model head
yaw. Photos are painted from the same mesh: skin inside the face oval, dark
eyes, coloured irises and lips, so mask-driven edits have pixels to act on.
Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np

from plumb_api.engines.core import regions
from plumb_api.engines.proportions.synthetic import symmetric_face

BASE_WIDTH, BASE_HEIGHT, BASE_FACE_WIDTH = 400.0, 500.0, 220.0


def placed_face(cx: float, cy: float, scale: float = 1.0) -> np.ndarray:
    """(478, 2) pixel mesh of the synthetic face centred at (cx, cy), scaled."""
    points = symmetric_face()
    points = (points - (BASE_WIDTH / 2, BASE_HEIGHT / 2)) * scale
    return np.asarray(points + (cx, cy), dtype=np.float64)


def yawed(points: np.ndarray, degrees: float, cx: float, half_width: float) -> np.ndarray:
    """Turn a frontal pixel mesh about a vertical cylinder (face edge at 65 degrees)."""
    radius = half_width / math.sin(math.radians(65))
    out = np.array(points, dtype=np.float64)
    angle = np.arcsin(np.clip((out[:, 0] - cx) / radius, -1, 1))
    out[:, 0] = cx + radius * np.sin(angle + math.radians(degrees))
    return out


def paint_face(image: np.ndarray, points: np.ndarray, skin: tuple[int, int, int],
               iris: tuple[int, int, int] = (92, 60, 38)) -> None:
    """Paint skin, eyes, irises and lips of one mesh into `image` in place."""
    height, width = image.shape[:2]
    masks = regions.region_masks(points, height, width, normalized=False, supersample=2)
    layers = (("face_oval", skin), ("eyes", (236, 236, 232)), ("irises", iris),
              ("brows", (60, 45, 35)), ("lips", (170, 80, 90)))
    for name, colour in layers:
        alpha = masks[name][..., None].astype(np.float64)
        mixed = image * (1 - alpha) + np.array(colour, dtype=np.float64) * alpha
        image[:] = np.rint(mixed).clip(0, 255).astype(np.uint8)


def drawn_photo(height: int, width: int, faces: list[tuple[np.ndarray, tuple[int, int, int]]],
                ground: tuple[int, int, int] = (88, 104, 120)) -> np.ndarray:
    image = np.empty((height, width, 3), dtype=np.uint8)
    image[:] = ground
    yy, xx = np.mgrid[:height, :width]
    image[..., 1] = np.clip(image[..., 1] + (xx % 17) - 8, 0, 255).astype(np.uint8)
    image[..., 2] = np.clip(image[..., 2] + (yy % 13) - 6, 0, 255).astype(np.uint8)
    for points, skin in faces:
        paint_face(image, points, skin)
    return image


def normalized(points: np.ndarray, width: int, height: int) -> np.ndarray:
    return np.asarray(points, dtype=np.float64) / (width, height)
