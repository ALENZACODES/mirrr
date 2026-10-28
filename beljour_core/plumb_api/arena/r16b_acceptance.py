'R16 Lane B acceptance catalogue and result auditing.\n\nThis module turns the W45-W58 and W77-W92 source-spec "Must" clauses into\nstable executable test identifiers. It deliberately separates evidence\nrequirements from visual quality so missing real-face evidence is never reported\nas a pass. No face data is persisted here. Author: John Khan.\n'

from __future__ import annotations

import math
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any, TypeGuard


@dataclass(frozen=True)
class AcceptanceContract:
    feature: str
    group: str
    name: str
    test_id: str
    pass_definition: str
    requires_adult: bool = False
    requires_checked_region: bool = False
    requires_checked_sequence: bool = False
    requires_health_consent: bool = False
    requires_cultural_review: bool = False
    release_evidence: tuple[str, ...] = ()

@dataclass(frozen=True)
class AcceptanceResult:
    feature: str
    test_id: str
    status: str
    passed: bool
    reasons: tuple[str, ...]
    metrics: Mapping[str, float | int | bool | str | None]

CONTRACTS: tuple[AcceptanceContract, ...] = (AcceptanceContract(feature='W45', group='lips', name='Fuller lips shape control', test_id='W45_TEST_ANATOMICAL_CAP', pass_definition='Adult-gated geometry stays bounded by observed lip anatomy; zero strength is identity; output remains a simulation.', requires_adult=True, release_evidence=('locality', 'zero_identity', 'geometry_cap', 'real_face_review')), AcceptanceContract(feature='W46', group='lips', name='Realistic overline', test_id='W46_TEST_EDGE_FOLLOW', pass_definition='Guide follows the observed vermilion edge, suppresses corners and limits pixels outside the lip support.', release_evidence=('locality', 'edge_alignment', 'daylight_review')), AcceptanceContract(feature='W47', group='lips', name='Lip tint and blush PMU states', test_id='W47_TEST_FADE_ORDER', pass_definition='Fresh, healed and fade display states are monotonically weaker and are never described as retention predictions.', requires_adult=True, release_evidence=('fade_order', 'copy_review', 'deep_lip_review')), AcceptanceContract(feature='W48', group='lips', name='Lip flip appearance', test_id='W48_TEST_UPPER_LIP_BOUND', pass_definition='Adult-gated upper-lip appearance shift stays within the conservative geometry cap and makes no muscle or treatment claim.', requires_adult=True, release_evidence=('geometry_cap', 'locality', 'copy_review')), AcceptanceContract(feature='W49', group='lips', name='Filler dose-style comparison', test_id='W49_TEST_STYLE_NOT_DOSE', pass_definition='Dose wording is a visual style label only; geometry remains capped and no real millilitre-to-outcome mapping is claimed.', requires_adult=True, release_evidence=('geometry_cap', 'copy_review', 'real_face_review')), AcceptanceContract(feature='W50', group='smile', name='Gum-show appearance consultation', test_id='W50_TEST_CHECKED_GUM_ONLY', pass_definition='Only checked gum and tooth polygons are used; output is static and contains no causal diagnosis or treatment recommendation.', requires_adult=True, requires_checked_region=True, release_evidence=('annotation_provenance', 'locality', 'copy_review')), AcceptanceContract(feature='W51', group='smile', name='Veneer design preview', test_id='W51_TEST_CHECKED_TEETH_ONLY', pass_definition='Only checked teeth are edited; shape and shade are bounded; no automatic segmentation model or clinical material outcome is claimed.', requires_adult=True, requires_checked_region=True, release_evidence=('annotation_provenance', 'shade_review', 'irreversibility_copy')), AcceptanceContract(feature='W52', group='smile', name='Tooth-gap preference preview', test_id='W52_TEST_KEEP_FIRST_CLASS', pass_definition='Keep is a first-class option; partial and visual closure are bounded; no beauty score or orthodontic outcome is presented.', requires_adult=True, requires_checked_region=True, release_evidence=('annotation_provenance', 'midline_check', 'copy_review')), AcceptanceContract(feature='W53', group='smile', name='Tooth and gum character', test_id='W53_TEST_GUM_GUIDE_DISCLOSURE', pass_definition='Checked gum and teeth drive the guide; tooth character remains editable; surgical context is disclosed without treatment advice.', requires_adult=True, requires_checked_region=True, release_evidence=('annotation_provenance', 'gum_line_check', 'copy_review')), AcceptanceContract(feature='W54', group='lips', name='Optical tooth contrast from lip shade', test_id='W54_TEST_TEETH_UNCHANGED', pass_definition='Teeth pixels remain byte-identical; only adjacent lip colour changes perceived contrast.', release_evidence=('protected_teeth', 'locality', 'copy_review')), AcceptanceContract(feature='W55', group='lips', name='Lipstick finish', test_id='W55_TEST_TEXTURE_RETENTION', pass_definition='Finish changes colour or reflectance while retaining measurable source-lip texture and original alpha.', release_evidence=('texture_retention', 'alpha_identity', 'locality')), AcceptanceContract(feature='W56', group='lips', name='Wear-off scenarios', test_id='W56_TEST_DETERMINISTIC_WEAR', pass_definition='Same seed and scenario are deterministic; stronger wear does not increase retained colour; no product-duration promise is made.', release_evidence=('determinism', 'wear_order', 'copy_review')), AcceptanceContract(feature='W57', group='lips', name='Pigmentation-aware lip colour', test_id='W57_TEST_PIGMENT_PRESERVATION', pass_definition='Opacity adapts to observed lip pigmentation only inside the lip mask and natural variation is not labelled a defect.', release_evidence=('locality', 'pigmentation_review', 'copy_review')), AcceptanceContract(feature='W58', group='smile', name='Smile in motion', test_id='W58_TEST_CHECKED_FRAME_STABILITY', pass_definition='At least two time-ordered checked frames are required; annotation jumps are bounded; automatic tracking is not claimed.', requires_adult=True, requires_checked_sequence=True, release_evidence=('frame_provenance', 'temporal_stability', 'real_sequence_review')), AcceptanceContract(feature='W77', group='skin_more', name='Sheer skin tint', test_id='W77_TEST_TEXTURE_FIRST_TINT', pass_definition='Tint is bounded, zero strength is identity, texture remains visible and no skin-tone ranking or lightening objective is used.', release_evidence=('texture_retention', 'zero_identity', 'fairness_slice')), AcceptanceContract(feature='W78', group='skin_more', name='Cosmetic tan', test_id='W78_TEST_DRY_ZONE_BOUND', pass_definition='Cosmetic colour is bounded, dry zones receive no more colour than the base mask and no UV or health claim is made.', release_evidence=('locality', 'dry_zone_review', 'copy_review')), AcceptanceContract(feature='W79', group='skin_more', name='Face and body tone match', test_id='W79_TEST_DELTA_REDUCTION', pass_definition='Checked-region colour distance decreases without changing unmarked pixels or asserting a preferred skin tone.', requires_checked_region=True, release_evidence=('region_delta', 'locality', 'fairness_slice')), AcceptanceContract(feature='W80', group='skin_more', name='Visual sunscreen cast', test_id='W80_TEST_NO_EFFICACY_CLAIM', pass_definition='Only the checked region receives a visual cast simulation and the output explicitly makes no SPF or UV-efficacy claim.', requires_checked_region=True, release_evidence=('locality', 'cast_order', 'copy_review')), AcceptanceContract(feature='W81', group='skin_more', name='Marked pigmentation concealing', test_id='W81_TEST_USER_MARKED_ONLY', pass_definition='Only user-marked deeper-pigmentation regions receive bounded corrector; no diagnosis or defect label is generated.', requires_checked_region=True, release_evidence=('locality', 'corrector_bound', 'fairness_slice')), AcceptanceContract(feature='W82', group='skin_more', name='Marked redness correction', test_id='W82_TEST_NO_DIAGNOSIS', pass_definition='Only user-marked redness appearance is changed; correction is bounded and no medical diagnosis is inferred.', requires_checked_region=True, release_evidence=('locality', 'corrector_bound', 'copy_review')), AcceptanceContract(feature='W83', group='skin_more', name='Local cycle-linked appearance diary', test_id='W83_TEST_CONSENT_NO_PREDICTION', pass_definition='Explicit local health-data consent is required; entries remain local and the diary does not predict fertility, cycle timing or diagnosis.', requires_health_consent=True, release_evidence=('consent', 'local_storage_review', 'copy_review')), AcceptanceContract(feature='W84', group='skin_more', name='Mature-skin texture-first mode', test_id='W84_TEST_ZERO_LINE_BLUR', pass_definition='Texture remains measurable, line blur is zero and copy does not promise younger-looking or anti-age outcomes.', release_evidence=('texture_retention', 'line_blur_zero', 'copy_review')), AcceptanceContract(feature='W85', group='skin_more', name='Jewellery placement', test_id='W85_TEST_CHECKED_PLACEMENT', pass_definition='Procedural jewellery is constrained to checked placement support and does not claim millimetre sizing without calibration.', requires_checked_region=True, release_evidence=('placement', 'locality', 'calibration_copy')), AcceptanceContract(feature='W86', group='skin_more', name='Glasses placement', test_id='W86_TEST_CHECKED_FRAME_FIT', pass_definition='Procedural frames stay within checked fit support, preserve protected facial regions and avoid uncalibrated physical-size claims.', requires_checked_region=True, release_evidence=('placement', 'symmetry', 'protected_regions')), AcceptanceContract(feature='W87', group='skin_more', name='Nail colour', test_id='W87_TEST_MANUAL_NAIL_REGION', pass_definition='Only manually checked nail regions receive colour; no automatic hand model is introduced and surrounding pixels stay unchanged.', requires_checked_region=True, release_evidence=('annotation_provenance', 'locality', 'alpha_identity')), AcceptanceContract(feature='W88', group='skin_more', name='Hijab colour and drape', test_id='W88_TEST_HAIR_PROTECTION', pass_definition='Only checked scarf support is coloured, protected hair remains unchanged and public release remains gated on cultural co-design review.', requires_checked_region=True, requires_cultural_review=True, release_evidence=('locality', 'hair_protection', 'cultural_review')), AcceptanceContract(feature='W89', group='skin_more', name='Occasion bundles', test_id='W89_TEST_EDITABLE_BUNDLE', pass_definition='Every bundle is editable into individual controls, uses plain occasion wording and makes no competence or attractiveness claim.', release_evidence=('editability', 'copy_review', 'zero_identity')), AcceptanceContract(feature='W90', group='skin_more', name='Freckles', test_id='W90_TEST_PRESERVE_FIRST_CLASS', pass_definition='Preserve is a first-class exact-identity choice; faux freckles are seeded, bounded to checked support and never erase existing freckles.', requires_checked_region=True, release_evidence=('preserve_identity', 'determinism', 'locality')), AcceptanceContract(feature='W91', group='skin_more', name='Face and body continuity', test_id='W91_TEST_LIGHTING_CAVEAT', pass_definition='Checked-region continuity reduces colour mismatch when possible, preserves unmarked pixels and reports the lighting caveat.', requires_checked_region=True, release_evidence=('region_delta', 'locality', 'lighting_caveat')), AcceptanceContract(feature='W92', group='skin_more', name='Texture-first mature rendering', test_id='W92_TEST_TEXTURE_PRESERVATION', pass_definition='Microcontrast is bounded, measured texture stays above the gate and no wrinkle-removal or age-reversal promise is made.', release_evidence=('texture_retention', 'copy_review', 'fairness_slice')))

