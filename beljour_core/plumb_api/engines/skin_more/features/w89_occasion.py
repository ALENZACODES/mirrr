'W89 editable context bundle orchestration. Author: John Khan.'

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

from ..occasion import competence_claim, edit, scale, serialise


@dataclass(frozen=True)
class Result:
    recipe: dict[str, object]
    editable: bool
    competence_claim: bool
    passed: bool

def plan(name: str='everyday', amount: float=1, changes: Mapping[str, float] | None=None) -> Result:
    b = edit(name, changes or {})
    b = scale(b, amount)
    data = serialise(b)
    return Result(data, True, competence_claim(b), bool(data['editable']) and (not competence_claim(b)))

def pass_definition() -> str:
    return 'all bundle controls editable; interview preset never equates makeup with competence'
