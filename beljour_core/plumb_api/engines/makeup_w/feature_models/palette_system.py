'Palette construction, extraction and outfit harmony for R17B. Author: John Khan.'
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from ..colourspace import lab_to_lch, rgb_to_lab

RGB = tuple[int, int, int]

@dataclass(frozen=True)
class RankedShade:
    rgb: RGB
    role: str
    score: float
    chroma: float
    lightness: float
    rationale: str

def _clamp_rgb(rgb: tuple[int, int, int] | list[int]) -> RGB:
    if len(rgb) != 3:
        raise ValueError('RGB must contain three channels')
    values = tuple(int(min(255, max(0, channel))) for channel in rgb)
    return (values[0], values[1], values[2])

def _hue_distance(a: float, b: float) -> float:
    delta = abs((a - b) % 360.0)
    return min(delta, 360.0 - delta)

def undertone_anchor(undertone: str) -> float:
    anchors = {'cool': 345.0, 'neutral': 25.0, 'warm': 55.0, 'olive': 92.0}
    if undertone not in anchors:
        raise ValueError('unsupported undertone')
    return anchors[undertone]

def rank_shades(shades: list[RGB], undertone: str, role: str='lip') -> tuple[RankedShade, ...]:
    if role not in {'lip', 'blush', 'eye', 'accent', 'base'}:
        raise ValueError('unsupported role')
    anchor = undertone_anchor(undertone)
    ranked: list[RankedShade] = []
    for raw in shades:
        rgb = _clamp_rgb(raw)
        lightness, chroma, hue = lab_to_lch(rgb_to_lab(np.asarray(rgb, dtype=np.float64)))
        hue_score = 1.0 - _hue_distance(hue, anchor) / 180.0
        chroma_target = {'base': 12.0, 'eye': 35.0, 'lip': 48.0, 'blush': 38.0, 'accent': 55.0}[role]
        chroma_score = max(0.0, 1.0 - abs(chroma - chroma_target) / 80.0)
        score = 0.68 * hue_score + 0.32 * chroma_score
        ranked.append(RankedShade(rgb, role, score, chroma, lightness, f'local Lab/LCh score for {undertone} undertone'))
    return tuple(sorted(ranked, key=lambda item: item.score, reverse=True))

def balanced_palette(anchor: RGB, undertone: str) -> tuple[RankedShade, ...]:
    r, g, b = _clamp_rgb(anchor)
    candidates = [(r, g, b), (min(255, int(r * 1.08 + 8)), min(255, int(g * 0.96 + 4)), min(255, int(b * 1.03))), (max(0, int(r * 0.82)), max(0, int(g * 0.78)), max(0, int(b * 0.86))), (min(255, int(r * 0.92 + 15)), min(255, int(g * 1.02 + 7)), min(255, int(b * 0.8 + 12)))]
    return rank_shades(candidates, undertone, 'accent')

def outfit_harmony(outfit: RGB, undertone: str) -> dict[str, RGB | float | str]:
    rgb = _clamp_rgb(outfit)
    lightness, chroma, hue = lab_to_lch(rgb_to_lab(np.asarray(rgb, dtype=np.float64)))
    anchor = undertone_anchor(undertone)
    complement_hue = (hue + 180.0) % 360.0
    relation = 'adjacent' if _hue_distance(hue, anchor) < 55 else 'contrast'
    return {'outfit': rgb, 'outfit_lightness': lightness, 'outfit_chroma': chroma, 'outfit_hue': hue, 'undertone_anchor': anchor, 'complement_hue': complement_hue, 'relation': relation, 'label': 'local colour-harmony guidance; no brand or product claim'}

def deep_skin_guard(source_l: float, candidate_l: float, tolerance: float=1.0) -> tuple[float, bool]:
    if not all(math.isfinite(v) for v in (source_l, candidate_l, tolerance)):
        raise ValueError('values must be finite')
    corrected = min(candidate_l, source_l + max(0.0, tolerance))
    return (corrected, corrected <= source_l + tolerance)