_BY_ID = {row.feature: row for row in CONTRACTS}

def contract(feature: str) -> AcceptanceContract:
    try:
        return _BY_ID[feature]
    except KeyError as exc:
        raise ValueError(f'unsupported R16 Lane B feature: {feature}') from exc

def grouped() -> dict[str, tuple[AcceptanceContract, ...]]:
    groups: dict[str, list[AcceptanceContract]] = {}
    for row in CONTRACTS:
        groups.setdefault(row.group, []).append(row)
    return {name: tuple(rows) for name, rows in groups.items()}

def audit_catalogue() -> dict[str, Any]:
    ids = [row.feature for row in CONTRACTS]
    tests = [row.test_id for row in CONTRACTS]
    groups = grouped()
    return {'rows': len(CONTRACTS), 'unique_features': len(ids) == len(set(ids)), 'unique_test_ids': len(tests) == len(set(tests)), 'groups': {name: len(rows) for name, rows in groups.items()}, 'adult_rows': sum(row.requires_adult for row in CONTRACTS), 'checked_region_rows': sum(row.requires_checked_region for row in CONTRACTS), 'checked_sequence_rows': sum(row.requires_checked_sequence for row in CONTRACTS), 'health_consent_rows': sum(row.requires_health_consent for row in CONTRACTS), 'cultural_review_rows': sum(row.requires_cultural_review for row in CONTRACTS)}

