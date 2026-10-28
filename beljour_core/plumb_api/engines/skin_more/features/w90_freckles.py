'W90 preserve-or-faux freckle orchestration. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..freckles import FreckleSpec, apply, preserve, reproducible


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    faux: bool
    deterministic: bool
    mark_count: int
    passed: bool
    label: str

def preview(photo: np.ndarray, mask: np.ndarray, style: str='preserve', amount: float=0.4, seed: int=0) -> Result:
    if style == 'preserve':
        out, m = preserve(photo)
        return Result(out, False, True, 0, bool(np.array_equal(out, photo)), str(m['label']))
    spec = FreckleSpec(density=amount, seed=seed)
    out, m = apply(photo, mask, spec)
    mark_count = m.get('mark_count', 0)
    deterministic = reproducible(mask, spec)
    return Result(out, True, deterministic, int(mark_count) if isinstance(mark_count, (int, float)) else 0, deterministic, str(m.get('label', 'Faux freckles simulation.')))

def pass_definition() -> str:
    return 'preserve mode exact identity; faux mode deterministic for same seed and labelled simulation'
