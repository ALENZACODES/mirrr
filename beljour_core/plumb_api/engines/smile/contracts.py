'Validated contracts for R16B smile and dental consultation simulations. Author: John Khan.'

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

import numpy as np

FEATURES = ('W50', 'W51', 'W52', 'W53', 'W58')

ADULT_FEATURES = set(FEATURES)

LABEL = 'Adult consultation simulation. Dental geometry is user-annotated and approximate; no diagnosis or treatment recommendation.'

VERSION = 'smile-r16b/1'

MAX_PIXELS = 4194304

@dataclass(frozen=True)
class SmileAnnotation:
    teeth: tuple[tuple[float, float], ...]
    gum: tuple[tuple[float, float], ...] = ()
    midline_x: float | None = None

@dataclass(frozen=True)
class SmileRequest:
    feature: str
    amount: float = 0.5
    style: str = ''
    adult_confirmed: bool = False
    tooth_shade: tuple[int, int, int] = (232, 225, 207)
    gum_shade: tuple[int, int, int] = (155, 83, 91)
    annotation: SmileAnnotation | None = None
    frame_annotations: tuple[SmileAnnotation, ...] = ()
    seed: int = 17
    metadata: Mapping[str, Any] = field(default_factory=dict)

@dataclass
class SmileResult:
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
    if not isinstance(v, (list, tuple)) or len(v) != 3:
        raise ValueError(f'{name} must have 3 channels')
    vals = tuple(number(x, name, 0, 255) for x in v)
    if any(int(x) != x for x in vals):
        raise ValueError(f'{name} channels must be integers')
    return (int(vals[0]), int(vals[1]), int(vals[2]))

def annotation(v: Any) -> SmileAnnotation:
    if isinstance(v, SmileAnnotation):
        return v
    if not isinstance(v, Mapping):
        raise ValueError('annotation required')
    unknown = set(v) - {'teeth', 'gum', 'midline_x'}
    if unknown:
        raise ValueError('unknown annotation field')

    def poly(x: Any, name: str, minimum: int) -> tuple[tuple[float, float], ...]:
        if x in (None, ()):
            return ()
        if not isinstance(x, (list, tuple)) or not minimum <= len(x) <= 128:
            raise ValueError(f'{name} requires {minimum}..128 points')
        out = []
        for p in x:
            if not isinstance(p, (list, tuple)) or len(p) != 2:
                raise ValueError(f'{name} points must be x,y')
            out.append((number(p[0], f'{name} x', 0, 1), number(p[1], f'{name} y', 0, 1)))
        return tuple(out)
    mid = v.get('midline_x')
    return SmileAnnotation(poly(v.get('teeth'), 'teeth', 3), poly(v.get('gum'), 'gum', 0), None if mid is None else number(mid, 'midline_x', 0, 1))

def parse_request(v: Mapping[str, Any] | SmileRequest) -> SmileRequest:
    if isinstance(v, SmileRequest):
        return v
    if not isinstance(v, Mapping):
        raise ValueError('smile request must be object')
    unknown = set(v) - set(SmileRequest.__dataclass_fields__)
    if unknown:
        raise ValueError(f'unknown smile fields: {sorted(unknown)}')
    feature = str(v.get('feature', ''))
    if feature not in FEATURES:
        raise ValueError('unsupported smile feature')
    adult = v.get('adult_confirmed', False)
    if adult is not True:
        raise PermissionError('18+ confirmation required for dental consultation simulation')
    ann = None if v.get('annotation') is None else annotation(v['annotation'])
    if feature != 'W58' and ann is None:
        raise ValueError('checked teeth annotation required; automatic dental segmentation is intentionally not used')
    frames = v.get('frame_annotations', ())
    if not isinstance(frames, (tuple, list)) or len(frames) > 240:
        raise ValueError('frame annotation list too large')
    parsed_frames = tuple(annotation(x) for x in frames)
    if feature == 'W58' and len(parsed_frames) < 2:
        raise ValueError('W58 needs at least two checked frame annotations')
    seed = number(v.get('seed', 17), 'seed', 0, 2 ** 32 - 1)
    return SmileRequest(feature=feature, amount=number(v.get('amount', 0.5), 'amount', 0, 1), style=str(v.get('style', '') or ''), adult_confirmed=True, tooth_shade=rgb(v.get('tooth_shade', (232, 225, 207)), 'tooth_shade'), gum_shade=rgb(v.get('gum_shade', (155, 83, 91)), 'gum_shade'), annotation=ann, frame_annotations=parsed_frames, seed=int(seed), metadata=dict(v.get('metadata', {})))

def validate_photo(image: Any) -> np.ndarray:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8 or image.ndim != 3 or (image.shape[2] not in (3, 4)):
        raise ValueError('photo must be uint8 RGB/RGBA')
    h, w = image.shape[:2]
    if min(h, w) < 8 or h * w > MAX_PIXELS:
        raise ValueError('photo size outside supported range')
    return image
