'W88 checked scarf-colour preview with hair protection. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..accessory_fit import hijab_colour


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    hair_changed_fraction: float
    hair_reveal: bool
    cultural_review_required: bool
    release_ready: bool
    passed: bool

def preview(photo: np.ndarray, scarf_mask: np.ndarray, hair_mask: np.ndarray, colour: tuple[int, int, int]=(74, 91, 122), amount: float=0.55, cultural_review_complete: bool=False) -> Result:
    out, m = hijab_colour(photo, scarf_mask, hair_mask, colour, amount)
    passed = float(m['hair_changed_fraction']) == 0 and (not bool(m['hair_reveal']))
    return Result(out, float(m['hair_changed_fraction']), False, True, passed and cultural_review_complete, passed)

def pass_definition() -> str:
    return 'hair-protected pixels unchanged; no reveal/removal; cultural co-design remains separate release gate'
