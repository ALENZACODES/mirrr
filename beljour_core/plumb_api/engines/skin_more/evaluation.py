'Detailed R16B Skin & More box-side quality evaluation. Author: John Khan.'

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass

import numpy as np

from .colorimetry import cast_score, compare_regions
from .continuity import lighting_caveat
from .continuity import measure as continuity_measure
from .freckles import FreckleSpec
from .freckles import reproducible as freckles_reproducible
from .masking import outside_change_fraction, protected_change_fraction
from .texture import texture_gate


@dataclass(frozen=True)
class SkinEvaluation:
    feature: str
    passed: bool
    metrics: Mapping[str, float | int | bool | str | None]
    failures: tuple[str, ...]
    notes: tuple[str, ...]

def _image(value: np.ndarray) -> np.ndarray:
    if not isinstance(value, np.ndarray) or value.dtype != np.uint8:
        raise ValueError('photo must be uint8 ndarray')
    if value.ndim != 3 or value.shape[2] not in (3, 4):
        raise ValueError('photo must be RGB or RGBA')
    return value

def _mask(value: np.ndarray, shape: tuple[int, int]) -> np.ndarray:
    mask = np.asarray(value, dtype=np.float64)
    if mask.shape != shape:
        raise ValueError('mask shape mismatch')
    if not np.all(np.isfinite(mask)):
        raise ValueError('mask must be finite')
    return np.clip(mask, 0.0, 1.0)

def _alpha_identity(before: np.ndarray, after: np.ndarray) -> bool:
    if before.shape[2] != 4 or after.shape[2] != 4:
        return True
    return bool(np.array_equal(before[..., 3], after[..., 3]))

def _zero_identity(before: np.ndarray, zero_result: np.ndarray) -> bool:
    return bool(np.array_equal(before, zero_result))

def _changed_fraction(before: np.ndarray, after: np.ndarray) -> float:
    a = _image(before)
    b = _image(after)
    if a.shape != b.shape:
        return 1.0
    return float(np.mean(np.any(a[..., :3] != b[..., :3], axis=2)))

def _locality(before: np.ndarray, after: np.ndarray, support: np.ndarray, limit: float=0.03) -> tuple[float, bool]:
    mask = _mask(support, before.shape[:2])
    outside = float(outside_change_fraction(before, after, mask))
    return (outside, outside <= limit)

def _texture(before: np.ndarray, after: np.ndarray, support: np.ndarray, floor: float) -> tuple[float, bool]:
    result = texture_gate(before, after, _mask(support, before.shape[:2]), floor)
    return (float(result['score']), bool(result['pass']))

def _numeric_metric(metrics: Mapping[str, float | int | bool | str | None], key: str) -> float:
    value = metrics[key]
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise TypeError(f'metric {key} is not numeric')
    return float(value)

def _base_metrics(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray) -> dict[str, float | int | bool | str | None]:
    outside, _ = _locality(before, after, support)
    return {'outside_error': outside, 'alpha_identity': _alpha_identity(before, after), 'zero_identity': _zero_identity(before, zero_result), 'changed_fraction': _changed_fraction(before, after)}

def evaluate_w77(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, face: np.ndarray) -> SkinEvaluation:
    failures: list[str] = []
    metrics = _base_metrics(before, after, zero_result, face)
    texture_score, texture_ok = _texture(before, after, face, 0.72)
    metrics['texture_retention'] = texture_score
    metrics['skin_tone_ranking'] = False
    metrics['lightening_objective'] = False
    if not bool(metrics['zero_identity']):
        failures.append('zero-strength tint is not identity')
    if not bool(metrics['alpha_identity']):
        failures.append('alpha channel changed')
    if _numeric_metric(metrics, 'outside_error') > 0.03:
        failures.append('tint escaped face support')
    if not texture_ok:
        failures.append('texture-retention gate failed')
    return SkinEvaluation('W77', not failures, metrics, tuple(failures), ('No preferred skin tone is encoded.',))

