"""Procedural portraits drawn in code, for tests, previews and speed checks.

No photos are used anywhere. A portrait is a few ellipses and polygons in
face-local units, drawn through the same FaceTarget mapping the looks use, so
the returned landmarks match the drawing exactly at any roll.
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np
from PIL import Image, ImageDraw

from .model import hex_to_rgb
from .raster import ImageArray
from .target import FaceBox, FaceLandmarks, FaceTarget, Point

# Six skin tones from very light to very deep, for the fairness checks.
SKIN_TONES: tuple[str, ...] = (
    "#f6dcc8",
    "#eac0a0",
    "#d39d74",
    "#a86b47",
    "#7b4a2e",
    "#4a2c1c",
)
HAIR_COLOURS: tuple[str, ...] = ("#2b1d14", "#4a3020", "#7a5a2a", "#151515")


@dataclass(frozen=True)
class PortraitSpec:
    """One drawn face: centre, box size, skin, hair and roll in degrees."""

    cx: float
    cy: float
    width: float
    height: float
    skin: str = SKIN_TONES[2]
    hair: str = HAIR_COLOURS[0]
    roll: float = 0.0


def _ellipse_local(cu: float, cv: float, ru: float, rv: float, steps: int = 36) -> list[Point]:
    angles = [2.0 * math.pi * i / steps for i in range(steps)]
    return [(cu + ru * math.cos(a), cv + rv * math.sin(a)) for a in angles]


def _shade(colour: str, factor: float) -> tuple[int, int, int]:
    r, g, b = hex_to_rgb(colour)
    return (int(r * factor), int(g * factor), int(b * factor))


def background(width: int, height: int, seed: int = 0) -> ImageArray:
    """A soft two-colour gradient with a few blocks, so frames have texture to sit on."""
    ys = np.linspace(0.0, 1.0, height, dtype=np.float32)[:, None, None]
    top = np.array([96, 132, 168], dtype=np.float32)
    bottom = np.array([196, 176, 150], dtype=np.float32)
    grad = np.broadcast_to(top + (bottom - top) * ys, (height, width, 3))
    image = np.ascontiguousarray(grad).astype(np.uint8)
    rng = np.random.default_rng(seed)
    for _ in range(6):
        x0 = int(rng.integers(0, max(1, width - 8)))
        y0 = int(rng.integers(0, max(1, height - 8)))
        w = int(rng.integers(4, max(5, width // 4)))
        h = int(rng.integers(4, max(5, height // 4)))
        colour = rng.integers(60, 220, 3).astype(np.uint8)
        image[y0 : y0 + h, x0 : x0 + w] = colour
    return image


def draw_portrait(image: ImageArray, spec: PortraitSpec) -> FaceTarget:
    """Draw one face on the image in place and return its matching target."""
    box = FaceBox(spec.cx - spec.width / 2.0, spec.cy - spec.height / 2.0, spec.width, spec.height)
    plain = FaceTarget(box, spec.roll)
    canvas = Image.fromarray(image)
    draw = ImageDraw.Draw(canvas)

    def fill(points: Sequence[Point], colour: tuple[int, int, int]) -> list[Point]:
        mapped = plain.local_polygon(points)
        draw.polygon(mapped, fill=colour)
        return mapped

    skin = hex_to_rgb(spec.skin)
    hair = hex_to_rgb(spec.hair)
    fill([(-0.16, 0.4), (0.16, 0.4), (0.18, 0.85), (-0.18, 0.85)], _shade(spec.skin, 0.9))
    fill(_ellipse_local(0.0, -0.08, 0.56, 0.5), hair)
    fill(_ellipse_local(0.0, 0.02, 0.46, 0.5), skin)
    fill(_ellipse_local(0.0, -0.4, 0.44, 0.16), hair)
    eyes: list[list[Point]] = []
    for side in (-1.0, 1.0):
        white = fill(_ellipse_local(side * 0.19, -0.07, 0.09, 0.045), (245, 245, 240))
        fill(_ellipse_local(side * 0.19, -0.07, 0.035, 0.04), (60, 40, 30))
        fill(
            [(side * 0.08, -0.17), (side * 0.3, -0.19), (side * 0.3, -0.16), (side * 0.08, -0.14)],
            _shade(spec.hair, 1.0),
        )
        eyes.append(white)
    left_eye, right_eye = eyes
    nose = fill([(0.0, -0.02), (0.05, 0.14), (-0.05, 0.14)], _shade(spec.skin, 0.82))
    mouth = fill(_ellipse_local(0.0, 0.29, 0.13, 0.045), (176, 70, 80))
    jaw_local = [
        (float(u), 0.02 + 0.5 * math.sqrt(max(0.0, 1.0 - (float(u) / 0.46) ** 2)))
        for u in np.linspace(-0.44, 0.44, 9)
    ]
    jaw = plain.local_polygon(jaw_local)
    brows = [
        plain.local_polygon([(side * 0.08, -0.155), (side * 0.3, -0.175)]) for side in (-1.0, 1.0)
    ]
    out = np.asarray(canvas, dtype=np.uint8)
    image[...] = out
    landmarks = FaceLandmarks(
        left_eye=tuple(left_eye),
        right_eye=tuple(right_eye),
        left_brow=tuple(brows[0]),
        right_brow=tuple(brows[1]),
        nose=tuple(nose),
        mouth=tuple(mouth),
        jaw=tuple(jaw),
    )
    return FaceTarget(box, spec.roll, landmarks)


def scene(
    width: int,
    height: int,
    specs: Sequence[PortraitSpec],
    seed: int = 0,
) -> tuple[ImageArray, tuple[FaceTarget, ...]]:
    """A background with one or more drawn faces; targets are in spec order."""
    image = background(width, height, seed)
    targets = tuple(draw_portrait(image, spec) for spec in specs)
    return image, targets


def single(
    size: int = 256, skin: str = SKIN_TONES[2], roll: float = 0.0
) -> tuple[ImageArray, FaceTarget]:
    """A square picture with one centred face."""
    spec = PortraitSpec(size * 0.5, size * 0.56, size * 0.36, size * 0.44, skin=skin, roll=roll)
    image, targets = scene(size, size, [spec])
    return image, targets[0]


def pair(width: int = 640, height: int = 360) -> tuple[ImageArray, FaceTarget, FaceTarget]:
    """Two faces side by side, far enough apart that their effect regions do not meet."""
    face_w, face_h = width * 0.16, height * 0.32
    left = PortraitSpec(width * 0.25, height * 0.62, face_w, face_h, skin=SKIN_TONES[1])
    right = PortraitSpec(
        width * 0.75, height * 0.62, face_w, face_h, skin=SKIN_TONES[4], hair=HAIR_COLOURS[2]
    )
    image, targets = scene(width, height, [left, right], seed=3)
    return image, targets[0], targets[1]
