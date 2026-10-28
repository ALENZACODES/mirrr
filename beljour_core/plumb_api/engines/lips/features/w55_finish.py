'W55 lipstick finish system. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..finish import apply, line_energy, texture_retention
from ..geometry import lip_mask


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    finish: str
    line_energy_ratio: float
    texture_retention: float
    passed: bool

def preview(photo: np.ndarray, points: np.ndarray, style: str='matte', amount: float=0.6) -> Result:
    mask = lip_mask(photo.shape[0], photo.shape[1], points)
    out, _, _ = apply(photo, mask, (155, 55, 75), style, amount)
    before = line_energy(photo, mask)
    after = line_energy(out, mask)
    ratio = after / max(before, 1e-06)
    retained = texture_retention(photo, out, mask)
    return Result(out, style, ratio, retained, 0.35 <= ratio <= 2.2 and retained >= 0.45)

def pass_definition() -> str:
    return 'finish changes reflectance/colour while retaining measured lip texture'
