'W78 cosmetic self-tan preview. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..complexion import apply_tan, tan_plan
from ..masking import outside_change_fraction


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    style: str
    opacity: float
    dry_multiplier: float
    outside_fraction: float
    passed: bool
    warning: str

def preview(photo: np.ndarray, body_mask: np.ndarray, dry_mask: np.ndarray, style: str='medium', amount: float=0.5) -> Result:
    plan = tan_plan(style, amount)
    out = apply_tan(photo, body_mask, dry_mask, plan)
    outside = outside_change_fraction(photo, out, body_mask)
    passed = outside <= 0.001 and 0 <= plan.opacity <= 0.2
    return Result(out, style, plan.opacity, plan.dry_zone_multiplier, outside, passed, plan.warning)

def pass_definition() -> str:
    return 'no unmasked change, dry zones receive no more colour than surrounding skin, no UV/health claim'
