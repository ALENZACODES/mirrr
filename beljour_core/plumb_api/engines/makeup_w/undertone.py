'Undertone-aware shade constraints and deep-skin safeguards. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .colourspace import lab_to_lch, lch_score, rgb_to_lab


@dataclass(frozen=True)
class ShadeAssessment:
    shade: tuple[int, int, int]
    undertone: str
    compatibility: float
    source_l: float
    shade_l: float
    source_chroma: float
    shade_chroma: float
    would_lighten: bool
    chroma_ratio: float

def assess(source_rgb: tuple[int, int, int], shade: tuple[int, int, int], undertone: str) -> ShadeAssessment:
    source = lab_to_lch(rgb_to_lab(np.asarray(source_rgb, dtype=float)))
    target = lab_to_lch(rgb_to_lab(np.asarray(shade, dtype=float)))
    source_l = float(source[0])
    target_l = float(target[0])
    source_c = float(source[1])
    target_c = float(target[1])
    return ShadeAssessment(shade, undertone, lch_score(shade, undertone), source_l, target_l, source_c, target_c, target_l > source_l + 1.5, target_c / max(source_c, 1e-06))

def constrain_shade(source_rgb: tuple[int, int, int], shade: tuple[int, int, int], undertone: str) -> tuple[int, int, int]:
    source_lab = rgb_to_lab(np.asarray(source_rgb, dtype=float))
    target_lab = rgb_to_lab(np.asarray(shade, dtype=float))
    if float(target_lab[0]) <= float(source_lab[0]) + 1.0:
        return shade
    ratio = max(0.1, float(source_lab[0]) / max(float(target_lab[0]), 1e-06))
    scaled = np.asarray(shade, dtype=float) * ratio
    source_chroma = float(lab_to_lch(source_lab)[1])
    scaled_chroma = float(lab_to_lch(rgb_to_lab(scaled))[1])
    if source_chroma > 20 and scaled_chroma < source_chroma * 0.78:
        mean = float(np.mean(scaled))
        scaled = mean + (scaled - mean) * 1.18
    clipped = np.clip(scaled, 0, 255)
    return (int(round(float(clipped[0]))), int(round(float(clipped[1]))), int(round(float(clipped[2]))))

def rank(source_rgb: tuple[int, int, int], candidates: tuple[tuple[int, int, int], ...], undertone: str) -> tuple[ShadeAssessment, ...]:
    assessments = [assess(source_rgb, constrain_shade(source_rgb, shade, undertone), undertone) for shade in candidates]
    assessments.sort(key=lambda item: (item.would_lighten, -item.compatibility, -item.chroma_ratio))
    return tuple(assessments)
