'Procedural local hairstyle geometry. Author: John Khan.'
from __future__ import annotations

import numpy as np

from .contracts import HairGeometry


def extension_mask(mask: np.ndarray, geometry: HairGeometry, length_ratio: float, volume: float) -> np.ndarray:
    h, _ = mask.shape
    extra = int(round(h * length_ratio * 0.35))
    result = mask.copy()
    if extra <= 0:
        return result
    for y in range(h):
        source_y = max(0, y - extra)
        source = mask[source_y]
        taper = max(0.0, 1.0 - max(0, y / max(h - 1, 1) - geometry.chin[1]) * (0.45 + 0.4 * (1 - volume)))
        result[y] = np.maximum(result[y], source * taper)
    return np.clip(result, 0, 1)

def topper_mask(mask: np.ndarray, geometry: HairGeometry, amount: float) -> np.ndarray:
    h, w = mask.shape
    yy, xx = np.mgrid[:h, :w]
    cx = geometry.crown[0] * (w - 1)
    cy = geometry.crown[1] * (h - 1)
    rx = max(4.0, geometry.face_width * w * (0.42 + 0.25 * amount))
    ry = max(4.0, geometry.face_height * h * (0.18 + 0.12 * amount))
    ellipse = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
    return np.maximum(mask, ellipse.astype(np.float64) * amount)

def fringe_mask(mask: np.ndarray, geometry: HairGeometry, amount: float) -> np.ndarray:
    h, w = mask.shape
    yy, xx = np.mgrid[:h, :w]
    left = geometry.left_temple[0] * w
    right = geometry.right_temple[0] * w
    top = geometry.crown[1] * h
    bottom = top + geometry.face_height * h * (0.2 + 0.18 * amount)
    arch = top + ((xx - (left + right) / 2) / max(right - left, 1)) ** 2 * h * 0.05
    region = (xx >= left) & (xx <= right) & (yy >= arch) & (yy <= bottom)
    return np.maximum(mask, region.astype(np.float64) * (0.65 + 0.35 * amount))

def face_shape(geometry: HairGeometry) -> str:
    ratio = geometry.face_height / max(geometry.face_width, 1e-06)
    if ratio >= 1.7:
        return 'long'
    if ratio <= 1.25:
        return 'round'
    return 'balanced'

def cut_recommendation(geometry: HairGeometry) -> dict[str, str | float]:
    shape = face_shape(geometry)
    mapping = {'long': ('collarbone layers', 0.58), 'round': ('long layers', 0.72), 'balanced': ('soft layers', 0.65)}
    name, length = mapping[shape]
    return {'face_shape_proxy': shape, 'cut': name, 'length_ratio': length, 'label': 'geometry-based preview, not a rule'}
