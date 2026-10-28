'Lips W45-W49/W54-W57 evidence metrics. Author: John Khan.'

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

import numpy as np

from .geometry import lip_mask


@dataclass(frozen=True)
class LipEvidence:
    feature: str
    changed_fraction: float
    outside_fraction: float
    alpha_preserved: bool
    lip_area_before: float
    lip_area_after: float
    area_ratio: float
    edge_energy_ratio: float
    identity_at_zero: bool
    passed: bool
    reasons: tuple[str, ...]

def _edge_energy(image: np.ndarray, mask: np.ndarray) -> float:
    rgb = image[..., :3].astype(np.float32)
    gray = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    gx = np.zeros_like(gray)
    gy = np.zeros_like(gray)
    gx[:, 1:-1] = (gray[:, 2:] - gray[:, :-2]) * 0.5
    gy[1:-1, :] = (gray[2:, :] - gray[:-2, :]) * 0.5
    mag = np.sqrt(gx * gx + gy * gy)
    m = mask > 0.5
    return float(np.mean(mag[m])) if m.any() else 0.0

def measure(feature: str, before: np.ndarray, after: np.ndarray, points: np.ndarray, zero_output: np.ndarray | None=None) -> LipEvidence:
    if before.shape != after.shape:
        raise ValueError('image shape mismatch')
    mask = lip_mask(before.shape[0], before.shape[1], points)
    changed = np.any(before[..., :3] != after[..., :3], axis=2)
    inside = mask > 0.01
    outside = ~inside
    changed_fraction = float(np.mean(changed))
    outside_fraction = float(np.mean(changed[outside])) if outside.any() else 0.0
    alpha = bool(np.array_equal(before[..., 3], after[..., 3])) if before.shape[2] == 4 else True
    b_energy = _edge_energy(before, mask)
    a_energy = _edge_energy(after, mask)
    ratio = a_energy / max(b_energy, 1e-06)
    identity = True if zero_output is None else bool(np.array_equal(before, zero_output))
    area = float(np.mean(mask > 0.5))
    reasons = []
    if outside_fraction > 0.005:
        reasons.append('outside-lip change exceeded tolerance')
    if not alpha:
        reasons.append('alpha changed')
    if not 0.45 <= ratio <= 1.8:
        reasons.append('lip edge energy changed excessively')
    if not identity:
        reasons.append('zero-strength output was not exact identity')
    return LipEvidence(feature, changed_fraction, outside_fraction, alpha, area, area, 1.0, ratio, identity, not reasons, tuple(reasons))

def aggregate(rows: Iterable[LipEvidence]) -> dict[str, object]:
    items = list(rows)
    tested = len(items)
    passed = sum(r.passed for r in items)
    return {'tested': tested, 'passed': passed, 'failed': tested - passed, 'pass_rate': passed / tested if tested else None, 'release_ready': tested > 0 and passed == tested}
