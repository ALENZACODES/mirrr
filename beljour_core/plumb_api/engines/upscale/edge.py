'Directional edge analysis and correction. Author: John Khan.'
from __future__ import annotations

import numpy as np


def gradients(channel: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    src = np.asarray(channel, dtype=np.float64)
    gx = np.zeros_like(src)
    gy = np.zeros_like(src)
    gx[:, 1:-1] = (src[:, 2:] - src[:, :-2]) * 0.5
    gy[1:-1] = (src[2:] - src[:-2]) * 0.5
    return (gx, gy)

def orientation(channel: np.ndarray) -> np.ndarray:
    gx, gy = gradients(channel)
    return np.arctan2(gy, gx)

def edge_strength(channel: np.ndarray) -> np.ndarray:
    gx, gy = gradients(channel)
    return np.hypot(gx, gy)

def directional_restore(channel: np.ndarray, amount: float=0.35) -> np.ndarray:
    src = np.asarray(channel, dtype=np.float64)
    gx, gy = gradients(src)
    strength = np.hypot(gx, gy)
    maxv = max(float(np.max(strength)), 1e-09)
    weight = np.clip(strength / maxv, 0, 1) * amount
    horizontal = (np.roll(src, 1, axis=1) + np.roll(src, -1, axis=1)) * 0.5
    vertical = (np.roll(src, 1, axis=0) + np.roll(src, -1, axis=0)) * 0.5
    choose = np.abs(gx) >= np.abs(gy)
    tangent = np.where(choose, vertical, horizontal)
    return np.clip(src * (1 - weight) + tangent * weight, 0, 255)
