'Multi-scale detail analysis for classical upscale. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .kernels import box_blur


@dataclass(frozen=True)
class PyramidLevel:
    width: int
    height: int
    mean_detail: float
    p95_detail: float
    edge_share: float

def detail_map(channel: np.ndarray) -> np.ndarray:
    src = np.asarray(channel, dtype=np.float64)
    return src - box_blur(src)

def edge_mask(channel: np.ndarray, threshold: float=8.0) -> np.ndarray:
    detail = np.abs(detail_map(channel))
    return detail >= threshold

def reduce2(channel: np.ndarray) -> np.ndarray:
    src = np.asarray(channel, dtype=np.float64)
    h = src.shape[0] // 2 * 2
    w = src.shape[1] // 2 * 2
    crop = src[:h, :w]
    return crop.reshape(h // 2, 2, w // 2, 2).mean(axis=(1, 3))

def build(channel: np.ndarray, levels: int=4) -> tuple[np.ndarray, ...]:
    current = np.asarray(channel, dtype=np.float64)
    result = [current]
    for _ in range(max(0, levels - 1)):
        if min(current.shape) < 8:
            break
        current = reduce2(current)
        result.append(current)
    return tuple(result)

def summarize(level: np.ndarray) -> PyramidLevel:
    detail = np.abs(detail_map(level))
    edge = detail >= 8.0
    return PyramidLevel(width=level.shape[1], height=level.shape[0], mean_detail=float(np.mean(detail)), p95_detail=float(np.quantile(detail, 0.95)), edge_share=float(np.mean(edge)))

def summaries(channel: np.ndarray, levels: int=4) -> tuple[PyramidLevel, ...]:
    return tuple(summarize(level) for level in build(channel, levels))

def detail_strength(channel: np.ndarray) -> float:
    levels = summaries(channel, 4)
    if not levels:
        return 0.0
    weights = np.linspace(1.0, 0.45, len(levels))
    values = np.asarray([level.mean_detail for level in levels])
    return float(np.sum(values * weights) / np.sum(weights))

def recommended_detail(channel: np.ndarray) -> float:
    strength = detail_strength(channel)
    if strength < 2.0:
        return 0.3
    if strength < 5.0:
        return 0.48
    if strength < 9.0:
        return 0.58
    return 0.42
