"""Deterministic, photo-free evidence consolidation for Pro quality gates.

Consumes only aggregate observations from a separately approved box runner.
Nothing in this module reads images, alters frozen definitions, infers labels,
or awards an external real-face PASS. Partial shards remain visible and unproven.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Literal, cast

from .errors import CommandValidationError
from .quality_gate_r3h import R3HDefinition

BatchStatus = Literal["fail", "unproven"]
_SHA256 = re.compile(r"^[a-f0-9]{64}$")
_RUN_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$")
_METRIC = re.compile(r"^[a-z][a-z0-9_]{0,79}$")
_SCHEMA = "beljour-pro-aggregate-shard/1"
_MAX_SHARDS = 4096


@dataclass(frozen=True, slots=True)
class AggregateReading:
    metric: str
    count: int
    total: float
    lowest: float
    highest: float

    def __post_init__(self) -> None:
        if not isinstance(self.metric, str) or _METRIC.fullmatch(self.metric) is None:
            raise CommandValidationError("invalid_evidence", "Metric name is invalid.")
        if type(self.count) is not int or self.count < 1:
            raise CommandValidationError("invalid_evidence", "Metric count must be positive.")
        if any(not isinstance(value, (int, float)) or not math.isfinite(value)
               for value in (self.total, self.lowest, self.highest)):
            raise CommandValidationError("invalid_evidence", "Metric totals must be finite.")
        if self.lowest > self.highest:
            raise CommandValidationError("invalid_evidence", "Metric extrema are reversed.")
        average = self.total / self.count
        if not self.lowest - 1e-9 <= average <= self.highest + 1e-9:
            raise CommandValidationError("invalid_evidence", "Metric total is outside its extrema.")

    @property
    def mean(self) -> float:
        return self.total / self.count

    def as_dict(self) -> dict[str, object]:
        return {
            "metric": self.metric,
            "count": self.count,
            "total": self.total,
            "lowest": self.lowest,
            "highest": self.highest,
        }


@dataclass(frozen=True, slots=True)
class ShardEvidence:
    run_id: str
    manifest_sha256: str
    definition_sha256: str
    command: str
    shard: int
    shard_count: int
    expected: int
    seen: int
    eligible: int
    errors: int
    labels: tuple[str, ...]
    readings: tuple[AggregateReading, ...]
    human_review_complete: bool

    def __post_init__(self) -> None:
        if not isinstance(self.run_id, str) or _RUN_ID.fullmatch(self.run_id) is None:
            raise CommandValidationError("invalid_evidence", "Evidence run identifier is invalid.")
        if any(not isinstance(value, str) or _SHA256.fullmatch(value) is None
               for value in (self.manifest_sha256, self.definition_sha256)):
            raise CommandValidationError("invalid_evidence", "Frozen evidence digests are invalid.")
        if self.command not in ("enhance", "denoise", "upscale", "studioquality", "poseonly"):
            raise CommandValidationError("invalid_evidence", "Pro evidence command is unknown.")
        if (
            type(self.shard_count) is not int
            or not 1 <= self.shard_count <= _MAX_SHARDS
            or type(self.shard) is not int
            or not 0 <= self.shard < self.shard_count
        ):
            raise CommandValidationError("invalid_evidence", "Shard identity is invalid.")
        if any(type(value) is not int for value in (self.expected, self.seen, self.eligible, self.errors)):
            raise CommandValidationError("invalid_evidence", "Shard counts must be integers.")
        if not 1 <= self.expected <= 10_000_000 or not 0 <= self.seen <= self.expected:
            raise CommandValidationError("invalid_evidence", "Shard coverage is invalid.")
        if self.eligible < 0 or self.errors < 0 or self.eligible + self.errors > self.seen:
            raise CommandValidationError("invalid_evidence", "Shard eligibility counts are invalid.")
        if not isinstance(self.labels, tuple) or any(
            not isinstance(label, str) or _METRIC.fullmatch(label) is None for label in self.labels
        ) or len(set(self.labels)) != len(self.labels):
            raise CommandValidationError("invalid_evidence", "Declared label columns are invalid.")
        if type(self.human_review_complete) is not bool:
            raise CommandValidationError("invalid_evidence", "Review completion must be explicit.")
        if not isinstance(self.readings, tuple) or any(
            not isinstance(item, AggregateReading) for item in self.readings
        ) or len({item.metric for item in self.readings}) != len(self.readings):
            raise CommandValidationError("invalid_evidence", "Shard metric summaries are invalid.")
        if any(item.count > self.eligible for item in self.readings):
            raise CommandValidationError("invalid_evidence", "Metric coverage exceeds eligible cases.")

    @property
    def complete(self) -> bool:
        return self.seen == self.expected and self.eligible + self.errors == self.seen

    def as_dict(self) -> dict[str, object]:
        return {
            "version": _SCHEMA,
            "run_id": self.run_id,
            "manifest_sha256": self.manifest_sha256,
            "definition_sha256": self.definition_sha256,
            "command": self.command,
            "shard": self.shard,
            "shard_count": self.shard_count,
            "expected": self.expected,
            "seen": self.seen,
            "eligible": self.eligible,
            "errors": self.errors,
            "labels": list(self.labels),
            "readings": [reading.as_dict() for reading in self.readings],
            "human_review_complete": self.human_review_complete,
        }


@dataclass(frozen=True, slots=True)
class MetricRollup:
    name: str
    count: int
    average: float | None
    lowest: float | None
    highest: float | None

    def as_dict(self) -> dict[str, object]:
        return {
            "name": self.name,
            "count": self.count,
            "average": self.average,
            "lowest": self.lowest,
            "highest": self.highest,
        }


@dataclass(frozen=True, slots=True)
class BatchEvidenceReport:
    status: BatchStatus
    run_id: str
    command: str
    evidence_fingerprint: str
    expected_total: int
    seen_total: int
    eligible_total: int
    error_total: int
    shards_present: int
    shards_expected: int
    missing_shards: tuple[int, ...]
    missing: tuple[str, ...]
    failed: tuple[str, ...]
    metrics: tuple[MetricRollup, ...]

    def public_metadata(self) -> dict[str, object]:
        """Never serializes per-person data or a false release success."""
        return {
            "version": "beljour-pro-evidence-report/1",
            "status": self.status,
            "run_id": self.run_id,
            "command": self.command,
            "evidence_fingerprint": self.evidence_fingerprint,
            "expected_total": self.expected_total,
            "seen_total": self.seen_total,
            "eligible_total": self.eligible_total,
            "error_total": self.error_total,
            "shards_present": self.shards_present,
            "shards_expected": self.shards_expected,
            "missing_shards": list(self.missing_shards),
            "missing": list(self.missing),
            "failed": list(self.failed),
            "metrics": [metric.as_dict() for metric in self.metrics],
            "release_qualified": False,
        }


def _checked_dict(value: object, keys: frozenset[str]) -> dict[str, object]:
    if not isinstance(value, dict) or set(value) != keys or any(
        not isinstance(key, str) for key in value
    ):
        raise CommandValidationError("invalid_evidence", "Evidence object has unrecognized fields.")
    return value



def _require_string(value: object) -> str:
    if not isinstance(value, str):
        raise CommandValidationError("invalid_evidence", "Evidence identifiers must be strings.")
    return value


def _require_integer(value: object) -> int:
    if type(value) is not int:
        raise CommandValidationError("invalid_evidence", "Evidence counts must be integers.")
    return value


def _require_boolean(value: object) -> bool:
    if type(value) is not bool:
        raise CommandValidationError("invalid_evidence", "Review flag must be boolean.")
    return value

def decode_evidence(raw: object) -> ShardEvidence:
    """Parse a strict aggregate schema; refuse pixels, paths and extra fields."""
    keys = frozenset({
        "version", "run_id", "manifest_sha256", "definition_sha256", "command", "shard",
        "shard_count", "expected", "seen", "eligible", "errors", "labels", "readings",
        "human_review_complete",
    })
    entry = _checked_dict(raw, keys)
    if entry["version"] != _SCHEMA:
        raise CommandValidationError("invalid_evidence", "Evidence schema version is invalid.")
    labels_raw = entry["labels"]
    readings_raw = entry["readings"]
    if not isinstance(labels_raw, list) or not isinstance(readings_raw, list):
        raise CommandValidationError("invalid_evidence", "Evidence labels and readings must be lists.")
    if len(labels_raw) > 64 or len(readings_raw) > 64:
        raise CommandValidationError("invalid_evidence", "Aggregate metadata is too large.")
    if any(not isinstance(label, str) for label in labels_raw):
        raise CommandValidationError("invalid_evidence", "Labels must be strings.")
    readings: list[AggregateReading] = []
    for item in readings_raw:
        row = _checked_dict(item, frozenset({"metric", "count", "total", "lowest", "highest"}))
        if (
            not isinstance(row["metric"], str)
            or type(row["count"]) is not int
            or any(type(row[key]) not in (int, float) for key in ("total", "lowest", "highest"))
        ):
            raise CommandValidationError("invalid_evidence", "Numeric metric fields are invalid.")
        readings.append(
            AggregateReading(
                row["metric"], row["count"], float(cast(int | float, row["total"])),
                float(cast(int | float, row["lowest"])), float(cast(int | float, row["highest"])),
            )
        )
    return ShardEvidence(
        _require_string(entry["run_id"]),
        _require_string(entry["manifest_sha256"]),
        _require_string(entry["definition_sha256"]),
        _require_string(entry["command"]),
        _require_integer(entry["shard"]),
        _require_integer(entry["shard_count"]),
        _require_integer(entry["expected"]),
        _require_integer(entry["seen"]),
        _require_integer(entry["eligible"]),
        _require_integer(entry["errors"]),
        tuple(labels_raw),
        tuple(readings),
        _require_boolean(entry["human_review_complete"]),
    )


def decode_evidence_json(text: str) -> ShardEvidence:
    if not isinstance(text, str) or len(text.encode("utf-8")) > 32_768:
        raise CommandValidationError("invalid_evidence", "Evidence record is invalid or too large.")
    try:
        raw: object = json.loads(text)
    except (ValueError, TypeError):
        raise CommandValidationError("invalid_evidence", "Evidence JSON could not be decoded.") from None
    return decode_evidence(raw)


def _fingerprint(shards: Sequence[ShardEvidence]) -> str:
    canonical = json.dumps(
        [item.as_dict() for item in shards], sort_keys=True,
        separators=(",", ":"), ensure_ascii=True, allow_nan=False,
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _rollup(metric: str, shards: Sequence[ShardEvidence]) -> MetricRollup:
    values = [reading for shard in shards for reading in shard.readings if reading.metric == metric]
    if not values:
        return MetricRollup(metric, 0, None, None, None)
    count = sum(reading.count for reading in values)
    try:
        total = math.fsum(reading.total for reading in values)
    except OverflowError:
        raise CommandValidationError("invalid_evidence", "Metric sum overflowed.") from None
    if not math.isfinite(total):
        raise CommandValidationError("invalid_evidence", "Metric sum is not finite.")
    return MetricRollup(
        metric, count, total / count,
        min(reading.lowest for reading in values),
        max(reading.highest for reading in values),
    )


def collect_evidence(
    definition: R3HDefinition,
    shards: Sequence[ShardEvidence],
    *,
    definition_sha256: str,
    frozen_manifest_sha256: str,
) -> BatchEvidenceReport:
    """Fail closed on bad metric means and missing shards without issuing a PASS."""
    if not isinstance(definition, R3HDefinition):
        raise CommandValidationError("invalid_evidence", "A preregistered definition is required.")
    if not isinstance(definition_sha256, str) or _SHA256.fullmatch(definition_sha256) is None:
        raise CommandValidationError("invalid_evidence", "Definition SHA-256 is invalid.")
    if not isinstance(frozen_manifest_sha256, str) or _SHA256.fullmatch(frozen_manifest_sha256) is None:
        raise CommandValidationError("invalid_evidence", "Frozen manifest SHA-256 is invalid.")
    if not isinstance(shards, Sequence) or not 1 <= len(shards) <= _MAX_SHARDS:
        raise CommandValidationError("invalid_evidence", "At least one bounded shard is required.")
    if any(not isinstance(shard, ShardEvidence) for shard in shards):
        raise CommandValidationError("invalid_evidence", "Shard types are invalid.")
    ordered = sorted(shards, key=lambda entry: entry.shard)
    first = ordered[0]
    if first.command != definition.command:
        raise CommandValidationError("invalid_evidence", "Evidence command differs from the gate.")
    for shard in ordered:
        if (
            shard.run_id != first.run_id
            or shard.manifest_sha256 != frozen_manifest_sha256
            or shard.definition_sha256 != definition_sha256
            or shard.command != first.command
            or shard.shard_count != first.shard_count
        ):
            raise CommandValidationError("invalid_evidence", "Frozen evidence identity is inconsistent.")
    indexes = [shard.shard for shard in ordered]
    if len(set(indexes)) != len(indexes):
        raise CommandValidationError("duplicate_shard", "Shard identifiers must be unique.")
    present = set(indexes)
    missing_shards = tuple(index for index in range(first.shard_count) if index not in present)
    missing: list[str] = []
    failures: list[str] = []
    expected = sum(shard.expected for shard in ordered)
    seen = sum(shard.seen for shard in ordered)
    eligible = sum(shard.eligible for shard in ordered)
    errors = sum(shard.errors for shard in ordered)
    if missing_shards:
        missing.append("missing_shards")
    if any(not shard.complete for shard in ordered):
        missing.append("incomplete_shard")
    if expected < definition.minimum_faces or seen < definition.minimum_faces:
        missing.append("frozen_population_incomplete")
    if any(not shard.human_review_complete for shard in ordered):
        missing.append("independent_review_missing")
    declared_labels = set(ordered[0].labels)
    for shard in ordered[1:]:
        declared_labels.intersection_update(shard.labels)
    for label in definition.required_labels:
        if label not in declared_labels:
            missing.append(f"label:{label}")
    metrics = tuple(_rollup(metric.name, ordered) for metric in definition.metrics)
    for limit, metric in zip(definition.metrics, metrics, strict=True):
        if metric.average is None or metric.count < eligible:
            missing.append(f"metric:{limit.name}")
        if metric.average is not None and not limit.accepts(metric.average):
            failures.append(f"metric:{limit.name}")
    # External authorization, per-group human ratings, demographic fairness,
    # and the immutable 100k runner remain separate mandatory release gates.
    missing.append("external_release_verdict_not_supplied")
    return BatchEvidenceReport(
        "fail" if failures else "unproven",
        first.run_id, first.command, _fingerprint(ordered), expected, seen, eligible,
        errors, len(ordered), first.shard_count, missing_shards,
        tuple(missing), tuple(failures), metrics,
    )
