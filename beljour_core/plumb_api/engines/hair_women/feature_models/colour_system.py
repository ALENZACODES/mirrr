'Hair colour placement models for W23/W26/W29-W36. Author: John Khan.'
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class FoilBand:
    start: float
    end: float
    weight: float
    side: str

def _finite(value: float, name: str) -> float:
    if not math.isfinite(value):
        raise ValueError(f'{name} must be finite')
    return value

def root_depth(amount: float, root_width: float=0.1) -> dict[str, float | str]:
    a = min(1.0, max(0.0, _finite(amount, 'amount')))
    width = min(0.22, max(0.03, _finite(root_width, 'root_width')))
    return {'band_ratio': width, 'opacity': 0.2 + 0.62 * a, 'label': 'root colour simulation'}

def money_piece(amount: float, face_width: float=0.42) -> tuple[FoilBand, FoilBand]:
    a = min(1.0, max(0.0, _finite(amount, 'amount')))
    width = min(0.16, max(0.035, face_width * (0.1 + 0.05 * a)))
    return (FoilBand(0.18, 0.18 + width, 0.35 + 0.55 * a, 'left'), FoilBand(0.82 - width, 0.82, 0.35 + 0.55 * a, 'right'))

def foil_map(style: str, density: float, seed: int=17) -> tuple[FoilBand, ...]:
    if style not in {'babylights', 'lowlights', 'balanced', 'chunky', 'lived_in'}:
        raise ValueError('unsupported foil style')
    d = min(1.0, max(0.0, _finite(density, 'density')))
    base = {'babylights': 11, 'lowlights': 7, 'balanced': 9, 'chunky': 5, 'lived_in': 6}[style]
    count = max(2, round(base * (0.45 + 0.55 * d)))
    bands: list[FoilBand] = []
    phase = seed % 19 / 19.0
    for i in range(count):
        centre = 0.08 + 0.84 * ((i + phase) / max(count - 1 + phase, 1.0))
        width = (0.012 if style == 'babylights' else 0.025 if style != 'chunky' else 0.052) * (0.8 + 0.4 * d)
        bands.append(FoilBand(max(0.0, centre - width), min(1.0, centre + width), 0.25 + 0.65 * d, 'both'))
    return tuple(bands)

def ombre_curve(start: float, softness: float, samples: int=17) -> tuple[float, ...]:
    s = min(0.9, max(0.05, _finite(start, 'start')))
    soft = min(0.4, max(0.02, _finite(softness, 'softness')))
    n = max(5, min(samples, 101))
    values: list[float] = []
    for i in range(n):
        y = i / (n - 1)
        x = (y - s) / soft
        values.append(1.0 / (1.0 + math.exp(-x)))
    return tuple(values)

def split_partition(part_x: float, feather: float=0.025) -> dict[str, float]:
    p = min(0.8, max(0.2, _finite(part_x, 'part_x')))
    f = min(0.12, max(0.0, _finite(feather, 'feather')))
    return {'part_x': p, 'left_end': max(0.0, p - f), 'right_start': min(1.0, p + f)}

def peekaboo_region(side: str, reveal: float) -> dict[str, float | str]:
    if side not in {'left', 'right', 'both'}:
        raise ValueError('side must be left, right or both')
    r = min(1.0, max(0.0, _finite(reveal, 'reveal')))
    return {'side': side, 'lower_start': 0.52 - 0.1 * r, 'outer_width': 0.18 + 0.14 * r, 'opacity': 0.25 + 0.65 * r}
