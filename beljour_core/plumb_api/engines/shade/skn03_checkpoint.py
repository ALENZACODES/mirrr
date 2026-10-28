"""Bounded, photo-free SKN-03 correction and C18 source evidence.

This is an evidence contract for the frozen-set operator, not a new shade
matcher or a release decision. Every refusal and regression stays counted.
Author: John Khan.
"""
from __future__ import annotations

import math
import re
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Literal

from .c18 import C18Snapshot, load_c18_shades
from .calibration import committed_distance_limit
from .distance import delta_e
from .loaders import Lab, checked_lab

TARGET_NUMERATOR = 95
TARGET_DENOMINATOR = 100
CAUSES = frozenset({
    "wrong_reference", "undertone_boundary", "unreliable_lighting",
    "no_mesh", "too_far", "too_deep", "missing_label", "other",
})
EvidenceState = Literal["BELOW_TARGET", "EVIDENCE_INCOMPLETE", "BOX_REVIEW_REQUIRED"]


def _count(value: object, field: str) -> int:
    if type(value) is not int or not 0 <= value <= 100_000:
        raise ValueError(f"{field} must be a bounded nonnegative integer")
    return value


def _digest(value: object, field: str) -> str:
    if not isinstance(value, str) or re.fullmatch(r"[a-f0-9]{64}", value) is None:
        raise ValueError(f"{field} must be a SHA-256 digest")
    return value


@dataclass(frozen=True, slots=True)
class TransitionCounts:
    """Same frozen identities at baseline and candidate, without storing IDs."""

    still_correct: int
    corrected: int
    regressed: int
    still_incorrect: int

    def __post_init__(self) -> None:
        for name in ("still_correct", "corrected", "regressed", "still_incorrect"):
            _count(getattr(self, name), name)
        if self.total == 0 or self.total > 100_000:
            raise ValueError("A frozen comparison needs 1..100000 cases")

    @property
    def total(self) -> int:
        return self.still_correct + self.corrected + self.regressed + self.still_incorrect

    @property
    def before(self) -> int:
        return self.still_correct + self.regressed

    @property
    def after(self) -> int:
        return self.still_correct + self.corrected


@dataclass(frozen=True, slots=True)
class SKN03Checkpoint:
    """No facial data, demographic guesses, or unverifiable PASS verdicts."""

    counts: TransitionCounts
    c18_digest: str
    frozen_manifest_digest: str
    causes: tuple[tuple[str, int], ...]
    independently_labelled: int
    compatible_baseline: bool
    human_review_complete: bool

    @property
    def minimum_correct(self) -> int:
        return (TARGET_NUMERATOR * self.counts.total + TARGET_DENOMINATOR - 1) // TARGET_DENOMINATOR

    @property
    def additional_required(self) -> int:
        return max(0, self.minimum_correct - self.counts.after)

    @property
    def rate_target_met(self) -> bool:
        return self.additional_required == 0

    @property
    def status(self) -> EvidenceState:
        if not self.rate_target_met:
            return "BELOW_TARGET"
        if (self.independently_labelled != self.counts.total
                or not self.compatible_baseline or not self.human_review_complete):
            return "EVIDENCE_INCOMPLETE"
        return "BOX_REVIEW_REQUIRED"

    def public(self) -> dict[str, object]:
        return {
            "format": "beljour-skn03-checkpoint/1",
            "source": "frozen_operator_aggregate",
            "c18_digest": self.c18_digest,
            "frozen_manifest_digest": self.frozen_manifest_digest,
            "total": self.counts.total,
            "baseline_correct": self.counts.before,
            "candidate_correct": self.counts.after,
            "corrected": self.counts.corrected,
            "regressed": self.counts.regressed,
            "candidate_incorrect": self.counts.total - self.counts.after,
            "minimum_correct": self.minimum_correct,
            "additional_required": self.additional_required,
            "target": TARGET_NUMERATOR / TARGET_DENOMINATOR,
            "causes": dict(self.causes),
            "independently_labelled": self.independently_labelled,
            "compatible_baseline": self.compatible_baseline,
            "human_review_complete": self.human_review_complete,
            "status": self.status,
            "release_pass": False,
        }


