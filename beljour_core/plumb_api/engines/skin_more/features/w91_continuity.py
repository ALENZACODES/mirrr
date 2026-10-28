'W91 neck/chest colour continuity orchestration. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..continuity import (
    apply,
    evaluate,
    lighting_caveat,
    measure,
    plan,
)


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    before_delta_e: float
    after_delta_e: float
    lighting_warning: bool
    body_shape_scored: bool
    passed: bool
    caveat: str

def preview(photo: np.ndarray, source_mask: np.ndarray, target_mask: np.ndarray, amount: float=0.5) -> Result:
    before = measure(photo, source_mask, target_mask)
    p = plan(photo, source_mask, target_mask, amount)
    out = apply(photo, target_mask, p)
    gate = evaluate(photo, out, source_mask, target_mask)
    after = measure(out, source_mask, target_mask)
    return Result(out, before.delta_e, after.delta_e, before.lighting_warning, False, bool(gate['pass']), lighting_caveat(before))

def pass_definition() -> str:
    return 'checked colour gap must not increase; no body-shape score; lighting caveat always present'
