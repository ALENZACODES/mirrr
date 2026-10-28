'Scope and safety assessment for the clean-shave appearance estimate. Author: John Khan.'
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class ShaveAssessment:
    accepted: bool
    scope: str
    confidence: float
    reason: str
    label: str

def assess(coverage: float, estimated_length_mm: float, mask_confidence: float) -> ShaveAssessment:
    if not all(math.isfinite(v) for v in (coverage, estimated_length_mm, mask_confidence)):
        raise ValueError('assessment values must be finite')
    if not 0 <= coverage <= 1 or not 0 <= mask_confidence <= 1:
        raise ValueError('coverage and mask_confidence must be 0..1')
    if estimated_length_mm < 0 or estimated_length_mm > 100:
        raise ValueError('estimated_length_mm outside supported range')
    if mask_confidence < 0.55:
        return ShaveAssessment(False, 'unknown', mask_confidence, 'beard mask confidence is too low', 'not tested')
    if estimated_length_mm > 8:
        return ShaveAssessment(False, 'long_beard', mask_confidence, 'clean-shave preview is limited to stubble and short beards', 'refused')
    if coverage < 0.005:
        return ShaveAssessment(False, 'none', mask_confidence, 'no meaningful stubble/short-beard region supplied', 'not applicable')
    scope = 'stubble' if estimated_length_mm <= 2.5 else 'short_beard'
    confidence = min(mask_confidence, 0.95 if scope == 'stubble' else 0.85)
    return ShaveAssessment(True, scope, confidence, 'within supported visual-estimate scope', 'clean-shave visual estimate')

def amount_cap(scope: str, skin_delta_budget: float=4.0) -> float:
    if scope not in {'stubble', 'short_beard'}:
        return 0.0
    if not math.isfinite(skin_delta_budget) or skin_delta_budget <= 0:
        raise ValueError('skin_delta_budget must be positive')
    base = 0.9 if scope == 'stubble' else 0.72
    return min(base, max(0.15, skin_delta_budget / 4.0 * base))

def report(assessment: ShaveAssessment) -> dict[str, object]:
    return {'accepted': assessment.accepted, 'scope': assessment.scope, 'confidence': assessment.confidence, 'reason': assessment.reason, 'label': assessment.label, 'simulation': True, 'medical_advice': False, 'identity_geometry_changed': False}
