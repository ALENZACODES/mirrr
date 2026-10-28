'Detailed checked-annotation evaluation for R16B smile features. Author: John Khan.'

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass

import numpy as np

from .annotations import stats, validate_for_feature
from .contracts import SmileAnnotation
from .gap import acceptance as gap_acceptance
from .gap import plan as gap_plan
from .gummy import acceptance as gummy_acceptance
from .gummy import compare as gummy_compare
from .motion import acceptance as motion_acceptance
from .motion import metrics as motion_metrics
from .tooth_gum import gum_line, tooth_character
from .veneers import cells, shade_warning


@dataclass(frozen=True)
class DentalLocality:
    outside_error: float
    protected_error: float
    support_fraction: float
    alpha_identity: bool
    passed: bool

@dataclass(frozen=True)
class DentalEvaluation:
    feature: str
    passed: bool
    metrics: Mapping[str, float | int | bool | str | None]
    failures: tuple[str, ...]
    warnings: tuple[str, ...]

def _validate_image(image: np.ndarray) -> np.ndarray:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8:
        raise ValueError('image must be uint8 ndarray')
    if image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError('image must be RGB or RGBA')
    return image

def _validate_mask(mask: np.ndarray, shape: tuple[int, int]) -> np.ndarray:
    value = np.asarray(mask, dtype=np.float64)
    if value.shape != shape:
        raise ValueError('mask shape mismatch')
    if not np.all(np.isfinite(value)):
        raise ValueError('mask must be finite')
    return np.clip(value, 0.0, 1.0)

def locality(before: np.ndarray, after: np.ndarray, support: np.ndarray, protected: np.ndarray | None=None, outside_limit: float=0.01) -> DentalLocality:
    a = _validate_image(before)
    b = _validate_image(after)
    if a.shape != b.shape:
        raise ValueError('image shape mismatch')
    m = _validate_mask(support, a.shape[:2]) > 0.05
    diff = np.mean(np.abs(a[..., :3].astype(float) - b[..., :3].astype(float)), axis=2) / 255.0
    outside = float(np.mean(diff[~m])) if np.any(~m) else 0.0
    protected_error = 0.0
    if protected is not None:
        p = _validate_mask(protected, a.shape[:2]) > 0.05
        protected_error = float(np.mean(diff[p])) if np.any(p) else 0.0
    alpha_identity = True
    if a.shape[2] == 4 and b.shape[2] == 4:
        alpha_identity = bool(np.array_equal(a[..., 3], b[..., 3]))
    passed = outside <= outside_limit and protected_error <= 1e-09 and alpha_identity
    return DentalLocality(outside, protected_error, float(np.mean(m)), alpha_identity, passed)

def annotation_metrics(annotation: SmileAnnotation) -> dict[str, float | bool | None]:
    row = stats(annotation)
    return {'tooth_width': row.tooth_width, 'tooth_height': row.tooth_height, 'gum_height': row.gum_height, 'tooth_area': row.tooth_area, 'gum_area': row.gum_area, 'midline_error': row.midline_error, 'overlap_fraction': row.overlap_fraction, 'checked_annotation': True}

def adult_gate(adult_confirmed: bool) -> tuple[bool, tuple[str, ...]]:
    if adult_confirmed:
        return (True, ())
    return (False, ('18+ confirmation missing',))

def evaluate_w50(before: np.ndarray, after: np.ndarray, support: np.ndarray, annotation: SmileAnnotation, amount: float, adult_confirmed: bool) -> DentalEvaluation:
    failures: list[str] = []
    ok, gate_failures = adult_gate(adult_confirmed)
    failures.extend(gate_failures)
    loc = locality(before, after, support)
    comparison = gummy_compare(annotation, amount)
    accepted = gummy_acceptance(annotation, comparison)
    if not loc.passed:
        failures.append('change escaped checked gum/tooth support')
    if not bool(accepted['passed']):
        failures.append('checked gum-show comparison gate failed')
    if not comparison.static_only:
        failures.append('comparison must remain static')
    row = annotation_metrics(annotation)
    metrics = {**row, 'outside_error': loc.outside_error, 'alpha_identity': loc.alpha_identity, 'zero_identity': True, 'current_ratio': comparison.current_ratio, 'display_ratio': comparison.gum_line_emphasis_ratio, 'diagnosis': False}
    warnings = tuple(validate_for_feature(annotation, 'W50')) + (comparison.warning,)
    return DentalEvaluation('W50', ok and (not failures), metrics, tuple(failures), warnings)

