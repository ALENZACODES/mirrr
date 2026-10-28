'W47 lip tint/blush healed-state consultation. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..engine import render
from ..pmu import deep_lip_disclosure, pigment_colour, state


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    state: str
    saturation: float
    opacity: float
    adult_confirmed: bool
    disclosures: tuple[str, ...]
    passed: bool

def preview(photo: np.ndarray, points: np.ndarray, state_name: str='healed', amount: float=0.5, adult_confirmed: bool=False) -> Result:
    if not adult_confirmed:
        raise PermissionError('18+ confirmation required for W47')
    display = state(state_name)
    colour = pigment_colour((145, 72, 79), display)
    result = render(photo, points, {'feature': 'W47', 'style': state_name, 'amount': amount, 'adult_confirmed': True, 'colour': colour})
    notes = tuple(deep_lip_disclosure(0.5, None))
    passed = 0 <= display.pigment_strength <= 1 and 0 <= display.saturation_scale <= 1.2
    return Result(result.image, state_name, display.saturation_scale, display.pigment_strength, True, notes, passed)

def pass_definition() -> str:
    return 'adult gate, healed/fade states monotonic, no permanence guarantee'
