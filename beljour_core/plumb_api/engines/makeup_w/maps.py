'Face-shape placement maps for makeup. Author: John Khan.'
from __future__ import annotations

import numpy as np


def ellipse(shape: tuple[int, int], cx: float, cy: float, rx: float, ry: float) -> np.ndarray:
    h, w = shape
    yy, xx = np.mgrid[:h, :w]
    x = xx / max(w - 1, 1)
    y = yy / max(h - 1, 1)
    return (((x - cx) / max(rx, 1e-06)) ** 2 + ((y - cy) / max(ry, 1e-06)) ** 2 <= 1).astype(np.float64)

def blush_map(shape: tuple[int, int], face_shape: str) -> np.ndarray:
    positions = {'round': ((0.34, 0.54, 0.1, 0.045), (0.66, 0.54, 0.1, 0.045)), 'long': ((0.34, 0.57, 0.12, 0.04), (0.66, 0.57, 0.12, 0.04)), 'heart': ((0.35, 0.56, 0.09, 0.05), (0.65, 0.56, 0.09, 0.05)), 'square': ((0.34, 0.56, 0.08, 0.06), (0.66, 0.56, 0.08, 0.06)), 'oval': ((0.35, 0.55, 0.1, 0.05), (0.65, 0.55, 0.1, 0.05)), 'balanced': ((0.35, 0.55, 0.1, 0.05), (0.65, 0.55, 0.1, 0.05))}
    left, right = positions[face_shape]
    return np.maximum(ellipse(shape, *left), ellipse(shape, *right))

def contour_map(shape: tuple[int, int], face_shape: str) -> np.ndarray:
    h, w = shape
    yy, xx = np.mgrid[:h, :w]
    x = xx / max(w - 1, 1)
    y = yy / max(h - 1, 1)
    temple = ((x < 0.25) | (x > 0.75)) & (y > 0.25) & (y < 0.5)
    jaw = ((x < 0.32) | (x > 0.68)) & (y > 0.62) & (y < 0.78)
    if face_shape == 'long':
        jaw |= (y > 0.72) & (x > 0.35) & (x < 0.65)
    elif face_shape == 'round':
        temple |= ((x < 0.3) | (x > 0.7)) & (y > 0.48) & (y < 0.66)
    return (temple | jaw).astype(np.float64)

def concealer_map(shape: tuple[int, int]) -> np.ndarray:
    left = ellipse(shape, 0.38, 0.44, 0.11, 0.055)
    right = ellipse(shape, 0.62, 0.44, 0.11, 0.055)
    center = ellipse(shape, 0.5, 0.6, 0.08, 0.08)
    return np.maximum(np.maximum(left, right), center)

def correction_map(shape: tuple[int, int], issue: str) -> np.ndarray:
    if issue == 'under_eye':
        return np.maximum(ellipse(shape, 0.38, 0.45, 0.12, 0.06), ellipse(shape, 0.62, 0.45, 0.12, 0.06))
    if issue == 'redness':
        return ellipse(shape, 0.5, 0.56, 0.24, 0.16)
    return ellipse(shape, 0.5, 0.53, 0.18, 0.14)
