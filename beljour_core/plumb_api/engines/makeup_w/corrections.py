'Colour-correction planning without diagnosis. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CorrectionPlan:
    issue: str
    corrector: tuple[int, int, int]
    opacity: float
    placement: str
    note: str

def plan(issue: str, skin_depth: float, undertone: str) -> CorrectionPlan:
    depth = max(0.0, min(float(skin_depth), 1.0))
    if issue == 'under_eye':
        base = (150, 88, 65) if depth >= 0.55 else (181, 119, 96)
        return CorrectionPlan(issue, base, 0.1 + 0.16 * depth, 'thin crescent below orbital area', 'appearance correction only; no diagnosis')
    if issue == 'redness':
        green = (75, 103, 73) if depth >= 0.55 else (104, 131, 96)
        return CorrectionPlan(issue, green, 0.05 + 0.09 * (1 - depth), 'user-marked redness area', 'appearance correction only; no diagnosis')
    if issue == 'discolouration':
        if undertone == 'olive':
            colour = (143, 103, 70)
        elif undertone == 'cool':
            colour = (159, 92, 80)
        else:
            colour = (151, 99, 74)
        return CorrectionPlan(issue, colour, 0.08 + 0.12 * depth, 'user-marked discolouration area', 'appearance correction only; no diagnosis')
    raise ValueError('unsupported correction issue')

def blend_order(plans: tuple[CorrectionPlan, ...]) -> tuple[CorrectionPlan, ...]:
    priority = {'under_eye': 0, 'discolouration': 1, 'redness': 2}
    return tuple(sorted(plans, key=lambda item: priority[item.issue]))
