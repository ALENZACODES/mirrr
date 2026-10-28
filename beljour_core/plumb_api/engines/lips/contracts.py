'Validated contracts for R16B lip simulations. Author: John Khan.'

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

import numpy as np

FEATURES = ('W45', 'W46', 'W47', 'W48', 'W49', 'W54', 'W55', 'W56', 'W57')

ADULT_FEATURES = {'W45', 'W47', 'W48', 'W49'}

STYLES = {'W45': ('natural_plump', 'cupid_focus', 'keyhole', 'vertical_lift'), 'W46': ('balanced', 'cupid_only', 'soft_outer'), 'W47': ('healed', 'fresh', 'month_6', 'month_12', 'month_18'), 'W48': ('rest', 'smile'), 'W49': ('0.5_ml_style', '1.0_ml_style'), 'W54': ('blue_based', 'neutral', 'warm_based'), 'W55': ('matte', 'satin', 'gloss', 'stain'), 'W56': ('two_hours', 'coffee', 'meal'), 'W57': ('sheer', 'medium', 'opaque')}

LABEL = 'Local lip simulation. Cosmetic or consultation preview only; not a predicted clinical result.'

MAX_PIXELS = 4194304

VERSION = 'lips-r16b/1'

@dataclass(frozen=True)
class LipRequest:
    feature: str
    amount: float = 0.5
    style: str = ''
    colour: tuple[int, int, int] = (155, 55, 75)
    liner_colour: tuple[int, int, int] = (103, 42, 55)
    shine: float = 0.25
    feather: float = 0.18
    preserve_texture: float = 1.0
    adult_confirmed: bool = False
    daylight: float = 0.5
    two_tone_balance: float = 0.5
    seed: int = 17
    metadata: Mapping[str, Any] = field(default_factory=dict)

@dataclass
class LipResult:
    image: np.ndarray
    coverage: np.ndarray
    report: dict[str, Any]

def number(v: Any, name: str, lo: float, hi: float) -> float:
    if isinstance(v, (bool, str)):
        raise ValueError(f'{name} must be numeric')
    try:
        out = float(v)
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError(f'{name} must be numeric') from exc
    if not math.isfinite(out) or not lo <= out <= hi:
        raise ValueError(f'{name} must be in {lo}..{hi}')
    return out

def rgb(v: Any, name: str) -> tuple[int, int, int]:
    if not isinstance(v, (tuple, list)) or len(v) != 3:
        raise ValueError(f'{name} must have 3 channels')
    vals = tuple(number(x, name, 0, 255) for x in v)
    if any(int(x) != x for x in vals):
        raise ValueError(f'{name} channels must be integers')
    return (int(vals[0]), int(vals[1]), int(vals[2]))

def parse_request(v: Mapping[str, Any] | LipRequest) -> LipRequest:
    if isinstance(v, LipRequest):
        return v
    if not isinstance(v, Mapping):
        raise ValueError('lip request must be an object')
    unknown = set(v) - set(LipRequest.__dataclass_fields__)
    if unknown:
        raise ValueError(f'unknown lip request fields: {sorted(unknown)}')
    feature = str(v.get('feature', ''))
    if feature not in FEATURES:
        raise ValueError('unsupported lip feature')
    style = str(v.get('style', '') or '')
    if style and style not in STYLES[feature]:
        raise ValueError('unsupported style for lip feature')
    adult = v.get('adult_confirmed', False)
    if not isinstance(adult, bool):
        raise ValueError('adult_confirmed must be boolean')
    if feature in ADULT_FEATURES and (not adult):
        raise PermissionError('18+ confirmation required for consultation preview')
    seed = number(v.get('seed', 17), 'seed', 0, 2 ** 32 - 1)
    if seed != int(seed):
        raise ValueError('seed must be integer')
    metadata = v.get('metadata', {})
    if not isinstance(metadata, Mapping):
        raise ValueError('metadata must be an object')
    return LipRequest(feature=feature, amount=number(v.get('amount', 0.5), 'amount', 0, 1), style=style, colour=rgb(v.get('colour', (155, 55, 75)), 'colour'), liner_colour=rgb(v.get('liner_colour', (103, 42, 55)), 'liner_colour'), shine=number(v.get('shine', 0.25), 'shine', 0, 1), feather=number(v.get('feather', 0.18), 'feather', 0, 1), preserve_texture=number(v.get('preserve_texture', 1), 'preserve_texture', 0.5, 1), adult_confirmed=adult, daylight=number(v.get('daylight', 0.5), 'daylight', 0, 1), two_tone_balance=number(v.get('two_tone_balance', 0.5), 'two_tone_balance', 0, 1), seed=int(seed), metadata=dict(metadata))

def validate_photo(image: Any) -> np.ndarray:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8:
        raise ValueError('photo must be uint8 ndarray')
    if image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError('photo must be RGB/RGBA')
    h, w = image.shape[:2]
    if min(h, w) < 8 or h * w > MAX_PIXELS:
        raise ValueError('photo size outside supported range')
    return image

def validate_points(points: Any) -> np.ndarray:
    a = np.asarray(points, dtype=np.float64)
    if a.shape not in ((468, 2), (478, 2)):
        raise ValueError('468 or 478 normalized landmarks required')
    if not np.all(np.isfinite(a)) or np.any(a < -0.25) or np.any(a > 1.25):
        raise ValueError('invalid landmark coordinates')
    return a.copy()
