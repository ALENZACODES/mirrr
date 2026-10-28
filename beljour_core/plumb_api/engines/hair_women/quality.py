'Hair-specific objective diagnostics and group reporting for R17B. Author: John Khan.'
from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass

import numpy as np


@dataclass(frozen=True)
class HairQuality:
    outside_change: float
    alpha_error: float
    texture_ratio: float
    mask_edge_jump: float
    mean_colour_delta: float
    high_colour_delta: float
    coverage_fraction: float
    passed: bool

def _validate(image: np.ndarray, after: np.ndarray, mask: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    if image.dtype != np.uint8 or after.dtype != np.uint8:
        raise ValueError('images must be uint8')
    if image.shape != after.shape or image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError('images must be matching RGB/RGBA arrays')
    value = np.asarray(mask, dtype=np.float64)
    if value.shape != image.shape[:2] or not np.all(np.isfinite(value)):
        raise ValueError('mask must be finite HxW')
    if np.any(value < 0) or np.any(value > 1):
        raise ValueError('mask must be 0..1')
    return (image, after, value)

def luminance(image: np.ndarray) -> np.ndarray:
    rgb = image[..., :3].astype(np.float64)
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]

def edge_energy(image: np.ndarray, mask: np.ndarray) -> float:
    grey = luminance(image)
    gx = np.zeros_like(grey)
    gy = np.zeros_like(grey)
    gx[:, 1:-1] = (grey[:, 2:] - grey[:, :-2]) * 0.5
    gy[1:-1] = (grey[2:] - grey[:-2]) * 0.5
    active = mask > 0.25
    if not np.any(active):
        return 0.0
    return float(np.mean(np.hypot(gx, gy)[active]))

def outside_change_fraction(image: np.ndarray, after: np.ndarray, mask: np.ndarray, tolerance: float=1.0) -> float:
    image, after, mask = _validate(image, after, mask)
    outside = mask <= 0.01
    if not np.any(outside):
        return 0.0
    delta = np.max(np.abs(after[..., :3].astype(float) - image[..., :3].astype(float)), axis=2)
    return float(np.mean(delta[outside] > tolerance))

def alpha_error(image: np.ndarray, after: np.ndarray) -> float:
    if image.shape != after.shape:
        raise ValueError('shape mismatch')
    if image.shape[2] != 4:
        return 0.0
    return float(np.max(np.abs(after[..., 3].astype(float) - image[..., 3].astype(float))))

def texture_ratio(image: np.ndarray, after: np.ndarray, mask: np.ndarray) -> float:
    before = edge_energy(image, mask)
    current = edge_energy(after, mask)
    return 1.0 if before <= 1e-09 else current / before

def _mask_boundary(mask: np.ndarray) -> np.ndarray:
    padded = np.pad(mask, 1, mode='edge')
    low = np.ones_like(mask)
    high = np.zeros_like(mask)
    for dy in range(3):
        for dx in range(3):
            piece = padded[dy:dy + mask.shape[0], dx:dx + mask.shape[1]]
            low = np.minimum(low, piece)
            high = np.maximum(high, piece)
    return high - low > 0.1

def mask_edge_jump(image: np.ndarray, after: np.ndarray, mask: np.ndarray) -> float:
    image, after, mask = _validate(image, after, mask)
    boundary = _mask_boundary(mask)
    if not np.any(boundary):
        return 0.0
    delta = np.linalg.norm(after[..., :3].astype(float) - image[..., :3].astype(float), axis=2)
    return float(np.quantile(delta[boundary], 0.95))

def colour_delta_stats(image: np.ndarray, after: np.ndarray, mask: np.ndarray) -> tuple[float, float]:
    image, after, mask = _validate(image, after, mask)
    active = mask > 0.25
    if not np.any(active):
        return (0.0, 0.0)
    delta = np.linalg.norm(after[..., :3].astype(float) - image[..., :3].astype(float), axis=2)[active]
    return (float(np.mean(delta)), float(np.quantile(delta, 0.95)))

def assess(image: np.ndarray, after: np.ndarray, mask: np.ndarray, texture_floor: float=0.68) -> HairQuality:
    image, after, mask = _validate(image, after, mask)
    outside = outside_change_fraction(image, after, mask)
    alpha = alpha_error(image, after)
    texture = texture_ratio(image, after, mask)
    edge_jump = mask_edge_jump(image, after, mask)
    mean_delta, high_delta = colour_delta_stats(image, after, mask)
    coverage = float(np.mean(mask > 0.01))
    passed = outside <= 0.005 and alpha == 0.0 and (texture >= texture_floor) and (edge_jump <= 90.0)
    return HairQuality(outside, alpha, texture, edge_jump, mean_delta, high_delta, coverage, passed)

def group_summary(rows: Sequence[HairQuality]) -> dict[str, float | int]:
    if not rows:
        return {'count': 0, 'passed': 0, 'failed': 0}
    return {'count': len(rows), 'passed': sum(row.passed for row in rows), 'failed': sum(not row.passed for row in rows), 'outside_change_mean': sum(row.outside_change for row in rows) / len(rows), 'outside_change_max': max(row.outside_change for row in rows), 'texture_ratio_mean': sum(row.texture_ratio for row in rows) / len(rows), 'texture_ratio_min': min(row.texture_ratio for row in rows), 'mask_edge_jump_mean': sum(row.mask_edge_jump for row in rows) / len(rows), 'colour_delta_mean': sum(row.mean_colour_delta for row in rows) / len(rows)}

def serialize(value: HairQuality) -> dict[str, float | bool]:
    return asdict(value)

def fairness_slice(rows: Sequence[Mapping[str, object]], metric: str, group_key: str) -> dict[str, dict[str, float | int]]:
    grouped: dict[str, list[float]] = {}
    for row in rows:
        group = row.get(group_key)
        value = row.get(metric)
        if not isinstance(group, str) or not isinstance(value, (int, float)) or isinstance(value, bool):
            continue
        number = float(value)
        if not math.isfinite(number):
            continue
        grouped.setdefault(group, []).append(number)
    result: dict[str, dict[str, float | int]] = {}
    for group, values in grouped.items():
        result[group] = {'count': len(values), 'mean': sum(values) / len(values), 'min': min(values), 'max': max(values)}
    return result