def evaluate_w51(before: np.ndarray, after: np.ndarray, support: np.ndarray, annotation: SmileAnnotation, character: str, adult_confirmed: bool) -> DentalEvaluation:
    failures: list[str] = []
    ok, gate_failures = adult_gate(adult_confirmed)
    failures.extend(gate_failures)
    loc = locality(before, after, support)
    sections = cells(annotation, 8, character)
    if not loc.passed:
        failures.append('veneer preview escaped checked teeth support')
    if len(sections) != 8:
        failures.append('expected eight checked smile-zone sections')
    if any(cell.width <= 0 or cell.height <= 0 for cell in sections):
        failures.append('invalid tooth section geometry')
    target = (232, 225, 207)
    warnings = tuple(shade_warning(target)) + tuple(validate_for_feature(annotation, 'W51'))
    metrics = {**annotation_metrics(annotation), 'outside_error': loc.outside_error, 'alpha_identity': loc.alpha_identity, 'zero_identity': True, 'tooth_sections': len(sections), 'automatic_segmentation': False, 'clinical_material_outcome': False}
    return DentalEvaluation('W51', ok and (not failures), metrics, tuple(failures), warnings)

def evaluate_w52(before: np.ndarray, after: np.ndarray, support: np.ndarray, annotation: SmileAnnotation, mode: str, amount: float, adult_confirmed: bool) -> DentalEvaluation:
    failures: list[str] = []
    ok, gate_failures = adult_gate(adult_confirmed)
    failures.extend(gate_failures)
    loc = locality(before, after, support)
    display = gap_plan(annotation, mode, amount)
    accepted = gap_acceptance(display)
    if not loc.passed:
        failures.append('gap preview escaped checked teeth support')
    if not bool(accepted['passed']):
        failures.append('gap geometry gate failed')
    if mode == 'keep' and display.reduction_fraction != 0.0:
        failures.append('keep option changed the estimated display gap')
    metrics = {**annotation_metrics(annotation), 'outside_error': loc.outside_error, 'alpha_identity': loc.alpha_identity, 'zero_identity': True, 'original_width': display.original_width, 'displayed_width': display.displayed_width, 'reduction_fraction': display.reduction_fraction, 'beauty_score': False, 'orthodontic_outcome': False}
    warnings = tuple(validate_for_feature(annotation, 'W52'))
    return DentalEvaluation('W52', ok and (not failures), metrics, tuple(failures), warnings)

def evaluate_w53(before: np.ndarray, after: np.ndarray, support: np.ndarray, annotation: SmileAnnotation, style: str, amount: float, adult_confirmed: bool) -> DentalEvaluation:
    failures: list[str] = []
    ok, gate_failures = adult_gate(adult_confirmed)
    failures.extend(gate_failures)
    loc = locality(before, after, support)
    try:
        guide = gum_line(annotation, amount)
        sections = tooth_character(annotation, style, amount)
    except ValueError as exc:
        failures.append(str(exc))
        guide = None
        sections = []
    if not loc.passed:
        failures.append('tooth/gum character preview escaped checked support')
    if len(sections) != 8:
        failures.append('tooth-character section count is not eight')
    metrics = {**annotation_metrics(annotation), 'outside_error': loc.outside_error, 'alpha_identity': loc.alpha_identity, 'zero_identity': True, 'tooth_sections': len(sections), 'gum_line_amplitude': None if guide is None else guide.amplitude, 'treatment_recommendation': False, 'surgical_context': False if guide is None else guide.surgical_context}
    warnings = tuple(validate_for_feature(annotation, 'W53'))
    if guide is not None:
        warnings += (guide.label,)
    return DentalEvaluation('W53', ok and (not failures), metrics, tuple(failures), warnings)

def evaluate_w58(annotations: Sequence[SmileAnnotation], adult_confirmed: bool) -> DentalEvaluation:
    failures: list[str] = []
    ok, gate_failures = adult_gate(adult_confirmed)
    failures.extend(gate_failures)
    try:
        row = motion_metrics(annotations)
        motion_ok, motion_failures = motion_acceptance(row)
        failures.extend(motion_failures)
    except ValueError as exc:
        row = None
        motion_ok = False
        failures.append(str(exc))
    metrics = {'outside_error': 0.0, 'alpha_identity': True, 'zero_identity': True, 'checked_frames': 0 if row is None else row.frames, 'max_centre_jump': None if row is None else row.max_centre_jump, 'max_width_change': None if row is None else row.max_width_change, 'jitter_score': None if row is None else row.jitter_score, 'automatic_tracking': False, 'evidence_hash': None if row is None else row.evidence_hash}
    warnings = ('Checked-frame stability only; real smile dynamics remain a separate review.',)
    return DentalEvaluation('W58', ok and motion_ok and (not failures), metrics, tuple(failures), warnings)

EVALUATORS = {'W50': evaluate_w50, 'W51': evaluate_w51, 'W52': evaluate_w52, 'W53': evaluate_w53, 'W58': evaluate_w58}
