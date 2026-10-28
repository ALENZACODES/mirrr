"""Joint preflight for Tuesday's five-command and two-tier lock evidence.

This is an operator's gap report, not a substitute for independent real-face
qualification. Only validated, checksum-bound source packets are consumed.
All missing, unsafe, late or non-device observations remain visible.
Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Literal, cast

from .errors import CommandValidationError
from .lock_matrix import COMMANDS
from .quality_tier_matrix import verify_tier_matrix
from .tuesday_lock import verify_tuesday_lock_json

ScopeStatus = Literal["blocked", "incomplete", "awaiting_device", "awaiting_review"]
GapReason = Literal[
    "missing", "safety_failed", "over_budget", "device_unmeasured",
]


@dataclass(frozen=True, slots=True)
class LockGap:
    scope: str
    level_tenths: int
    reason: GapReason

    def __post_init__(self) -> None:
        if not isinstance(self.scope, str) or not self.scope:
            raise CommandValidationError("invalid_lock_gap", "A named evidence scope is required.")
        if type(self.level_tenths) is not int or not 10 <= self.level_tenths <= 50:
            raise CommandValidationError("invalid_lock_gap", "Evidence level must be 1.0–5.0.")
        if self.reason not in (
            "missing", "safety_failed", "over_budget", "device_unmeasured",
        ):
            raise CommandValidationError("invalid_lock_gap", "Unknown evidence deficiency.")

    def public_metadata(self) -> dict[str, object]:
        return {
            "scope": self.scope,
            "level_tenths": self.level_tenths,
            "reason": self.reason,
        }


@dataclass(frozen=True, slots=True)
class ScopeCoverage:
    scope: str
    slots: int
    observed: int
    device: int
    missing: int
    failed_safety: int
    over_budget: int

    @property
    def status(self) -> ScopeStatus:
        if self.failed_safety or self.over_budget:
            return "blocked"
        if self.missing:
            return "incomplete"
        if self.device < self.slots:
            return "awaiting_device"
        return "awaiting_review"

    def public_metadata(self) -> dict[str, object]:
        return {
            "scope": self.scope,
            "slots": self.slots,
            "observed": self.observed,
            "device": self.device,
            "missing": self.missing,
            "failed_safety": self.failed_safety,
            "over_budget": self.over_budget,
            "status": self.status,
        }


@dataclass(frozen=True, slots=True)
class TuesdayReadiness:
    run_id: str
    renderer_build: str
    command_sha256: str
    tier_sha256: str
    scopes: tuple[ScopeCoverage, ...]
    gaps: tuple[LockGap, ...]

    @property
    def status(self) -> ScopeStatus:
        if any(scope.status == "blocked" for scope in self.scopes):
            return "blocked"
        if any(scope.status == "incomplete" for scope in self.scopes):
            return "incomplete"
        if any(scope.status == "awaiting_device" for scope in self.scopes):
            return "awaiting_device"
        return "awaiting_review"

    @property
    def observed(self) -> int:
        return sum(scope.observed for scope in self.scopes)

    @property
    def device_measured(self) -> int:
        return sum(scope.device for scope in self.scopes)

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": "beljour-lock-readiness/1",
            "run_id": self.run_id,
            "renderer_build": self.renderer_build,
            "command_sha256": self.command_sha256,
            "tier_sha256": self.tier_sha256,
            "expected_commands": 205,
            "expected_tiers": 82,
            "total_slots": 287,
            "observed": self.observed,
            "device_measured": self.device_measured,
            "status": self.status,
            "scopes": [scope.public_metadata() for scope in self.scopes],
            "gaps": [gap.public_metadata() for gap in self.gaps],
            "independent_realface_qualified": False,
            "production_identity_qualified": False,
            "release_qualified": False,
        }


def _checked_rows(value: object, count: int) -> list[dict[str, object]]:
    if not isinstance(value, list) or len(value) != count:
        raise CommandValidationError("invalid_lock_readiness", "Evidence row count is wrong.")
    if any(not isinstance(item, dict) for item in value):
        raise CommandValidationError("invalid_lock_readiness", "Evidence rows must be objects.")
    return cast(list[dict[str, object]], value)


def _coverage(scope: str, rows: list[dict[str, object]]) -> tuple[ScopeCoverage, list[LockGap]]:
    missing = 0
    failed = 0
    slow = 0
    device = 0
    gaps: list[LockGap] = []
    for row in rows:
        level = cast(int, row["level_tenths"])
        status = row["status"]
        if status == "missing":
            missing += 1
            gaps.append(LockGap(scope, level, "missing"))
        elif status == "failed_safety":
            failed += 1
            gaps.append(LockGap(scope, level, "safety_failed"))
        elif status == "over_budget":
            slow += 1
            gaps.append(LockGap(scope, level, "over_budget"))
        elif status == "synthetic_checked":
            gaps.append(LockGap(scope, level, "device_unmeasured"))
        elif status == "device_checked":
            device += 1
        else:
            raise CommandValidationError("invalid_lock_readiness", "Unknown verified row status.")
    return ScopeCoverage(
        scope=scope,
        slots=len(rows),
        observed=len(rows) - missing,
        device=device,
        missing=missing,
        failed_safety=failed,
        over_budget=slow,
    ), gaps


def assess_tuesday_readiness(
    command_json: str, tier_json: str,
) -> TuesdayReadiness:
    """Revalidate both packets, then enumerate every still-open evidence item.

    The matrix contains 205 command slots and 82 additional tier slots. Each
    scope has 41 strength levels. Neither an ordinary synthetic check nor a
    device measurement alone licenses a claim about real-person identity.
    """
    commands = verify_tuesday_lock_json(command_json)
    tiers = verify_tier_matrix(tier_json, original_tuesday_json=command_json)
    if (
        commands["run_id"] != tiers["run_id"]
        or commands["renderer_build"] != tiers["renderer_build"]
    ):
        raise CommandValidationError(
            "invalid_lock_readiness", "The command and tier runs do not match.",
        )
    command_rows = _checked_rows(commands["rows"], 205)
    tier_rows = _checked_rows(tiers["rows"], 82)
    scopes: list[ScopeCoverage] = []
    gaps: list[LockGap] = []
    for command in COMMANDS:
        name = f"/{command.value}"
        group = [row for row in command_rows if row["command"] == command.value]
        if len(group) != 41:
            raise CommandValidationError(
                "invalid_lock_readiness", f"The {name} evidence is incomplete.",
            )
        coverage, group_gaps = _coverage(name, group)
        scopes.append(coverage)
        gaps.extend(group_gaps)
    for tier in ("1080", "4k"):
        name = f"/upscale:{tier}"
        group = [row for row in tier_rows if row["tier"] == tier]
        if len(group) != 41:
            raise CommandValidationError(
                "invalid_lock_readiness", f"The {name} evidence is incomplete.",
            )
        coverage, group_gaps = _coverage(name, group)
        scopes.append(coverage)
        gaps.extend(group_gaps)
    if sum(scope.slots for scope in scopes) != 287:
        raise CommandValidationError("invalid_lock_readiness", "All 287 slots are mandatory.")
    command_digest = json.loads(command_json)["sha256"]
    tier_digest = json.loads(tier_json)["sha256"]
    return TuesdayReadiness(
        run_id=cast(str, commands["run_id"]),
        renderer_build=cast(str, commands["renderer_build"]),
        command_sha256=cast(str, command_digest),
        tier_sha256=cast(str, tier_digest),
        scopes=tuple(scopes),
        gaps=tuple(gaps),
    )
