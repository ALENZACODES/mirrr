'Synthetic and real-face metric aggregation for W45-W57. Author: John Khan.'

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import numpy as np

from .anatomy import LipAnatomy, describe
from .finish import line_energy, texture_retention
from .pigmentation import PigmentationStats


@dataclass(frozen=True)
class LipAssessment:
    feature: str
    changed_fraction: float
    outside_error: float
    alpha_exact: bool
    texture_correlation: float
    line_energy_ratio: float
    geometry: dict[str, float | str]
    pigmentation_two_tone: float | None
    warnings: tuple[str, ...]

def outside_error(original: np.ndarray, result: np.ndarray, support: np.ndarray) -> float:
    diff = np.mean(np.abs(original[..., :3].astype(np.float64) - result[..., :3].astype(np.float64)), axis=2) / 255.0
    outside = support <= 0.05
    return float(np.mean(diff[outside])) if np.any(outside) else 0.0

def assess(feature: str, original: np.ndarray, result: np.ndarray, support: np.ndarray, anatomy: LipAnatomy, pigmentation: PigmentationStats | None=None, warnings: list[str] | tuple[str, ...]=()) -> LipAssessment:
    if original.shape != result.shape:
        raise ValueError('assessment images must have identical shapes')
    if support.shape != original.shape[:2]:
        raise ValueError('assessment support must match image size')
    changed = float(np.mean(np.any(original[..., :3] != result[..., :3], axis=2)))
    alpha_exact = True
    if original.shape[2] == 4:
        alpha_exact = bool(np.array_equal(original[..., 3], result[..., 3]))
    before_energy = line_energy(original, support)
    after_energy = line_energy(result, support)
    energy_ratio = after_energy / max(before_energy, 1e-08)
    return LipAssessment(feature=feature, changed_fraction=changed, outside_error=outside_error(original, result, support), alpha_exact=alpha_exact, texture_correlation=texture_retention(original, result, support), line_energy_ratio=float(energy_ratio), geometry=describe(anatomy), pigmentation_two_tone=None if pigmentation is None else pigmentation.two_tone_score, warnings=tuple(warnings))

def gate(row: LipAssessment) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    if row.outside_error > 0.025:
        reasons.append('outside-support colour error exceeds 0.025')
    if not row.alpha_exact:
        reasons.append('source alpha changed')
    if row.texture_correlation < 0.8:
        reasons.append('texture correlation below 0.80')
    if row.feature in {'W45', 'W48', 'W49'} and (not 0.55 <= row.line_energy_ratio <= 1.65):
        reasons.append('geometry preview damaged local line energy')
    if row.feature == 'W55' and row.line_energy_ratio < 0.55:
        reasons.append('finish preview flattened lip lines')
    return (not reasons, reasons)

def group_report(rows: list[LipAssessment]) -> dict[str, Any]:
    verdicts = [gate(row) for row in rows]
    return {'group': 'lips', 'features': [asdict(row) | {'passed': verdicts[i][0], 'failures': verdicts[i][1]} for i, row in enumerate(rows)], 'tested': len(rows), 'passed': sum(ok for ok, _ in verdicts), 'failed': sum(not ok for ok, _ in verdicts), 'status': 'passed' if rows and all(ok for ok, _ in verdicts) else 'not passed', 'claim': 'Metrics describe the supplied local images only; no frozen-set release claim is implied.'}
