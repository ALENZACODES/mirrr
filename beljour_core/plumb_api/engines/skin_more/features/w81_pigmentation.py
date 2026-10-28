'W81 user-marked deeper-pigmentation cosmetic correction. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..complexion import apply_correction, deeper_pigmentation_plan
from ..masking import outside_change_fraction


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    opacity: float
    outside_fraction: float
    diagnostic: bool
    passed: bool
    copy: str

def preview(photo: np.ndarray, checked_mask: np.ndarray, style: str='orange_corrector', amount: float=0.5) -> Result:
    plan = deeper_pigmentation_plan(style, amount)
    out = apply_correction(photo, checked_mask, plan)
    outside = outside_change_fraction(photo, out, checked_mask)
    copy = 'Cosmetic preview on a user-marked region; this does not identify or diagnose pigmentation conditions.'
    return Result(out, plan.opacity, outside, plan.diagnostic, outside <= 0.001 and (not plan.diagnostic), copy)

def pass_definition() -> str:
    return 'checked region only, bounded cosmetic correction, and no diagnosis'
