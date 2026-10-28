'W45 fuller-lips shape consultation. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..anatomy import measure, plausibility_cap, style_weights
from ..engine import render


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    upper_ratio: float
    lower_ratio: float
    applied_amount: float
    adult_confirmed: bool
    passed: bool
    copy: str

def preview(photo: np.ndarray, points: np.ndarray, amount: float=0.4, style: str='natural_plump', adult_confirmed: bool=False) -> Result:
    if not adult_confirmed:
        raise PermissionError('18+ confirmation required for W45')
    anatomy = measure(points)
    cap = min(amount, plausibility_cap(anatomy, style))
    weights = style_weights(style)
    result = render(photo, points, {'feature': 'W45', 'style': style, 'amount': cap, 'adult_confirmed': True})
    passed = cap <= amount + 1e-09 and 'simulation' in str(result.report['label']).lower()
    return Result(result.image, (weights.cupid + weights.upper_lateral) / 2.0, (weights.lower_centre + weights.lower_lateral) / 2.0, cap, True, passed, 'Consultation simulation only; no volume or medical outcome guarantee.')

def pass_definition() -> str:
    return 'adult confirmation, bounded geometry, exact identity at zero, simulation label'
