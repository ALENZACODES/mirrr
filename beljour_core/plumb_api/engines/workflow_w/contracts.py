'Workflow contracts and validation. Author: John Khan.'
from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

FEATURES = ('W94', 'W96', 'W99', 'W100')

@dataclass(frozen=True)
class WorkflowRequest:
    feature: str
    city: str = ''
    service: str = ''
    price_low: float = 0.0
    price_high: float = 0.0
    sessions: int = 1
    maintenance_weeks: int = 8
    occasion: str = ''
    look_id: str = ''
    depth: float = 0.0
    undertone: str = 'neutral'
    hair_base: str = ''
    allergens: tuple[str, ...] = ()
    measured_on: str = ''
    metadata: Mapping[str, Any] = field(default_factory=dict)

def _number(value: Any, name: str, low: float, high: float) -> float:
    if isinstance(value, (bool, str)):
        raise ValueError(f'{name} must be numeric')
    try:
        out = float(value)
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError(f'{name} must be numeric') from exc
    if not math.isfinite(out) or not low <= out <= high:
        raise ValueError(f'{name} outside range')
    return out

def parse(value: Mapping[str, Any] | WorkflowRequest) -> WorkflowRequest:
    if isinstance(value, WorkflowRequest):
        return value
    if not isinstance(value, Mapping):
        raise ValueError('workflow request must be object')
    unknown = set(value) - set(WorkflowRequest.__dataclass_fields__)
    if unknown:
        raise ValueError(f'unknown workflow fields: {sorted(unknown)}')
    feature = str(value.get('feature', ''))
    if feature not in FEATURES:
        raise ValueError('unsupported workflow feature')
    sessions = _number(value.get('sessions', 1), 'sessions', 1, 24)
    weeks = _number(value.get('maintenance_weeks', 8), 'maintenance_weeks', 1, 104)
    if sessions != int(sessions) or weeks != int(weeks):
        raise ValueError('sessions/weeks must be integers')
    allergens = value.get('allergens', ())
    if not isinstance(allergens, Sequence) or isinstance(allergens, (str, bytes)):
        raise ValueError('allergens must be list')
    meta = value.get('metadata', {})
    if not isinstance(meta, Mapping):
        raise ValueError('metadata must be object')
    return WorkflowRequest(feature=feature, city=str(value.get('city', ''))[:80], service=str(value.get('service', ''))[:120], price_low=_number(value.get('price_low', 0), 'price_low', 0, 100000), price_high=_number(value.get('price_high', 0), 'price_high', 0, 100000), sessions=int(sessions), maintenance_weeks=int(weeks), occasion=str(value.get('occasion', ''))[:80], look_id=str(value.get('look_id', ''))[:120], depth=_number(value.get('depth', 0), 'depth', 0, 100), undertone=str(value.get('undertone', 'neutral'))[:20], hair_base=str(value.get('hair_base', ''))[:60], allergens=tuple(str(x)[:80] for x in allergens[:32]), measured_on=str(value.get('measured_on', ''))[:32], metadata=dict(meta))
