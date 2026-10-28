'Manual dental annotation rasterisation and bounded geometry transforms. Author: John Khan.'

from __future__ import annotations

import numpy as np


def polygon_mask(h: int, w: int, poly: tuple[tuple[float, float], ...]) -> np.ndarray:
    if len(poly) < 3:
        return np.zeros((h, w), dtype=np.float32)
    p = np.asarray(poly, float)
    yy, xx = np.mgrid[:h, :w]
    x = (xx + 0.5) / w
    y = (yy + 0.5) / h
    inside = np.zeros((h, w), bool)
    for a, b in zip(p, np.roll(p, -1, axis=0), strict=True):
        ax, ay = a
        bx, by = b
        inside ^= ((ay > y) != (by > y)) & (x < (bx - ax) * (y - ay) / (by - ay + 1e-12) + ax)
    return inside.astype(np.float32)

def centroid(poly: tuple[tuple[float, float], ...]) -> tuple[float, float]:
    p = np.asarray(poly, float)
    return (float(p[:, 0].mean()), float(p[:, 1].mean()))

def annotation_width(poly: tuple[tuple[float, float], ...]) -> float:
    p = np.asarray(poly, float)
    return float(p[:, 0].max() - p[:, 0].min())

def annotation_height(poly: tuple[tuple[float, float], ...]) -> float:
    p = np.asarray(poly, float)
    return float(p[:, 1].max() - p[:, 1].min())

def split_teeth(poly: tuple[tuple[float, float], ...], count: int=8) -> list[tuple[float, float, float, float]]:
    p = np.asarray(poly, float)
    x0, y0 = p.min(axis=0)
    x1, y1 = p.max(axis=0)
    step = (x1 - x0) / count
    return [(float(x0 + i * step), float(y0), float(x0 + (i + 1) * step), float(y1)) for i in range(count)]

def midline_error(poly: tuple[tuple[float, float], ...], midline: float | None) -> float:
    cx, _ = centroid(poly)
    return 0 if midline is None else abs(cx - midline)
