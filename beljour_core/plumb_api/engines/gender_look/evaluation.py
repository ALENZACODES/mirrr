'Gender-look identity and skin-colour metrics. Author: John Khan.'
from __future__ import annotations

import numpy as np


def cheek_delta(before: np.ndarray, after: np.ndarray, cheek: np.ndarray) -> float:
    active = np.asarray(cheek) > 0.2
    if not np.any(active):
        return 0.0
    return float(np.mean(np.sqrt(np.sum((after[..., :3].astype(float)[active] - before[..., :3].astype(float)[active]) ** 2, axis=1))) / 2.3)

def identity_pins(before_points: np.ndarray, after_points: np.ndarray) -> bool:
    a = np.asarray(before_points, float)
    b = np.asarray(after_points, float)
    return a.shape == b.shape and bool(np.allclose(a, b, atol=1e-12))