def build_skn03_checkpoint(
    *, counts: TransitionCounts, frozen_manifest_digest: str,
    c18_digest: str, causes: Mapping[str, int], independently_labelled: int,
    compatible_baseline: bool, human_review_complete: bool,
) -> SKN03Checkpoint:
    """Refuse inconsistent aggregates before displaying a candidate improvement.

    Digests bind the declared source and catalogue, but do not independently
    authenticate the operator's labels, frozen set, or human review.
    """
    if not isinstance(counts, TransitionCounts):
        raise ValueError("Frozen comparison counts are required")
    manifest = _digest(frozen_manifest_digest, "Frozen manifest")
    catalogue = _digest(c18_digest, "C18 catalogue")
    if catalogue != load_c18_shades("skin").digest:
        raise ValueError("C18 skin-reference catalogue changed")
    labelled = _count(independently_labelled, "Independent labels")
    if labelled > counts.total:
        raise ValueError("Independent label count exceeds the denominator")
    if type(compatible_baseline) is not bool or type(human_review_complete) is not bool:
        raise ValueError("Evidence flags must be booleans")
    if not isinstance(causes, Mapping) or not causes or set(causes) - CAUSES:
        raise ValueError("Failure causes must use the allowed categories")
    checked = tuple(sorted((key, _count(value, key)) for key, value in causes.items()))
    if sum(value for _, value in checked) != counts.total - counts.after:
        raise ValueError("Every incorrect or refused case must have one failure cause")
    return SKN03Checkpoint(
        counts, catalogue, manifest, checked, labelled,
        compatible_baseline, human_review_complete,
    )


@dataclass(frozen=True, slots=True)
class UndertoneBoundary:
    """A source-derived Lab midpoint is not an independently labelled face."""

    first_id: str
    second_id: str
    lab: Lab
    first_distance: float
    second_distance: float
    inside_committed_limit: bool


def undertone_boundary_vectors(*, max_pairs: int = 32) -> tuple[UndertoneBoundary, ...]:
    """Find difficult different-undertone neighbours without inventing samples."""
    if type(max_pairs) is not int or not 1 <= max_pairs <= 96:
        raise ValueError("Boundary count must be in 1..96")
    reference: C18Snapshot = load_c18_shades("skin")
    edges: list[tuple[float, str, str, Lab]] = []
    for index, first in enumerate(reference.records):
        for second in reference.records[index + 1:]:
            if first.undertone == second.undertone:
                continue
            if abs(first.level - second.level) > 1:
                continue
            centre = checked_lab(tuple((a + b) / 2 for a, b in zip(first.lab, second.lab, strict=True)))
            edges.append((delta_e(first.lab, second.lab), first.id, second.id, centre))
    edges.sort(key=lambda value: (value[0], value[1], value[2]))
    by_id = {row.id: row for row in reference.records}
    limit = committed_distance_limit()
    return tuple(
        UndertoneBoundary(
            first_id, second_id, sample,
            delta_e(sample, by_id[first_id].lab),
            delta_e(sample, by_id[second_id].lab),
            max(delta_e(sample, by_id[first_id].lab), delta_e(sample, by_id[second_id].lab)) <= limit,
        )
        for _, first_id, second_id, sample in edges[:max_pairs]
    )


def pending_checkpoint_note(reported_percent: float = 93.9) -> dict[str, Any]:
    """Describe an externally reported rate without inventing a denominator."""
    if type(reported_percent) not in (int, float) or not math.isfinite(reported_percent):
        raise ValueError("Reported rate must be finite")
    if not 0 <= reported_percent <= 100:
        raise ValueError("Reported percentage must be in 0..100")
    return {
        "format": "beljour-skn03-open-evidence/1",
        "reported_percent": float(reported_percent),
        "target_percent": 95.0,
        "percentage_point_gap": round(max(0.0, 95.0 - reported_percent), 4),
        "verified_denominator": None,
        "verified_transition_counts": None,
        "c18_digest": load_c18_shades("skin").digest,
        "status": "UNPROVEN",
        "release_pass": False,
        "required_evidence": (
            "frozen_manifest_digest", "independent_reference_labels",
            "baseline_and_candidate_transitions", "failure_cause_counts",
            "compatible_baseline", "human_review",
        ),
    }


def load_skn03_c18_binding() -> dict[str, object]:
    """Stable C18 skin inventory identity for the downstream C18 QA runner."""
    source = load_c18_shades("skin")
    if len(source.records) != 96:
        raise ValueError("Unexpected C18 skin inventory count")
    return {
        "format": "beljour-skn03-c18-binding/1",
        "count": len(source.records),
        "digest": source.digest,
        "source": source.source,
        "release_pass": False,
    }
