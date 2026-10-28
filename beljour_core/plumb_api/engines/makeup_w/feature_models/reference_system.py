'Checked-region reference analysis and original event recipes. Author: John Khan.'
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

import numpy as np

from ..colourspace import lab_to_lch, rgb_to_lab


@dataclass(frozen=True)
class RegionSignature:
    name: str
    rgb: tuple[int, int, int]
    lightness: float
    chroma: float
    hue: float
    coverage: float

def signature(image: np.ndarray, mask: np.ndarray, name: str) -> RegionSignature:
    if image.ndim != 3 or image.shape[2] not in (3, 4) or image.dtype != np.uint8:
        raise ValueError('image must be RGB/RGBA uint8')
    if mask.shape != image.shape[:2]:
        raise ValueError('mask shape mismatch')
    active = np.asarray(mask, dtype=float) > 0.25
    if int(active.sum()) < 8:
        raise ValueError(f'{name} checked region is too small')
    mean = image[..., :3][active].mean(axis=0)
    rgb = tuple(int(round(float(value))) for value in mean)
    fixed = (rgb[0], rgb[1], rgb[2])
    lightness, chroma, hue = lab_to_lch(rgb_to_lab(np.asarray(fixed, dtype=np.float64)))
    return RegionSignature(name, fixed, lightness, chroma, hue, float(active.mean()))

def checked_reference(image: np.ndarray, masks: Mapping[str, np.ndarray]) -> tuple[RegionSignature, ...]:
    required = ('eye', 'cheek', 'lip')
    if set(masks) != set(required):
        raise ValueError('checked reference requires exactly eye, cheek and lip masks')
    return tuple(signature(image, np.asarray(masks[name]), name) for name in required)

def transfer_plan(signatures: tuple[RegionSignature, ...], max_strength: float=0.65) -> tuple[dict[str, object], ...]:
    if {item.name for item in signatures} != {'eye', 'cheek', 'lip'}:
        raise ValueError('complete checked signatures required')
    cap = min(0.75, max(0.05, max_strength))
    plans: list[dict[str, object]] = []
    for item in signatures:
        plans.append({'region': item.name, 'target_rgb': item.rgb, 'target_lightness': item.lightness, 'target_chroma': item.chroma, 'target_hue': item.hue, 'strength_cap': cap if item.name != 'eye' else min(cap, 0.52), 'source': 'user-checked local reference'})
    return tuple(plans)
ORIGINAL_EVENT_LOOKS: dict[str, dict[str, object]] = {'gallery_evening': {'lip': (132, 62, 70), 'blush': (126, 78, 72), 'eye': (72, 59, 55), 'finish': 'satin', 'intensity': 0.58}, 'city_lights': {'lip': (104, 55, 75), 'blush': (116, 76, 84), 'eye': (58, 54, 70), 'finish': 'dewy', 'intensity': 0.62}, 'soft_velvet': {'lip': (118, 66, 62), 'blush': (122, 82, 72), 'eye': (74, 61, 52), 'finish': 'matte', 'intensity': 0.46}, 'copper_hour': {'lip': (126, 72, 54), 'blush': (132, 88, 62), 'eye': (102, 72, 45), 'finish': 'satin', 'intensity': 0.55}}

def event_recipe(name: str) -> dict[str, object]:
    if name not in ORIGINAL_EVENT_LOOKS:
        raise ValueError('unknown original event look')
    return {'name': name, **ORIGINAL_EVENT_LOOKS[name], 'source': 'original BELJOUR recipe; no celebrity or third-party reference'}
