'R16B Skin & More release-gate assessment. Author: John Khan.'

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass

import numpy as np

from .benchmark import PASS_DEFINITIONS
from .masking import outside_change_fraction, validate_mask
from .texture import texture_gate


@dataclass(frozen=True)
class CaseAssessment:
    feature: str
    tested: bool
    passed: bool
    changed_fraction: float
    outside_change_fraction: float | None
    alpha_preserved: bool
    texture_score: float | None
    reasons: tuple[str, ...]

@dataclass(frozen=True)
class GroupAssessment:
    feature: str
    tested: int
    passed: int
    failed: int
    not_tested: int
    pass_rate: float | None
    release_ready: bool
    definition: str

def assess_case(feature: str, before: np.ndarray, after: np.ndarray, allowed: np.ndarray | None, requires_texture: bool=False) -> CaseAssessment:
    if feature not in PASS_DEFINITIONS:
        raise ValueError('unknown Skin & More feature')
    if before.shape != after.shape:
        raise ValueError('before/after shape mismatch')
    changed = np.any(before[..., :3] != after[..., :3], axis=2)
    changed_fraction = float(np.mean(changed))
    alpha = bool(np.array_equal(before[..., 3], after[..., 3])) if before.shape[2] == 4 else True
    outside = None
    reasons = []
    if allowed is not None:
        mask = validate_mask(allowed, before.shape[:2])
        outside = outside_change_fraction(before, after, mask)
        if outside > 0.002:
            reasons.append('pixels changed outside checked/allowed region')
    texture = None
    if requires_texture and allowed is not None:
        gate = texture_gate(before, after, allowed)
        texture = float(gate['score'])
        if not gate['pass']:
            reasons.append('texture-retention gate failed')
    if not alpha:
        reasons.append('alpha changed')
    return CaseAssessment(feature, True, not reasons, changed_fraction, outside, alpha, texture, tuple(reasons))

def not_tested(feature: str, reason: str) -> CaseAssessment:
    if feature not in PASS_DEFINITIONS:
        raise ValueError('unknown feature')
    return CaseAssessment(feature, False, False, 0, None, True, None, (reason,))

def aggregate(feature: str, cases: Iterable[CaseAssessment], required_cases: int=1) -> GroupAssessment:
    rows = [c for c in cases if c.feature == feature]
    tested = sum(c.tested for c in rows)
    passed = sum(c.tested and c.passed for c in rows)
    failed = tested - passed
    missing = sum(not c.tested for c in rows)
    rate = passed / tested if tested else None
    ready = tested >= required_cases and failed == 0 and (missing == 0)
    return GroupAssessment(feature, tested, passed, failed, missing, rate, ready, PASS_DEFINITIONS[feature])

def aggregate_all(cases: Iterable[CaseAssessment], features: Iterable[str] | None=None, required_cases: int=1) -> dict[str, GroupAssessment]:
    rows = list(cases)
    wanted = list(features or sorted(PASS_DEFINITIONS))
    return {f: aggregate(f, rows, required_cases) for f in wanted}

def release_summary(groups: Mapping[str, GroupAssessment]) -> dict[str, object]:
    ready = [f for f, g in groups.items() if g.release_ready]
    blocked = [f for f, g in groups.items() if not g.release_ready]
    return {'ready': ready, 'blocked': blocked, 'all_ready': not blocked, 'real_face_gate': 'required before public release', 'simulation_labels': True}

def fairness_slice(cases: Iterable[CaseAssessment], labels: Iterable[str]) -> dict[str, dict[str, float | int | None]]:
    rows = list(cases)
    labs = list(labels)
    if len(rows) != len(labs):
        raise ValueError('labels must align with cases')
    buckets: dict[str, list[CaseAssessment]] = {}
    for case, label in zip(rows, labs, strict=True):
        buckets.setdefault(str(label), []).append(case)
    result = {}
    for label, items in sorted(buckets.items()):
        tested = [c for c in items if c.tested]
        passed = sum(c.passed for c in tested)
        result[label] = {'tested': len(tested), 'passed': passed, 'pass_rate': passed / len(tested) if tested else None}
    return result
