"""Synthetic metadata tests for read-only Pro release readiness.

These cases contain no user photograph and cannot authorize production release.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.release_readiness import (
    CommandObservation,
    FrozenIdentity,
    SliceObservation,
    review_frozen_readiness,
)

HEX = "a" * 64
OTHER_HEX = "b" * 64
DIMENSIONS = ("source", "tone", "gender", "yaw", "occlusion", "image_size")
COMMANDS = ("cleanup", "identitylock", "poseonly", "studioquality", "upscale")


def frozen() -> FrozenIdentity:
    return FrozenIdentity("frozen-100000-v1", HEX, HEX, HEX, "commit-123", 100_000, 30)


def slices() -> tuple[SliceObservation, ...]:
    return tuple(SliceObservation(name, "group-a", 100, 99, 0.95, True) for name in DIMENSIONS)


def case(command: str) -> CommandObservation:
    return CommandObservation(
        command, 100_000, 100_000, 100_000, 0, 100_000, 0, 0,
        15, 15, True, True, True, True, slices(),
    )


def assess(*items: CommandObservation, independent: bool = True):
    return review_frozen_readiness(
        frozen(), tuple(items), observed_manifest_sha256=HEX,
        observed_definitions_sha256=HEX, observed_model_sha256=HEX,
        observed_baseline_commit="commit-123", independent_runner=independent,
    )


def test_all_complete_means_independent_review_not_release() -> None:
    result = assess(*(case(name) for name in COMMANDS))
    assert result.status == "ready_for_independent_review"
    assert result.independently_approved is False
    assert result.public_metadata()["independently_approved"] is False
    assert result.failed == ()
    assert result.missing == ()


def test_empty_and_partial_are_unproven() -> None:
    empty = assess()
    assert empty.status == "unproven"
    assert len(empty.missing) == 5
    partial = assess(case("cleanup"))
    assert len(partial.missing) == 4
    assert partial.recorded_commands == ("cleanup",)


@pytest.mark.parametrize(
    ("field", "reason"),
    [
        ("processed_faces", "incomplete_frozen_set"),
        ("eligible_faces", "ineligible_cases"),
        ("uncertain_identity_checks", "identity_unproven"),
        ("confirmed_identity_checks", "identity_coverage"),
        ("total_metric_checks", "metrics_missing"),
    ],
)
def test_missing_conditions_are_not_passes(field: str, reason: str) -> None:
    changes = {field: 0 if field not in ("uncertain_identity_checks",) else 1}
    if field == "processed_faces":
        changes.update(eligible_faces=0, confirmed_identity_checks=0)
    if field == "eligible_faces":
        changes.update(eligible_faces=99_999)
    if field == "uncertain_identity_checks":
        changes.update(confirmed_identity_checks=99_999)
    if field == "total_metric_checks":
        changes.update(passed_metric_checks=0)
    report = replace(case("cleanup"), **changes)
    outcome = assess(report)
    assert outcome.status == "unproven"
    assert f"cleanup:{reason}" in outcome.missing


@pytest.mark.parametrize(
    ("field", "reason"),
    [
        ("expected_faces", "expected_count_mismatch"),
        ("error_faces", "processing_errors"),
        ("rejected_identity_checks", "identity_regressions"),
        ("passed_metric_checks", "metric_regressions"),
    ],
)
def test_explicit_regressions_fail(field: str, reason: str) -> None:
    changes = {field: 100_001 if field == "expected_faces" else 1}
    if field == "rejected_identity_checks":
        changes.update(confirmed_identity_checks=99_999)
    report = replace(case("cleanup"), **changes)
    outcome = assess(report)
    assert outcome.status == "blocked"
    assert f"cleanup:{reason}" in outcome.failed


@pytest.mark.parametrize(
    ("field", "reason"),
    [
        ("all_reference_labels_present", "reference_labels_missing"),
        ("checked_model_and_data_rights", "model_or_data_rights"),
        ("baseline_comparable", "baseline_comparison_missing"),
        ("has_independent_human_review", "human_review_missing"),
    ],
)
def test_external_review_and_rights_are_required(field: str, reason: str) -> None:
    report = replace(case("cleanup"), **{field: False})
    outcome = assess(report)
    assert f"cleanup:{reason}" in outcome.missing


def test_independent_runner_missing() -> None:
    result = assess(*(case(name) for name in COMMANDS), independent=False)
    assert result.status == "unproven"
    assert "independent_runner_missing" in result.missing


def test_minimum_group_and_all_dimensions_required() -> None:
    small = replace(slices()[0], eligible=2, passed=2)
    report = replace(case("cleanup"), slices=(small, *slices()[1:]))
    result = assess(report)
    assert "cleanup:source:group-a:underpowered" in result.missing
    without = replace(case("cleanup"), slices=slices()[:-1])
    assert "cleanup:image_size_slices_missing" in assess(without).missing


def test_failed_and_posthoc_slice_threshold() -> None:
    weak = replace(slices()[0], passed=70)
    report = replace(case("cleanup"), slices=(weak, *slices()[1:]))
    assert "cleanup:source:group-a:below_threshold" in assess(report).failed
    posthoc = replace(slices()[0], threshold_preregistered=False)
    report = replace(case("cleanup"), slices=(posthoc, *slices()[1:]))
    assert "cleanup:source:group-a:threshold_not_preregistered" in assess(report).missing


def test_manifest_definitions_model_and_baseline_bound() -> None:
    values = {
        "observed_manifest_sha256": HEX,
        "observed_definitions_sha256": HEX,
        "observed_model_sha256": HEX,
        "observed_baseline_commit": "commit-123",
        "independent_runner": True,
    }
    for field, change, reason in (
        ("observed_manifest_sha256", OTHER_HEX, "manifest_changed"),
        ("observed_definitions_sha256", OTHER_HEX, "definitions_changed"),
        ("observed_model_sha256", OTHER_HEX, "identity_model_changed"),
        ("observed_baseline_commit", "other-commit", "baseline_changed"),
    ):
        modified = {**values, field: change}
        result = review_frozen_readiness(frozen(), tuple(case(x) for x in COMMANDS), **modified)
        assert result.status == "blocked"
        assert reason in result.failed


@pytest.mark.parametrize("missing", ["", "mismatched", "ABC", "a" * 63])
def test_bad_hashes_rejected(missing: str) -> None:
    with pytest.raises(CommandValidationError):
        FrozenIdentity("frozen-100000", missing, HEX, HEX, "commit-123", 100_000, 30)


def test_wrong_shape_and_required_labels_rejected() -> None:
    with pytest.raises(CommandValidationError):
        FrozenIdentity("frozen-100000", HEX, HEX, HEX, "commit-123", 999, 30)
    with pytest.raises(CommandValidationError):
        FrozenIdentity("frozen-100000", HEX, HEX, HEX, "commit-123", 100_000, 0)
    with pytest.raises(CommandValidationError):
        FrozenIdentity(
            "frozen-100000", HEX, HEX, HEX, "commit-123", 100_000, 30,
            ("source",),
        )


def test_bad_slice_and_report_rejected() -> None:
    with pytest.raises(CommandValidationError):
        replace(slices()[0], eligible=1, passed=2)
    with pytest.raises(CommandValidationError):
        replace(slices()[0], threshold=float("nan"))
    with pytest.raises(CommandValidationError):
        replace(case("cleanup"), confirmed_identity_checks=100_001)
    with pytest.raises(CommandValidationError):
        replace(case("cleanup"), slices=(slices()[0], slices()[0]))
    with pytest.raises(CommandValidationError):
        assess(case("cleanup"), case("cleanup"))


def test_no_personal_or_biometric_data_in_output() -> None:
    public = assess(case("cleanup")).public_metadata()
    assert public["set_id"] == "frozen-100000-v1"
    assert "pixels" not in repr(public)
    assert "embeddings" not in repr(public)
    assert "filenames" not in repr(public)
