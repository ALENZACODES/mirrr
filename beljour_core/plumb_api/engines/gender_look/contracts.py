'Gender-look contracts. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np


@dataclass(frozen=True)
class GenderLookRequest:
    direction: str = 'feminine'
    level: str = 'normal'
    amount: float = 0.5

def parse(value: dict[str, Any] | GenderLookRequest) -> GenderLookRequest:
    if isinstance(value, GenderLookRequest):
        return value
    if not isinstance(value, dict):
        raise ValueError('request must be object')
    direction = str(value.get('direction', 'feminine'))
    level = str(value.get('level', 'normal'))
    amount = value.get('amount', 0.5)
    if direction not in {'feminine', 'masculine', 'neutral'}:
        raise ValueError('unsupported direction')
    if level not in {'normal', 'extra', 'hyper'}:
        raise ValueError('unsupported level')
    if not isinstance(amount, (int, float)) or isinstance(amount, bool) or (not 0 <= float(amount) <= 1):
        raise ValueError('amount must be 0..1')
    return GenderLookRequest(direction, level, float(amount))

def mask(value: Any, shape: tuple[int, int], name: str) -> np.ndarray:
    a = np.asarray(value, dtype=np.float64)
    if a.shape != shape or not np.all(np.isfinite(a)) or np.any(a < 0) or np.any(a > 1):
        raise ValueError(f'{name} invalid')
    return a.copy()
