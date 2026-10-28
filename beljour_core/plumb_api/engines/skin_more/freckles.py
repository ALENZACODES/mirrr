'W90 freckle preservation and procedural faux marks. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .masking import alpha_composite, validate_mask


@dataclass(frozen=True)
class FreckleSpec:
    density: float = 0.3
    radius_min: int = 1
    radius_max: int = 2
    opacity_min: float = 0.22
    opacity_max: float = 0.55
    seed: int = 0

def validate(spec: FreckleSpec) -> FreckleSpec:
    if not 0 <= spec.density <= 1:
        raise ValueError('density must be in [0,1]')
    if not 1 <= spec.radius_min <= spec.radius_max <= 5:
        raise ValueError('radii must be 1..5')
    if not 0 <= spec.opacity_min <= spec.opacity_max <= 1:
        raise ValueError('opacity range invalid')
    return spec

def procedural_points(mask: np.ndarray, spec: FreckleSpec) -> list[tuple[int, int, int, float]]:
    validate(spec)
    m = validate_mask(mask) > 0.5
    ys, xs = np.nonzero(m)
    if not len(xs):
        return []
    rng = np.random.default_rng(spec.seed)
    target = int(round(len(xs) * spec.density / 160.0))
    target = max(0, min(target, 250))
    if target == 0:
        return []
    choices = rng.choice(len(xs), size=min(target, len(xs)), replace=False)
    points = []
    for i in choices:
        r = int(rng.integers(spec.radius_min, spec.radius_max + 1))
        opacity = float(rng.uniform(spec.opacity_min, spec.opacity_max))
        points.append((int(xs[i]), int(ys[i]), r, opacity))
    return points

def raster(mask: np.ndarray, spec: FreckleSpec) -> np.ndarray:
    m = validate_mask(mask)
    h, w = m.shape
    out = np.zeros((h, w), np.float32)
    yy, xx = np.mgrid[:h, :w]
    for x, y, r, opacity in procedural_points(m, spec):
        d = (xx - x) ** 2 + (yy - y) ** 2
        spot = np.exp(-d / max(1.0, 2.0 * r * r)) * opacity
        out = np.maximum(out, spot.astype(np.float32))
    return out * m

def apply(photo: np.ndarray, mask: np.ndarray, spec: FreckleSpec, colour: tuple[int, int, int]=(96, 62, 45)) -> tuple[np.ndarray, dict[str, object]]:
    marks = raster(mask, spec)
    out = alpha_composite(photo, colour, marks, 1.0)
    points = procedural_points(mask, spec)
    return (out, {'faux': True, 'seed': spec.seed, 'requested_density': spec.density, 'mark_count': len(points), 'label': 'SIMULATION'})

def preserve(photo: np.ndarray) -> tuple[np.ndarray, dict[str, object]]:
    return (np.asarray(photo).copy(), {'faux': False, 'preserved': True, 'changed_fraction': 0.0, 'label': 'SIMULATION'})

def reproducible(mask: np.ndarray, spec: FreckleSpec) -> bool:
    return np.array_equal(raster(mask, spec), raster(mask, spec))

def protected_overlap(marks: np.ndarray, protected: np.ndarray) -> float:
    a = validate_mask(marks) > 0.01
    b = validate_mask(protected, a.shape) > 0.5
    return float(np.mean(a & b))

def density_score(marks: np.ndarray, mask: np.ndarray) -> float:
    m = validate_mask(mask) > 0.5
    if not m.any():
        return 0.0
    return float(np.mean(validate_mask(marks)[m] > 0.05))
