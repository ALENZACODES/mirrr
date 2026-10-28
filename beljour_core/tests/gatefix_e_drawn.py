"""Parametric face, covering and composition fixtures using only drawn coordinates.

The inputs contain no photograph, personal identifier or external source data.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from plumb_api.engines.core import regions
from plumb_api.engines.proportions.synthetic import symmetric_face

Pixels = NDArray[np.uint8]
Floats = NDArray[np.float64]
TONES = (35, 68, 103, 143, 185, 223)


@dataclass(frozen=True)
class DrawnCase:
    image: Pixels
    face: Floats
    oval: NDArray[np.float32]
    covering: NDArray[np.float64]
    label: str


def warped_face(seed: int, width: int, height: int) -> Floats:
    """Vary contours and two landmarks with deterministic finite perturbations."""
    if not 0 <= seed <= 47:
        raise ValueError("synthetic variation outside supported range")
    rng = np.random.default_rng(404)
    result = symmetric_face(
        width, height, face_width=width * 102 / 175, face_length=height * 148 / 208
    )
    for case in range(seed + 1):
        face = result.copy()
        face[:, 0] = width / 2 + (face[:, 0] - width / 2) * rng.uniform(0.65, 1.1)
        face[:, 1] = height / 2 + (face[:, 1] - height / 2) * rng.uniform(0.7, 1.18)
        for index in rng.choice(list(regions.FACE_OVAL), size=2, replace=False):
            face[index] += rng.normal(0, rng.uniform(0.5, 6), size=2)
    return face


def _head_mask(face: Floats, height: int, width: int) -> NDArray[np.float32]:
    return regions.region_mask(
        "face_oval", face, height, width, normalized=False, supersample=1
    )


def build_case(
    *,
    tone: int = 143,
    seed: int = 3,
    covering: str = "none",
    composition: str = "single",
    orientation: float = 0.0,
    sepia: bool = False,
    monochrome: bool = False,
    rgba: bool = False,
) -> DrawnCase:
    """Draw one face, optionally another silhouette and a marked fabric shape."""
    if tone not in TONES:
        raise ValueError("tone must be from the authored synthetic palette")
    if covering not in {"none", "band", "wrap"}:
        raise ValueError("unknown synthetic covering")
    if composition not in {"single", "two", "three"}:
        raise ValueError("unknown composition")
    if not math.isfinite(orientation) or abs(orientation) > 18:
        raise ValueError("rotation outside fixture range")
    height, width = 208, 175
    face = warped_face(seed, width, height)
    if orientation:
        angle = math.radians(orientation)
        matrix = np.array([[math.cos(angle), -math.sin(angle)],
                           [math.sin(angle), math.cos(angle)]])
        face = (face - [width / 2, height / 2]) @ matrix.T + [width / 2, height / 2]
    oval = _head_mask(face, height, width)
    yy, xx = np.mgrid[0:height, 0:width]
    backdrop = 80 + (xx // 5 % 2) * 110
    image = np.empty((height, width, 3), dtype=np.uint8)
    for channel in range(3):
        image[:, :, channel] = backdrop
    if tone == 143:
        face_texture = np.clip(135 + 40 * np.sin(xx / 10), 0, 255)
    else:
        face_texture = np.clip(tone + 15 * np.sin(xx / 10), 0, 255)
    image[oval >= 0.5] = np.uint8(np.clip(face_texture[oval >= 0.5], 0, 255))[:, None]
    if composition != "single":
        number = 1 if composition == "two" else 2
        for index in range(number):
            cx, cy = width * (0.10 + 0.78 * index), height * (0.68 + 0.08 * index)
            ellipse = ((xx - cx) / 12) ** 2 + ((yy - cy) / 33) ** 2 <= 1.0
            other = ellipse & (oval < 0.5)
            image[other] = (80 + 25 * index, 65 + 15 * index, 50 + 20 * index)
    marked = np.zeros((height, width), dtype=np.float64)
    if covering == "band":
        marked[(oval >= 0.5) & (yy > 49) & (yy < 89)] = 1.0
    elif covering == "wrap":
        sides = (xx < 52) | (xx > 122)
        wrap = (yy < 86) | (sides & (yy < 158))
        marked[(oval >= 0.5) & wrap] = 1.0
    image[marked >= 0.5] = (205, 191, 169)
    if monochrome:
        light = np.uint8(np.rint(np.mean(image.astype(float), axis=2)))
        image[:, :, :] = light[:, :, None]
    if sepia:
        image = np.uint8(np.clip(np.rint(image.astype(float) * [1.08, 0.98, 0.81]), 0, 255))
    if rgba:
        alpha = np.uint8(np.where(yy % 11 == 0, 180, 255))
        image = np.concatenate([image, alpha[..., None]], axis=2)
    return DrawnCase(image, face, oval, marked, f"drawn_{seed}_{tone}_{covering}")


def pad_case(case: DrawnCase, *, pixels: int = 12) -> DrawnCase:
    """Surround the image with unchanged bytes and shift landmarks accordingly."""
    if pixels < 0 or pixels > 30:
        raise ValueError("unsupported padding")
    image = np.pad(case.image, ((pixels, pixels), (pixels, pixels), (0, 0)), mode="edge")
    oval = np.pad(case.oval, pixels)
    covering = np.pad(case.covering, pixels)
    face = case.face + float(pixels)
    return DrawnCase(image, face, oval, covering, case.label + "_padded")
