'Box-side R17B makeup metrics. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .colourspace import lab_to_lch, rgb_to_lab


@dataclass(frozen=True)
class MakeupMetrics:
    outside_error: float
    alpha_error: float
    mean_luminance_shift: float
    deep_chroma_ratio: float
    changed_fraction: float

def metrics(before: np.ndarray, after: np.ndarray, coverage: np.ndarray) -> MakeupMetrics:
    active = coverage > 0.01
    b = before[..., :3].astype(np.float64)
    a = after[..., :3].astype(np.float64)
    delta = np.max(np.abs(a - b), axis=2)
    outside = ~active
    outside_error = float(np.mean(delta[outside] > 1)) if np.any(outside) else 0.0
    alpha = 0.0
    if before.shape[2] == 4:
        alpha = float(np.max(np.abs(after[..., 3].astype(np.int16) - before[..., 3].astype(np.int16))))
    lum = float(np.mean(a[active] - b[active])) if np.any(active) else 0.0
    if np.any(active):
        lb = lab_to_lch(rgb_to_lab(b[active]))
        la = lab_to_lch(rgb_to_lab(a[active]))
        dark = lb[:, 0] <= 50
        ratio = float(np.mean(la[dark, 1]) / max(np.mean(lb[dark, 1]), 1e-06)) if np.any(dark) else 1.0
    else:
        ratio = 1.0
    return MakeupMetrics(outside_error, alpha, lum, ratio, float(np.mean(delta > 1)))

def passed(value: MakeupMetrics) -> bool:
    return value.outside_error <= 0.005 and value.alpha_error == 0 and (value.mean_luminance_shift <= 1.5) and (value.deep_chroma_ratio >= 0.78)