def evaluate_w78(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray, dry: np.ndarray) -> SkinEvaluation:
    failures: list[str] = []
    metrics = _base_metrics(before, after, zero_result, support)
    dry_mask = _mask(dry, before.shape[:2]) > 0.05
    base_mask = _mask(support, before.shape[:2]) > 0.05
    diff = np.mean(np.abs(before[..., :3].astype(float) - after[..., :3].astype(float)), axis=2)
    dry_change = float(np.mean(diff[dry_mask])) if np.any(dry_mask) else 0.0
    base_change = float(np.mean(diff[base_mask])) if np.any(base_mask) else 0.0
    metrics['dry_zone_change'] = dry_change
    metrics['base_zone_change'] = base_change
    metrics['uv_claim'] = False
    metrics['health_claim'] = False
    if dry_change > base_change + 1e-09:
        failures.append('dry-zone colour exceeds overall supported colour')
    if _numeric_metric(metrics, 'outside_error') > 0.03:
        failures.append('tan escaped support')
    if not bool(metrics['zero_identity']):
        failures.append('zero-strength tan is not identity')
    return SkinEvaluation('W78', not failures, metrics, tuple(failures), ('Cosmetic colour only; no UV-safety implication.',))

def evaluate_w79(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, source: np.ndarray, target: np.ndarray) -> SkinEvaluation:
    failures: list[str] = []
    support = np.maximum(_mask(source, before.shape[:2]), _mask(target, before.shape[:2]))
    metrics = _base_metrics(before, after, zero_result, support)
    before_delta = compare_regions(before, source, target).delta_e76
    after_delta = compare_regions(after, source, target).delta_e76
    metrics['before_delta_e'] = before_delta
    metrics['after_delta_e'] = after_delta
    metrics['preferred_tone'] = False
    if after_delta > before_delta + 1e-09:
        failures.append('checked-region colour distance increased')
    if _numeric_metric(metrics, 'outside_error') > 0.03:
        failures.append('continuity edit escaped checked regions')
    return SkinEvaluation('W79', not failures, metrics, tuple(failures), ())

def evaluate_w80(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray) -> SkinEvaluation:
    failures: list[str] = []
    metrics = _base_metrics(before, after, zero_result, support)
    metrics['visual_cast_before'] = cast_score(before, support)
    metrics['visual_cast_after'] = cast_score(after, support)
    metrics['spf_efficacy_claim'] = False
    metrics['uv_efficacy_claim'] = False
    if _numeric_metric(metrics, 'outside_error') > 0.03:
        failures.append('visual cast escaped checked support')
    if not bool(metrics['zero_identity']):
        failures.append('zero-strength cast is not identity')
    return SkinEvaluation('W80', not failures, metrics, tuple(failures), ('Visual finish simulation only; no SPF or UV-efficacy claim.',))

def evaluate_w81(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, marked: np.ndarray) -> SkinEvaluation:
    failures: list[str] = []
    metrics = _base_metrics(before, after, zero_result, marked)
    metrics['diagnosis'] = False
    metrics['defect_label'] = False
    if _numeric_metric(metrics, 'outside_error') > 0.01:
        failures.append('pigmentation correction escaped user-marked region')
    if not bool(metrics['zero_identity']):
        failures.append('zero-strength correction is not identity')
    return SkinEvaluation('W81', not failures, metrics, tuple(failures), ('User-marked appearance only; no diagnosis.',))

def evaluate_w82(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, marked: np.ndarray) -> SkinEvaluation:
    failures: list[str] = []
    metrics = _base_metrics(before, after, zero_result, marked)
    metrics['diagnosis'] = False
    metrics['treatment_claim'] = False
    if _numeric_metric(metrics, 'outside_error') > 0.01:
        failures.append('redness correction escaped user-marked region')
    return SkinEvaluation('W82', not failures, metrics, tuple(failures), ('User-marked redness appearance only.',))

