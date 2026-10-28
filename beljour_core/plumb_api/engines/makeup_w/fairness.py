'Deep-skin and olive-tone guardrail metrics. Author: John Khan.'
from __future__ import annotations

import numpy as np

from .colourspace import lab_to_lch, rgb_to_lab


def skin_stats(image: np.ndarray, mask: np.ndarray) -> dict[str, float]:
    active = mask > 0.2
    if not np.any(active):
        return {'l': 0.0, 'chroma': 0.0, 'hue': 0.0}
    pixels = image[..., :3].astype(float)[active]
    lch = lab_to_lch(rgb_to_lab(pixels))
    return {'l': float(np.mean(lch[:, 0])), 'chroma': float(np.mean(lch[:, 1])), 'hue': float(np.mean(lch[:, 2]))}

def deep_skin_guard(before: np.ndarray, after: np.ndarray, mask: np.ndarray) -> dict[str, float | bool]:
    b = skin_stats(before, mask)
    a = skin_stats(after, mask)
    ratio = a['chroma'] / max(b['chroma'], 1e-09)
    return {'before_l': b['l'], 'after_l': a['l'], 'lightened': a['l'] > b['l'] + 1.5, 'chroma_ratio': ratio, 'passed': a['l'] <= b['l'] + 1.5 and ratio >= 0.78}

def olive_guard(palette_hues: tuple[float, ...]) -> dict[str, float | bool]:
    if not palette_hues:
        return {'olive_distance': 180.0, 'passed': False}
    distances = [min(abs(h - 92.0), 360 - abs(h - 92.0)) for h in palette_hues]
    best = min(distances)
    return {'olive_distance': best, 'passed': best <= 65.0}
