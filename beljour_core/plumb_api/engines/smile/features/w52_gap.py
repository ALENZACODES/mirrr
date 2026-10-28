'W52 checked tooth-gap visual preference preview. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

from ..contracts import SmileAnnotation
from ..gap import acceptance, plan
from ._shared import render_feature, require


@dataclass(frozen=True)
class Result:
    image: object
    mode: str
    before_width: float
    expected_width: float
    reduction_fraction: float
    orthodontic_claim: bool
    passed: bool

def preview(photo, annotation: SmileAnnotation, mode: str='keep', amount: float=0.5, adult_confirmed: bool=False) -> Result:
    if not adult_confirmed:
        raise PermissionError('18+ confirmation required for W52')
    require(annotation, 'teeth')
    display = plan(annotation, mode, amount)
    out = render_feature(photo, 'W52', annotation, amount, True)
    gate = acceptance(display)
    return Result(out, mode, display.original_width, display.displayed_width, display.reduction_fraction, False, bool(gate['passed']))

def pass_definition() -> str:
    return 'keep option remains first-class; visual closure is bounded; no orthodontic treatment claim'
