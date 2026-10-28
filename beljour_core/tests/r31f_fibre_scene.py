"""Drawn r31f fibre scene: a striped hair block with a visible scalp patch; no photographs.

The same scene is drawn in web/test/helpers/r31f-fibre-scene.mjs, so the literal values
asserted by the r31f tests are shared by Python and the browser. Author: John Khan.
"""
from __future__ import annotations

import numpy as np

from plumb_api.engines.concealer.shade_support import FibreReading
from plumb_api.engines.hair_palette.catalogue import require_shade
from plumb_api.engines.menshair import HairAnchors

SIZE = 96
HAIR_RGB = (70, 52, 40)
SCALP_RGB = (196, 154, 124)
GROUND_RGB = (205, 177, 145)
SWATCH = "natural-04-n"
HEAD = HairAnchors.parse({
    "left_temple": (.28, .34), "right_temple": (.72, .34), "crown": (.5, .11),
    "left_ear": (.24, .59), "right_ear": (.76, .59), "nape": (.5, .83),
})


def scene(alpha: bool = False) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """(photo, hair region, visible scalp): uint8 masks of 0/255, hair rows 12..61."""
    image = np.empty((SIZE, SIZE, 4 if alpha else 3), dtype=np.uint8)
    image[..., :3] = GROUND_RGB
    if alpha:
        image[..., 3] = 255
    region = np.zeros((SIZE, SIZE), dtype=np.uint8)
    region[12:62, 22:74] = 255
    image[12:62, 22:74, :3] = HAIR_RGB
    xx = np.arange(SIZE)[None, :].repeat(SIZE, axis=0)
    image[12:62, 22:74, 1] += ((xx[12:62, 22:74] // 2) % 4).astype(np.uint8)
    scalp = np.zeros_like(region)
    scalp[39:59, 28:69] = 255
    image[39:59, 28:69, :3] = SCALP_RGB
    return image, region, scalp


def readings(offsets: tuple[float, ...] = (-0.3, 0.3), mode: str = "neutral",
             swatch: str = SWATCH) -> list[FibreReading]:
    """Corrected readings near one catalogue swatch, offset in L* only."""
    lab = require_shade(swatch).lab
    return [FibreReading((lab[0] + d, lab[1], lab[2]), mode) for d in offsets]