def _finite_number(value: object) -> TypeGuard[int | float]:
    return isinstance(value, (int, float)) and (not isinstance(value, bool)) and math.isfinite(float(value))

def _metric(metrics: Mapping[str, Any], name: str) -> float | None:
    value = metrics.get(name)
    return float(value) if _finite_number(value) else None

def prerequisites(feature: str, *, adult_confirmed: bool=False, checked_regions: int=0, checked_frames: int=0, health_consent: bool=False, cultural_review: bool=False) -> tuple[bool, tuple[str, ...]]:
    row = contract(feature)
    failures: list[str] = []
    if row.requires_adult and (not adult_confirmed):
        failures.append('18+ confirmation missing')
    if row.requires_checked_region and checked_regions < 1:
        failures.append('checked local region missing')
    if row.requires_checked_sequence and checked_frames < 2:
        failures.append('two or more checked frames required')
    if row.requires_health_consent and (not health_consent):
        failures.append('explicit local health-data consent missing')
    if row.requires_cultural_review and (not cultural_review):
        failures.append('cultural co-design release review pending')
    return (not failures, tuple(failures))

def evidence_status(feature: str, evidence: Iterable[str]) -> tuple[bool, tuple[str, ...]]:
    row = contract(feature)
    supplied = set(evidence)
    missing = tuple(item for item in row.release_evidence if item not in supplied)
    return (not missing, missing)

