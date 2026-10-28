"""Drawn smiling faces for the teeth tests: an open mouth with known teeth, gaps and tongue.

Starts from the arena's code-drawn face (arena/synthetic.py: skin-toned oval on the
symmetric landmark mesh, seeded grain, drawn freckles and moles), opens the inner lips
on the mesh by a share of the mouth width (a gap of zero squashes them shut), and paints
the opening: an upper band of teeth in a chosen shade with darker gaps between them, a red
tongue below, and a dark mouth interior. No photo, dataset or model.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ...arena.synthetic import drawn_face
from ..core import regions

TEETH_SHADES = {"white": (236, 232, 222), "ivory": (226, 212, 182), "yellowish": (212, 190, 142),
                "greyish": (178, 174, 166)}
TONGUE = (150, 70, 72)
INTERIOR = (44, 24, 26)


@dataclass(frozen=True)
class SmileFace:
    image: NDArray[np.uint8]
    points: NDArray[np.float64]
    teeth: NDArray[np.bool_]       # drawn tooth pixels (gaps excluded)
    gaps: NDArray[np.bool_]        # drawn dark lines between teeth
    tongue: NDArray[np.bool_]
    tone: str


def smile_face(tone: str = "medium", *, teeth: str = "yellowish", gap: float = 0.3, seed: int = 1,
               width: int = 200, height: int = 240) -> SmileFace:
    if teeth not in TEETH_SHADES:
        raise ValueError(f"teeth must be one of {', '.join(TEETH_SHADES)}")
    face = drawn_face(tone, seed=seed, width=width, height=height)
    points = face.points.copy()
    top, bottom = points[13, 1], points[14, 1]
    centre = (top + bottom) / 2
    mouth = float(np.linalg.norm(points[291] - points[61]))
    for index in regions.LIPS_INNER:
        if gap <= 0:
            points[index, 1] = centre + 0.05 * (points[index, 1] - centre)
        elif points[index, 1] < centre - 1e-6 or index == 13:
            points[index, 1] -= gap * mouth / 2
        elif points[index, 1] > centre + 1e-6 or index == 14:
            points[index, 1] += gap * mouth / 2
    image = face.image.copy()
    blank = np.zeros(image.shape[:2], dtype=bool)
    if gap <= 0:
        return SmileFace(image, points, blank, blank.copy(), blank.copy(), tone)
    opening = regions.region_mask("mouth_opening", points, height, width, normalized=False) >= 0.5
    yy, xx = np.mgrid[:height, :width]
    rows = np.nonzero(opening.any(axis=1))[0]
    split = rows[0] + 0.55 * (rows[-1] - rows[0] + 1)
    band = opening & (yy < split)
    gaps = band & ((xx - int(points[13, 0])) % 7 == 0)
    tongue = opening & (yy >= split + 2)
    image[opening] = INTERIOR
    image[band] = TEETH_SHADES[teeth]
    image[gaps] = (np.array(TEETH_SHADES[teeth]) * 0.45).astype(np.uint8)
    image[tongue] = TONGUE
    return SmileFace(image, points, band & ~gaps, gaps, tongue, tone)
