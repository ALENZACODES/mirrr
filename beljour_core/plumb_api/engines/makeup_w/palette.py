'Custom palettes, extraction and undertone recommendations. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .colourspace import lch_score, rgb_to_lab


@dataclass(frozen=True)
class PaletteColour:
    rgb: tuple[int, int, int]
    role: str
    undertone_score: float
    source: str

def custom_palette(colours: list[tuple[int, int, int]], undertone: str) -> tuple[PaletteColour, ...]:
    roles = ('eye', 'blush', 'lip', 'accent', 'liner', 'highlight')
    return tuple(PaletteColour(c, roles[i % len(roles)], lch_score(c, undertone), 'user') for i, c in enumerate(colours[:12]))

def extract_palette(image: np.ndarray, mask: np.ndarray | None=None, count: int=6) -> tuple[tuple[int, int, int], ...]:
    rgb = image[..., :3].reshape(-1, 3)
    if mask is not None:
        active = np.asarray(mask).reshape(-1) > 0.1
        rgb = rgb[active]
    if len(rgb) == 0:
        raise ValueError('palette region is empty')
    lab = rgb_to_lab(rgb.astype(np.float64))
    luminance = lab[:, 0]
    order = np.argsort(luminance)
    picks: list[tuple[int, int, int]] = []
    for q in np.linspace(0.08, 0.92, max(1, count)):
        idx = order[min(len(order) - 1, int(q * (len(order) - 1)))]
        row = rgb[idx]
        colour = (int(row[0]), int(row[1]), int(row[2]))
        if colour not in picks:
            picks.append(colour)
    return tuple(picks)

def recommend(colours: tuple[tuple[int, int, int], ...], undertone: str) -> tuple[PaletteColour, ...]:
    ranked = sorted((PaletteColour(c, 'recommended', lch_score(c, undertone), 'local-colour-math') for c in colours), key=lambda x: x.undertone_score, reverse=True)
    return tuple(ranked)

def outfit_harmony(outfit: tuple[int, int, int], undertone: str) -> tuple[PaletteColour, ...]:
    from .colourspace import rotate_hue
    candidates = [outfit, rotate_hue(outfit, 30), rotate_hue(outfit, -30), rotate_hue(outfit, 180), rotate_hue(outfit, 150)]
    return recommend(tuple(candidates), undertone)
