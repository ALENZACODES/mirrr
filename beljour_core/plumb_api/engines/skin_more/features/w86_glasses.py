'W86 procedural glasses guide without face-shape judgement. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..accessory_fit import apply_checked_colour, fit_report, glasses_geometry


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    style: str
    symmetry: float
    scale_ratio: float
    flaw_score: None
    passed: bool

def preview(photo: np.ndarray, style: str='soft_round', scale: float=1, colour: tuple[int, int, int]=(48, 44, 42), amount: float=0.9) -> Result:
    h, w = photo.shape[:2]
    mask = glasses_geometry(h, w, style, scale)
    out = apply_checked_colour(photo, mask, colour, amount)
    r = fit_report('W86', mask, 0.42)
    return Result(out, style, r.symmetry, r.scale_ratio, None, r.outside_fraction <= 0.001)

def pass_definition() -> str:
    return 'procedural frame stays local to guide geometry; no face-shape flaw/ranking language'
