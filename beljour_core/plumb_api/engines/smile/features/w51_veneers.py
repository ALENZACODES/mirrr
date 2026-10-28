'W51 checked veneer-design preview without automatic segmentation. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..contracts import SmileAnnotation
from ..veneers import cells, shade_delta, shade_warning
from ._shared import render_feature, require


@dataclass(frozen=True)
class Result:
    image: object
    tooth_cells: int
    character: str
    shade_delta: float
    model_used: bool
    passed: bool
    warnings: tuple[str, ...]

def preview(photo, annotation: SmileAnnotation, shape_style: str='soft', amount: float=0.5, adult_confirmed: bool=False) -> Result:
    if not adult_confirmed:
        raise PermissionError('18+ confirmation required for W51')
    require(annotation, 'teeth')
    sections = cells(annotation, 8, shape_style)
    target = (232, 225, 207)
    delta = shade_delta(np.asarray(photo)[..., :3], target)
    out = render_feature(photo, 'W51', annotation, amount, True)
    warnings = tuple(shade_warning(target))
    return Result(out, len(sections), shape_style, delta, False, len(sections) == 8, warnings)

def pass_definition() -> str:
    return 'checked teeth only, no segmentation model, bounded shape/shade, no clinical material outcome claim'
