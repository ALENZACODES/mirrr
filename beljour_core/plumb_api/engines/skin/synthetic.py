"""Drawn test faces for the skin tools, with known ground truth.

Starts from the arena's code-drawn face (arena/synthetic.py: skin-toned oval on the
symmetric landmark mesh, seeded grain, drawn freckles and moles at known places) and adds
two drawn patches at known face coordinates: a smooth red blotch on the subject's right
cheek (for Even tone) and a smooth pale shine spot on the left cheek (for Matte). No
photo, dataset or model is involved. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .common import frame

BLOTCH = (-0.55, 0.62, 0.30)      # (a, b, radius) in IOD units: subject's right cheek
SHINE = (0.55, 0.55, 0.22)        # subject's left cheek
BLOTCH_RGB = (1.10, 0.90, 0.92)   # per-channel gain at the blotch centre: redder, not lighter
SHINE_MIX = 0.35                  # share of near-white mixed in at the shine centre


@dataclass(frozen=True)
class SkinFace:
    image: NDArray[np.uint8]
    points: NDArray[np.float64]
    marks: tuple[tuple[float, float, float], ...]
    blotch: tuple[float, float, float]   # image x, y, radius in pixels
    shine: tuple[float, float, float]


def skin_face(tone: str = "medium", *, seed: int = 3, width: int = 200, height: int = 240,
              blotch: bool = True, shine: bool = True) -> SkinFace:
    from plumb_api.arena.synthetic import drawn_face

    base = drawn_face(tone, seed=seed, width=width, height=height)
    face = frame(base.points)
    img = base.image.astype(np.float64)
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    spots = []
    for (a, b, r), on in ((BLOTCH, blotch), (SHINE, shine)):
        x, y = face.point(a, b)
        rad = r * face.iod
        spots.append((x, y, rad))
        if not on:
            continue
        bump = np.exp(-((xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2) / (2 * (rad / 2) ** 2))
        if (a, b, r) == BLOTCH:
            img *= 1 + (np.asarray(BLOTCH_RGB) - 1)[None, None, :] * bump[..., None]
        else:
            img = img * (1 - SHINE_MIX * bump[..., None]) + 245.0 * SHINE_MIX * bump[..., None]
    out = np.clip(np.rint(img), 0, 255).astype(np.uint8)
    return SkinFace(out, base.points, base.marks, spots[0], spots[1])
