"""Strict photo-free interchange for externally measured Pro quality evidence.

The real-face box owns images and labels. Inputs to this module are summaries,
not trusted user claims. No raw pixels, embeddings, filenames or model bytes
are accepted, and even a complete report cannot authorize public release.
Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import cast

from .errors import CommandValidationError
from .release_readiness import (
    CommandObservation,
    FrozenAudit,
    FrozenIdentity,
    RequiredDimension,
    SliceObservation,
    review_frozen_readiness,
)

_MAX_BYTES = 4 * 1024 * 1024
_MAX_COMMANDS = 5
_MAX_SLICES = 4096
_MAX_LABELS = 256
_TOP_FIELDS = frozenset({
    "version", "identity", "reports", "observed_manifest_sha256",
    "observed_definitions_sha256", "observed_model_sha256",
    "observed_baseline_commit", "independent_runner",
})
_FROZEN_FIELDS = frozenset({
    "set_id", "manifest_sha256", "definitions_sha256", "model_sha256",
    "baseline_commit", "expected_faces", "minimum_per_slice", "required_dimensions",
})
_REPORT_FIELDS = frozenset({
    "command", "expected_faces", "processed_faces", "eligible_faces", "error_faces",
    "confirmed_identity_checks", "rejected_identity_checks", "uncertain_identity_checks",
    "passed_metric_checks", "total_metric_checks", "has_independent_human_review",
    "all_reference_labels_present", "checked_model_and_data_rights", "baseline_comparable",
    "slices",
})
_SLICE_FIELDS = frozenset({
    "dimension", "label", "eligible", "passed", "threshold", "threshold_preregistered",
})


def _checked_map(value: object, fields: frozenset[str]) -> dict[str, object]:
    if not isinstance(value, dict) or set(value) != fields:
        raise CommandValidationError(
            "invalid_release_payload", "Evidence fields are missing or unexpected.",
        )
    if any(not isinstance(key, str) for key in value):
        raise CommandValidationError("invalid_release_payload", "Evidence keys must be strings.")
    return value


def _string(value: object, name: str) -> str:
    if type(value) is not str:
        raise CommandValidationError("invalid_release_payload", f"{name} must be a string.")
    return cast(str, value)


def _integer(value: object, name: str) -> int:
    if type(value) is not int:
        raise CommandValidationError("invalid_release_payload", f"{name} must be an integer.")
    return cast(int, value)


def _boolean(value: object, name: str) -> bool:
    if type(value) is not bool:
        raise CommandValidationError("invalid_release_payload", f"{name} must be a boolean.")
    return cast(bool, value)


def _sequence(value: object, maximum: int, name: str) -> list[object]:
    if not isinstance(value, list) or len(value) > maximum:
        raise CommandValidationError("invalid_release_payload", f"{name} has invalid length.")
    return value


def _parse_frozen(value: object) -> FrozenIdentity:
    row = _checked_map(value, _FROZEN_FIELDS)
    labels = _sequence(row["required_dimensions"], _MAX_LABELS, "required_dimensions")
    dimensions = tuple(_string(item, "dimension") for item in labels)
    required: tuple[RequiredDimension, ...] = (
        "source", "tone", "gender", "yaw", "occlusion", "image_size",
    )
    if dimensions != required:
        raise CommandValidationError("invalid_release_payload", "Frozen dimensions differ.")
    return FrozenIdentity(
        set_id=_string(row["set_id"], "set_id"),
        manifest_sha256=_string(row["manifest_sha256"], "manifest_sha256"),
        definitions_sha256=_string(row["definitions_sha256"], "definitions_sha256"),
        model_sha256=_string(row["model_sha256"], "model_sha256"),
        baseline_commit=_string(row["baseline_commit"], "baseline_commit"),
        expected_faces=_integer(row["expected_faces"], "expected_faces"),
        minimum_per_slice=_integer(row["minimum_per_slice"], "minimum_per_slice"),
        required_dimensions=required,
    )


def _parse_slices(value: object) -> tuple[SliceObservation, ...]:
    rows = _sequence(value, _MAX_SLICES, "slice_evidence")
    results: list[SliceObservation] = []
    for item in rows:
        row = _checked_map(item, _SLICE_FIELDS)
        threshold = row["threshold"]
        if isinstance(threshold, bool) or not isinstance(threshold, (int, float)):
            raise CommandValidationError("invalid_release_payload", "Threshold must be numeric.")
        results.append(SliceObservation(
            dimension=cast(RequiredDimension, _string(row["dimension"], "dimension")),
            label=_string(row["label"], "label"),
            eligible=_integer(row["eligible"], "eligible"),
            passed=_integer(row["passed"], "passed"),
            threshold=float(threshold),
            threshold_preregistered=_boolean(
                row["threshold_preregistered"], "threshold_preregistered",
            ),
        ))
    return tuple(results)


def _parse_report(value: object) -> CommandObservation:
    row = _checked_map(value, _REPORT_FIELDS)
    return CommandObservation(
        command=_string(row["command"], "command"),
        expected_faces=_integer(row["expected_faces"], "expected_faces"),
        processed_faces=_integer(row["processed_faces"], "processed_faces"),
        eligible_faces=_integer(row["eligible_faces"], "eligible_faces"),
        error_faces=_integer(row["error_faces"], "error_faces"),
        confirmed_identity_checks=_integer(
            row["confirmed_identity_checks"], "confirmed_identity_checks",
        ),
        rejected_identity_checks=_integer(
            row["rejected_identity_checks"], "rejected_identity_checks",
        ),
        uncertain_identity_checks=_integer(
            row["uncertain_identity_checks"], "uncertain_identity_checks",
        ),
        passed_metric_checks=_integer(row["passed_metric_checks"], "passed_metric_checks"),
        total_metric_checks=_integer(row["total_metric_checks"], "total_metric_checks"),
        has_independent_human_review=_boolean(
            row["has_independent_human_review"], "has_independent_human_review",
        ),
        all_reference_labels_present=_boolean(
            row["all_reference_labels_present"], "all_reference_labels_present",
        ),
        checked_model_and_data_rights=_boolean(
            row["checked_model_and_data_rights"], "checked_model_and_data_rights",
        ),
        baseline_comparable=_boolean(row["baseline_comparable"], "baseline_comparable"),
        slices=_parse_slices(row["slices"]),
    )


@dataclass(frozen=True, slots=True)
class ExternalFrozenRun:
    identity: FrozenIdentity
    reports: tuple[CommandObservation, ...]
    observed_manifest_sha256: str
    observed_definitions_sha256: str
    observed_model_sha256: str
    observed_baseline_commit: str
    independent_runner: bool

    def audit(self) -> FrozenAudit:
        return review_frozen_readiness(
            self.identity,
            self.reports,
            observed_manifest_sha256=self.observed_manifest_sha256,
            observed_definitions_sha256=self.observed_definitions_sha256,
            observed_model_sha256=self.observed_model_sha256,
            observed_baseline_commit=self.observed_baseline_commit,
            independent_runner=self.independent_runner,
        )


def parse_external_frozen_run(data: bytes) -> ExternalFrozenRun:
    """Read one bounded JSON report, rejecting unknown biometric/image fields."""
    if not isinstance(data, bytes) or len(data) < 2 or len(data) > _MAX_BYTES:
        raise CommandValidationError("invalid_release_payload", "Evidence payload size is invalid.")
    try:
        decoded = data.decode("utf-8", errors="strict")
        parsed = json.loads(
            decoded, parse_constant=_reject_nonfinite,
            object_pairs_hook=_reject_duplicate_keys,
        )
    except (UnicodeDecodeError, ValueError, TypeError):
        raise CommandValidationError("invalid_release_payload", "Evidence is not valid JSON.") from None
    row = _checked_map(parsed, _TOP_FIELDS)
    if row["version"] != "beljour-pro-release-input/1":
        raise CommandValidationError("invalid_release_payload", "Evidence schema version is unsupported.")
    report_rows = _sequence(row["reports"], _MAX_COMMANDS, "command_reports")
    return ExternalFrozenRun(
        identity=_parse_frozen(row["identity"]),
        reports=tuple(_parse_report(item) for item in report_rows),
        observed_manifest_sha256=_string(
            row["observed_manifest_sha256"], "observed_manifest_sha256",
        ),
        observed_definitions_sha256=_string(
            row["observed_definitions_sha256"], "observed_definitions_sha256",
        ),
        observed_model_sha256=_string(
            row["observed_model_sha256"], "observed_model_sha256",
        ),
        observed_baseline_commit=_string(
            row["observed_baseline_commit"], "observed_baseline_commit",
        ),
        independent_runner=_boolean(row["independent_runner"], "independent_runner"),
    )


def _reject_nonfinite(value: str) -> None:
    raise CommandValidationError("invalid_release_payload", f"Nonfinite value {value} is not allowed.")


def _reject_duplicate_keys(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise CommandValidationError("invalid_release_payload", "Duplicate evidence key.")
        result[key] = value
    return result
