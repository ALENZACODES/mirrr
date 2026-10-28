"""Honest five-command engineering lock matrix for all 41 decimal levels.

An engineering-checked synthetic matrix is not independent face validation.
Only the existing external frozen gate can establish release readiness.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

from .errors import CommandValidationError
from .types import CommandName

LockStatus = Literal["blocked", "incomplete", "synthetic_ready", "device_measured"]
LEVELS: tuple[int, ...] = tuple(range(10, 51))
COMMANDS: tuple[CommandName, ...] = tuple(CommandName)


@dataclass(frozen=True, slots=True)
class LockObservation:
    command: CommandName
    level_tenths: int
    preview_ms: float
    export_ms: float
    identity_applied: bool
    alpha_unchanged: bool
    protected_unchanged: bool
    neutral_correct: bool
    skin_lift_l: float | None = None
    pose_minimum_jacobian: float | None = None
    pose_retention: float | None = None
    measured_device: bool = False

    def __post_init__(self) -> None:
        if not isinstance(self.command, CommandName):
            raise CommandValidationError("invalid_lock_matrix", "Lock command is not registered.")
        if type(self.level_tenths) is not int or self.level_tenths not in LEVELS:
            raise CommandValidationError("invalid_lock_matrix", "Lock level must be 1.0 to 5.0 in steps of 0.1.")
        if (
            type(self.preview_ms) not in (int, float)
            or type(self.export_ms) not in (int, float)
            or not math.isfinite(self.preview_ms)
            or not math.isfinite(self.export_ms)
            or min(self.preview_ms, self.export_ms) < 0.0
        ):
            raise CommandValidationError("invalid_lock_matrix", "Lock timings must be finite and nonnegative.")
        if any(type(value) is not bool for value in (
            self.identity_applied,
            self.alpha_unchanged,
            self.protected_unchanged,
            self.neutral_correct,
            self.measured_device,
        )):
            raise CommandValidationError("invalid_lock_matrix", "Lock evidence flags must be checked booleans.")
        for number in (self.skin_lift_l, self.pose_minimum_jacobian, self.pose_retention):
            if number is not None and (
                type(number) not in (int, float) or not math.isfinite(number)
            ):
                raise CommandValidationError("invalid_lock_matrix", "Lock measurements must be finite.")


@dataclass(frozen=True, slots=True)
class CommandLockFinding:
    command: CommandName
    checked_levels: int
    missing_levels: tuple[int, ...]
    failed_levels: tuple[int, ...]
    timing_limited_levels: tuple[int, ...]
    device_levels: int

    @property
    def technical_pass(self) -> bool:
        return not self.missing_levels and not self.failed_levels and not self.timing_limited_levels


@dataclass(frozen=True, slots=True)
class LockMatrixReport:
    version: Literal["beljour-five-command-lock/1"]
    status: LockStatus
    findings: tuple[CommandLockFinding, ...]
    total_checked: int
    duplicate_rows: int
    preview_budget_ms: float
    export_budget_ms: float
    complete_five_command_coverage: bool
    release_qualified: Literal[False] = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": self.version,
            "status": self.status,
            "total_checked": self.total_checked,
            "duplicate_rows": self.duplicate_rows,
            "preview_budget_ms": self.preview_budget_ms,
            "export_budget_ms": self.export_budget_ms,
            "complete_five_command_coverage": self.complete_five_command_coverage,
            "commands": [
                {
                    "name": finding.command.value,
                    "checked_levels": finding.checked_levels,
                    "missing_levels": list(finding.missing_levels),
                    "failed_levels": list(finding.failed_levels),
                    "timing_limited_levels": list(finding.timing_limited_levels),
                    "device_levels": finding.device_levels,
                }
                for finding in self.findings
            ],
            "synthetic_only": self.status != "device_measured",
            "independent_face_evidence": False,
            "release_qualified": False,
        }


def _passes_guard(observation: LockObservation) -> bool:
    if not observation.identity_applied:
        return False
    if not observation.alpha_unchanged or not observation.protected_unchanged:
        return False
    if observation.level_tenths == 10 and not observation.neutral_correct:
        return False
    if observation.command is CommandName.STUDIOQUALITY:
        if observation.skin_lift_l is None or observation.skin_lift_l > 2.5:
            return False
    if observation.command is CommandName.POSEONLY:
        if (
            observation.pose_minimum_jacobian is None
            or observation.pose_retention is None
            or observation.pose_minimum_jacobian < 0.25
            or observation.pose_retention < 0.25
        ):
            return False
    return True


def evaluate_command_locks(
    observations: tuple[LockObservation, ...],
    *,
    preview_budget_ms: float = 100.0,
    export_budget_ms: float = 2000.0,
) -> LockMatrixReport:
    """Check completeness, engineering invariants and observed performance.

    Every command must be checked at each of the forty-one decimal levels.
    Duplicate rows are failures rather than a way to increase coverage.
    """
    if not isinstance(observations, tuple) or any(
        not isinstance(item, LockObservation) for item in observations
    ):
        raise CommandValidationError("invalid_lock_matrix", "Matrix requires typed observations.")
    if len(observations) > len(COMMANDS) * len(LEVELS) * 2:
        raise CommandValidationError("invalid_lock_matrix", "Matrix record count exceeds its bound.")
    if any(
        type(budget) not in (int, float) or not math.isfinite(budget) or budget <= 0
        for budget in (preview_budget_ms, export_budget_ms)
    ):
        raise CommandValidationError("invalid_lock_matrix", "Matrix performance budgets are invalid.")
    lookup: dict[tuple[CommandName, int], LockObservation] = {}
    duplicate: set[tuple[CommandName, int]] = set()
    for row in observations:
        key = (row.command, row.level_tenths)
        if key in lookup:
            duplicate.add(key)
        else:
            lookup[key] = row
    results: list[CommandLockFinding] = []
    all_device = True
    for command in COMMANDS:
        missing: list[int] = []
        failures: list[int] = []
        timings: list[int] = []
        device_count = 0
        for level in LEVELS:
            key = (command, level)
            observation = lookup.get(key)
            if observation is None:
                missing.append(level)
                continue
            if not _passes_guard(observation) or key in duplicate:
                failures.append(level)
            if (observation.preview_ms > preview_budget_ms
                    or observation.export_ms > export_budget_ms):
                timings.append(level)
            if observation.measured_device:
                device_count += 1
            else:
                all_device = False
        results.append(CommandLockFinding(command, len(LEVELS) - len(missing),
                                          tuple(missing), tuple(failures), tuple(timings),
                                          device_count))
    full_coverage = all(item.checked_levels == len(LEVELS) for item in results)
    if duplicate or any(item.failed_levels for item in results):
        status: LockStatus = "blocked"
    elif not full_coverage:
        status = "incomplete"
    elif any(item.timing_limited_levels for item in results):
        status = "blocked"
    elif all_device:
        status = "device_measured"
    else:
        status = "synthetic_ready"
    return LockMatrixReport(
        "beljour-five-command-lock/1", status, tuple(results), len(lookup),
        len(duplicate), float(preview_budget_ms), float(export_budget_ms), full_coverage,
    )