def evaluate_w83(*, consent: bool, samples: Sequence[float], exported_samples: Sequence[float]) -> SkinEvaluation:
    failures: list[str] = []
    if not consent:
        failures.append('explicit local health-data consent missing')
    source = tuple(float(v) for v in samples)
    restored = tuple(float(v) for v in exported_samples)
    round_trip = source == restored
    if not round_trip:
        failures.append('local diary export did not round-trip')
    metrics = {'outside_error': 0.0, 'alpha_identity': True, 'zero_identity': True, 'samples': len(source), 'round_trip': round_trip, 'prediction': False, 'fertility_prediction': False, 'diagnosis': False, 'local_only': True}
    return SkinEvaluation('W83', not failures, metrics, tuple(failures), ('Pattern diary only; it does not predict cycle timing or fertility.',))

def evaluate_w84(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray) -> SkinEvaluation:
    failures: list[str] = []
    metrics = _base_metrics(before, after, zero_result, support)
    texture_score, texture_ok = _texture(before, after, support, 0.78)
    metrics['texture_retention'] = texture_score
    metrics['line_blur'] = 0.0
    metrics['anti_age_claim'] = False
    metrics['younger_claim'] = False
    if not texture_ok:
        failures.append('mature-skin texture gate failed')
    if _numeric_metric(metrics, 'outside_error') > 0.03:
        failures.append('mature-skin edit escaped support')
    return SkinEvaluation('W84', not failures, metrics, tuple(failures), ('Pro-age texture-first copy only.',))

def evaluate_w85(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, placement: np.ndarray, calibrated: bool) -> SkinEvaluation:
    failures: list[str] = []
    metrics = _base_metrics(before, after, zero_result, placement)
    metrics['physical_size_claim'] = calibrated
    metrics['calibrated'] = calibrated
    if _numeric_metric(metrics, 'outside_error') > 0.03:
        failures.append('jewellery escaped checked placement support')
    return SkinEvaluation('W85', not failures, metrics, tuple(failures), ('Physical-size wording is unavailable without calibration.',))

def evaluate_w86(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, placement: np.ndarray, protected: np.ndarray) -> SkinEvaluation:
    failures: list[str] = []
    metrics = _base_metrics(before, after, zero_result, placement)
    protected_error = protected_change_fraction(before, after, protected)
    metrics['protected_region_error'] = protected_error
    metrics['physical_size_claim'] = False
    if protected_error > 1e-09:
        failures.append('glasses changed protected pixels')
    if _numeric_metric(metrics, 'outside_error') > 0.03:
        failures.append('glasses escaped checked fit support')
    return SkinEvaluation('W86', not failures, metrics, tuple(failures), ())

def evaluate_w87(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, nails: np.ndarray) -> SkinEvaluation:
    failures: list[str] = []
    metrics = _base_metrics(before, after, zero_result, nails)
    metrics['automatic_hand_model'] = False
    if _numeric_metric(metrics, 'outside_error') > 0.01:
        failures.append('nail colour escaped manually checked nail region')
    return SkinEvaluation('W87', not failures, metrics, tuple(failures), ('Manual checked region only; no automatic hand model.',))

def evaluate_w88(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, scarf: np.ndarray, hair: np.ndarray, cultural_review: bool) -> SkinEvaluation:
    failures: list[str] = []
    metrics = _base_metrics(before, after, zero_result, scarf)
    hair_error = protected_change_fraction(before, after, hair)
    metrics['protected_hair_unchanged'] = hair_error <= 1e-09
    metrics['protected_hair_error'] = hair_error
    metrics['cultural_review'] = cultural_review
    if hair_error > 1e-09:
        failures.append('protected hair pixels changed')
    if not cultural_review:
        failures.append('cultural co-design release review pending')
    if _numeric_metric(metrics, 'outside_error') > 0.01:
        failures.append('hijab colour escaped checked scarf support')
    return SkinEvaluation('W88', not failures, metrics, tuple(failures), ('Public release remains gated on cultural co-design review.',))

