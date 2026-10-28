'W85 procedural jewellery scale guide. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..accessory_fit import apply_checked_colour, fit_report, jewellery_geometry


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    scale_ratio: float
    symmetry: float
    millimetre_claim: bool
    passed: bool
    warning: str

def preview(photo: np.ndarray, style: str='both', scale: float=1, colour: tuple[int, int, int]=(180, 145, 74), amount: float=0.7) -> Result:
    h, w = photo.shape[:2]
    mask = jewellery_geometry(h, w, style, scale)
    out = apply_checked_colour(photo, mask, colour, amount)
    r = fit_report('W85', mask, 0.4)
    return Result(out, r.scale_ratio, r.symmetry, False, r.outside_fraction <= 0.001, r.warning)

def pass_definition() -> str:
    return 'procedural asset only, image-relative scale unless calibrated, no product-weight or fit guarantee'
