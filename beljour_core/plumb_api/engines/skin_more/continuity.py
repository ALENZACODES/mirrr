'W79/W91 checked-region continuity tools. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .colorimetry import compare_regions, robust_region_colour
from .masking import alpha_composite, feather, outside_change_fraction


@dataclass(frozen=True)
class ContinuityMeasurement:
    delta_e: float
    lightness_gap: float
    chroma_gap: float
    source_pixels: int
    target_pixels: int
    lighting_warning: bool

@dataclass(frozen=True)
class ContinuityPlan:
    source_rgb: tuple[int, int, int]
    opacity: float
    maximum_delta_e_reduction: float
    note: str

def measure(photo: np.ndarray, source: np.ndarray, target: np.ndarray) -> ContinuityMeasurement:
    s = robust_region_colour(photo, source)
    t = robust_region_colour(photo, target)
    d = compare_regions(photo, source, target)
    lighting_warning = abs(s.luma - t.luma) > 0.2
    return ContinuityMeasurement(d.delta_e76, d.lightness, d.chroma, s.pixel_count, t.pixel_count, lighting_warning)

def plan(photo: np.ndarray, source: np.ndarray, target: np.ndarray, amount: float) -> ContinuityPlan:
    if not 0 <= amount <= 1:
        raise ValueError('amount must be in [0,1]')
    m = measure(photo, source, target)
    s = robust_region_colour(photo, source)
    rgb_values = [int(round(v)) for v in s.rgb]
    rgb = (rgb_values[0], rgb_values[1], rgb_values[2])
    lighting_factor = 0.45 if m.lighting_warning else 1.0
    opacity = min(0.18, m.delta_e / 120.0) * amount * lighting_factor
    return ContinuityPlan(rgb, opacity, 0.45, 'Colour continuity only; body shape and worth are never scored.')

def apply(photo: np.ndarray, target: np.ndarray, p: ContinuityPlan) -> np.ndarray:
    return alpha_composite(photo, p.source_rgb, feather(target, 4), p.opacity)

def evaluate(before: np.ndarray, after: np.ndarray, source: np.ndarray, target: np.ndarray) -> dict[str, float | bool]:
    b = measure(before, source, target)
    a = measure(after, source, target)
    outside = outside_change_fraction(before, after, target)
    improved = a.delta_e <= b.delta_e + 1e-06
    overcorrected = b.delta_e - a.delta_e > max(2.0, b.delta_e * 0.6)
    return {'before_delta_e': b.delta_e, 'after_delta_e': a.delta_e, 'improved': improved, 'overcorrected': overcorrected, 'outside_change_fraction': outside, 'pass': improved and (not overcorrected) and (outside <= 0.001)}

def region_pair_names(names: list[str]) -> tuple[str, str]:
    preferred = [('face', 'neck'), ('neck', 'chest'), ('face', 'chest'), ('face', 'hand')]
    have = set(names)
    for pair in preferred:
        if pair[0] in have and pair[1] in have:
            return pair
    if len(names) < 2:
        raise ValueError('two checked regions are required')
    return (names[0], names[1])

def lighting_caveat(measurement: ContinuityMeasurement) -> str:
    if measurement.lighting_warning:
        return 'The checked regions have a large luminance gap, so lighting may dominate the apparent colour difference.'
    return 'The comparison is within one photo but still depends on local lighting and camera processing.'

def continuity_report(photo: np.ndarray, regions: dict[str, np.ndarray]) -> dict[str, object]:
    names = sorted(regions)
    a, b = region_pair_names(names)
    m = measure(photo, regions[a], regions[b])
    return {'source': a, 'target': b, 'delta_e': m.delta_e, 'lightness_gap': m.lightness_gap, 'chroma_gap': m.chroma_gap, 'lighting_warning': m.lighting_warning, 'caveat': lighting_caveat(m), 'body_shape_scored': False}
