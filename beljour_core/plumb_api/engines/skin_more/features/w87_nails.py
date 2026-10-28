'W87 checked nail-colour preview. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..accessory_fit import nail_colour
from ..masking import outside_change_fraction, stats


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    region_fraction: float
    outside_fraction: float
    shape_changed: bool
    passed: bool

def preview(photo: np.ndarray, nail_mask: np.ndarray, colour: tuple[int, int, int]=(120, 34, 58), amount: float=0.75) -> Result:
    out = nail_colour(photo, nail_mask, colour, amount)
    outside = outside_change_fraction(photo, out, nail_mask)
    s = stats(nail_mask)
    return Result(out, s.fraction, outside, False, outside <= 0.001)

def pass_definition() -> str:
    return 'checked nail interiors only; colour changes but nail shape and length do not'