def metric_gate(feature: str, metrics: Mapping[str, Any]) -> tuple[bool, tuple[str, ...]]:
    """Evaluate common measured gates without fabricating unavailable metrics.

    Missing metrics do not silently pass. They are returned as a reason and the
    caller decides whether the result is ``not_tested`` or ``failed`` based on
    whether the feature was actually evaluated on a face.
    """
    reasons: list[str] = []
    outside = _metric(metrics, 'outside_error')
    if outside is None:
        reasons.append('outside_error metric missing')
    elif outside > 0.03:
        reasons.append('outside_error exceeds 0.03')
    alpha = metrics.get('alpha_identity')
    if alpha is not True:
        reasons.append('alpha identity not demonstrated')
    zero = metrics.get('zero_identity')
    if zero is not True:
        reasons.append('zero-strength identity not demonstrated')
    if feature in {'W55', 'W77', 'W84', 'W92'}:
        texture = _metric(metrics, 'texture_retention')
        floor = 0.45 if feature == 'W55' else 0.72 if feature == 'W77' else 0.78
        if texture is None:
            reasons.append('texture_retention metric missing')
        elif texture < floor:
            reasons.append(f'texture_retention below {floor:.2f}')
    if feature == 'W54' and metrics.get('protected_teeth_unchanged') is not True:
        reasons.append('protected teeth identity not demonstrated')
    if feature in {'W56', 'W90'} and metrics.get('deterministic') is not True:
        reasons.append('determinism not demonstrated')
    if feature == 'W58':
        frames = _metric(metrics, 'checked_frames')
        if frames is None or frames < 2:
            reasons.append('checked-frame count below two')
        if metrics.get('automatic_tracking') is not False:
            reasons.append('automatic-tracking exclusion not demonstrated')
    if feature == 'W83' and metrics.get('prediction') is not False:
        reasons.append('no-prediction property not demonstrated')
    if feature == 'W88' and metrics.get('protected_hair_unchanged') is not True:
        reasons.append('protected hair identity not demonstrated')
    return (not reasons, tuple(reasons))

def evaluate(feature: str, metrics: Mapping[str, Any] | None, *, tested: bool, adult_confirmed: bool=False, checked_regions: int=0, checked_frames: int=0, health_consent: bool=False, cultural_review: bool=False) -> AcceptanceResult:
    row = contract(feature)
    pre_ok, pre_reasons = prerequisites(feature, adult_confirmed=adult_confirmed, checked_regions=checked_regions, checked_frames=checked_frames, health_consent=health_consent, cultural_review=cultural_review)
    if not tested:
        reasons = pre_reasons + ('real-face evidence not supplied',)
        return AcceptanceResult(feature, row.test_id, 'not_tested', False, reasons, metrics or {})
    if not pre_ok:
        return AcceptanceResult(feature, row.test_id, 'failed', False, pre_reasons, metrics or {})
    metric_ok, metric_reasons = metric_gate(feature, metrics or {})
    return AcceptanceResult(feature, row.test_id, 'passed' if metric_ok else 'failed', metric_ok, metric_reasons, metrics or {})

def release_summary(results: Iterable[AcceptanceResult]) -> dict[str, Any]:
    rows = tuple(results)
    counts = {'passed': 0, 'failed': 0, 'not_tested': 0}
    by_group: dict[str, dict[str, int]] = {}
    for result in rows:
        counts[result.status] = counts.get(result.status, 0) + 1
        group = contract(result.feature).group
        bucket = by_group.setdefault(group, {'passed': 0, 'failed': 0, 'not_tested': 0})
        bucket[result.status] = bucket.get(result.status, 0) + 1
    expected = {row.feature for row in CONTRACTS}
    supplied = {row.feature for row in rows}
    missing = sorted(expected - supplied)
    return {'counts': counts, 'groups': by_group, 'missing_features': missing, 'complete': not missing, 'release_ready': not missing and counts['failed'] == 0 and (counts['not_tested'] == 0), 'note': 'Release readiness still depends on the binding frozen-face gate; synthetic tests cannot substitute for it.'}
