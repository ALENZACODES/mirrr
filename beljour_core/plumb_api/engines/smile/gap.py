'W52 diastema keep/partial/visual-close geometry. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .annotations import bounds
from .contracts import SmileAnnotation


@dataclass(frozen=True)
class GapPlan:
    mode: str
    original_width: float
    displayed_width: float
    reduction_fraction: float
    midline_x: float | None
    midline_error: float | None
    label: str

MODES = {'keep': 0.0, 'partial': 0.45, 'visual_close': 0.82}

def estimate_gap_width(annotation: SmileAnnotation) -> float:
    x0, _, x1, _ = bounds(annotation.teeth)
    return (x1 - x0) / 8.0 * 0.32

def plan(annotation: SmileAnnotation, mode: str, amount: float) -> GapPlan:
    if mode not in MODES:
        raise ValueError('unsupported gap choice')
    if not 0.0 <= amount <= 1.0:
        raise ValueError('amount must be in 0..1')
    original = estimate_gap_width(annotation)
    reduction = MODES[mode] * amount
    displayed = original * (1.0 - reduction)
    x0, _, x1, _ = bounds(annotation.teeth)
    centre = (x0 + x1) / 2.0
    error = None if annotation.midline_x is None else abs(centre - annotation.midline_x)
    label = {'keep': 'Keep my gap', 'partial': 'Partly close the checked central display gap', 'visual_close': 'Visually close the checked central display gap'}[mode]
    return GapPlan(mode, original, displayed, reduction, annotation.midline_x, error, label)

def edit_band(width: int, height: int, annotation: SmileAnnotation, plan_value: GapPlan) -> np.ndarray:
    if width < 8 or height < 8:
        raise ValueError('image is too small for gap preview')
    x0, y0, x1, y1 = bounds(annotation.teeth)
    centre = (x0 + x1) / 2.0
    half = max(plan_value.displayed_width / 2.0, 1.0 / width)
    xs = (np.arange(width) + 0.5) / width
    ys = (np.arange(height) + 0.5) / height
    x, y = np.meshgrid(xs, ys)
    return ((np.abs(x - centre) <= half) & (y >= y0) & (y <= y1)).astype(np.float32)

def acceptance(plan_value: GapPlan) -> dict[str, object]:
    return {'mode': plan_value.mode, 'keep_first_class': True, 'beauty_score': False, 'reduction_fraction': plan_value.reduction_fraction, 'midline_error': plan_value.midline_error, 'passed': plan_value.mode in MODES and 0.0 <= plan_value.reduction_fraction <= 0.82}