def evaluate_w89(*, editable: bool, competence_claim: bool, zero_identity: bool) -> SkinEvaluation:
    failures: list[str] = []
    if not editable:
        failures.append('occasion bundle cannot be decomposed into editable controls')
    if competence_claim:
        failures.append('occasion bundle contains a competence claim')
    if not zero_identity:
        failures.append('zero-strength bundle is not identity')
    metrics = {'outside_error': 0.0, 'alpha_identity': True, 'zero_identity': zero_identity, 'editable': editable, 'competence_claim': competence_claim, 'beauty_score': False}
    return SkinEvaluation('W89', not failures, metrics, tuple(failures), ())

def evaluate_w90(before: np.ndarray, after: np.ndarray, preserve_result: np.ndarray, support: np.ndarray, seed: int) -> SkinEvaluation:
    failures: list[str] = []
    metrics = _base_metrics(before, after, preserve_result, support)
    preserve_identity = bool(np.array_equal(before, preserve_result))
    spec = FreckleSpec(seed=seed)
    deterministic = freckles_reproducible(support, spec)
    metrics['preserve_identity'] = preserve_identity
    metrics['deterministic'] = deterministic
    metrics['zero_identity'] = preserve_identity
    if not preserve_identity:
        failures.append('preserve mode is not exact identity')
    if not deterministic:
        failures.append('seeded freckle placement is not reproducible')
    if _numeric_metric(metrics, 'outside_error') > 0.01:
        failures.append('faux freckles escaped checked support')
    return SkinEvaluation('W90', not failures, metrics, tuple(failures), ('Existing freckles are not treated as defects.',))

def evaluate_w91(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, source: np.ndarray, target: np.ndarray) -> SkinEvaluation:
    failures: list[str] = []
    support = np.maximum(_mask(source, before.shape[:2]), _mask(target, before.shape[:2]))
    metrics = _base_metrics(before, after, zero_result, support)
    before_measure = continuity_measure(before, source, target)
    after_measure = continuity_measure(after, source, target)
    metrics['before_delta_e'] = before_measure.delta_e
    metrics['after_delta_e'] = after_measure.delta_e
    metrics['lighting_caveat'] = lighting_caveat(before_measure)
    metrics['body_score'] = False
    if after_measure.delta_e > before_measure.delta_e + 1e-09:
        failures.append('continuity delta increased')
    if _numeric_metric(metrics, 'outside_error') > 0.03:
        failures.append('continuity edit escaped checked regions')
    return SkinEvaluation('W91', not failures, metrics, tuple(failures), (str(metrics['lighting_caveat']),))

def evaluate_w92(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray) -> SkinEvaluation:
    failures: list[str] = []
    metrics = _base_metrics(before, after, zero_result, support)
    texture_score, texture_ok = _texture(before, after, support, 0.78)
    metrics['texture_retention'] = texture_score
    metrics['wrinkle_removal_claim'] = False
    metrics['age_reversal_claim'] = False
    if not texture_ok:
        failures.append('texture-first gate failed')
    if _numeric_metric(metrics, 'outside_error') > 0.03:
        failures.append('texture edit escaped support')
    return SkinEvaluation('W92', not failures, metrics, tuple(failures), ('Texture-first rendering; no age reversal claim.',))

EVALUATORS = {'W77': evaluate_w77, 'W78': evaluate_w78, 'W79': evaluate_w79, 'W80': evaluate_w80, 'W81': evaluate_w81, 'W82': evaluate_w82, 'W83': evaluate_w83, 'W84': evaluate_w84, 'W85': evaluate_w85, 'W86': evaluate_w86, 'W87': evaluate_w87, 'W88': evaluate_w88, 'W89': evaluate_w89, 'W90': evaluate_w90, 'W91': evaluate_w91, 'W92': evaluate_w92}
