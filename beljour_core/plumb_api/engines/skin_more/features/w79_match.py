'W79 face/body colour continuity orchestration. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..colorimetry import compare_regions
from ..complexion import face_body_match
from ..masking import outside_change_fraction


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    before_delta_e: float
    after_delta_e: float
    outside_fraction: float
    passed: bool
    lighting_note: str

def preview(photo: np.ndarray, face_mask: np.ndarray, body_mask: np.ndarray, amount: float=0.5) -> Result:
    before = compare_regions(photo, face_mask, body_mask)
    out, metrics = face_body_match(photo, face_mask, body_mask, amount)
    after = compare_regions(out, face_mask, body_mask)
    outside = outside_change_fraction(photo, out, body_mask)
    passed = after.delta_e76 <= before.delta_e76 + 1e-06 and outside <= 0.001
    note = 'One-photo comparison only; lighting may create apparent differences.'
    return Result(out, before.delta_e76, after.delta_e76, outside, passed, note)

def pass_definition() -> str:
    return 'checked target region only and perceptual colour gap must not increase'
