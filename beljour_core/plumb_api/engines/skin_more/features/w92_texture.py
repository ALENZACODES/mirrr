'W92 texture-first mature beauty orchestration. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..texture import bounded_microcontrast, texture_gate


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    texture_score: float
    edge_retention: float
    anti_age_claim: bool
    passed: bool
    copy: str

def preview(photo: np.ndarray, mask: np.ndarray, amount: float=0.4) -> Result:
    out = bounded_microcontrast(photo, mask, amount)
    gate = texture_gate(photo, out, mask, 0.8)
    copy = 'Texture-first preview: lines, pores and changing lip/brow detail remain part of the result.'
    return Result(out, float(gate['score']), float(gate['edge_retention']), False, bool(gate['pass']), copy)

def pass_definition() -> str:
    return 'texture score >=0.80, no line erasure objective, no anti-ageing claim'
