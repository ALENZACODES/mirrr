"""Drawn r33f shade scenes: a symmetric face, a grey card and optional coloured light.

Synthetic only; the literal values in the r33f tests are shared with the browser
tests in web/test/r33f-*.test.mjs, which draw the same scenes. Author: John Khan.
"""
from __future__ import annotations

import numpy as np

from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade.finder import zone_masks
from plumb_api.engines.shade.reference_study import CASTS

WIDTH, HEIGHT = 160, 192
POINTS = symmetric_face(WIDTH, HEIGHT, face_width=88, face_length=126)
ZONES = zone_masks(POINTS, HEIGHT, WIDTH)
SKIN = (63.0, 13.29, 17.64)  # LG-07N
NEXT_SKIN = (60.0, 13.79, 18.3)  # LG-08N
WARM = CASTS["warm_light_checked_neutral"]
COOL = CASTS["cool_light_checked_neutral"]


def card(size: int = 16) -> np.ndarray:
    """A square card mask with its top-left corner at (4, 4)."""
    mask = np.zeros((HEIGHT, WIDTH), dtype=np.bool_)
    mask[4:4 + size, 4:4 + size] = True
    return mask


def scene(skin: tuple[float, float, float] = SKIN, *, cast: np.ndarray | None = None,
          card_rgb: int = 128, lower_rgb: int | None = None) -> np.ndarray:
    """Grey ground, the 16-pixel card (lower half optionally re-lit), skin zones, then light."""
    image = np.full((HEIGHT, WIDTH, 3), 128, dtype=np.uint8)
    image[4:20, 4:20] = card_rgb
    if lower_rgb is not None:
        image[12:20, 4:20] = lower_rgb
    for mask in ZONES.values():
        image[mask] = cs.to_bytes(cs.lab_to_srgb(np.asarray(skin)))
    return image if cast is None else cs.to_bytes(cs.encode(cs.decode(image) * cast))
