'Local makeup lighting robustness checks without product claims. Author: John Khan.'
from __future__ import annotations

import math
from dataclasses import asdict, dataclass

import numpy as np

from .colourspace import lab_to_lch, rgb_to_lab


@dataclass(frozen=True)
class LightingCondition:
    name: str
    white_rgb: tuple[int, int, int]
    exposure_ev: float
    label: str

@dataclass(frozen=True)
class LightingResult:
    condition: str
    mean_rgb: tuple[float, float, float]
    lightness: float
    chroma: float
    hue: float
    delta_lightness: float
    delta_chroma: float
    hue_shift: float
CONDITIONS = {'daylight': LightingCondition('daylight', (255, 250, 240), 0.0, 'neutral daylight simulation'), 'warm_indoor': LightingCondition('warm_indoor', (255, 220, 175), -0.15, 'warm indoor light simulation'), 'cool_indoor': LightingCondition('cool_indoor', (210, 230, 255), -0.1, 'cool indoor light simulation'), 'flash': LightingCondition('flash', (245, 248, 255), 0.35, 'generic flash simulation'), 'dim_evening': LightingCondition('dim_evening', (235, 205, 180), -0.65, 'dim evening simulation')}

def _active_mean(image: np.ndarray, mask: np.ndarray) -> tuple[float, float, float]:
    if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError('image must be RGB/RGBA uint8')
    value = np.asarray(mask, dtype=float)
    if value.shape != image.shape[:2]:
        raise ValueError('mask shape mismatch')
    active = value > 0.25
    if not np.any(active):
        raise ValueError('mask is empty')
    mean = image[..., :3][active].mean(axis=0)
    return (float(mean[0]), float(mean[1]), float(mean[2]))

def apply_condition(image: np.ndarray, condition: LightingCondition) -> np.ndarray:
    rgb = image[..., :3].astype(np.float64)
    white = np.asarray(condition.white_rgb, dtype=np.float64) / 255.0
    gain = 2.0 ** condition.exposure_ev
    transformed = rgb * white[None, None, :] * gain
    out = image.copy()
    out[..., :3] = np.clip(np.rint(transformed), 0, 255).astype(np.uint8)
    if image.shape[2] == 4:
        out[..., 3] = image[..., 3]
    return out

def _lch(rgb: tuple[float, float, float]) -> tuple[float, float, float]:
    rounded = tuple(int(round(min(255, max(0, value)))) for value in rgb)
    fixed = np.asarray((rounded[0], rounded[1], rounded[2]), dtype=float)
    lch = lab_to_lch(rgb_to_lab(fixed))
    return (float(lch[0]), float(lch[1]), float(lch[2]))

def compare(image: np.ndarray, mask: np.ndarray, condition: LightingCondition) -> LightingResult:
    before = _active_mean(image, mask)
    after_image = apply_condition(image, condition)
    after = _active_mean(after_image, mask)
    before_l, before_c, before_h = _lch(before)
    after_l, after_c, after_h = _lch(after)
    raw = abs(after_h - before_h) % 360
    return LightingResult(condition.name, after, after_l, after_c, after_h, after_l - before_l, after_c - before_c, min(raw, 360 - raw))

def sweep(image: np.ndarray, mask: np.ndarray) -> tuple[LightingResult, ...]:
    return tuple(compare(image, mask, condition) for condition in CONDITIONS.values())

def robustness(rows: tuple[LightingResult, ...], max_hue_shift: float=35.0) -> dict[str, object]:
    if not rows:
        raise ValueError('at least one lighting result required')
    if not math.isfinite(max_hue_shift) or max_hue_shift <= 0:
        raise ValueError('max_hue_shift must be positive')
    maximum = max(row.hue_shift for row in rows)
    return {'conditions': len(rows), 'max_hue_shift': maximum, 'max_lightness_delta': max(abs(row.delta_lightness) for row in rows), 'max_chroma_delta': max(abs(row.delta_chroma) for row in rows), 'passed': maximum <= max_hue_shift, 'label': 'generic local lighting robustness simulation; not calibrated product photography'}

def serialize(rows: tuple[LightingResult, ...]) -> list[dict[str, object]]:
    return [asdict(row) for row in rows]
