'Fringe, haircut, curl and heat-style plans. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .contracts import HairGeometry


@dataclass(frozen=True)
class StylePlan:
    name: str
    length_ratio: float
    volume_ratio: float
    fringe_ratio: float
    texture_retention: float
    note: str

def fringe_options(geometry: HairGeometry) -> tuple[StylePlan, ...]:
    long_face = geometry.face_height / max(geometry.face_width, 1e-06) > 1.55
    return (StylePlan('soft curtain', 0.72, 0.34, 0.22 if long_face else 0.18, 0.95, 'geometry-informed preview, not a rule'), StylePlan('side sweep', 0.78, 0.3, 0.16, 0.96, 'geometry-informed preview, not a rule'), StylePlan('light fringe', 0.68, 0.28, 0.25 if long_face else 0.2, 0.92, 'geometry-informed preview, not a rule'))

def haircut_options(geometry: HairGeometry, curl_strength: float) -> tuple[StylePlan, ...]:
    ratio = geometry.face_height / max(geometry.face_width, 1e-06)
    curl = max(0.0, min(curl_strength, 1.0))
    shrinkage = 0.06 + 0.3 * curl
    if ratio > 1.55:
        names = ('collarbone layers', 'rounded shoulder cut', 'soft chin frame')
    elif ratio < 1.3:
        names = ('long vertical layers', 'shoulder sweep', 'face-frame layers')
    else:
        names = ('soft layers', 'collarbone shape', 'balanced face frame')
    return tuple(StylePlan(name, length * (1 - shrinkage), 0.35 + i * 0.06, 0.0, 0.95, 'worn length accounts for curl shrinkage estimate') for i, (name, length) in enumerate(zip(names, (0.74, 0.62, 0.52), strict=True)))

def heat_style_profile(style: str, heat_shape: float, curl_strength: float) -> dict[str, float | str]:
    if style not in {'straight', 'wave', 'curl', 'blowout'}:
        raise ValueError('unsupported heat style')
    h = max(0.0, min(float(heat_shape), 1.0))
    c = max(0.0, min(float(curl_strength), 1.0))
    displacement = {'straight': 0.18, 'wave': 0.1, 'curl': 0.08, 'blowout': 0.12}[style] * h
    retained = max(0.72, 1 - displacement * (0.6 + 0.4 * c))
    return {'style': style, 'shape_amount': h, 'texture_retention_target': retained, 'label': 'appearance preview only; heat safety depends on condition and tools'}

def curl_frequency(image: np.ndarray, mask: np.ndarray) -> float:
    rgb = np.mean(image[..., :3].astype(float), axis=2)
    active = mask > 0.2
    if not np.any(active):
        return 0.0
    signal = np.mean(rgb * active, axis=0)
    signal = signal - np.mean(signal)
    spectrum = np.abs(np.fft.rfft(signal))
    if len(spectrum) <= 1:
        return 0.0
    return float(np.argmax(spectrum[1:]) + 1) / max(len(signal), 1)

def curl_pattern_retained(before: np.ndarray, after: np.ndarray, mask: np.ndarray, tolerance: float=0.08) -> bool:
    return abs(curl_frequency(before, mask) - curl_frequency(after, mask)) <= tolerance
