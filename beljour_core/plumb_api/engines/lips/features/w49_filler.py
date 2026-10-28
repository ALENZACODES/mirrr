'W49 filler-dose-style appearance consultation. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..anatomy import measure, plausibility_cap
from ..engine import render


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    style_label: str
    applied_amount: float
    actual_ml_claim: bool
    adult_confirmed: bool
    passed: bool
    warning: str

def preview(photo: np.ndarray, points: np.ndarray, style_label: str='0.5_ml_style', amount: float=0.5, adult_confirmed: bool=False) -> Result:
    if not adult_confirmed:
        raise PermissionError('18+ confirmation required for W49')
    style_for_cap = 'natural_plump' if style_label == '0.5_ml_style' else 'vertical_lift'
    applied = min(amount, plausibility_cap(measure(points), style_for_cap))
    result = render(photo, points, {'feature': 'W49', 'style': style_label, 'amount': applied, 'adult_confirmed': True})
    warning = 'Style label is a visual reference only; it is not a claim that a real injection volume produces this result.'
    return Result(result.image, style_label, applied, False, True, applied <= amount + 1e-09, warning)

def pass_definition() -> str:
    return 'adult gate; dose names are style labels only; no real mL-to-outcome claim'
