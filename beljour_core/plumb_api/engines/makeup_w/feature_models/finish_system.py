'Finish, oxidation and minimal-product planning for R17B makeup. Author: John Khan.'
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class FinishPlan:
    finish: str
    smoothing: float
    highlight: float
    powder: float
    coverage: float
    texture_floor: float

def _unit(value: float, name: str) -> float:
    if not math.isfinite(value):
        raise ValueError(f'{name} must be finite')
    return min(1.0, max(0.0, value))

def finish_plan(name: str, amount: float) -> FinishPlan:
    a = _unit(amount, 'amount')
    table = {'cream': (0.1, 0.08, 0.0, 0.34, 0.84), 'powder': (0.26, 0.0, 0.36, 0.38, 0.74), 'dewy': (0.08, 0.3, 0.0, 0.26, 0.86), 'matte': (0.24, 0.0, 0.42, 0.34, 0.72), 'skin_tint': (0.06, 0.05, 0.0, 0.18, 0.9)}
    if name not in table:
        raise ValueError('unsupported finish')
    smoothing, highlight, powder, coverage, floor = table[name]
    return FinishPlan(name, smoothing * a, highlight * a, powder * a, coverage * a, max(floor, 1.0 - (1.0 - floor) * a))

def minimal_product_plan(amount: float, concerns: tuple[str, ...]) -> dict[str, object]:
    a = _unit(amount, 'amount')
    allowed = {'under_eye', 'redness', 'shine', 'lip', 'brow', 'none'}
    if any(item not in allowed for item in concerns):
        raise ValueError('unsupported concern')
    steps: list[dict[str, object]] = []
    if 'under_eye' in concerns:
        steps.append({'area': 'under_eye', 'coverage': 0.16 + 0.18 * a, 'optional': True})
    if 'redness' in concerns:
        steps.append({'area': 'checked_redness', 'coverage': 0.1 + 0.15 * a, 'optional': True})
    if 'shine' in concerns:
        steps.append({'area': 'centre_face', 'finish': 'localized_matte', 'amount': 0.12 + 0.2 * a})
    if 'lip' in concerns:
        steps.append({'area': 'lip', 'finish': 'sheer', 'amount': 0.1 + 0.25 * a})
    if 'brow' in concerns:
        steps.append({'area': 'brow', 'finish': 'soft_tint', 'amount': 0.1 + 0.18 * a})
    return {'steps': tuple(steps), 'product_count_estimate': len(steps), 'label': 'minimum-product appearance plan; every step is optional'}

def oxidation_timeline(delta_l: float, delta_chroma: float, hours: int=8) -> tuple[dict[str, float | str], ...]:
    if not all(math.isfinite(v) for v in (delta_l, delta_chroma)):
        raise ValueError('oxidation inputs must be finite')
    count = max(1, min(int(hours), 12))
    rows: list[dict[str, float | str]] = []
    for hour in range(count + 1):
        progress = 0.0 if hour == 0 else 1.0 - 2.0 ** (-hour / 1.8)
        rows.append({'hour': float(hour), 'delta_l_estimate': delta_l * progress, 'delta_chroma_estimate': delta_chroma * progress, 'label': 'estimate from user-entered formula behaviour'})
    return tuple(rows)

def seasonal_mix(depth_shift: float, self_tan: float) -> dict[str, float | str]:
    if not math.isfinite(depth_shift) or not math.isfinite(self_tan):
        raise ValueError('mix inputs must be finite')
    shift = min(1.0, max(-1.0, depth_shift + 0.35 * _unit(self_tan, 'self_tan')))
    deeper = 0.5 + 0.45 * shift
    deeper = min(0.95, max(0.05, deeper))
    return {'lighter_ratio': 1.0 - deeper, 'deeper_ratio': deeper, 'effective_shift': shift, 'label': 'mixing estimate; verify the result on skin in current lighting'}
