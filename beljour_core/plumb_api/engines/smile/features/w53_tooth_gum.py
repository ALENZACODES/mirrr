'W53 checked tooth/gum character design. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

from ..contracts import SmileAnnotation
from ..tooth_gum import gum_line, tooth_character
from ._shared import render_feature, require


@dataclass(frozen=True)
class Result:
    image: object
    gum_line_amplitude: float
    tooth_sections: int
    treatment_recommendation: bool
    passed: bool
    note: str

def preview(photo, annotation: SmileAnnotation, style: str='soft', amount: float=0.5, adult_confirmed: bool=False) -> Result:
    if not adult_confirmed:
        raise PermissionError('18+ confirmation required for W53')
    require(annotation, 'teeth', 'gum')
    guide = gum_line(annotation, amount)
    character = tooth_character(annotation, style, amount)
    out = render_feature(photo, 'W53', annotation, amount, True)
    passed = len(character) == 8 and guide.amplitude >= 0
    return Result(out, guide.amplitude, len(character), False, passed, guide.label)

def pass_definition() -> str:
    return 'checked gum+teeth only; character remains editable; no tissue-removal/treatment recommendation'
