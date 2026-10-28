'Detailed box-side evaluation helpers for R16B lip features. Author: John Khan.'

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

import numpy as np

from .anatomy import measure
from .geometry import edge_ring
from .pigmentation import analyse
from .pmu import ordered_strengths, validate_monotonic_fade
from .wear import monotonic_wear


@dataclass(frozen=True)
class ImageIntegrity:
    shape_equal: bool
    dtype_equal: bool
    alpha_equal: bool
    finite: bool
    mean_absolute_error: float
    changed_fraction: float

@dataclass(frozen=True)
class LocalityMetrics:
    inside_change: float
    outside_change: float
    protected_change: float
    support_fraction: float
    passed: bool

@dataclass(frozen=True)
class TextureMetrics:
    correlation: float
    gradient_ratio: float
    variance_ratio: float
    passed: bool

@dataclass(frozen=True)
class FeatureEvaluation:
    feature: str
    passed: bool
    metrics: Mapping[str, float | int | bool | str | None]
    failures: tuple[str, ...]
    notes: tuple[str, ...]

def _rgb(image: np.ndarray) -> np.ndarray:
    if not isinstance(image, np.ndarray):
        raise ValueError('image must be ndarray')
    if image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError('image must be RGB or RGBA')
    return image[..., :3].astype(np.float64)

def _mask(mask: np.ndarray, shape: tuple[int, int]) -> np.ndarray:
    value = np.asarray(mask, dtype=np.float64)
    if value.shape != shape:
        raise ValueError('mask shape mismatch')
    if not np.all(np.isfinite(value)):
        raise ValueError('mask must be finite')
    return np.clip(value, 0.0, 1.0)

def integrity(before: np.ndarray, after: np.ndarray) -> ImageIntegrity:
    shape_equal = before.shape == after.shape
    dtype_equal = before.dtype == after.dtype
    if not shape_equal:
        return ImageIntegrity(False, dtype_equal, False, False, float('inf'), 1.0)
    a = _rgb(before)
    b = _rgb(after)
    finite = bool(np.all(np.isfinite(b)))
    diff = np.abs(a - b) / 255.0
    changed = np.any(a != b, axis=2)
    alpha_equal = True
    if before.shape[2] == 4 and after.shape[2] == 4:
        alpha_equal = bool(np.array_equal(before[..., 3], after[..., 3]))
    return ImageIntegrity(shape_equal=True, dtype_equal=dtype_equal, alpha_equal=alpha_equal, finite=finite, mean_absolute_error=float(np.mean(diff)), changed_fraction=float(np.mean(changed)))

def locality(before: np.ndarray, after: np.ndarray, support: np.ndarray, protected: np.ndarray | None=None, outside_limit: float=0.03) -> LocalityMetrics:
    if before.shape != after.shape:
        raise ValueError('image shape mismatch')
    allowed = _mask(support, before.shape[:2]) > 0.05
    diff = np.mean(np.abs(_rgb(before) - _rgb(after)), axis=2) / 255.0
    inside = float(np.mean(diff[allowed])) if np.any(allowed) else 0.0
    outside = float(np.mean(diff[~allowed])) if np.any(~allowed) else 0.0
    protected_change = 0.0
    if protected is not None:
        p = _mask(protected, before.shape[:2]) > 0.05
        protected_change = float(np.mean(diff[p])) if np.any(p) else 0.0
    return LocalityMetrics(inside_change=inside, outside_change=outside, protected_change=protected_change, support_fraction=float(np.mean(allowed)), passed=outside <= outside_limit and protected_change <= 1e-09)

def _gradient(gray: np.ndarray) -> np.ndarray:
    gx = np.diff(gray, axis=1, append=gray[:, -1:])
    gy = np.diff(gray, axis=0, append=gray[-1:, :])
    return np.sqrt(gx * gx + gy * gy)

