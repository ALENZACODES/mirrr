"""Drawn hair with known grey strands, for the grey removal and Grey Transition tests.

A skin-toned background (standing in for the face beside the hair) and a hair area of
wavy strands: each strand follows a seeded sine path, has a lighter centre and darker
edges, and is drawn either in a natural shade or, for a chosen share of the strands, in a
low-chroma silver; the gaps between strands mix the two in the same share. Later strands
cover earlier ones, and the truth follows the strand drawn last at each pixel. Returns the
photo, the hair mask she would mark (the hair area) and the grey-strand truth. No photo,
dataset or model. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

NATURAL_SHADES = {"dark_brown": (74, 50, 36), "chestnut": (118, 72, 44), "black": (36, 30, 28), "dark_blonde": (150, 116, 76)}
SILVER = (196, 194, 190)
SKIN = (186, 140, 112)


@dataclass(frozen=True)
class GreyHair:
    image: NDArray[np.uint8]
    mask: NDArray[np.float64]        # the hair she marks
    grey: NDArray[np.bool_]          # pixels of drawn grey strands
    pigmented: NDArray[np.bool_]     # pixels of drawn natural strands
    shade: str


def grey_hair(shade: str = "dark_brown", *, grey_share: float = 0.3, seed: int = 1, width: int = 120,
              height: int = 96) -> GreyHair:
    if shade not in NATURAL_SHADES:
        raise ValueError(f"shade must be one of {', '.join(NATURAL_SHADES)}")
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[:height, :width].astype(np.float64)
    image = np.empty((height, width, 3))
    image[:] = SKIN
    hair = (xx >= 10) & (xx < width - 10) & (yy >= 8) & (yy < height - 8)
    natural = np.array(NATURAL_SHADES[shade], dtype=np.float64)
    silver = np.array(SILVER, dtype=np.float64)
    image[hair] = ((1 - grey_share) * natural + grey_share * silver) * 0.7
    owner = np.full((height, width), -1)
    greys: list[bool] = []
    x = 10.0
    while x < width - 10:
        phase, amp = rng.uniform(0, 2 * np.pi), rng.uniform(1.0, 2.5)
        distance = np.abs(xx - (x + amp * np.sin(yy / 6.0 + phase)))
        strand = hair & (distance <= 1.4)
        is_grey = bool(rng.uniform() < grey_share)
        shading = (1.1 - 0.25 * distance)[..., None]
        image[strand] = np.clip((silver if is_grey else natural) * shading[strand], 0, 255)
        owner[strand] = len(greys)
        greys.append(is_grey)
        x += 3.0
    drawn = owner >= 0
    grey = drawn & np.asarray(greys + [False])[owner]
    return GreyHair(np.rint(image).astype(np.uint8), hair.astype(np.float64), grey, drawn & ~grey, shade)
