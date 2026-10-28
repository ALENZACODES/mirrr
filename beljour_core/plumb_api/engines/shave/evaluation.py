'Clean-shave local evaluation. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class ShaveMetrics:
    outside_error: float
    alpha_error: float
    beard_darkness_reduction: float
    cheek_delta_e_proxy: float

def metrics(before: np.ndarray, after: np.ndarray, beard: np.ndarray, cheek: np.ndarray) -> ShaveMetrics:
    b = before[..., :3].astype(float)
    a = after[..., :3].astype(float)
    active = beard > 0.02
    outside = ~active
    delta = np.max(np.abs(a - b), axis=2)
    out = float(np.mean(delta[outside] > 1)) if np.any(outside) else 0.0
    alpha = float(np.max(np.abs(after[..., 3].astype(int) - before[..., 3].astype(int)))) if before.shape[2] == 4 else 0.0
    beard_active = beard > 0.2
    dark_before = float(255 - np.mean(b[beard_active])) if np.any(beard_active) else 0.0
    dark_after = float(255 - np.mean(a[beard_active])) if np.any(beard_active) else 0.0
    cheek_active = cheek > 0.2
    cheek_delta = float(np.mean(np.linalg.norm(a[cheek_active] - b[cheek_active], axis=1)) / 2.3) if np.any(cheek_active) else 0.0
    return ShaveMetrics(out, alpha, max(0.0, dark_before - dark_after), cheek_delta)

def passed(value: ShaveMetrics) -> bool:
    return value.outside_error <= 0.005 and value.alpha_error == 0 and (value.cheek_delta_e_proxy <= 4)
