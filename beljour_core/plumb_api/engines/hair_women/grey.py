'Grey blending and transition evidence helpers. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .timeline import TimelinePoint, grey_transition


@dataclass(frozen=True)
class GreyEvidence:
    observed_bright_share: float
    requested_blend_share: float
    root_contrast: float
    natural_transition: tuple[TimelinePoint, ...]

def observed_grey_share(image: np.ndarray, hair_mask: np.ndarray) -> float:
    rgb = image[..., :3].astype(np.float64)
    active = hair_mask > 0.3
    if not np.any(active):
        return 0.0
    maximum = np.max(rgb, axis=2)
    minimum = np.min(rgb, axis=2)
    saturation = (maximum - minimum) / np.maximum(maximum, 1.0)
    brightness = np.mean(rgb, axis=2)
    grey = active & (brightness >= 105) & (saturation <= 0.2)
    return float(np.count_nonzero(grey)) / float(np.count_nonzero(active))

def root_contrast(image: np.ndarray, root_mask: np.ndarray, lower_mask: np.ndarray) -> float:
    rgb = image[..., :3].astype(np.float64)
    root = root_mask > 0.2
    lower = lower_mask > 0.2
    if not np.any(root) or not np.any(lower):
        return 0.0
    r = np.mean(rgb[root], axis=0)
    lower_mean = np.mean(rgb[lower], axis=0)
    return float(np.linalg.norm(r - lower_mean))

def evidence(image: np.ndarray, hair_mask: np.ndarray, root_mask: np.ndarray, lower_mask: np.ndarray, requested: float) -> GreyEvidence:
    observed = observed_grey_share(image, hair_mask)
    contrast = root_contrast(image, root_mask, lower_mask)
    timeline = grey_transition(observed, 18)
    return GreyEvidence(observed, max(0.0, min(requested, 1.0)), contrast, timeline)

def intervention_costs(months: int, visit_interval: int, price_low: float, price_high: float) -> tuple[dict[str, float | str], ...]:
    if not 1 <= visit_interval <= 24:
        raise ValueError('visit interval must be 1..24 months')
    rows: list[dict[str, float | str]] = []
    for month in range(0, max(1, months) + 1):
        visits = month // visit_interval
        rows.append({'month': float(month), 'colouring_low': visits * price_low, 'colouring_high': visits * price_high, 'natural_transition_cost': 0.0, 'label': 'optional cost comparison; no recommendation'})
    return tuple(rows)
