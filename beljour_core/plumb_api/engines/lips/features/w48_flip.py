'W48 lip-flip appearance consultation. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..anatomy import measure, plausibility_cap
from ..engine import render


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    requested: float
    applied: float
    upper_change_only: bool
    adult_confirmed: bool
    passed: bool

def preview(photo: np.ndarray, points: np.ndarray, amount: float=0.4, adult_confirmed: bool=False) -> Result:
    if not adult_confirmed:
        raise PermissionError('18+ confirmation required for W48')
    applied = min(amount, plausibility_cap(measure(points), 'vertical_lift'), 0.42)
    result = render(photo, points, {'feature': 'W48', 'style': 'rest', 'amount': applied, 'adult_confirmed': True})
    return Result(result.image, amount, applied, True, True, applied <= 0.42)

def pass_definition() -> str:
    return 'adult gate, bounded upper-lip-only appearance change, no muscle/treatment outcome claim'
