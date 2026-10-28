"""Five-command, forty-one-level synthetic engineering lock matrix tests.

These tests cannot award approval for real faces or for a public release.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.lock_matrix import (
    COMMANDS,
    LEVELS,
    LockObservation,
    evaluate_command_locks,
)
from plumb_api.commands.types import CommandName


def observation(command: CommandName, level: int) -> LockObservation:
    return LockObservation(
        command=command,
        level_tenths=level,
        preview_ms=12.5,
        export_ms=83.0,
        identity_applied=True,
        alpha_unchanged=True,
        protected_unchanged=True,
        neutral_correct=True,
        skin_lift_l=1.8 if command is CommandName.STUDIOQUALITY else None,
        pose_minimum_jacobian=0.8 if command is CommandName.POSEONLY else None,
        pose_retention=1.0 if command is CommandName.POSEONLY else None,
        measured_device=False,
    )


def full() -> tuple[LockObservation, ...]:
    return tuple(observation(command, level) for command in COMMANDS for level in LEVELS)


def substitute(rows: tuple[LockObservation, ...], changed: LockObservation) -> tuple[LockObservation, ...]:
    return tuple(
        changed if row.command == changed.command and row.level_tenths == changed.level_tenths
        else row for row in rows
    )


def test_all_five_commands_and_all_levels_are_required() -> None:
    observed = full()
    report = evaluate_command_locks(observed)
    assert len(observed) == 205
    assert report.total_checked == 205
    assert report.complete_five_command_coverage
    assert report.status == "synthetic_ready"
    assert all(item.checked_levels == 41 for item in report.findings)
    assert not report.release_qualified
    assert report.public_metadata()["independent_face_evidence"] is False


def test_missing_one_decimal_level_remains_incomplete() -> None:
    observed = tuple(item for item in full() if not (
        item.command is CommandName.POSEONLY and item.level_tenths == 23
    ))
    report = evaluate_command_locks(observed)
    assert report.status == "incomplete"
    assert not report.complete_five_command_coverage
    last = next(item for item in report.findings if item.command is CommandName.POSEONLY)
    assert last.missing_levels == (23,)


def test_duplicate_receipts_are_not_counted_as_coverage() -> None:
    observed = full()
    report = evaluate_command_locks((*observed, observed[0]))
    assert report.status == "blocked"
    assert report.duplicate_rows == 1
    assert report.total_checked == 205


@pytest.mark.parametrize("field", [
    "identity_applied", "alpha_unchanged", "protected_unchanged", "neutral_correct",
])
def test_mutated_invariant_is_caught(field: str) -> None:
    observed = full()
    selected = observation(CommandName.CLEANUP, 10)
    changed = replace(selected, **{field: False})
    report = evaluate_command_locks(substitute(observed, changed))
    assert report.status == "blocked"
    checks = next(row for row in report.findings if row.command is CommandName.CLEANUP)
    assert checks.failed_levels == (10,)


def test_no_default_identity_cannot_become_locked() -> None:
    selected = replace(observation(CommandName.POSEONLY, 50), identity_applied=False)
    report = evaluate_command_locks(substitute(full(), selected))
    assert report.status == "blocked"


@pytest.mark.parametrize("invalid", [2.50001, 3.0, 9.0])
def test_studio_lightness_above_declared_cap_blocks(invalid: float) -> None:
    altered = replace(observation(CommandName.STUDIOQUALITY, 43), skin_lift_l=invalid)
    result = evaluate_command_locks(substitute(full(), altered))
    assert result.status == "blocked"
    entry = next(row for row in result.findings if row.command is CommandName.STUDIOQUALITY)
    assert entry.failed_levels == (43,)


def test_studio_missing_mask_measurement_blocks() -> None:
    modified = replace(observation(CommandName.STUDIOQUALITY, 27), skin_lift_l=None)
    report = evaluate_command_locks(substitute(full(), modified))
    assert report.status == "blocked"


@pytest.mark.parametrize("change", [
    {"pose_minimum_jacobian": 0.249},
    {"pose_minimum_jacobian": None},
    {"pose_retention": 0.249},
    {"pose_retention": None},
])
def test_pose_folds_and_missing_evidence_block(change: dict[str, object]) -> None:
    altered = replace(observation(CommandName.POSEONLY, 50), **change)
    report = evaluate_command_locks(substitute(full(), altered))
    assert report.status == "blocked"
    checked = next(item for item in report.findings if item.command is CommandName.POSEONLY)
    assert checked.failed_levels == (50,)


def test_budget_regression_blocks_engineering_readiness() -> None:
    observed = full()
    slow = replace(observation(CommandName.UPSCALE, 49), preview_ms=100.001)
    report = evaluate_command_locks(substitute(observed, slow))
    assert report.status == "blocked"
    entry = next(item for item in report.findings if item.command is CommandName.UPSCALE)
    assert entry.timing_limited_levels == (49,)


def test_device_report_still_does_not_approve_independent_face_gate() -> None:
    observed = tuple(replace(row, measured_device=True) for row in full())
    report = evaluate_command_locks(observed)
    assert report.status == "device_measured"
    assert all(item.device_levels == 41 for item in report.findings)
    assert not report.release_qualified
    assert report.public_metadata()["release_qualified"] is False


def test_partial_device_timings_remain_synthetic_ready() -> None:
    observed = list(full())
    observed[0] = replace(observed[0], measured_device=True)
    report = evaluate_command_locks(tuple(observed))
    assert report.status == "synthetic_ready"


@pytest.mark.parametrize("invalid", [-2.0, 0.0, math.nan, math.inf])
def test_bad_budgets_do_not_change_gate(invalid: float) -> None:
    with pytest.raises(CommandValidationError):
        evaluate_command_locks(full(), preview_budget_ms=invalid)


@pytest.mark.parametrize("invalid", [math.nan, math.inf, -1.0])
def test_invalid_observation_timing_refused(invalid: float) -> None:
    with pytest.raises(CommandValidationError):
        replace(observation(CommandName.CLEANUP, 15), preview_ms=invalid)


def test_invalid_level_rejected_not_rounded() -> None:
    with pytest.raises(CommandValidationError):
        observation(CommandName.POSEONLY, 9)
    with pytest.raises(CommandValidationError):
        observation(CommandName.POSEONLY, 51)


def test_large_matrix_refused() -> None:
    rows = full()
    with pytest.raises(CommandValidationError):
        evaluate_command_locks(rows * 3)


def test_public_matrix_exposes_no_private_face_or_annotations() -> None:
    report = evaluate_command_locks(full())
    result = str(report.public_metadata())
    for word in ("pixels", "landmarks", "image_path", "face_embedding", "body_mask"):
        assert word not in result
