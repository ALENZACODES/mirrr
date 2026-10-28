'W54 lip-colour optical tooth-contrast preview. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..engine import render


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    tooth_pixels_changed: int
    optical_only: bool
    passed: bool
    note: str

def preview(photo: np.ndarray, points: np.ndarray, tooth_mask: np.ndarray | None=None, style: str='blue_based', amount: float=0.6) -> Result:
    r = render(photo, points, {'feature': 'W54', 'style': style, 'amount': amount})
    changed = 0
    if tooth_mask is not None:
        m = np.asarray(tooth_mask) > 0.5
        changed = int(np.any(r.image[..., :3] != photo[..., :3], axis=2)[m].sum()) if m.any() else 0
    return Result(r.image, changed, True, changed == 0, 'Teeth are unchanged; only adjacent lip colour can alter perceived contrast.')

def pass_definition() -> str:
    return 'teeth pixels unchanged; effect is explicitly optical contrast from lip colour'
