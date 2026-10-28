'W89 editable occasion bundles. Author: John Khan.'

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, replace


@dataclass(frozen=True)
class Bundle:
    id: str
    complexion: float
    lip: float
    eye: float
    brow: float
    jewellery: float
    copy: str
    assumptions: tuple[str, ...]

_BUNDLES = {'interview': Bundle('interview', 0.16, 0.1, 0.08, 0.08, 0, 'Restrained starting point; appearance is not competence.', ('User can change every control.',)), 'date_night': Bundle('date_night', 0.25, 0.32, 0.28, 0.18, 0.18, 'Optional stronger colour starting point; no gendered requirement.', ('Context label describes a preset, not a rule.',)), 'wedding_guest': Bundle('wedding_guest', 0.24, 0.24, 0.22, 0.16, 0.2, 'Editable guest look; avoids bridal-role assumptions.', ('Lighting and dress colour are not inferred.',)), 'everyday': Bundle('everyday', 0.12, 0.12, 0.1, 0.1, 0, 'Low-intensity editable starting point.', ('No default is treated as more natural or better.',))}

def bundle(name: str) -> Bundle:
    if name not in _BUNDLES:
        raise ValueError('unsupported occasion bundle')
    return _BUNDLES[name]

def validate_value(value: float) -> float:
    v = float(value)
    if not 0 <= v <= 1:
        raise ValueError('bundle control must be in [0,1]')
    return v

def edit(name: str, changes: Mapping[str, float]) -> Bundle:
    base = bundle(name)
    allowed = {'complexion', 'lip', 'eye', 'brow', 'jewellery'}
    unknown = set(changes) - allowed
    if unknown:
        raise ValueError(f'unknown bundle controls: {sorted(unknown)}')
    values = {key: validate_value(value) for key, value in changes.items()}
    return Bundle(id=base.id, complexion=values.get('complexion', base.complexion), lip=values.get('lip', base.lip), eye=values.get('eye', base.eye), brow=values.get('brow', base.brow), jewellery=values.get('jewellery', base.jewellery), copy=base.copy, assumptions=base.assumptions)

def scale(b: Bundle, amount: float) -> Bundle:
    a = validate_value(amount)
    return replace(b, complexion=b.complexion * a, lip=b.lip * a, eye=b.eye * a, brow=b.brow * a, jewellery=b.jewellery * a)

def serialise(b: Bundle) -> dict[str, object]:
    return {'id': b.id, 'complexion': b.complexion, 'lip': b.lip, 'eye': b.eye, 'brow': b.brow, 'jewellery': b.jewellery, 'copy': b.copy, 'assumptions': list(b.assumptions), 'editable': True}

def competence_claim(b: Bundle) -> bool:
    return False

def compare(a: Bundle, b: Bundle) -> dict[str, float]:
    return {name: getattr(b, name) - getattr(a, name) for name in ('complexion', 'lip', 'eye', 'brow', 'jewellery')}

def catalogue() -> list[dict[str, object]]:
    return [serialise(_BUNDLES[key]) for key in sorted(_BUNDLES)]

def all_editable() -> bool:
    return all(row['editable'] is True for row in catalogue())
