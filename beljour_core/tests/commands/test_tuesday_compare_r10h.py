"""Literal technical regressions remain visible across reviewer packets.

Only metadata-only synthetic observations are used. Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.lock_matrix import COMMANDS, LEVELS, LockObservation
from plumb_api.commands.tuesday_compare import compare_tuesday_packets
from plumb_api.commands.tuesday_lock import build_tuesday_lock_packet
from plumb_api.commands.types import CommandName


def observation(command: CommandName, level: int) -> LockObservation:
    return LockObservation(
        command=command, level_tenths=level,
        preview_ms=12.0, export_ms=78.0,
        identity_applied=True, alpha_unchanged=True,
        protected_unchanged=True, neutral_correct=True,
        skin_lift_l=1.0 if command is CommandName.STUDIOQUALITY else None,
        pose_minimum_jacobian=0.9 if command is CommandName.POSEONLY else None,
        pose_retention=1.0 if command is CommandName.POSEONLY else None,
    )


def complete() -> tuple[LockObservation, ...]:
    return tuple(observation(command, level) for command in COMMANDS for level in LEVELS)


def packet(rows: tuple[LockObservation, ...], build: str, run: str = "same-locked-set") -> str:
    return build_tuesday_lock_packet(rows, run_id=run, renderer_build=build).to_json()


def test_same_complete_packet_is_not_a_release_approval() -> None:
    result = compare_tuesday_packets(packet(complete(), "old"), packet(complete(), "new"))
    assert result.status == "no_new_regressions"
    assert result.checked == 205
    assert result.regressions == ()
    assert result.improvements == 0
    assert result.public_metadata()["release_qualified"] is False
    assert result.public_metadata()["independent_realface_result"] == "NOT_RUN"


@pytest.mark.parametrize("change,issue", (
    ({"identity_applied": False}, "new_failure:failed_safety"),
    ({"neutral_correct": False}, "new_failure:failed_safety"),
    ({"alpha_unchanged": False}, "new_failure:failed_safety"),
    ({"preview_ms": 102.0}, "new_failure:over_budget"),
    ({"export_ms": 2300.0}, "new_failure:over_budget"),
))
def test_single_stop_regression_not_hidden(change: dict[str, object], issue: str) -> None:
    baseline = complete()
    altered = (replace(baseline[0], **change), *baseline[1:])
    result = compare_tuesday_packets(packet(baseline, "old"), packet(altered, "new"))
    assert result.status == "regressed"
    assert len(result.regressions) == 1
    assert result.regressions[0].issue == issue
    assert result.regressions[0].level_tenths == 10
    assert result.improvements == 0


def test_missing_row_recovery_counts_as_an_improvement_only() -> None:
    baseline = complete()[1:]
    current = complete()
    result = compare_tuesday_packets(packet(baseline, "old"), packet(current, "new"))
    assert result.status == "no_new_regressions"
    assert result.improvements == 1
    assert result.regressions == ()


def test_new_missing_row_never_inherits_old_pass() -> None:
    baseline = complete()
    current = complete()[1:]
    report = compare_tuesday_packets(packet(baseline, "old"), packet(current, "new"))
    assert report.status == "regressed"
    assert report.regressions[0].issue == "new_failure:missing"


def test_different_locked_runs_refused() -> None:
    with pytest.raises(CommandValidationError, match="different run"):
        compare_tuesday_packets(packet((), "old", run="first"), packet((), "new", run="second"))


def test_repeated_results_have_stable_order() -> None:
    earlier = packet(complete(), "old")
    later = packet(tuple(reversed(complete())), "new")
    one = compare_tuesday_packets(earlier, later)
    two = compare_tuesday_packets(earlier, later)
    assert one == two


def test_untrusted_json_never_becomes_comparison_evidence() -> None:
    with pytest.raises(CommandValidationError):
        compare_tuesday_packets("{broken", packet((), "new"))
