'Extension, topper, and wig planning utilities. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .contracts import HairGeometry


@dataclass(frozen=True)
class LengthEstimate:
    stretched_ratio: float
    worn_ratio: float
    shrinkage_ratio: float
    added_pixels: int
    label: str

def length_estimate(image_height: int, requested_ratio: float, curl_strength: float) -> LengthEstimate:
    requested = max(0.0, min(float(requested_ratio), 1.0))
    curl = max(0.0, min(float(curl_strength), 1.0))
    shrinkage = 0.06 + 0.34 * curl
    worn = requested * (1 - shrinkage)
    return LengthEstimate(requested, worn, shrinkage, int(round(image_height * worn * 0.35)), 'visual estimate; stretched and worn lengths shown separately')

def blend_score(mask: np.ndarray, added: np.ndarray) -> float:
    m = np.asarray(mask, dtype=np.float64)
    a = np.asarray(added, dtype=np.float64)
    overlap = np.minimum(m, a)
    union = np.maximum(m, a)
    denominator = float(np.sum(union))
    return 1.0 if denominator <= 1e-09 else float(np.sum(overlap) / denominator)

def attachment_rows(geometry: HairGeometry, method: str, count: int=5) -> tuple[tuple[float, float], ...]:
    if method not in {'clip', 'tape', 'sew'}:
        raise ValueError('unsupported attachment method')
    n = max(2, min(int(count), 8))
    top = geometry.crown[1] + geometry.face_height * (0.12 if method == 'clip' else 0.16)
    spacing = geometry.face_height * (0.26 if method == 'sew' else 0.22) / max(n - 1, 1)
    rows = []
    for i in range(n):
        y = top + i * spacing
        width = geometry.face_width * (0.45 + 0.08 * i)
        rows.append((y, min(width, geometry.face_width * 0.82)))
    return tuple(rows)

def topper_profile(geometry: HairGeometry, volume: float) -> dict[str, float | str]:
    v = max(0.0, min(float(volume), 1.0))
    return {'crown_x': geometry.crown[0], 'crown_y': geometry.crown[1], 'base_width_ratio': geometry.face_width * (0.42 + 0.22 * v), 'base_height_ratio': geometry.face_height * (0.16 + 0.1 * v), 'lift_ratio': 0.03 + 0.08 * v, 'label': 'topper volume simulation'}

def wig_profile(geometry: HairGeometry, amount: float, sensitive: bool) -> dict[str, float | str | bool]:
    a = max(0.0, min(float(amount), 1.0))
    return {'cap_width_ratio': geometry.face_width * (0.93 + 0.04 * a), 'cap_depth_ratio': geometry.face_height * (0.44 + 0.07 * a), 'hairline_softness': 0.75 if sensitive else 0.55, 'scalp_contact_visualization': sensitive, 'label': 'fashion wig preview; fit and comfort require in-person verification'}

def sensitive_limits(amount: float) -> tuple[float, float]:
    a = max(0.0, min(float(amount), 1.0))
    opacity = min(0.35, 0.15 + 0.25 * a)
    scalp_contact = min(0.25, 0.1 + 0.18 * a)
    return (opacity, scalp_contact)
