'W80 visual sunscreen-cast preview with no efficacy claim. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..complexion import spf_cast_preview
from ..masking import outside_change_fraction


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    visual_cast_before: float
    visual_cast_after: float
    outside_fraction: float
    efficacy_claim: str
    passed: bool

def preview(photo: np.ndarray, mask: np.ndarray, style: str='mineral_cast', amount: float=0.5) -> Result:
    out, metrics = spf_cast_preview(photo, photo.shape[1], photo.shape[0], mask, style, amount) if False else (None, None)
    from ..complexion import spf_cast_preview as run
    out, metrics = run(photo, mask, style, amount)
    outside = outside_change_fraction(photo, out, mask)
    passed = outside <= 0.001 and metrics['efficacy_claim'] == 'none'
    return Result(out, float(metrics['visual_cast_before']), float(metrics['visual_cast_after']), outside, str(metrics['efficacy_claim']), passed)

def pass_definition() -> str:
    return 'visual cast only inside checked region; explicit zero SPF/UV efficacy claim'
