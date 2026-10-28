"""Strict external report handling on synthetic metadata only. Author: John Khan."""

from __future__ import annotations

import json
from collections.abc import Callable

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.release_payload import parse_external_frozen_run
from plumb_api.commands.release_readiness import CommandObservation, FrozenIdentity, SliceObservation

HEX = "d" * 64
COMMANDS = ("cleanup", "identitylock", "poseonly", "studioquality", "upscale")
DIMENSIONS = ("source", "tone", "gender", "yaw", "occlusion", "image_size")


def input_dict() -> dict[str, object]:
    frozen = FrozenIdentity("frozen-100000", HEX, HEX, HEX, "commit-4", 100_000, 30)
    labels = tuple(SliceObservation(name, "group-a", 300, 298, 0.95, True)
                   for name in DIMENSIONS)
    commands = tuple(CommandObservation(name, 100_000, 100_000, 100_000, 0,
                                        100_000, 0, 0, 13, 13, True, True, True,
                                        True, labels) for name in COMMANDS)
    return {
        "version": "beljour-pro-release-input/1",
        "identity": {
            "set_id": frozen.set_id,
            "manifest_sha256": frozen.manifest_sha256,
            "definitions_sha256": frozen.definitions_sha256,
            "model_sha256": frozen.model_sha256,
            "baseline_commit": frozen.baseline_commit,
            "expected_faces": frozen.expected_faces,
            "minimum_per_slice": frozen.minimum_per_slice,
            "required_dimensions": list(frozen.required_dimensions),
        },
        "reports": [
            {
                "command": report.command,
                "expected_faces": report.expected_faces,
                "processed_faces": report.processed_faces,
                "eligible_faces": report.eligible_faces,
                "error_faces": report.error_faces,
                "confirmed_identity_checks": report.confirmed_identity_checks,
                "rejected_identity_checks": report.rejected_identity_checks,
                "uncertain_identity_checks": report.uncertain_identity_checks,
                "passed_metric_checks": report.passed_metric_checks,
                "total_metric_checks": report.total_metric_checks,
                "has_independent_human_review": report.has_independent_human_review,
                "all_reference_labels_present": report.all_reference_labels_present,
                "checked_model_and_data_rights": report.checked_model_and_data_rights,
                "baseline_comparable": report.baseline_comparable,
                "slices": [],
            }
            for report in commands
        ],
        "observed_manifest_sha256": HEX,
        "observed_definitions_sha256": HEX,
        "observed_model_sha256": HEX,
        "observed_baseline_commit": "commit-4",
        "independent_runner": True,
    }


def payload(modify: Callable[[dict[str, object]], None] | None = None) -> bytes:
    raw = input_dict()
    frozen = raw["reports"]
    assert isinstance(frozen, list)
    for report in frozen:
        assert isinstance(report, dict)
        report["slices"] = [
            {"dimension": name, "label": "group-a", "eligible": 300, "passed": 298,
             "threshold": 0.95, "threshold_preregistered": True}
            for name in DIMENSIONS
        ]
    if modify is not None:
        modify(raw)
    return json.dumps(raw, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def test_complete_report_stays_pending_independent_release() -> None:
    report = parse_external_frozen_run(payload())
    audit = report.audit()
    assert audit.status == "ready_for_independent_review"
    assert audit.independently_approved is False
    assert len(report.reports) == 5
    assert report.identity.expected_faces == 100_000


def test_report_can_be_replayed_deterministically() -> None:
    left = parse_external_frozen_run(payload()).audit().public_metadata()
    right = parse_external_frozen_run(payload()).audit().public_metadata()
    assert left == right


def test_missing_command_is_unproven() -> None:
    def change(value: dict[str, object]) -> None:
        assert isinstance(value["reports"], list)
        value["reports"].pop()
    result = parse_external_frozen_run(payload(change)).audit()
    assert result.status == "unproven"
    assert "upscale:missing_command" in result.missing


def test_invalid_report_alters_only_readiness() -> None:
    def change(value: dict[str, object]) -> None:
        reports = value["reports"]
        assert isinstance(reports, list) and isinstance(reports[0], dict)
        reports[0]["error_faces"] = 1
    audit = parse_external_frozen_run(payload(change)).audit()
    assert audit.status == "blocked"
    assert "cleanup:processing_errors" in audit.failed


@pytest.mark.parametrize("invalid", [
    b"", b" ", b"[]", b"\xff", b"{bad", b"NaN", b"null",
    b"{\"value\":Infinity}", b"A" * (4 * 1024 * 1024 + 1),
])
def test_rejects_invalid_payload(invalid: bytes) -> None:
    with pytest.raises(CommandValidationError):
        parse_external_frozen_run(invalid)


def test_rejects_extra_photo_or_biometric_fields() -> None:
    for location in ("top", "command", "slice", "identity"):
        def change(value: dict[str, object]) -> None:
            reports = value["reports"]
            identity = value["identity"]
            assert isinstance(reports, list) and isinstance(reports[0], dict)
            assert isinstance(identity, dict)
            if location == "top":
                value["raw_photo"] = "forbidden"
            elif location == "identity":
                identity["embeddings"] = [0.2, 0.3]
            elif location == "command":
                reports[0]["filename"] = "private-face.jpg"
            else:
                assert isinstance(reports[0]["slices"], list)
                reports[0]["slices"][0]["image_path"] = "/private"
        with pytest.raises(CommandValidationError):
            parse_external_frozen_run(payload(change))


def test_rejects_changed_version() -> None:
    def change(value: dict[str, object]) -> None:
        value["version"] = "future-schema"
    with pytest.raises(CommandValidationError):
        parse_external_frozen_run(payload(change))


def test_rejects_extra_slice_count() -> None:
    def change(value: dict[str, object]) -> None:
        reports = value["reports"]
        assert isinstance(reports, list) and isinstance(reports[0], dict)
        assert isinstance(reports[0]["slices"], list)
        reports[0]["slices"] *= 700
    with pytest.raises(CommandValidationError):
        parse_external_frozen_run(payload(change))


def test_rejects_changed_dimensions() -> None:
    def change(value: dict[str, object]) -> None:
        frozen = value["identity"]
        assert isinstance(frozen, dict)
        frozen["required_dimensions"] = ["source"]
    with pytest.raises(CommandValidationError):
        parse_external_frozen_run(payload(change))


def test_rejects_numeric_bool_and_float_counts() -> None:
    for count in (True, 10.2, "100000", None):
        def change(value: dict[str, object]) -> None:
            reports = value["reports"]
            assert isinstance(reports, list) and isinstance(reports[0], dict)
            reports[0]["processed_faces"] = count
        with pytest.raises(CommandValidationError):
            parse_external_frozen_run(payload(change))


def test_rejects_missing_or_wrong_flags() -> None:
    for value in ("yes", 1, None):
        def change(raw: dict[str, object]) -> None:
            raw["independent_runner"] = value
        with pytest.raises(CommandValidationError):
            parse_external_frozen_run(payload(change))


def test_rejects_changed_manifest_even_if_all_synthetic_numbers_green() -> None:
    def change(value: dict[str, object]) -> None:
        value["observed_manifest_sha256"] = "a" * 64
    report = parse_external_frozen_run(payload(change)).audit()
    assert report.status == "blocked"
    assert "manifest_changed" in report.failed


def test_duplicate_json_keys_rejected_without_silent_overwrite() -> None:
    source = payload()
    changed = source.replace(b'"independent_runner":true',
                             b'"independent_runner":true,"independent_runner":false')
    with pytest.raises(CommandValidationError):
        parse_external_frozen_run(changed)