def texture(before: np.ndarray, after: np.ndarray, support: np.ndarray, minimum: float=0.45) -> TextureMetrics:
    allowed = _mask(support, before.shape[:2]) > 0.05
    if np.count_nonzero(allowed) < 8:
        return TextureMetrics(1.0, 1.0, 1.0, True)
    a = _rgb(before).mean(axis=2)
    b = _rgb(after).mean(axis=2)
    av = a[allowed]
    bv = b[allowed]
    if float(np.std(av)) <= 1e-09 or float(np.std(bv)) <= 1e-09:
        corr = 1.0
    else:
        corr = float(np.corrcoef(av, bv)[0, 1])
    ga = float(np.mean(_gradient(a)[allowed]))
    gb = float(np.mean(_gradient(b)[allowed]))
    gradient_ratio = gb / max(ga, 1e-09)
    va = float(np.var(av))
    vb = float(np.var(bv))
    variance_ratio = vb / max(va, 1e-09)
    bounded = min(max(corr, 0.0), 1.0)
    return TextureMetrics(correlation=corr, gradient_ratio=gradient_ratio, variance_ratio=variance_ratio, passed=bounded >= minimum and gradient_ratio >= minimum * 0.55)

def zero_identity(before: np.ndarray, zero_result: np.ndarray) -> bool:
    return bool(np.array_equal(before, zero_result))

def geometry_delta(before_points: np.ndarray, after_points: np.ndarray) -> dict[str, float]:
    if before_points.shape != after_points.shape:
        raise ValueError('landmark shape mismatch')
    delta = np.asarray(after_points, dtype=np.float64) - np.asarray(before_points, dtype=np.float64)
    distance = np.sqrt(np.sum(delta * delta, axis=1))
    return {'mean': float(np.mean(distance)), 'maximum': float(np.max(distance)), 'p95': float(np.percentile(distance, 95))}

