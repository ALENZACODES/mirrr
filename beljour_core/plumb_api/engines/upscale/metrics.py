'Synthetic objective metrics for classical upscale. Author: John Khan.'
from __future__ import annotations

import math

import numpy as np


def psnr(reference: np.ndarray, candidate: np.ndarray) -> float:
    a = reference[..., :3].astype(np.float64)
    b = candidate[..., :3].astype(np.float64)
    mse = float(np.mean((a - b) ** 2))
    return float('inf') if mse == 0 else 20 * math.log10(255 / math.sqrt(mse))

def ssim_proxy(reference: np.ndarray, candidate: np.ndarray) -> float:
    x = np.mean(reference[..., :3].astype(np.float64), axis=2)
    y = np.mean(candidate[..., :3].astype(np.float64), axis=2)
    mx, my = (float(np.mean(x)), float(np.mean(y)))
    vx, vy = (float(np.var(x)), float(np.var(y)))
    cov = float(np.mean((x - mx) * (y - my)))
    c1 = 6.5025
    c2 = 58.5225
    return (2 * mx * my + c1) * (2 * cov + c2) / ((mx * mx + my * my + c1) * (vx + vy + c2))

def ringing_score(image: np.ndarray) -> float:
    grey = np.mean(image[..., :3].astype(np.float64), axis=2)
    lap = np.zeros_like(grey)
    lap[1:-1, 1:-1] = 4 * grey[1:-1, 1:-1] - grey[:-2, 1:-1] - grey[2:, 1:-1] - grey[1:-1, :-2] - grey[1:-1, 2:]
    p99 = float(np.quantile(np.abs(lap), 0.99))
    return p99 / 255.0
