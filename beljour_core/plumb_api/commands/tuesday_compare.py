"""Compare two 205-slot technical lock dossiers without hiding regressions.

Only repeat the comparison on the same declared run/fixture identity. Device
results and real-face approval stay independent from this local metadata diff.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import cast

from .errors import CommandValidationError
from .tuesday_lock import verify_tuesday_lock_json

_BAD = frozenset({"missing", "failed_safety", "over_budget"})


@dataclass(frozen=True, slots=True)
class LockRegression:
    command: str
    level_tenths: int
    issue: str

    def public_metadata(self) -> dict[str, object]:
        return {"command": self.command, "level_tenths": self.level_tenths, "issue": self.issue}


@dataclass(frozen=True, slots=True)
class TuesdayComparison:
    source_run: str
    old_build: str
    new_build: str
    regressions: tuple[LockRegression, ...]
    improvements: int
    checked: int
    status: str

    def public_metadata(self) -> dict[str, object]:
        return {
            "source_run": self.source_run,
            "old_build": self.old_build,
            "new_build": self.new_build,
            "checked": self.checked,
            "status": self.status,
            "regressions": [entry.public_metadata() for entry in self.regressions],
            "improvements": self.improvements,
            "independent_realface_result": "NOT_RUN",
            "release_qualified": False,
        }


def _rows(report: dict[str, object]) -> list[dict[str, object]]:
    return cast(list[dict[str, object]], report["rows"])


def compare_tuesday_packets(original_json: str, candidate_json: str) -> TuesdayComparison:
    """Flag lost evidence or newly unsafe decimal stops; never change a threshold."""
    old = verify_tuesday_lock_json(original_json)
    new = verify_tuesday_lock_json(candidate_json)
    if old["run_id"] != new["run_id"]:
        raise CommandValidationError(
            "incompatible_lock_run", "Lock packets belong to different run identities."
        )
    baseline = _rows(old)
    candidate = _rows(new)
    found: list[LockRegression] = []
    fixed = 0
    for before, after in zip(baseline, candidate, strict=True):
        name = cast(str, before["command"])
        level = cast(int, before["level_tenths"])
        prior_status = cast(str, before["status"])
        next_status = cast(str, after["status"])
        if prior_status == "missing" and next_status in ("failed_safety", "over_budget"):
            found.append(LockRegression(name, level, "newly_observed_failure:" + next_status))
        elif prior_status not in _BAD and next_status in _BAD:
            found.append(LockRegression(name, level, "new_failure:" + next_status))
        elif prior_status == "missing" and next_status == "missing":
            continue
        elif prior_status == "missing" and next_status not in _BAD:
            fixed += 1
        elif prior_status in _BAD and next_status not in _BAD:
            fixed += 1
        elif prior_status == "over_budget" and next_status == "failed_safety":
            found.append(LockRegression(name, level, "performance_to_safety_failure"))
        if before["identity_applied"] is True and after["identity_applied"] is False:
            if not any(item.command == name and item.level_tenths == level for item in found):
                found.append(LockRegression(name, level, "identity_guard_regressed"))
        if before["neutral_correct"] is True and after["neutral_correct"] is False:
            if not any(item.command == name and item.level_tenths == level for item in found):
                found.append(LockRegression(name, level, "neutral_output_regressed"))
        if before["alpha_unchanged"] is True and after["alpha_unchanged"] is False:
            if not any(item.command == name and item.level_tenths == level for item in found):
                found.append(LockRegression(name, level, "alpha_regressed"))
    return TuesdayComparison(
        cast(str, old["run_id"]),
        cast(str, old["renderer_build"]),
        cast(str, new["renderer_build"]),
        tuple(found), fixed, len(candidate),
        "regressed" if found else "no_new_regressions",
    )