def edge_alignment(coverage: np.ndarray, lip_support: np.ndarray) -> dict[str, float | bool]:
    coverage_mask = _mask(coverage, lip_support.shape)
    lip = _mask(lip_support, lip_support.shape)
    edge = edge_ring(lip, 2)
    active = coverage_mask > 0.05
    edge_active = edge > 0.05
    overlap = float(np.mean(edge[active])) if np.any(active) else 0.0
    outside = float(np.mean(active & ~(lip > 0.001)))
    corner_width = max(1, lip.shape[1] // 8)
    corner = np.zeros_like(active)
    corner[:, :corner_width] = True
    corner[:, -corner_width:] = True
    corner_energy = float(np.mean(coverage_mask[corner & active])) if np.any(corner & active) else 0.0
    centre_energy = float(np.mean(coverage_mask[~corner & active])) if np.any(~corner & active) else 0.0
    corner_ratio = corner_energy / max(centre_energy, 1e-09)
    return {'edge_overlap': overlap, 'outside_fraction': outside, 'corner_ratio': corner_ratio, 'passed': bool(np.any(edge_active) and outside <= 0.08 and (corner_ratio <= 1.0))}

def pigmentation_metrics(photo: np.ndarray, support: np.ndarray) -> dict[str, float | bool]:
    row = analyse(photo, support)
    return {'side_delta': row.side_delta, 'vertical_delta': row.vertical_delta, 'two_tone_score': row.two_tone_score, 'observed': True}

def evaluate_w45(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray, landmarks: np.ndarray, adult_confirmed: bool) -> FeatureEvaluation:
    failures: list[str] = []
    i = integrity(before, after)
    loc = locality(before, after, support)
    tex = texture(before, after, support, 0.45)
    anatomy = measure(landmarks)
    if not adult_confirmed:
        failures.append('adult confirmation missing')
    if not zero_identity(before, zero_result):
        failures.append('zero-strength render is not identity')
    if not i.alpha_equal:
        failures.append('alpha channel changed')
    if not loc.passed:
        failures.append('change escaped lip support')
    if not tex.passed:
        failures.append('source texture fell below the consultation floor')
    metrics: dict[str, float | int | bool | str | None] = {'outside_error': loc.outside_change, 'texture_retention': max(0.0, min(1.0, tex.correlation)), 'alpha_identity': i.alpha_equal, 'zero_identity': zero_identity(before, zero_result), 'mouth_width': anatomy.width, 'upper_height': anatomy.upper_height, 'lower_height': anatomy.lower_height}
    return FeatureEvaluation('W45', not failures, metrics, tuple(failures), ('Simulation only; no clinical result is inferred.',))

def evaluate_w46(before: np.ndarray, after: np.ndarray, support: np.ndarray, coverage: np.ndarray) -> FeatureEvaluation:
    failures: list[str] = []
    i = integrity(before, after)
    loc = locality(before, after, np.maximum(support, coverage))
    edge = edge_alignment(coverage, support)
    if not i.alpha_equal:
        failures.append('alpha channel changed')
    if not loc.passed:
        failures.append('liner change escaped allowed support')
    if not edge['passed']:
        failures.append('overline edge alignment gate failed')
    metrics = {'outside_error': loc.outside_change, 'alpha_identity': i.alpha_equal, 'zero_identity': True, 'edge_overlap': float(edge['edge_overlap']), 'corner_ratio': float(edge['corner_ratio'])}
    return FeatureEvaluation('W46', not failures, metrics, tuple(failures), ('Daylight review remains a box-side visual check.',))

def evaluate_w47(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray, adult_confirmed: bool) -> FeatureEvaluation:
    failures: list[str] = []
    i = integrity(before, after)
    loc = locality(before, after, support)
    fade_ok = validate_monotonic_fade()
    strengths = ordered_strengths()
    if not adult_confirmed:
        failures.append('adult confirmation missing')
    if not fade_ok:
        failures.append('display fade states are not monotonic')
    if not zero_identity(before, zero_result):
        failures.append('zero-strength render is not identity')
    if not loc.passed:
        failures.append('PMU colour escaped observed lips')
    metrics = {'outside_error': loc.outside_change, 'alpha_identity': i.alpha_equal, 'zero_identity': zero_identity(before, zero_result), 'fade_monotonic': fade_ok, 'fresh_strength': strengths[0], 'last_fade_strength': strengths[-1]}
    return FeatureEvaluation('W47', not failures, metrics, tuple(failures), ('Fade states are illustrative and not retention predictions.',))

def evaluate_w48(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray, adult_confirmed: bool) -> FeatureEvaluation:
    failures: list[str] = []
    i = integrity(before, after)
    loc = locality(before, after, support, outside_limit=0.04)
    if not adult_confirmed:
        failures.append('adult confirmation missing')
    if not zero_identity(before, zero_result):
        failures.append('zero-strength render is not identity')
    if not loc.passed:
        failures.append('upper-lip appearance warp escaped bounded support')
    if not i.alpha_equal:
        failures.append('alpha channel changed')
    metrics = {'outside_error': loc.outside_change, 'alpha_identity': i.alpha_equal, 'zero_identity': zero_identity(before, zero_result), 'changed_fraction': i.changed_fraction}
    return FeatureEvaluation('W48', not failures, metrics, tuple(failures), ('No muscle or treatment outcome is claimed.',))

def evaluate_w49(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray, adult_confirmed: bool) -> FeatureEvaluation:
    failures: list[str] = []
    i = integrity(before, after)
    loc = locality(before, after, support, outside_limit=0.05)
    if not adult_confirmed:
        failures.append('adult confirmation missing')
    if not zero_identity(before, zero_result):
        failures.append('zero-strength render is not identity')
    if not loc.passed:
        failures.append('dose-style geometry escaped bounded support')
    metrics = {'outside_error': loc.outside_change, 'alpha_identity': i.alpha_equal, 'zero_identity': zero_identity(before, zero_result), 'changed_fraction': i.changed_fraction, 'actual_ml_claim': False}
    return FeatureEvaluation('W49', not failures, metrics, tuple(failures), ('Dose wording is a style label, not a predicted injection result.',))

def evaluate_w54(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray, protected_teeth: np.ndarray) -> FeatureEvaluation:
    failures: list[str] = []
    i = integrity(before, after)
    loc = locality(before, after, support, protected_teeth)
    protected_ok = loc.protected_change <= 1e-09
    if not protected_ok:
        failures.append('checked teeth pixels changed')
    if not zero_identity(before, zero_result):
        failures.append('zero-strength render is not identity')
    if not i.alpha_equal:
        failures.append('alpha channel changed')
    metrics = {'outside_error': loc.outside_change, 'alpha_identity': i.alpha_equal, 'zero_identity': zero_identity(before, zero_result), 'protected_teeth_unchanged': protected_ok, 'protected_teeth_error': loc.protected_change}
    return FeatureEvaluation('W54', not failures, metrics, tuple(failures), ('Only adjacent lip colour affects perceived contrast.',))

def evaluate_w55(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray) -> FeatureEvaluation:
    failures: list[str] = []
    i = integrity(before, after)
    loc = locality(before, after, support)
    tex = texture(before, after, support, 0.45)
    if not tex.passed:
        failures.append('lip texture retention below floor')
    if not loc.passed:
        failures.append('finish escaped lip support')
    if not zero_identity(before, zero_result):
        failures.append('zero-strength render is not identity')
    metrics = {'outside_error': loc.outside_change, 'alpha_identity': i.alpha_equal, 'zero_identity': zero_identity(before, zero_result), 'texture_retention': max(0.0, min(1.0, tex.correlation)), 'gradient_ratio': tex.gradient_ratio, 'variance_ratio': tex.variance_ratio}
    return FeatureEvaluation('W55', not failures, metrics, tuple(failures), ())

def evaluate_w56(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray, seed: int=17) -> FeatureEvaluation:
    failures: list[str] = []
    i = integrity(before, after)
    loc = locality(before, after, support)
    wear = monotonic_wear(support, seed)
    deterministic = bool(wear['monotonic'])
    if not deterministic:
        failures.append('wear order is not monotonic')
    if not loc.passed:
        failures.append('wear escaped lip support')
    if not zero_identity(before, zero_result):
        failures.append('zero-strength render is not identity')
    metrics = {'outside_error': loc.outside_change, 'alpha_identity': i.alpha_equal, 'zero_identity': zero_identity(before, zero_result), 'deterministic': deterministic, 'two_hours_retention': float(wear['two_hours']), 'coffee_retention': float(wear['coffee']), 'meal_retention': float(wear['meal'])}
    return FeatureEvaluation('W56', not failures, metrics, tuple(failures), ('Scenario is a finish-class estimate, not a product-duration promise.',))

def evaluate_w57(before: np.ndarray, after: np.ndarray, zero_result: np.ndarray, support: np.ndarray) -> FeatureEvaluation:
    failures: list[str] = []
    i = integrity(before, after)
    loc = locality(before, after, support)
    observed = pigmentation_metrics(before, support)
    if not loc.passed:
        failures.append('pigmentation-aware colour escaped observed lips')
    if not zero_identity(before, zero_result):
        failures.append('zero-strength render is not identity')
    metrics = {'outside_error': loc.outside_change, 'alpha_identity': i.alpha_equal, 'zero_identity': zero_identity(before, zero_result), 'side_delta': float(observed['side_delta']), 'vertical_delta': float(observed['vertical_delta']), 'two_tone_score': float(observed['two_tone_score'])}
    return FeatureEvaluation('W57', not failures, metrics, tuple(failures), ('Natural lip pigmentation is observed, not scored as a defect.',))

EVALUATORS = {'W45': evaluate_w45, 'W46': evaluate_w46, 'W47': evaluate_w47, 'W48': evaluate_w48, 'W49': evaluate_w49, 'W54': evaluate_w54, 'W55': evaluate_w55, 'W56': evaluate_w56, 'W57': evaluate_w57}
