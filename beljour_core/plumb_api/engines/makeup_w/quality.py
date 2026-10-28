'Makeup quality and deep-skin/olive acceptance diagnostics. Author: John Khan.'
from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass

import numpy as np

from .colourspace import lab_to_lch, rgb_to_lab


@dataclass(frozen=True)
class MakeupQuality:
    outside_change: float
    alpha_error: float
    mean_lightness_delta: float
    max_lightness_increase: float
    chroma_ratio: float
    hue_shift_deg: float
    texture_ratio: float
    passed: bool

def _arrays(image: np.ndarray, after: np.ndarray, mask: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    if image.dtype != np.uint8 or after.dtype != np.uint8 or image.shape != after.shape:
        raise ValueError('matching uint8 images required')
    if image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError('RGB/RGBA images required')
    value = np.asarray(mask, dtype=np.float64)
    if value.shape != image.shape[:2] or np.any(~np.isfinite(value)) or np.any(value < 0) or np.any(value > 1):
        raise ValueError('mask must be finite HxW 0..1')
    return (image, after, value)

def _luma(image: np.ndarray) -> np.ndarray:
    rgb = image[..., :3].astype(np.float64)
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]

def outside_change(image: np.ndarray, after: np.ndarray, mask: np.ndarray) -> float:
    image, after, mask = _arrays(image, after, mask)
    outside = mask <= 0.01
    if not np.any(outside):
        return 0.0
    delta = np.max(np.abs(after[..., :3].astype(float) - image[..., :3].astype(float)), axis=2)
    return float(np.mean(delta[outside] > 1.0))

def alpha_error(image: np.ndarray, after: np.ndarray) -> float:
    if image.shape != after.shape:
        raise ValueError('shape mismatch')
    if image.shape[2] != 4:
        return 0.0
    return float(np.max(np.abs(after[..., 3].astype(float) - image[..., 3].astype(float))))

def lightness_stats(image: np.ndarray, after: np.ndarray, mask: np.ndarray) -> tuple[float, float]:
    image, after, mask = _arrays(image, after, mask)
    active = mask > 0.25
    if not np.any(active):
        return (0.0, 0.0)
    delta = _luma(after)[active] - _luma(image)[active]
    return (float(np.mean(delta)), float(np.max(delta)))

def _region_rgb(image: np.ndarray, mask: np.ndarray) -> tuple[int, int, int]:
    active = mask > 0.25
    if not np.any(active):
        return (0, 0, 0)
    mean = image[..., :3][active].mean(axis=0)
    values = [int(round(float(value))) for value in mean]
    return (values[0], values[1], values[2])

def chroma_hue_stats(image: np.ndarray, after: np.ndarray, mask: np.ndarray) -> tuple[float, float]:
    image, after, mask = _arrays(image, after, mask)
    before_rgb = _region_rgb(image, mask)
    after_rgb = _region_rgb(after, mask)
    _, before_c, before_h = lab_to_lch(rgb_to_lab(np.asarray(before_rgb, dtype=np.float64)))
    _, after_c, after_h = lab_to_lch(rgb_to_lab(np.asarray(after_rgb, dtype=np.float64)))
    ratio = 1.0 if before_c <= 1e-09 else after_c / before_c
    raw = abs(after_h - before_h) % 360
    shift = min(raw, 360 - raw)
    return (ratio, shift)

def texture_ratio(image: np.ndarray, after: np.ndarray, mask: np.ndarray) -> float:
    image, after, mask = _arrays(image, after, mask)
    active = mask > 0.25
    if not np.any(active):
        return 1.0

    def energy(value: np.ndarray) -> float:
        grey = _luma(value)
        gx = np.zeros_like(grey)
        gy = np.zeros_like(grey)
        gx[:, 1:-1] = (grey[:, 2:] - grey[:, :-2]) * 0.5
        gy[1:-1] = (grey[2:] - grey[:-2]) * 0.5
        return float(np.mean(np.hypot(gx, gy)[active]))
    before = energy(image)
    current = energy(after)
    return 1.0 if before <= 1e-09 else current / before

def assess(image: np.ndarray, after: np.ndarray, mask: np.ndarray, *, deep_skin: bool, olive: bool) -> MakeupQuality:
    outside = outside_change(image, after, mask)
    alpha = alpha_error(image, after)
    mean_l, max_l = lightness_stats(image, after, mask)
    chroma, hue = chroma_hue_stats(image, after, mask)
    texture = texture_ratio(image, after, mask)
    chroma_floor = 0.78 if deep_skin else 0.72
    hue_cap = 28.0 if olive else 38.0
    passed = outside <= 0.005 and alpha == 0 and (max_l <= 1.5) and (chroma >= chroma_floor) and (hue <= hue_cap) and (texture >= 0.68)
    return MakeupQuality(outside, alpha, mean_l, max_l, chroma, hue, texture, passed)

def group_summary(rows: Sequence[MakeupQuality]) -> dict[str, float | int]:
    if not rows:
        return {'count': 0, 'passed': 0, 'failed': 0}
    return {'count': len(rows), 'passed': sum(row.passed for row in rows), 'failed': sum(not row.passed for row in rows), 'outside_change_max': max(row.outside_change for row in rows), 'lightness_increase_max': max(row.max_lightness_increase for row in rows), 'chroma_ratio_mean': sum(row.chroma_ratio for row in rows) / len(rows), 'chroma_ratio_min': min(row.chroma_ratio for row in rows), 'hue_shift_mean': sum(row.hue_shift_deg for row in rows) / len(rows), 'texture_ratio_min': min(row.texture_ratio for row in rows)}

def serialize(value: MakeupQuality) -> dict[str, float | bool]:
    return asdict(value)

def fairness_slice(rows: Sequence[Mapping[str, object]], metric: str, group_key: str) -> dict[str, dict[str, float | int]]:
    grouped: dict[str, list[float]] = {}
    for row in rows:
        group = row.get(group_key)
        value = row.get(metric)
        if not isinstance(group, str) or not isinstance(value, (int, float)) or isinstance(value, bool):
            continue
        number = float(value)
        if math.isfinite(number):
            grouped.setdefault(group, []).append(number)
    return {group: {'count': len(values), 'mean': sum(values) / len(values), 'min': min(values), 'max': max(values)} for group, values in grouped.items()}
