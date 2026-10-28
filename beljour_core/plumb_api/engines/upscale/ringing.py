'Ringing detection and bounded detail-restoration helpers. Author: John Khan.'
from __future__ import annotations

import numpy as np


def laplacian(channel: np.ndarray) -> np.ndarray:
    src = np.asarray(channel, dtype=np.float64)
    out = np.zeros_like(src)
    out[1:-1, 1:-1] = 4 * src[1:-1, 1:-1] - src[:-2, 1:-1] - src[2:, 1:-1] - src[1:-1, :-2] - src[1:-1, 2:]
    return out

def overshoot_map(channel: np.ndarray) -> np.ndarray:
    src = np.asarray(channel, dtype=np.float64)
    low = np.min(np.stack([src, np.roll(src, 1, 0), np.roll(src, -1, 0), np.roll(src, 1, 1), np.roll(src, -1, 1)]), axis=0)
    high = np.max(np.stack([src, np.roll(src, 1, 0), np.roll(src, -1, 0), np.roll(src, 1, 1), np.roll(src, -1, 1)]), axis=0)
    below = np.maximum(0.0, low - src)
    above = np.maximum(0.0, src - high)
    return np.maximum(below, above)

def clamp_neighbourhood(candidate: np.ndarray, reference: np.ndarray, margin: float=4.0) -> np.ndarray:
    ref = np.asarray(reference, dtype=np.float64)
    cand = np.asarray(candidate, dtype=np.float64)
    neighbours = np.stack([ref, np.roll(ref, 1, 0), np.roll(ref, -1, 0), np.roll(ref, 1, 1), np.roll(ref, -1, 1)])
    low = np.min(neighbours, axis=0) - margin
    high = np.max(neighbours, axis=0) + margin
    return np.minimum(np.maximum(cand, low), high)

def score(channel: np.ndarray) -> float:
    lap = np.abs(laplacian(channel))
    return float(np.quantile(lap, 0.99) / 255.0)

def edge_overshoot_share(candidate: np.ndarray, reference: np.ndarray, tolerance: float=6.0) -> float:
    cand = np.asarray(candidate, dtype=np.float64)
    ref = np.asarray(reference, dtype=np.float64)
    neighbours = np.stack([ref, np.roll(ref, 1, 0), np.roll(ref, -1, 0), np.roll(ref, 1, 1), np.roll(ref, -1, 1)])
    low = np.min(neighbours, axis=0) - tolerance
    high = np.max(neighbours, axis=0) + tolerance
    return float(np.mean((cand < low) | (cand > high)))

def overshoot_fraction(image: np.ndarray, tolerance: float=6.0) -> float:
    """Return the mean channel share outside each pixel's local neighbourhood envelope."""
    value = np.asarray(image, dtype=np.float64)
    if value.ndim == 2:
        return edge_overshoot_share(value, value, tolerance)
    if value.ndim != 3 or value.shape[2] < 1:
        raise ValueError('image must be HxW or HxWxC')
    shares = [edge_overshoot_share(value[..., channel], value[..., channel], tolerance) for channel in range(min(3, value.shape[2]))]
    return float(np.mean(np.asarray(shares, dtype=np.float64))) if shares else 0.0
