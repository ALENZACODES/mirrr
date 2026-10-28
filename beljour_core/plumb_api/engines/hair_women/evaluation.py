'Box-side R17B women hair quality metrics. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .texture import preserve_ratio


@dataclass(frozen=True)
class HairMetrics:
    outside_error: float
    changed_fraction: float
    alpha_error: float
    texture_ratio: float
    mean_inside_change: float

def metrics(before: np.ndarray, after: np.ndarray, coverage: np.ndarray) -> HairMetrics:
    active = coverage > 0.01
    delta = np.max(np.abs(after[..., :3].astype(np.int16) - before[..., :3].astype(np.int16)), axis=2)
    outside = ~active
    outside_error = float(np.mean(delta[outside] > 1)) if np.any(outside) else 0.0
    inside = float(np.mean(delta[active])) if np.any(active) else 0.0
    changed = float(np.mean(delta > 1))
    alpha = 0.0
    if before.shape[2] == 4:
        alpha = float(np.max(np.abs(after[..., 3].astype(np.int16) - before[..., 3].astype(np.int16))))
    return HairMetrics(outside_error, changed, alpha, preserve_ratio(before, after, coverage), inside)

def passed(value: HairMetrics, feature: str) -> bool:
    texture_floor = 0.72 if feature in {'W19', 'W20', 'W22', 'W37', 'W38', 'W40', 'W43'} else 0.62
    return value.outside_error <= 0.005 and value.alpha_error == 0 and (value.texture_ratio >= texture_floor)
