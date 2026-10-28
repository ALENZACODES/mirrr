'Validated contracts for R16B Skin & More simulations. Author: John Khan.'

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

import numpy as np

FEATURES = tuple(f'W{i}' for i in range(77, 93))

LOCAL_ONLY = {'W83'}

MANUAL_MASK_FEATURES = {'W79', 'W80', 'W81', 'W82', 'W85', 'W86', 'W87', 'W88', 'W90', 'W91'}

STYLE_MAP = {'W77': ('sheer', 'light', 'medium'), 'W78': ('light', 'medium', 'dark', 'olive'), 'W79': ('match_face', 'match_neck', 'match_chest'), 'W80': ('mineral_cast', 'tinted_cast', 'clear_finish'), 'W81': ('orange_corrector', 'peach_corrector', 'conceal_only'), 'W82': ('green_micro', 'neutralise', 'sensitivity_first'), 'W83': ('cycle', 'irregular', 'perimenopause', 'menopause'), 'W84': ('dewy_base', 'satin_base', 'powder_minimal'), 'W85': ('earrings', 'necklace', 'both'), 'W86': ('soft_round', 'angular', 'low_bridge'), 'W87': ('nude', 'berry', 'red', 'plum'), 'W88': ('soft_drape', 'structured_drape', 'wrapped'), 'W89': ('date_night', 'interview', 'wedding_guest'), 'W90': ('preserve', 'faux_subtle', 'faux_visible'), 'W91': ('jaw_to_neck', 'neck_to_chest', 'continuity'), 'W92': ('texture_first', 'satin', 'minimal_powder')}

LABEL = 'Local cosmetic simulation. Appearance preview only; no medical diagnosis, treatment, SPF efficacy, or health prediction.'

VERSION = 'skin-more-r16b/1'

MAX_PIXELS = 4194304

@dataclass(frozen=True)
class RegionMask:
    name: str
    points: tuple[tuple[float, float], ...]

@dataclass(frozen=True)
class SkinMoreRequest:
    feature: str
    amount: float = 0.5
    style: str = ''
    colour: tuple[int, int, int] = (173, 112, 89)
    secondary_colour: tuple[int, int, int] = (99, 73, 63)
    undertone: str = 'neutral'
    skin_depth: float = 0.5
    preserve_texture: float = 1.0
    masks: tuple[RegionMask, ...] = ()
    diary_values: tuple[float, ...] = ()
    consent_local_health_data: bool = False
    seed: int = 17
    metadata: Mapping[str, Any] = field(default_factory=dict)

@dataclass
class SkinMoreResult:
    image: np.ndarray
    coverage: np.ndarray
    report: dict[str, Any]

def number(v: Any, name: str, lo: float, hi: float) -> float:
    if isinstance(v, (bool, str)):
        raise ValueError(f'{name} must be numeric')
    try:
        o = float(v)
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError(f'{name} must be numeric') from exc
    if not math.isfinite(o) or not lo <= o <= hi:
        raise ValueError(f'{name} must be in {lo}..{hi}')
    return o

def rgb(v: Any, name: str) -> tuple[int, int, int]:
    if not isinstance(v, (tuple, list)) or len(v) != 3:
        raise ValueError(f'{name} must have 3 channels')
    a = tuple(number(x, name, 0, 255) for x in v)
    if any(int(x) != x for x in a):
        raise ValueError(f'{name} channels must be integers')
    return (int(a[0]), int(a[1]), int(a[2]))

def region(v: Any) -> RegionMask:
    if isinstance(v, RegionMask):
        return v
    if not isinstance(v, Mapping) or set(v) - {'name', 'points'}:
        raise ValueError('invalid region mask')
    name = str(v.get('name', ''))
    if not name or len(name) > 48:
        raise ValueError('region name required')
    points = v.get('points')
    if not isinstance(points, (list, tuple)) or not 3 <= len(points) <= 256:
        raise ValueError('region needs 3..256 points')
    out = []
    for p in points:
        if not isinstance(p, (list, tuple)) or len(p) != 2:
            raise ValueError('region points must be x,y')
        out.append((number(p[0], 'region x', 0, 1), number(p[1], 'region y', 0, 1)))
    return RegionMask(name, tuple(out))

def parse_request(v: Mapping[str, Any] | SkinMoreRequest) -> SkinMoreRequest:
    if isinstance(v, SkinMoreRequest):
        return v
    if not isinstance(v, Mapping):
        raise ValueError('skin-more request must be object')
    unknown = set(v) - set(SkinMoreRequest.__dataclass_fields__)
    if unknown:
        raise ValueError(f'unknown skin-more fields: {sorted(unknown)}')
    feature = str(v.get('feature', ''))
    style = str(v.get('style', '') or '')
    if feature not in FEATURES:
        raise ValueError('unsupported Skin & More feature')
    if style and style not in STYLE_MAP[feature]:
        raise ValueError('unsupported style')
    masks = v.get('masks', ())
    if not isinstance(masks, (tuple, list)) or len(masks) > 32:
        raise ValueError('too many masks')
    parsed = tuple(region(x) for x in masks)
    if feature in MANUAL_MASK_FEATURES and (not parsed):
        raise ValueError('this feature requires a checked local region annotation')
    diary = v.get('diary_values', ())
    if not isinstance(diary, (tuple, list)) or len(diary) > 366:
        raise ValueError('diary too long')
    values = tuple(number(x, 'diary value', 0, 1) for x in diary)
    consent = v.get('consent_local_health_data', False)
    if not isinstance(consent, bool):
        raise ValueError('consent_local_health_data must be boolean')
    if feature == 'W83' and (not consent):
        raise PermissionError('local health-data diary requires explicit consent')
    seed = number(v.get('seed', 17), 'seed', 0, 2 ** 32 - 1)
    return SkinMoreRequest(feature=feature, amount=number(v.get('amount', 0.5), 'amount', 0, 1), style=style, colour=rgb(v.get('colour', (173, 112, 89)), 'colour'), secondary_colour=rgb(v.get('secondary_colour', (99, 73, 63)), 'secondary_colour'), undertone=str(v.get('undertone', 'neutral')), skin_depth=number(v.get('skin_depth', 0.5), 'skin_depth', 0, 1), preserve_texture=number(v.get('preserve_texture', 1), 'preserve_texture', 0.5, 1), masks=parsed, diary_values=values, consent_local_health_data=consent, seed=int(seed), metadata=dict(v.get('metadata', {})))

def validate_photo(image: Any) -> np.ndarray:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8 or image.ndim != 3 or (image.shape[2] not in (3, 4)):
        raise ValueError('photo must be uint8 RGB/RGBA')
    h, w = image.shape[:2]
    if min(h, w) < 8 or h * w > MAX_PIXELS:
        raise ValueError('photo size unsupported')
    return image
