'Safety/claim gates for Skin & More. Author: John Khan.'

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass

FEATURES = tuple(f'W{i}' for i in range(77, 93))

REGION_REQUIRED = frozenset({'W79', 'W80', 'W81', 'W82', 'W85', 'W86', 'W87', 'W88', 'W90', 'W91'})

HEALTH_CONSENT = frozenset({'W83'})

CULTURAL_REVIEW = frozenset({'W88'})

TEXTURE_REQUIRED = frozenset({'W77', 'W84', 'W92'})

_FORBIDDEN_CLAIMS = {'W78': ('safe tan', 'healthy tan', 'uv protection', 'sun protection'), 'W80': ('spf efficacy', 'blocks uv', 'protects from sun', 'clinically proven'), 'W81': ('melasma diagnosis', 'disease', 'treatment'), 'W82': ('rosacea diagnosis', 'cure', 'treats redness'), 'W83': ('fertility', 'ovulation prediction', 'pregnancy prediction', 'diagnosis'), 'W84': ('reverse ageing', 'anti-aging', 'anti ageing', 'look younger'), 'W92': ('reverse ageing', 'erase wrinkles', 'look younger', 'anti-aging')}

@dataclass(frozen=True)
class SafetyDecision:
    feature: str
    allowed: bool
    reasons: tuple[str, ...]
    required_labels: tuple[str, ...]
    region_required: bool
    health_consent_required: bool
    cultural_review_required: bool

def required_labels(feature: str) -> tuple[str, ...]:
    if feature not in FEATURES:
        raise ValueError('unknown Skin & More feature')
    labels = ['SIMULATION']
    if feature in {'W78', 'W80'}:
        labels.append('NO SPF/UV EFFICACY CLAIM')
    if feature in {'W81', 'W82'}:
        labels.append('NOT A DIAGNOSIS')
    if feature == 'W83':
        labels.extend(['LOCAL SELF-OBSERVATION', 'NOT MEDICAL ADVICE'])
    if feature in {'W84', 'W92'}:
        labels.append('PRO-AGE · TEXTURE RETAINED')
    if feature == 'W88':
        labels.append('CULTURAL REVIEW REQUIRED BEFORE RELEASE')
    return tuple(labels)

def lint_copy(feature: str, text: str) -> tuple[str, ...]:
    if feature not in FEATURES:
        raise ValueError('unknown feature')
    lower = ' '.join(str(text).lower().split())
    findings = []
    for phrase in _FORBIDDEN_CLAIMS.get(feature, ()):
        if phrase in lower:
            findings.append(f'forbidden claim: {phrase}')
    absolute = ('guaranteed', 'perfect match', 'works for everyone', 'zero risk')
    for phrase in absolute:
        if phrase in lower:
            findings.append(f'absolute claim: {phrase}')
    return tuple(findings)

def decide(feature: str, *, copy: str='', regions: Mapping[str, object] | None=None, health_consent: bool=False, cultural_review_complete: bool=False) -> SafetyDecision:
    if feature not in FEATURES:
        raise ValueError('unknown Skin & More feature')
    reasons = list(lint_copy(feature, copy))
    regions = regions or {}
    if feature in REGION_REQUIRED and (not regions):
        reasons.append('checked region required')
    if feature in HEALTH_CONSENT and (not health_consent):
        reasons.append('explicit local health-data consent required')
    if feature in CULTURAL_REVIEW and (not cultural_review_complete):
        reasons.append('cultural co-design review remains a release dependency')
    return SafetyDecision(feature, not reasons, tuple(reasons), required_labels(feature), feature in REGION_REQUIRED, feature in HEALTH_CONSENT, feature in CULTURAL_REVIEW)

def release_blockers(feature: str, decision: SafetyDecision, real_face_tested: bool, real_face_passed: bool) -> tuple[str, ...]:
    blockers = list(decision.reasons)
    if not real_face_tested:
        blockers.append('real-face gate not tested')
    elif not real_face_passed:
        blockers.append('real-face gate failed')
    if feature in CULTURAL_REVIEW and decision.cultural_review_required:
        blockers.append('cultural review must be recorded separately')
    return tuple(dict.fromkeys(blockers))

def audit_copy(rows: Iterable[tuple[str, str]]) -> dict[str, object]:
    findings = []
    for feature, text in rows:
        for finding in lint_copy(feature, text):
            findings.append({'feature': feature, 'finding': finding})
    return {'rows': sum(1 for _ in rows) if not isinstance(rows, list) else len(rows), 'findings': findings, 'pass': not findings}
