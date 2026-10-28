'W56 lipstick wear-off simulation. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..geometry import lip_mask
from ..shaders import blend_colour
from ..wear import centre_retention, field, monotonic_wear


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    scenario: str
    centre_retention: float
    deterministic: bool
    monotonic: bool
    passed: bool

def preview(photo: np.ndarray, points: np.ndarray, name: str='coffee', amount: float=0.6, seed: int=17) -> Result:
    mask = lip_mask(photo.shape[0], photo.shape[1], points)
    worn = field(mask, name, seed)
    out = blend_colour(photo, worn, (145, 52, 71), amount, 1)
    deterministic = bool(np.array_equal(worn, field(mask, name, seed)))
    monotonic = bool(monotonic_wear(mask, seed)['monotonic'])
    retained = centre_retention(mask, worn)
    return Result(out, name, retained, deterministic, monotonic, deterministic and monotonic)

def pass_definition() -> str:
    return 'same seed/scenario deterministic; stronger wear never increases retained colour'
