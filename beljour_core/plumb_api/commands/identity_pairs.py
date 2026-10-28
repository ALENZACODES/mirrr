"""Frozen-policy verification of independently labelled identity comparisons.

Only authorised, locally held pair observations may enter this evaluator. It
never infers demographic membership from pixels, chooses thresholds on its
holdout, publishes pair identifiers, or approves a production face model.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass
from itertools import chain
from typing import Literal, NoReturn

from .errors import CommandValidationError

_DIGEST = re.compile(r"[a-f0-9]{64}\Z")
_HANDLE = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}\Z")
_LABEL = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9_ .-]{0,47}\Z")
_DIMENSIONS = ("source", "tone", "gender", "yaw", "occlusion", "image_size")
_VERSION = "beljour-identity-pair-qualification/1"
Status = Literal["blocked", "unproven", "ready_for_independent_review"]


def _refuse(reason: str) -> NoReturn:
    raise CommandValidationError("invalid_identity_qualification", reason)


def _digest(value: str, label: str) -> None:
    if type(value) is not str or _DIGEST.fullmatch(value) is None:
        _refuse(f"{label} must be a lowercase SHA-256 value.")


def _handle(value: str, label: str) -> None:
    if type(value) is not str or _HANDLE.fullmatch(value) is None:
        _refuse(f"{label} must be a bounded opaque identifier.")


def _rate(value: float, label: str) -> None:
    if type(value) not in (int, float) or not math.isfinite(value) or not 0 <= value <= 1:
        _refuse(f"{label} must be a finite rate in [0,1].")


def _count(value: int, label: str, minimum: int = 0) -> None:
    if type(value) is not int or value < minimum:
        _refuse(f"{label} has an invalid count.")


def _canonical(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True, allow_nan=False)


@dataclass(frozen=True, slots=True)
class RequiredSlice:
    dimension: str
    label: str

    def __post_init__(self) -> None:
        if self.dimension not in _DIMENSIONS:
            _refuse("Slice dimension is not a registered, externally labelled dimension.")
        if type(self.label) is not str or _LABEL.fullmatch(self.label) is None:
            _refuse("Slice labels must be bounded, non-identifying values.")


@dataclass(frozen=True, slots=True)
class IdentityPolicy:
    """Thresholds must be fixed and committed before evaluating frozen pairs."""

    name: str
    manifest_sha256: str
    model_sha256: str
    preprocessing_sha256: str
    definitions_sha256: str
    baseline_sha256: str
    threshold: float
    minimum_genuine: int
    minimum_impostor: int
    minimum_genuine_per_slice: int
    minimum_impostor_per_slice: int
    max_false_accept_rate: float
    min_true_accept_rate: float
    max_true_accept_gap: float
    required_slices: tuple[RequiredSlice, ...]
    independent_threshold_commit: bool

    def __post_init__(self) -> None:
        _handle(self.name, "Policy name")
        for label, value in (
            ("manifest", self.manifest_sha256),
            ("model", self.model_sha256),
            ("preprocessing", self.preprocessing_sha256),
            ("definitions", self.definitions_sha256),
            ("baseline", self.baseline_sha256),
        ):
            _digest(value, label)
        if type(self.threshold) not in (float, int):
            _refuse("Similarity threshold must be numeric.")
        if not math.isfinite(self.threshold) or not -1 <= self.threshold <= 1:
            _refuse("Similarity threshold is outside cosine range.")
        for count_label, count in (
            ("minimum genuine", self.minimum_genuine),
            ("minimum impostor", self.minimum_impostor),
            ("minimum slice genuine", self.minimum_genuine_per_slice),
            ("minimum slice impostor", self.minimum_impostor_per_slice),
        ):
            _count(count, count_label, 1)
        _rate(self.max_false_accept_rate, "Maximum false acceptance")
        _rate(self.min_true_accept_rate, "Minimum true acceptance")
        _rate(self.max_true_accept_gap, "Maximum group gap")
        if type(self.independent_threshold_commit) is not bool:
            _refuse("The threshold-commit flag must be boolean.")
        if not self.required_slices or len(self.required_slices) > 256:
            _refuse("The frozen policy needs a bounded, explicit slice inventory.")
        if len(set(self.required_slices)) != len(self.required_slices):
            _refuse("Policy slices must not repeat.")
        if set(slice_.dimension for slice_ in self.required_slices) != set(_DIMENSIONS):
            _refuse("All six independently labelled dimensions must be covered.")
        for dimension in _DIMENSIONS:
            if sum(slice_.dimension == dimension for slice_ in self.required_slices) < 2:
                _refuse("Every dimension needs at least two preregistered comparison groups.")

    def public_policy(self) -> dict[str, object]:
        return {
            "version": _VERSION,
            "name": self.name,
            "manifest_sha256": self.manifest_sha256,
            "model_sha256": self.model_sha256,
            "preprocessing_sha256": self.preprocessing_sha256,
            "definitions_sha256": self.definitions_sha256,
            "baseline_sha256": self.baseline_sha256,
            "threshold": self.threshold,
            "minimum_genuine": self.minimum_genuine,
            "minimum_impostor": self.minimum_impostor,
            "minimum_genuine_per_slice": self.minimum_genuine_per_slice,
            "minimum_impostor_per_slice": self.minimum_impostor_per_slice,
            "max_false_accept_rate": self.max_false_accept_rate,
            "min_true_accept_rate": self.min_true_accept_rate,
            "max_true_accept_gap": self.max_true_accept_gap,
            "required_slices": [
                {"dimension": item.dimension, "label": item.label}
                for item in sorted(self.required_slices, key=lambda item: (item.dimension, item.label))
            ],
            "independent_threshold_commit": self.independent_threshold_commit,
        }

    def fingerprint(self) -> str:
        return hashlib.sha256(_canonical(self.public_policy()).encode("ascii")).hexdigest()


@dataclass(frozen=True, slots=True)
class IdentityPair:
    """Private in-memory observation; none of its identifiers enter public reports."""

    pair_id: str
    source_a: str
    source_b: str
    subject_a: str
    subject_b: str
    genuine: bool
    cosine: float
    slices: tuple[RequiredSlice, ...]
    consent_and_rights_checked: bool
    reference_labels_checked: bool
    split: Literal["calibration", "frozen"] = "frozen"

    def __post_init__(self) -> None:
        for label, value in (
            ("Pair", self.pair_id),
            ("Source A", self.source_a),
            ("Source B", self.source_b),
            ("Subject A", self.subject_a),
            ("Subject B", self.subject_b),
        ):
            _handle(value, label)
        if self.source_a == self.source_b:
            _refuse("Comparing one image with itself is not independent identity evidence.")
        if type(self.genuine) is not bool or type(self.cosine) not in (int, float):
            _refuse("Pair relation and cosine score are invalid.")
        if not math.isfinite(self.cosine) or not -1 <= self.cosine <= 1:
            _refuse("Pair cosine similarity is invalid.")
        if self.genuine != (self.subject_a == self.subject_b):
            _refuse("The independently labelled identity relation is inconsistent.")
        if type(self.consent_and_rights_checked) is not bool:
            _refuse("Rights assertion must be boolean.")
        if type(self.reference_labels_checked) is not bool:
            _refuse("Label assertion must be boolean.")
        if self.split not in ("calibration", "frozen"):
            _refuse("Unknown pair split.")
        if not self.slices or len(self.slices) > len(_DIMENSIONS):
            _refuse("Pair requires a bounded independent slice inventory.")
        if len({tag.dimension for tag in self.slices}) != len(self.slices):
            _refuse("One pair cannot have conflicting labels for a dimension.")

    @property
    def pair_key(self) -> tuple[str, str]:
        return ((self.source_a, self.source_b) if self.source_a < self.source_b
                else (self.source_b, self.source_a))


@dataclass(frozen=True, slots=True)
class RateInterval:
    measured: float | None
    lower95: float | None
    upper95: float | None
    numerator: int
    denominator: int

    def public_metadata(self) -> dict[str, object]:
        return {
            "measured": self.measured,
            "lower95": self.lower95,
            "upper95": self.upper95,
            "numerator": self.numerator,
            "denominator": self.denominator,
        }


def wilson_interval(success: int, count: int) -> RateInterval:
    """Wilson score interval for an observed Bernoulli proportion (z=1.96)."""
    _count(count, "interval count")
    _count(success, "interval success")
    if success > count:
        _refuse("Interval successes exceed trials.")
    if count == 0:
        return RateInterval(None, None, None, 0, 0)
    observed = success / count
    z = 1.959963984540054
    z2 = z * z
    correction = 1 + z2 / count
    center = (observed + z2 / (2 * count)) / correction
    spread = z * math.sqrt(
        observed * (1 - observed) / count + z2 / (4 * count * count)
    ) / correction
    return RateInterval(observed, max(0.0, min(observed, center - spread)),
                        min(1.0, max(observed, center + spread)), success, count)


@dataclass(frozen=True, slots=True)
class PairMetric:
    genuine: int
    impostor: int
    true_accept: RateInterval
    false_accept: RateInterval

    def public_metadata(self) -> dict[str, object]:
        return {
            "genuine": self.genuine,
            "impostor": self.impostor,
            "true_accept": self.true_accept.public_metadata(),
            "false_accept": self.false_accept.public_metadata(),
        }


@dataclass(frozen=True, slots=True)
class SliceMetric:
    dimension: str
    label: str
    metric: PairMetric
    sufficiently_sampled: bool

    def public_metadata(self) -> dict[str, object]:
        return {
            "dimension": self.dimension,
            "label": self.label,
            "metric": self.metric.public_metadata(),
            "sufficiently_sampled": self.sufficiently_sampled,
        }


@dataclass(frozen=True, slots=True)
class IdentityPairAudit:
    status: Status
    reasons: tuple[str, ...]
    policy_sha256: str
    all_pairs: PairMetric
    slices: tuple[SliceMetric, ...]
    worst_true_accept_gap: float | None
    measured_on_external_faces: bool
    independently_approved: Literal[False] = False
    release_qualified: Literal[False] = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": _VERSION,
            "status": self.status,
            "reasons": list(self.reasons),
            "policy_sha256": self.policy_sha256,
            "all_pairs": self.all_pairs.public_metadata(),
            "slices": [item.public_metadata() for item in self.slices],
            "worst_true_accept_gap": self.worst_true_accept_gap,
            "measured_on_external_faces": self.measured_on_external_faces,
            "independently_approved": False,
            "release_qualified": False,
        }


def _metric(pairs: Sequence[IdentityPair], threshold: float) -> PairMetric:
    genuine = sum(item.genuine for item in pairs)
    impostor = len(pairs) - genuine
    true_accepts = sum(item.genuine and item.cosine >= threshold for item in pairs)
    false_accepts = sum(not item.genuine and item.cosine >= threshold for item in pairs)
    return PairMetric(
        genuine=genuine,
        impostor=impostor,
        true_accept=wilson_interval(true_accepts, genuine),
        false_accept=wilson_interval(false_accepts, impostor),
    )


def _privacy_preserving_reasons(reasons: Sequence[str]) -> tuple[str, ...]:
    return tuple(sorted(set(reasons)))


def evaluate_identity_pairs(
    observations: Sequence[IdentityPair],
    policy: IdentityPolicy,
    *,
    measured_on_external_faces: bool = False,
) -> IdentityPairAudit:
    """Evaluate a frozen holdout without fitting thresholds or publishing pair IDs.

    A clean technical result is never a release pass. Only an independent
    frozen real-face runner can decide public-release authorization.
    """
    if type(measured_on_external_faces) is not bool:
        _refuse("External-evidence flag must be boolean.")
    if len(observations) > 1_000_000:
        _refuse("Pair evidence exceeds the bounded audit size.")
    seen_ids: set[str] = set()
    seen_pairs: set[tuple[str, str]] = set()
    frozen_sources: set[str] = set()
    calibration_sources: set[str] = set()
    frozen_subjects: set[str] = set()
    calibration_subjects: set[str] = set()
    for row in observations:
        if not isinstance(row, IdentityPair):
            _refuse("Unvalidated pair evidence supplied.")
        if row.pair_id in seen_ids or row.pair_key in seen_pairs:
            _refuse("Duplicate pair evidence cannot enter the same audit.")
        seen_ids.add(row.pair_id)
        seen_pairs.add(row.pair_key)
        chosen = frozen_sources if row.split == "frozen" else calibration_sources
        chosen.update((row.source_a, row.source_b))
        chosen_subjects = frozen_subjects if row.split == "frozen" else calibration_subjects
        chosen_subjects.update((row.subject_a, row.subject_b))
    if frozen_sources & calibration_sources:
        _refuse("A photograph appears in both calibration and frozen comparisons.")
    if frozen_subjects & calibration_subjects:
        _refuse("A subject appears in both calibration and frozen comparisons.")
    rows = tuple(row for row in observations if row.split == "frozen")
    all_metrics = _metric(rows, policy.threshold)
    reasons: list[str] = []
    fail = False
    if not policy.independent_threshold_commit:
        reasons.append("threshold_not_independently_preregistered")
    if not rows:
        reasons.append("frozen_comparison_set_empty")
    if any(not row.consent_and_rights_checked for row in rows):
        reasons.append("pair_rights_not_confirmed")
    if any(not row.reference_labels_checked for row in rows):
        reasons.append("independent_pair_labels_missing")
    if all_metrics.genuine < policy.minimum_genuine:
        reasons.append("genuine_pairs_underpowered")
    if all_metrics.impostor < policy.minimum_impostor:
        reasons.append("impostor_pairs_underpowered")
    if all_metrics.false_accept.measured is not None:
        if all_metrics.false_accept.measured > policy.max_false_accept_rate:
            fail = True
            reasons.append("false_accept_rate_exceeds_policy")
    if all_metrics.true_accept.measured is not None:
        if all_metrics.true_accept.measured < policy.min_true_accept_rate:
            fail = True
            reasons.append("true_accept_rate_below_policy")
    if all_metrics.false_accept.upper95 is not None:
        if all_metrics.false_accept.upper95 > policy.max_false_accept_rate:
            reasons.append("false_accept_confidence_insufficient")
    if all_metrics.true_accept.lower95 is not None:
        if all_metrics.true_accept.lower95 < policy.min_true_accept_rate:
            reasons.append("true_accept_confidence_insufficient")
    by_slice: dict[RequiredSlice, list[IdentityPair]] = defaultdict(list)
    for row in rows:
        for tag in row.slices:
            by_slice[tag].append(row)
    summary: list[SliceMetric] = []
    for required in sorted(policy.required_slices, key=lambda item: (item.dimension, item.label)):
        value = _metric(by_slice[required], policy.threshold)
        sufficient = (
            value.genuine >= policy.minimum_genuine_per_slice
            and value.impostor >= policy.minimum_impostor_per_slice
        )
        if not sufficient:
            reasons.append("frozen_slice_underpowered")
        if value.true_accept.measured is not None:
            if value.true_accept.measured < policy.min_true_accept_rate:
                fail = True
                reasons.append("slice_true_accept_below_policy")
        if value.false_accept.measured is not None:
            if value.false_accept.measured > policy.max_false_accept_rate:
                fail = True
                reasons.append("slice_false_accept_exceeds_policy")
        summary.append(SliceMetric(required.dimension, required.label, value, sufficient))
    worst_gap = 0.0
    for dimension in _DIMENSIONS:
        values: list[float] = []
        for item in summary:
            rate = item.metric.true_accept.measured
            if item.dimension == dimension and item.sufficiently_sampled and rate is not None:
                values.append(rate)
        if len(values) < 2:
            reasons.append("comparison_groups_underpowered")
            continue
        gap = max(values) - min(values)
        worst_gap = max(worst_gap, gap)
        if gap > policy.max_true_accept_gap:
            fail = True
            reasons.append("true_accept_group_disparity")
    if not measured_on_external_faces:
        reasons.append("synthetic_or_external_source_unverified")
    if fail:
        status: Status = "blocked"
    elif reasons:
        status = "unproven"
    else:
        status = "ready_for_independent_review"
    return IdentityPairAudit(
        status=status,
        reasons=_privacy_preserving_reasons(reasons),
        policy_sha256=policy.fingerprint(),
        all_pairs=all_metrics,
        slices=tuple(summary),
        worst_true_accept_gap=worst_gap,
        measured_on_external_faces=measured_on_external_faces,
    )


def identity_report_json(report: IdentityPairAudit) -> str:
    """Serialize only aggregated, bounded fields; private pair IDs never leave."""
    return _canonical(report.public_metadata())


def reject_subject_overlap(
    development_subjects: Sequence[str], frozen_subjects: Sequence[str],
) -> None:
    """Reject cross-split subject leakage before reading protected comparisons."""
    if len(development_subjects) > 2_000_000 or len(frozen_subjects) > 2_000_000:
        _refuse("Subject split manifest is too large.")
    for subject in chain(development_subjects, frozen_subjects):
        _handle(subject, "Subject")
    if len(set(development_subjects)) != len(development_subjects):
        _refuse("Development manifest repeats a subject.")
    if len(set(frozen_subjects)) != len(frozen_subjects):
        _refuse("Frozen manifest repeats a subject.")
    if set(development_subjects) & set(frozen_subjects):
        _refuse("Subject leakage between development and frozen evidence.")
