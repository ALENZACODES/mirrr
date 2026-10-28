"""Drawn bearded faces for the beard-removal tests, with the drawn hair as known truth.

Starts from the arena's code-drawn face (arena/synthetic.py: skin oval on the symmetric
landmark mesh, seeded grain, drawn freckles and moles) and draws a beard on it with the
local strand renderer (engines/beard/strands.py: stubble or short boxed, any length and
density); the renderer's strand coverage is returned as the truth. "full" instead covers
the whole beard area with near-opaque hair, the case removal must refuse. No photo,
dataset or model. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ...arena.synthetic import drawn_face
from ..beard.regions import area
from ..beard.strands import render

HAIR = "#2a1e18"
FULL_HAIR = (42, 30, 24)


@dataclass(frozen=True)
class BeardFace:
    image: NDArray[np.uint8]
    clean: NDArray[np.uint8]        # the same face before the beard was drawn
    points: NDArray[np.float64]
    hair: NDArray[np.float64]       # drawn hair coverage 0..1
    area: NDArray[np.bool_]         # the beard area of the mesh
    tone: str


def bearded_face(tone: str = "medium", *, style: str = "stubble", length: int = 2, density: int = 3,
                 seed: int = 1, width: int = 200, height: int = 240) -> BeardFace:
    face = drawn_face(tone, seed=seed, width=width, height=height)
    zone = area(face.points, height, width).hard >= 0.5
    if style == "full":
        image = face.image.astype(np.float64)
        image[zone] = image[zone] * 0.08 + np.array(FULL_HAIR) * 0.92
        return BeardFace(np.rint(image).astype(np.uint8), face.image, face.points, zone.astype(np.float64) * 0.92, zone, tone)
    drawn = render(face.image, face.points, style=style, length=length, density=density, colour=HAIR, seed=seed)
    return BeardFace(drawn.image, face.image, face.points, np.asarray(drawn.alpha, dtype=np.float64), zone, tone)
