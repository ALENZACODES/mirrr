'Per-feature dental consultation assessment aggregation. Author: John Khan.'

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import numpy as np

from .annotations import AnnotationStats, stats
from .contracts import SmileAnnotation


@dataclass(frozen=True)
class SmileAssessment:
    feature: str
    changed_fraction: float
    outside_error: float
    alpha_exact: bool
    annotation: AnnotationStats
    consultation_label: bool
    diagnosis_claim: bool
    warnings: tuple[str, ...]

def assess(feature: str, original: np.ndarray, result: np.ndarray, support: np.ndarray, annotation: SmileAnnotation, label: str, warnings: list[str] | tuple[str, ...]=()) -> SmileAssessment:
    if original.shape != result.shape:
        raise ValueError('smile assessment images must match')
    if support.shape != original.shape[:2]:
        raise ValueError('smile support shape mismatch')
    diff = np.mean(np.abs(original[..., :3].astype(np.float64) - result[..., :3].astype(np.float64)), axis=2) / 255.0
    outside = support <= 0.05
    outside_error = float(np.mean(diff[outside])) if np.any(outside) else 0.0
    alpha_exact = True
    if original.shape[2] == 4:
        alpha_exact = bool(np.array_equal(original[..., 3], result[..., 3]))
    return SmileAssessment(feature=feature, changed_fraction=float(np.mean(diff > 1e-08)), outside_error=outside_error, alpha_exact=alpha_exact, annotation=stats(annotation), consultation_label='consultation' in label.lower() or 'dental' in label.lower(), diagnosis_claim=False, warnings=tuple(warnings))

def gate(row: SmileAssessment) -> tuple[bool, list[str]]:
    failures: list[str] = []
    if row.outside_error > 0.012:
        failures.append('outside checked dental region error exceeds 0.012')
    if not row.alpha_exact:
        failures.append('source alpha changed')
    if not row.consultation_label:
        failures.append('consultation label is missing')
    if row.diagnosis_claim:
        failures.append('diagnostic claim present')
    if row.annotation.tooth_area <= 0:
        failures.append('checked tooth polygon has no area')
    if row.feature in {'W50', 'W53'} and row.annotation.gum_area <= 0:
        failures.append('checked gum polygon is missing')
    return (not failures, failures)

def group_report(rows: list[SmileAssessment]) -> dict[str, Any]:
    verdicts = [gate(row) for row in rows]
    return {'group': 'smile', 'features': [asdict(row) | {'passed': verdicts[i][0], 'failures': verdicts[i][1]} for i, row in enumerate(rows)], 'tested': len(rows), 'passed': sum(ok for ok, _ in verdicts), 'failed': sum(not ok for ok, _ in verdicts), 'status': 'passed' if rows and all(ok for ok, _ in verdicts) else 'not passed', 'claim': 'Checked-annotation consultation metrics only; no treatment suitability or frozen-set claim.'}
