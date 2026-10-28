'Smile checked-region evidence helpers. Author: John Khan.'

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

import numpy as np

from .annotations import validate_for_feature
from .contracts import SmileAnnotation
from .geometry import polygon_mask


@dataclass(frozen=True)
class SmileEvidence:
    feature: str
    tested: bool
    changed_fraction: float
    outside_fraction: float
    alpha_preserved: bool
    annotation_valid: bool
    passed: bool
    reasons: tuple[str, ...]

def allowed_mask(feature: str, h: int, w: int, annotation: SmileAnnotation) -> np.ndarray:
    validate_for_feature(annotation, feature)
    masks = []
    if annotation.teeth:
        masks.append(polygon_mask(h, w, annotation.teeth))
    if annotation.gum:
        masks.append(polygon_mask(h, w, annotation.gum))
    if not masks:
        return np.zeros((h, w), np.float32)
    out = np.zeros((h, w), np.float32)
    for m in masks:
        out = np.maximum(out, m)
    return out

def measure(feature: str, before: np.ndarray, after: np.ndarray, annotation: SmileAnnotation) -> SmileEvidence:
    if before.shape != after.shape:
        raise ValueError('image shape mismatch')
    reasons = []
    try:
        mask = allowed_mask(feature, before.shape[0], before.shape[1], annotation)
        valid = True
    except ValueError as exc:
        return SmileEvidence(feature, True, 0, 1, True, False, False, (str(exc),))
    changed = np.any(before[..., :3] != after[..., :3], axis=2)
    outside = mask < 0.01
    outside_fraction = float(np.mean(changed[outside])) if outside.any() else 0.0
    alpha = bool(np.array_equal(before[..., 3], after[..., 3])) if before.shape[2] == 4 else True
    if outside_fraction > 0.005:
        reasons.append('change escaped checked oral region')
    if not alpha:
        reasons.append('alpha changed')
    return SmileEvidence(feature, True, float(np.mean(changed)), outside_fraction, alpha, valid, not reasons, tuple(reasons))

def aggregate(rows: Iterable[SmileEvidence]) -> dict[str, object]:
    items = list(rows)
    tested = sum(r.tested for r in items)
    passed = sum(r.tested and r.passed for r in items)
    return {'tested': tested, 'passed': passed, 'failed': tested - passed, 'not_tested': len(items) - tested, 'pass_rate': passed / tested if tested else None, 'release_ready': tested > 0 and passed == tested and (tested == len(items))}
