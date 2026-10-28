"""Shared drawn fixtures for the r27f tests: faces, hair blocks and colour patches.

Everything here is drawn from numbers; no photographs, landmarks of real people or
product data. Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np

from plumb_api.engines.core import regions
from plumb_api.engines.menshair import HairAnchors
from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade.finder import zone_masks

HEIGHT, WIDTH = 192, 160
POINTS = symmetric_face(WIDTH, HEIGHT, face_width=88, face_length=126)
OVAL = regions.region_mask("face_oval", POINTS, HEIGHT, WIDTH, normalized=False, supersample=2) >= 0.5
ZONES = zone_masks(POINTS, HEIGHT, WIDTH)
HEAD = HairAnchors.parse({
    "left_temple": (.28, .34), "right_temple": (.72, .34), "crown": (.5, .11),
    "left_ear": (.24, .59), "right_ear": (.76, .59), "nape": (.5, .83),
})


def skin_lab(lightness: float, hue: float = 53.0, chroma: float = 17.0) -> np.ndarray:
    angle = math.radians(hue)
    return np.array([lightness, chroma * math.cos(angle), chroma * math.sin(angle)])


def drawn_face(lightness: float, *, hue: float = 53.0, chroma: float = 17.0,
               background: tuple[int, int, int] = (128, 128, 128)) -> np.ndarray:
    """A flat skin oval on a plain background, with the symmetric mesh POINTS."""
    image = np.empty((HEIGHT, WIDTH, 3), dtype=np.uint8)
    image[:] = background
    image[OVAL] = cs.to_bytes(cs.lab_to_srgb(skin_lab(lightness, hue, chroma)))
    return image


def cast_zone(image: np.ndarray, zone: str, gains: tuple[float, float, float]) -> np.ndarray:
    """The same face with one W6 zone under a linear-light colour cast."""
    out = image.copy()
    mask = ZONES[zone]
    out[mask] = cs.to_bytes(cs.encode(cs.decode(out[mask]) * np.asarray(gains)))
    return out


def hair_block(hair: tuple[int, int, int], *, detail: int = 3, scalp: tuple[int, int, int] = (188, 146, 112),
               alpha: int = 255) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """(RGBA photo, hair region, visible scalp) as uint8 masks; ``detail`` adds strand stripes."""
    image = np.empty((96, 96, 4), dtype=np.uint8)
    image[..., :3] = (205, 177, 145)
    image[..., 3] = alpha
    region = np.zeros((96, 96), dtype=np.uint8)
    region[12:62, 22:74] = 255
    image[12:62, 22:74, :3] = hair
    xx = np.mgrid[0:96, 0:96][1]
    image[12:62, 22:74, 1] = np.clip(image[12:62, 22:74, 1].astype(np.int64)
                                     + (xx[12:62, 22:74] // 2) % (detail + 1), 0, 255).astype(np.uint8)
    show = np.zeros_like(region)
    show[39:59, 28:69] = 255
    image[39:59, 28:69, :3] = scalp
    return image, region, show


def colour_patch(hair: tuple[int, int, int], *, card: tuple[int, int, int] = (150, 150, 150),
                 cast: tuple[float, float, float] = (1.0, 1.0, 1.0)) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """(RGBA photo, hair mask, neutral card mask) under one linear-light cast."""
    image = np.empty((40, 60, 4), dtype=np.uint8)
    image[..., :3] = (120, 120, 120)
    image[..., 3] = 255
    image[5:35, 2:20, :3] = card
    image[5:35, 25:55, :3] = hair
    image[5:35, 25:55, 1] = np.clip(image[5:35, 25:55, 1].astype(np.int64) + np.arange(30) % 3, 0, 255)
    image[..., :3] = cs.to_bytes(cs.encode(cs.decode(image[..., :3]) * np.asarray(cast)))
    hair_mask = np.zeros((40, 60), dtype=np.uint8)
    hair_mask[5:35, 25:55] = 255
    card_mask = np.zeros((40, 60), dtype=bool)
    card_mask[5:35, 2:20] = True
    return image, hair_mask, card_mask
