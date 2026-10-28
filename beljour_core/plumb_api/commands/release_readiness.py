"""Read-only qualification audit for five Pro Commands.

The external frozen-set runner retains ownership of image pixels, reference
labels, human judgements, model provenance and final release authorization.
This package consumes bounded, separately generated summaries only. A
successful local audit is readiness for independent review, never release PASS.
Author: John Khan.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Literal

from .errors import CommandValidationError

AuditStatus = Literal["blocked", "unproven", "ready_for_independent_review"]
RequiredDimension = Literal[
    "source", "tone", "gender", "yaw", "occlusion", "image_size",
]

_DIGEST = re.compile(r"^[a-f0-9]{64}$")
_ID = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}$")
_ALLOWED_COMMANDS = frozenset({
    "identitylock", "cleanup", "upscale", "studioquality", "poseonly",
})
_REQUIRED_GROUPS: tuple[RequiredDimension, ...] = (
    "source", "tone", "gender", "yaw", "occlusion", "image_size",
)


def _require_digest(value: str, label: str) -> None:
    if not isinstance(value, str) or _DIGEST.fullmatch(value) is None:
        raise CommandValidationError("invalid_release_audit", f"{label} needs a SHA-256 digest.")


def _require_count(value: int, label: str, minimum: int = 0) -> None:
    if type(value) is not int or value < minimum:
        raise CommandValidationError("invalid_release_audit", f"{label} has an invalid count.")


def _require_flag(value: bool, label: str) -> None:
    if type(value) is not bool:
        raise CommandValidationError("invalid_release_audit", f"{label} must be a boolean.")


@dataclass(frozen=True, slots=True)
class FrozenIdentity:
    """Opaque, externally preregistered manifest and comparison identity."""

    set_id: str
    manifest_sha256: str
    definitions_sha256: str
    model_sha256: str
    baseline_commit: str
    expected_faces: int
    minimum_per_slice: int
    required_dimensions: tuple[RequiredDimension, ...] = _REQUIRED_GROUPS

    def __post_init__(self) -> None:
        if not isinstance(self.set_id, str) or _ID.fullmatch(self.set_id) is None:
            raise CommandValidationError("invalid_release_audit", "Frozen set identifier is invalid.")
        if not isinstance(self.baseline_commit, str) or _ID.fullmatch(self.baseline_commit) is None:
            raise CommandValidationError("invalid_release_audit", "Baseline commit is missing.")
        for label, value in (
            ("manifest", self.manifest_sha256),
            ("definitions", self.definitions_sha256),
            ("model", self.model_sha256),
        ):
            _require_digest(value, label)
        _require_count(self.expected_faces, "expected_faces", 100_000)
        _require_count(self.minimum_per_slice, "minimum_per_slice", 1)
        if self.required_dimensions != _REQUIRED_GROUPS:
            raise CommandValidationError(
                "invalid_release_audit", "Frozen group dimensions must remain preregistered.",
            )


@dataclass(frozen=True, slots=True)
class SliceObservation:
    dimension: RequiredDimension
    label: str
    eligible: int
    passed: int
    threshold: float
    threshold_preregistered: bool

    def __post_init__(self) -> None:
        if self.dimension not in _REQUIRED_GROUPS:
            raise CommandValidationError("invalid_release_audit", "Unknown frozen group dimension.")
        if not isinstance(self.label, str) or _ID.fullmatch(self.label) is None:
            raise CommandValidationError("invalid_release_audit", "Slice label is invalid.")
        _require_count(self.eligible, "eligible")
        _require_count(self.passed, "passed")
        if self.passed > self.eligible:
            raise CommandValidationError("invalid_release_audit", "Passed exceeds eligible.")
        if (not isinstance(self.threshold, (int, float)) or
                not math.isfinite(self.threshold) or
                not 0.0 < self.threshold <= 1.0):
            raise CommandValidationError("invalid_release_audit", "Slice threshold is invalid.")
        _require_flag(self.threshold_preregistered, "threshold_preregistered")

    @property
    def observed_rate(self) -> float | None:
        return self.passed / self.eligible if self.eligible > 0 else None

    def public_metadata(self) -> dict[str, object]:
        return {
            "dimension": self.dimension,
            "label": self.label,
            "eligible": self.eligible,
            "passed": self.passed,
            "threshold": self.threshold,
            "threshold_preregistered": self.threshold_preregistered,
            "observed_rate": self.observed_rate,
        }


@dataclass(frozen=True, slots=True)
class CommandObservation:
    command: str
    expected_faces: int
    processed_faces: int
    eligible_faces: int
    error_faces: int
    confirmed_identity_checks: int
    rejected_identity_checks: int
    uncertain_identity_checks: int
    passed_metric_checks: int
    total_metric_checks: int
    has_independent_human_review: bool
    all_reference_labels_present: bool
    checked_model_and_data_rights: bool
    baseline_comparable: bool
    slices: tuple[SliceObservation, ...]

    def __post_init__(self) -> None:
        if self.command not in _ALLOWED_COMMANDS:
            raise CommandValidationError("invalid_release_audit", "Unknown Pro command.")
        for name in (
            "expected_faces", "processed_faces", "eligible_faces", "error_faces",
            "confirmed_identity_checks", "rejected_identity_checks",
            "uncertain_identity_checks", "passed_metric_checks", "total_metric_checks",
        ):
            _require_count(getattr(self, name), name)
        for name in (
            "has_independent_human_review", "all_reference_labels_present",
            "checked_model_and_data_rights", "baseline_comparable",
        ):
            _require_flag(getattr(self, name), name)
        if self.processed_faces > self.expected_faces:
            raise CommandValidationError("invalid_release_audit", "Processed count exceeds frozen set.")
        if self.eligible_faces > self.processed_faces or self.error_faces > self.processed_faces:
            raise CommandValidationError("invalid_release_audit", "Eligible/error counts exceed processed.")
        if self.confirmed_identity_checks + self.rejected_identity_checks + (
            self.uncertain_identity_checks
        ) > self.processed_faces:
            raise CommandValidationError("invalid_release_audit", "Identity checks exceed cases.")
        if self.passed_metric_checks > self.total_metric_checks:
            raise CommandValidationError("invalid_release_audit", "Metric checks exceed total.")
        keys = [(item.dimension, item.label) for item in self.slices]
        if len(set(keys)) != len(keys):
            raise CommandValidationError("invalid_release_audit", "Duplicate slice evidence.")
        if any(not isinstance(item, SliceObservation) for item in self.slices):
            raise CommandValidationError("invalid_release_audit", "Slice evidence is malformed.")


@dataclass(frozen=True, slots=True)
class FrozenAudit:
    version: Literal["beljour-pro-release-readiness/1"]
    status: AuditStatus
    set_id: str
    expected_faces: int
    recorded_commands: tuple[str, ...]
    failed: tuple[str, ...]
    missing: tuple[str, ...]
    independently_approved: Literal[False] = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": self.version,
            "status": self.status,
            "set_id": self.set_id,
            "expected_faces": self.expected_faces,
            "recorded_commands": list(self.recorded_commands),
            "failed": list(self.failed),
            "missing": list(self.missing),
            "independently_approved": False,
        }


def review_frozen_readiness(
    identity: FrozenIdentity,
    reports: tuple[CommandObservation, ...],
    *,
    observed_manifest_sha256: str,
    observed_definitions_sha256: str,
    observed_model_sha256: str,
    observed_baseline_commit: str,
    independent_runner: bool,
) -> FrozenAudit:
    """Fail explicit regressions and expose every prerequisite still unproven.

    Does not read images or validate a self-attested reviewer's authenticity.
    A separate independently controlled release runner must decide PASS.
    """
    if not isinstance(identity, FrozenIdentity) or not isinstance(reports, tuple):
        raise CommandValidationError("invalid_release_audit", "Typed frozen inputs required.")
    if any(not isinstance(report, CommandObservation) for report in reports):
        raise CommandValidationError("invalid_release_audit", "Malformed command evidence.")
    _require_flag(independent_runner, "independent_runner")
    for label, value in (
        ("observed_manifest", observed_manifest_sha256),
        ("observed_definitions", observed_definitions_sha256),
        ("observed_model", observed_model_sha256),
    ):
        _require_digest(value, label)
    if not isinstance(observed_baseline_commit, str):
        raise CommandValidationError("invalid_release_audit", "Invalid observed baseline.")
    if len({report.command for report in reports}) != len(reports):
        raise CommandValidationError("invalid_release_audit", "Duplicate command evidence.")
    failures: list[str] = []
    missing: list[str] = []
    if observed_manifest_sha256 != identity.manifest_sha256:
        failures.append("manifest_changed")
    if observed_definitions_sha256 != identity.definitions_sha256:
        failures.append("definitions_changed")
    if observed_model_sha256 != identity.model_sha256:
        failures.append("identity_model_changed")
    if observed_baseline_commit != identity.baseline_commit:
        failures.append("baseline_changed")
    if not independent_runner:
        missing.append("independent_runner_missing")
    by_command = {report.command: report for report in reports}
    for command in sorted(_ALLOWED_COMMANDS):
        report = by_command.get(command)
        if report is None:
            missing.append(f"{command}:missing_command")
            continue
        if report.expected_faces != identity.expected_faces:
            failures.append(f"{command}:expected_count_mismatch")
        if report.processed_faces < identity.expected_faces:
            missing.append(f"{command}:incomplete_frozen_set")
        if report.eligible_faces < report.processed_faces:
            missing.append(f"{command}:ineligible_cases")
        if report.error_faces > 0:
            failures.append(f"{command}:processing_errors")
        if report.rejected_identity_checks > 0:
            failures.append(f"{command}:identity_regressions")
        if report.uncertain_identity_checks > 0:
            missing.append(f"{command}:identity_unproven")
        if report.confirmed_identity_checks < report.processed_faces:
            missing.append(f"{command}:identity_coverage")
        if report.total_metric_checks == 0:
            missing.append(f"{command}:metrics_missing")
        elif report.passed_metric_checks < report.total_metric_checks:
            failures.append(f"{command}:metric_regressions")
        if not report.all_reference_labels_present:
            missing.append(f"{command}:reference_labels_missing")
        if not report.checked_model_and_data_rights:
            missing.append(f"{command}:model_or_data_rights")
        if not report.baseline_comparable:
            missing.append(f"{command}:baseline_comparison_missing")
        if not report.has_independent_human_review:
            missing.append(f"{command}:human_review_missing")
        covered_dimensions = {item.dimension for item in report.slices}
        for dimension in identity.required_dimensions:
            if dimension not in covered_dimensions:
                missing.append(f"{command}:{dimension}_slices_missing")
        for item in report.slices:
            key = f"{command}:{item.dimension}:{item.label}"
            if item.eligible < identity.minimum_per_slice:
                missing.append(f"{key}:underpowered")
            if not item.threshold_preregistered:
                missing.append(f"{key}:threshold_not_preregistered")
            if item.observed_rate is not None and item.observed_rate < item.threshold:
                failures.append(f"{key}:below_threshold")
    status: AuditStatus = (
        "blocked" if failures else "unproven" if missing else "ready_for_independent_review"
    )
    return FrozenAudit(
        "beljour-pro-release-readiness/1", status, identity.set_id,
        identity.expected_faces, tuple(sorted(by_command)),
        tuple(dict.fromkeys(failures)), tuple(dict.fromkeys(missing)),
    )
