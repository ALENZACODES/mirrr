'W84 mature-skin mode with pro-age texture retention. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..texture import bounded_microcontrast, pro_age_profile, texture_gate


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    style: str
    texture_score: float
    line_blur: float
    anti_age_claim: bool
    passed: bool

def preview(photo: np.ndarray, mask: np.ndarray, style: str='texture_first', amount: float=0.5) -> Result:
    profile = pro_age_profile(style)
    out = bounded_microcontrast(photo, mask, amount * float(profile['microcontrast']) * 10)
    gate = texture_gate(photo, out, mask, 0.78)
    return Result(out, style, float(gate['score']), float(profile['line_blur']), False, bool(gate['pass']) and float(profile['line_blur']) == 0)

def pass_definition() -> str:
    return 'texture score >=0.78, zero line blur, no younger/anti-age claim'
