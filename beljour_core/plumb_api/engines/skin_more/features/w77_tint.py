'W77 sheer skin tint orchestration. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..colorimetry import robust_region_colour
from ..complexion import apply_tint, tint_plan
from ..texture import texture_gate


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    target_rgb: tuple[int, int, int]
    opacity: float
    texture_score: float
    passed: bool
    notes: tuple[str, ...]

def preview(photo: np.ndarray, face_mask: np.ndarray, target_rgb: tuple[int, int, int], style: str='sheer', amount: float=0.5) -> Result:
    base = robust_region_colour(photo, face_mask)
    source = (int(round(base.rgb[0])), int(round(base.rgb[1])), int(round(base.rgb[2])))
    plan = tint_plan(source, target_rgb, style, amount)
    out = apply_tint(photo, face_mask, plan)
    gate = texture_gate(photo, out, face_mask, 0.72)
    return Result(out, plan.target_rgb, plan.opacity, float(gate['score']), bool(gate['pass']), (plan.warning, 'No skin-tone ranking or lightening objective.'))

def pass_definition() -> str:
    return 'texture score >=0.72, bounded sheer opacity, alpha unchanged, zero-strength identity'
