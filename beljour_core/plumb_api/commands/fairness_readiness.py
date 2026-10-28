"""External-label fairness parity check for Pro edit quality.

Only review-approved reference labels may define groups. Pixel colour,
facial geometry, model guesses and self-reported results cannot substitute
for independent annotations. Small or missing groups stay UNPROVEN.
Thresholds must come from a preregistered versioned gate, not tuning runs.
Author: John Khan.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Literal

from .errors import CommandValidationError

GapStatus = Literal["fail", "unproven", "measured"]
_LABEL = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}$")


@dataclass(frozen=True, slots=True)
class GroupRate:
    label: str
    eligible: int
    passed: int
    labels_independently_verified: bool

    def __post_init__(self) -> None:
        if not isinstance(self.label, str) or _LABEL.fullmatch(self.label) is None:
            raise CommandValidationError("invalid_group", "Fairness label is invalid.")
        if type(self.eligible) is not int or self.eligible < 0:
            raise CommandValidationError("invalid_group", "Eligible count is invalid.")
        if type(self.passed) is not int or not 0 <= self.passed <= self.eligible:
            raise CommandValidationError("invalid_group", "Passed count is invalid.")
        if type(self.labels_independently_verified) is not bool:
            raise CommandValidationError("invalid_group", "Reference label approval must be explicit.")

    @property
    def rate(self) -> float | None:
        return self.passed / self.eligible if self.eligible else None


@dataclass(frozen=True, slots=True)
class GapDefinition:
    name: str
    group_dimension: str
    protected_group: str
    allowed_gap: float
    minimum_group_size: int
    threshold_preregistered: bool
    reference_labels_required: bool = True

    def __post_init__(self) -> None:
        if any(not isinstance(value, str) or _LABEL.fullmatch(value) is None for value in (
            self.name, self.group_dimension, self.protected_group,
        )):
            raise CommandValidationError("invalid_gap_definition", "Group gate identifiers are invalid.")
        if (not isinstance(self.allowed_gap, (int, float)) or
                not math.isfinite(self.allowed_gap) or
                not 0.0 <= self.allowed_gap <= 1.0):
            raise CommandValidationError("invalid_gap_definition", "Gap threshold is invalid.")
        if type(self.minimum_group_size) is not int or self.minimum_group_size < 1:
            raise CommandValidationError("invalid_gap_definition", "Group minimum is invalid.")
        if type(self.threshold_preregistered) is not bool:
            raise CommandValidationError("invalid_gap_definition", "Pre-registration must be explicit.")
        if type(self.reference_labels_required) is not bool:
            raise CommandValidationError("invalid_gap_definition", "Label requirement must be explicit.")
        if not self.reference_labels_required:
            raise CommandValidationError(
                "invalid_gap_definition", "Only independent reference labels qualify.",
            )


@dataclass(frozen=True, slots=True)
class GapReport:
    version: Literal["beljour-pro-group-gap/1"]
    name: str
    dimension: str
    status: GapStatus
    protected_rate: float | None
    best_comparator_rate: float | None
    observed_gap: float | None
    comparator_group: str | None
    missing: tuple[str, ...]
    failures: tuple[str, ...]
    release_qualified: Literal[False] = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": self.version,
            "name": self.name,
            "dimension": self.dimension,
            "status": self.status,
            "protected_rate": self.protected_rate,
            "best_comparator_rate": self.best_comparator_rate,
            "observed_gap": self.observed_gap,
            "comparator_group": self.comparator_group,
            "missing": list(self.missing),
            "failures": list(self.failures),
            "release_qualified": False,
        }


def review_group_gap(
    definition: GapDefinition,
    groups: tuple[GroupRate, ...],
) -> GapReport:
    if not isinstance(definition, GapDefinition) or not isinstance(groups, tuple):
        raise CommandValidationError("invalid_gap_evidence", "Typed group rate evidence is required.")
    if any(not isinstance(group, GroupRate) for group in groups):
        raise CommandValidationError("invalid_gap_evidence", "Group rate evidence is malformed.")
    names = [group.label for group in groups]
    if len(set(names)) != len(names):
        raise CommandValidationError("invalid_gap_evidence", "Group rate labels must be unique.")
    missing: list[str] = []
    failures: list[str] = []
    if not definition.threshold_preregistered:
        missing.append("threshold_not_preregistered")
    by_name = {group.label: group for group in groups}
    protected = by_name.get(definition.protected_group)
    if protected is None:
        missing.append("protected_group_missing")
    compared = [group for group in groups if group.label != definition.protected_group]
    if not compared:
        missing.append("comparator_groups_missing")
    for group in groups:
        if group.eligible < definition.minimum_group_size:
            missing.append(f"{group.label}:underpowered")
        if not group.labels_independently_verified:
            missing.append(f"{group.label}:labels_unverified")
    eligible_compared = [group for group in compared if group.rate is not None]
    best = max(eligible_compared, key=lambda row: (row.rate or 0, row.label), default=None)
    protected_rate = protected.rate if protected is not None else None
    best_rate = best.rate if best is not None else None
    observed_gap: float | None = None
    if protected_rate is not None and best_rate is not None:
        observed_gap = max(0.0, best_rate - protected_rate)
        if observed_gap > definition.allowed_gap + 1e-12:
            failures.append("protected_group_disparity")
    status: GapStatus = "fail" if failures else "unproven" if missing else "measured"
    return GapReport(
        "beljour-pro-group-gap/1", definition.name, definition.group_dimension,
        status, protected_rate, best_rate, observed_gap,
        best.label if best is not None else None,
        tuple(dict.fromkeys(missing)), tuple(failures),
    )
