'W50 checked gummy-smile appearance consultation. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

from ..contracts import SmileAnnotation
from ..gummy import acceptance, compare
from ._shared import render_feature, require


@dataclass(frozen=True)
class Result:
    image: object
    before_ratio: float
    after_ratio: float
    adult_confirmed: bool
    diagnostic: bool
    passed: bool
    copy: str

def preview(photo, annotation: SmileAnnotation, amount: float=0.4, adult_confirmed: bool=False) -> Result:
    if not adult_confirmed:
        raise PermissionError('18+ confirmation required for W50')
    require(annotation, 'gum', 'teeth')
    comparison = compare(annotation, amount)
    gate = acceptance(annotation, comparison)
    out = render_feature(photo, 'W50', annotation, amount, True)
    note = 'Static checked-region comparison only; it does not diagnose a cause or recommend treatment.'
    return Result(out, comparison.current_ratio, comparison.gum_line_emphasis_ratio, True, False, bool(gate['passed']), note)

def pass_definition() -> str:
    return 'adult gate; checked gum/teeth only; bounded appearance reduction; no diagnosis/treatment recommendation'
