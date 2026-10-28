'W50 gum-show comparison geometry, using checked annotations only. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .annotations import AnnotationStats, stats
from .contracts import SmileAnnotation


@dataclass(frozen=True)
class GumShowComparison:
    current_ratio: float
    lip_emphasis_ratio: float
    gum_line_emphasis_ratio: float
    tooth_length_emphasis_ratio: float
    static_only: bool
    warning: str

def ratio(annotation: SmileAnnotation) -> float:
    measured = stats(annotation)
    if measured.gum_height <= 0:
        return 0.0
    return measured.gum_height / max(measured.tooth_height, 1e-08)

def compare(annotation: SmileAnnotation, amount: float) -> GumShowComparison:
    if not 0.0 <= amount <= 1.0:
        raise ValueError('amount must be in 0..1')
    current = ratio(annotation)
    lip = current * (1.0 - 0.22 * amount)
    gum = current * (1.0 - 0.38 * amount)
    tooth = current * (1.0 - 0.18 * amount)
    return GumShowComparison(current_ratio=current, lip_emphasis_ratio=lip, gum_line_emphasis_ratio=gum, tooth_length_emphasis_ratio=tooth, static_only=True, warning='Causes of gum show vary. A front photograph cannot diagnose jaw, lip, tooth or gum causes.')

def colour_emphasis(mask: np.ndarray, amount: float) -> np.ndarray:
    if mask.ndim != 2:
        raise ValueError('gum support must be two-dimensional')
    return np.clip(mask.astype(np.float64) * amount * 0.18, 0.0, 0.18).astype(np.float32)

def acceptance(annotation: SmileAnnotation, comparison: GumShowComparison) -> dict[str, float | bool | str]:
    measured: AnnotationStats = stats(annotation)
    return {'checked_tooth_area': measured.tooth_area, 'checked_gum_area': measured.gum_area, 'current_ratio': comparison.current_ratio, 'static_only': comparison.static_only, 'diagnosis': False, 'passed': measured.tooth_area > 0 and measured.gum_area > 0 and comparison.static_only, 'pass_definition': 'Checked teeth and gum polygons; static label; no diagnostic or causal claim.'}
