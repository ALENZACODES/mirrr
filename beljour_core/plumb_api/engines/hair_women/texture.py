'Hair texture and curl preservation measurements. Author: John Khan.'
from __future__ import annotations

import numpy as np


def gradients(image: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    rgb = image[..., :3].astype(np.float64)
    grey = np.mean(rgb, axis=2)
    gy = np.zeros_like(grey)
    gx = np.zeros_like(grey)
    gy[1:-1] = (grey[2:] - grey[:-2]) * 0.5
    gx[:, 1:-1] = (grey[:, 2:] - grey[:, :-2]) * 0.5
    return (gx, gy)

def orientation_coherence(image: np.ndarray, mask: np.ndarray) -> float:
    gx, gy = gradients(image)
    active = mask > 0.25
    if np.count_nonzero(active) < 8:
        return 1.0
    theta = np.arctan2(gy[active], gx[active]) * 2
    return float(np.hypot(np.mean(np.cos(theta)), np.mean(np.sin(theta))))

def edge_energy(image: np.ndarray, mask: np.ndarray) -> float:
    gx, gy = gradients(image)
    active = mask > 0.25
    if not np.any(active):
        return 0.0
    return float(np.mean(np.hypot(gx, gy)[active]))

def preserve_ratio(before: np.ndarray, after: np.ndarray, mask: np.ndarray) -> float:
    base = edge_energy(before, mask)
    if base <= 1e-08:
        return 1.0
    return edge_energy(after, mask) / base

def define_curls(image: np.ndarray, mask: np.ndarray, amount: float) -> np.ndarray:
    rgb = image[..., :3].astype(np.float64)
    blurred = rgb.copy()
    padded = np.pad(rgb, ((1, 1), (1, 1), (0, 0)), mode='edge')
    acc = np.zeros_like(rgb)
    for dy in range(3):
        for dx in range(3):
            acc += padded[dy:dy + rgb.shape[0], dx:dx + rgb.shape[1]]
    blurred = acc / 9.0
    detail = rgb - blurred
    alpha = np.clip(mask * amount, 0, 1)[..., None]
    out = image.copy()
    out[..., :3] = np.clip(rgb + detail * 0.55 * alpha, 0, 255).astype(np.uint8)
    return out
