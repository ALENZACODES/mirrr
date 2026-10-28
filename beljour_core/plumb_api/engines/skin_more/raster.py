'Local checked-region raster operations. Author: John Khan.'

from __future__ import annotations

import numpy as np

from .contracts import RegionMask


def polygon_mask(h: int, w: int, points: tuple[tuple[float, float], ...]) -> np.ndarray:
    p = np.asarray(points, float)
    yy, xx = np.mgrid[:h, :w]
    x = (xx + 0.5) / w
    y = (yy + 0.5) / h
    inside = np.zeros((h, w), bool)
    for a, b in zip(p, np.roll(p, -1, axis=0), strict=True):
        ax, ay = a
        bx, by = b
        inside ^= ((ay > y) != (by > y)) & (x < (bx - ax) * (y - ay) / (by - ay + 1e-12) + ax)
    return inside.astype(np.float32)

def masks_by_name(h: int, w: int, regions: tuple[RegionMask, ...]) -> dict[str, np.ndarray]:
    return {r.name: polygon_mask(h, w, r.points) for r in regions}

def union(masks: dict[str, np.ndarray]) -> np.ndarray:
    if not masks:
        return np.zeros((1, 1), np.float32)
    out = np.zeros_like(next(iter(masks.values())))
    for m in masks.values():
        out = np.maximum(out, m)
    return out

def soften(mask: np.ndarray, passes: int=2) -> np.ndarray:
    out = mask.astype(float)
    for _ in range(max(0, passes)):
        out = (out + np.roll(out, 1, 0) + np.roll(out, -1, 0) + np.roll(out, 1, 1) + np.roll(out, -1, 1)) / 5
    return np.clip(out, 0, 1).astype(np.float32)

def dry_zone(mask: np.ndarray) -> np.ndarray:
    edge = np.maximum(np.maximum(np.abs(mask - np.roll(mask, 1, 0)), np.abs(mask - np.roll(mask, -1, 0))), np.maximum(np.abs(mask - np.roll(mask, 1, 1)), np.abs(mask - np.roll(mask, -1, 1))))
    return np.clip(mask * (0.65 + 0.35 * soften(edge, 3)), 0, 1)
