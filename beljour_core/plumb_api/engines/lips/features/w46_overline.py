'W46 realistic lip overline guide. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..engine import render
from ..geometry import edge_ring, lip_mask


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    guide_fraction: float
    outside_lip_fraction: float
    passed: bool
    note: str

def preview(photo: np.ndarray, points: np.ndarray, amount: float=0.4, style: str='balanced') -> Result:
    base = lip_mask(photo.shape[0], photo.shape[1], points)
    guide = edge_ring(base, 2)
    r = render(photo, points, {'feature': 'W46', 'style': style, 'amount': amount})
    fraction = float(np.mean(guide > 0.01))
    outside = float(np.mean((r.coverage > 0.01) & (base < 0.01)))
    passed = fraction > 0 and outside < 0.08
    return Result(r.image, fraction, outside, passed, 'Guide follows the existing lip edge and intentionally limits extension beyond it.')

def pass_definition() -> str:
    return 'guide hugs existing vermilion edge and overline stays bounded'
