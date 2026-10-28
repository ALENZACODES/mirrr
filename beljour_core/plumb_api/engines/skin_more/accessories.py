'Procedural accessory overlays with no third-party assets. Author: John Khan.'

from __future__ import annotations

import numpy as np


def _disk(mask: np.ndarray, cx: float, cy: float, r: float, value: float=1) -> None:
    h, w = mask.shape
    yy, xx = np.mgrid[:h, :w]
    mask[(xx - cx) ** 2 + (yy - cy) ** 2 <= r * r] = value

def jewellery_mask(h: int, w: int, kind: str, amount: float) -> np.ndarray:
    m = np.zeros((h, w), np.float32)
    r = max(1, min(h, w) * (0.012 + 0.018 * amount))
    if kind in ('earrings', 'both'):
        _disk(m, w * 0.19, h * 0.49, r)
        _disk(m, w * 0.81, h * 0.49, r)
    if kind in ('necklace', 'both'):
        yy, xx = np.mgrid[:h, :w]
        cx = w * 0.5
        cy = h * 0.79
        rx = w * 0.23
        ry = h * 0.09
        d = np.abs(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 - 1)
        m[d < 0.07] = 1
    return m

def glasses_mask(h: int, w: int, kind: str, amount: float) -> np.ndarray:
    m = np.zeros((h, w), np.float32)
    yy, xx = np.mgrid[:h, :w]
    cy = h * 0.39
    rx = w * (0.12 + 0.025 * amount)
    ry = h * (0.055 + 0.012 * amount)
    for cx in (w * 0.37, w * 0.63):
        d = np.abs(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 - 1)
        m[d < 0.08] = 1
    m[max(0, int(cy) - 1):min(h, int(cy) + 2), int(w * 0.47):int(w * 0.53)] = 1
    return m

def faux_freckles(h: int, w: int, region: np.ndarray, amount: float, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    m = np.zeros((h, w), np.float32)
    ys, xs = np.where(region > 0.5)
    if len(xs) == 0:
        return m
    count = int(8 + 44 * amount)
    idx = rng.integers(0, len(xs), size=count)
    for x, y in zip(xs[idx], ys[idx], strict=True):
        _disk(m, float(x), float(y), max(1, min(h, w) * rng.uniform(0.0015, 0.004)), rng.uniform(0.35, 0.8))
    return m
