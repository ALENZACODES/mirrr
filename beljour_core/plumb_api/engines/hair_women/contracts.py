'Typed contracts for R17B women hair previews. Author: John Khan.'
from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

import numpy as np

FEATURES = ('W19', 'W20', 'W21', 'W22', 'W23', 'W24', 'W25', 'W26', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34', 'W35', 'W36', 'W37', 'W38', 'W40', 'W41', 'W42', 'W43', 'W44')
LABEL = 'Local hair simulation. Preview or estimate only; not a guaranteed salon or medical outcome.'
MAX_PIXELS = 12000000

@dataclass(frozen=True)
class HairRequest:
    feature: str
    amount: float = 0.5
    colour: tuple[int, int, int] = (92, 58, 40)
    accent: tuple[int, int, int] = (176, 122, 78)
    length_ratio: float = 0.25
    volume: float = 0.35
    grey_share: float = 0.35
    month: int = 0
    curl_strength: float = 0.5
    heat_shape: float = 0.4
    humidity: float = 50.0
    scalp_sensitivity: bool = False
    seed: int = 17
    metadata: Mapping[str, Any] = field(default_factory=dict)

@dataclass(frozen=True)
class HairGeometry:
    crown: tuple[float, float]
    left_temple: tuple[float, float]
    right_temple: tuple[float, float]
    chin: tuple[float, float]
    face_width: float
    face_height: float

@dataclass
class HairResult:
    image: np.ndarray
    coverage: np.ndarray
    report: dict[str, Any]

def number(value: Any, name: str, low: float, high: float) -> float:
    if isinstance(value, (bool, str)):
        raise ValueError(f'{name} must be numeric')
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError(f'{name} must be numeric') from exc
    if not math.isfinite(result) or result < low or result > high:
        raise ValueError(f'{name} must be in {low}..{high}')
    return result

def rgb(value: Any, name: str) -> tuple[int, int, int]:
    if not isinstance(value, Sequence) or isinstance(value, (str, bytes)) or len(value) != 3:
        raise ValueError(f'{name} must have exactly three channels')
    values = [number(v, name, 0, 255) for v in value]
    if any(v != int(v) for v in values):
        raise ValueError(f'{name} channels must be integers')
    return (int(values[0]), int(values[1]), int(values[2]))

def parse_request(value: Mapping[str, Any] | HairRequest) -> HairRequest:
    if isinstance(value, HairRequest):
        return value
    if not isinstance(value, Mapping):
        raise ValueError('hair request must be an object')
    unknown = set(value) - set(HairRequest.__dataclass_fields__)
    if unknown:
        raise ValueError(f'unknown hair request fields: {sorted(unknown)}')
    feature = str(value.get('feature', ''))
    if feature not in FEATURES:
        raise ValueError('unsupported women hair feature')
    month = number(value.get('month', 0), 'month', 0, 36)
    seed = number(value.get('seed', 17), 'seed', 0, 2 ** 32 - 1)
    if month != int(month) or seed != int(seed):
        raise ValueError('month and seed must be integers')
    sensitive = value.get('scalp_sensitivity', feature == 'W42')
    if not isinstance(sensitive, bool):
        raise ValueError('scalp_sensitivity must be boolean')
    metadata = value.get('metadata', {})
    if not isinstance(metadata, Mapping):
        raise ValueError('metadata must be an object')
    return HairRequest(feature=feature, amount=number(value.get('amount', 0.5), 'amount', 0, 1), colour=rgb(value.get('colour', (92, 58, 40)), 'colour'), accent=rgb(value.get('accent', (176, 122, 78)), 'accent'), length_ratio=number(value.get('length_ratio', 0.25), 'length_ratio', 0, 1), volume=number(value.get('volume', 0.35), 'volume', 0, 1), grey_share=number(value.get('grey_share', 0.35), 'grey_share', 0, 1), month=int(month), curl_strength=number(value.get('curl_strength', 0.5), 'curl_strength', 0, 1), heat_shape=number(value.get('heat_shape', 0.4), 'heat_shape', 0, 1), humidity=number(value.get('humidity', 50), 'humidity', 0, 100), scalp_sensitivity=sensitive, seed=int(seed), metadata=dict(metadata))

def validate_photo(image: Any) -> np.ndarray:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8 or image.ndim != 3 or (image.shape[2] not in (3, 4)):
        raise ValueError('photo must be RGB/RGBA uint8')
    height, width = image.shape[:2]
    if min(height, width) < 16 or height * width > MAX_PIXELS:
        raise ValueError('photo size outside supported range')
    return image

def validate_mask(mask: Any, shape: tuple[int, int], name: str='hair_mask') -> np.ndarray:
    array = np.asarray(mask, dtype=np.float64)
    if array.shape != shape or not np.all(np.isfinite(array)):
        raise ValueError(f'{name} must be a finite HxW array')
    if np.any(array < 0) or np.any(array > 1):
        raise ValueError(f'{name} values must be 0..1')
    return array.copy()

def parse_geometry(value: Mapping[str, Any]) -> HairGeometry:

    def point(name: str) -> tuple[float, float]:
        raw = value.get(name)
        if not isinstance(raw, Sequence) or isinstance(raw, (str, bytes)) or len(raw) != 2:
            raise ValueError(f'{name} must be a normalized xy point')
        return (number(raw[0], name, -0.25, 1.25), number(raw[1], name, -0.25, 1.25))
    crown = point('crown')
    left = point('left_temple')
    right = point('right_temple')
    chin = point('chin')
    width = abs(right[0] - left[0])
    height = abs(chin[1] - crown[1])
    if width < 0.05 or height < 0.1:
        raise ValueError('head landmarks are degenerate')
    return HairGeometry(crown, left, right, chin, width, height)
