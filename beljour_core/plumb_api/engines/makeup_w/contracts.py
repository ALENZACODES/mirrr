'Contracts for R17B makeup features. Author: John Khan.'
from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

import numpy as np

FEATURES = ('W1', 'W2', 'W4', 'W5', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13', 'W14', 'W16', 'W17', 'W18')
FINISHES = ('cream', 'powder', 'dewy', 'matte', 'skin_tint', 'satin')
LOOKS = ('gallery_glow', 'midnight_line', 'soft_flash', 'velvet_evening')
MAX_PIXELS = 12000000

@dataclass(frozen=True)
class MakeupRequest:
    feature: str
    amount: float = 0.5
    shade: tuple[int, int, int] = (128, 62, 68)
    accent: tuple[int, int, int] = (178, 104, 86)
    finish: str = 'satin'
    face_shape: str = 'balanced'
    undertone: str = 'neutral'
    oxidation_delta: float = 0.0
    season_shift: float = 0.0
    look: str = 'gallery_glow'
    seed: int = 17
    metadata: Mapping[str, Any] = field(default_factory=dict)

@dataclass
class MakeupResult:
    image: np.ndarray
    coverage: np.ndarray
    report: dict[str, Any]

def number(value: Any, name: str, low: float, high: float) -> float:
    if isinstance(value, (str, bool)):
        raise ValueError(f'{name} must be numeric')
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError(f'{name} must be numeric') from exc
    if not math.isfinite(result) or not low <= result <= high:
        raise ValueError(f'{name} must be in {low}..{high}')
    return result

def rgb(value: Any, name: str) -> tuple[int, int, int]:
    if not isinstance(value, Sequence) or isinstance(value, (str, bytes)) or len(value) != 3:
        raise ValueError(f'{name} must be RGB')
    vals = [number(v, name, 0, 255) for v in value]
    if any(v != int(v) for v in vals):
        raise ValueError(f'{name} channels must be integers')
    return (int(vals[0]), int(vals[1]), int(vals[2]))

def parse_request(value: Mapping[str, Any] | MakeupRequest) -> MakeupRequest:
    if isinstance(value, MakeupRequest):
        return value
    if not isinstance(value, Mapping):
        raise ValueError('makeup request must be an object')
    unknown = set(value) - set(MakeupRequest.__dataclass_fields__)
    if unknown:
        raise ValueError(f'unknown makeup fields: {sorted(unknown)}')
    feature = str(value.get('feature', ''))
    if feature not in FEATURES:
        raise ValueError('unsupported makeup feature')
    finish = str(value.get('finish', 'satin'))
    if finish not in FINISHES:
        raise ValueError('unsupported finish')
    look = str(value.get('look', 'gallery_glow'))
    if look not in LOOKS:
        raise ValueError('unsupported original look')
    shape = str(value.get('face_shape', 'balanced'))
    if shape not in {'round', 'oval', 'square', 'heart', 'long', 'balanced'}:
        raise ValueError('unsupported face shape')
    undertone = str(value.get('undertone', 'neutral'))
    if undertone not in {'cool', 'neutral', 'warm', 'olive'}:
        raise ValueError('unsupported undertone')
    seed = number(value.get('seed', 17), 'seed', 0, 2 ** 32 - 1)
    if seed != int(seed):
        raise ValueError('seed must be integer')
    metadata = value.get('metadata', {})
    if not isinstance(metadata, Mapping):
        raise ValueError('metadata must be object')
    return MakeupRequest(feature=feature, amount=number(value.get('amount', 0.5), 'amount', 0, 1), shade=rgb(value.get('shade', (128, 62, 68)), 'shade'), accent=rgb(value.get('accent', (178, 104, 86)), 'accent'), finish=finish, face_shape=shape, undertone=undertone, oxidation_delta=number(value.get('oxidation_delta', 0), 'oxidation_delta', -20, 20), season_shift=number(value.get('season_shift', 0), 'season_shift', -1, 1), look=look, seed=int(seed), metadata=dict(metadata))

def validate_image(image: Any) -> np.ndarray:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8 or image.ndim != 3 or (image.shape[2] not in (3, 4)):
        raise ValueError('photo must be RGB/RGBA uint8')
    h, w = image.shape[:2]
    if min(h, w) < 16 or h * w > MAX_PIXELS:
        raise ValueError('photo size outside supported range')
    return image

def validate_mask(mask: Any, shape: tuple[int, int], name: str) -> np.ndarray:
    value = np.asarray(mask, dtype=np.float64)
    if value.shape != shape or not np.all(np.isfinite(value)) or np.any(value < 0) or np.any(value > 1):
        raise ValueError(f'{name} must be finite HxW values 0..1')
    return value.copy()
