"""Read-only, mergeable Lane C quality statistics; no image persistence.

This is *not* the real-face runner. A separate approved runner may supply only
anonymized measurements from a consented frozen set. Shard summaries contain
counts and strata, never raw pictures, identities, landmarks, timestamps or
paths. A reviewed manifest is necessary before an aggregate can be marked
PASS; tests use synthetic statistics only and may never attest a real run.

Author: John Khan.
"""
from __future__ import annotations

from collections import Counter
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field

from .realface_protocol import (
    FROZEN_FACE_COUNT,
    MIN_GROUP_FACES,
    MIN_SUCCESS_RATE,
    FeatureGate,
    GateState,
    RealFaceObservation,
    score_pixel_evidence,
)

MAX_SHARDS = 4096
MAX_GROUPS = 300
MAX_ROWS_PER_SHARD = FROZEN_FACE_COUNT
FATAL_FAULTS = frozenset({
    "MISSING_REGION_MASK",
    "OUTSIDE_MASK_EDIT",
    "ALPHA_EDIT",
    "CHANNEL_LIMIT",
    "ORIGINAL_BUFFER_CHANGED",
    "DISCLOSURE_MISSING",
    "UNAUTHORIZED_PROVIDER",
    "CONSENT_MISSING",
})


def _is_count(value: object, *, ceiling: int) -> bool:
    return (
        isinstance(value, int)
        and not isinstance(value, bool)
        and 0 <= value <= ceiling
    )


def _is_lowercase_sha256(value: object) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 64
        and all(char in "0123456789abcdef" for char in value)
    )


@dataclass(frozen=True, slots=True)
class ShardHeader:
    """No personal or account IDs: only an index into a frozen test manifest."""

    feature_id: str
    manifest_sha256: str
    index: int
    count: int
    evaluator_version: str = "lane-c-metrics/1"

    def validate(self, gate: FeatureGate) -> None:
        gate.validate()
        if self.feature_id != gate.id:
            raise ValueError("Feature identifier differs from the registered gate")
        if not _is_lowercase_sha256(self.manifest_sha256):
            raise ValueError("Frozen dataset manifest must use lowercase SHA-256")
        if not _is_count(self.count, ceiling=MAX_SHARDS) or self.count < 1:
            raise ValueError("Shard count must be in 1..4096")
        if (
            not _is_count(self.index, ceiling=MAX_SHARDS - 1)
            or self.index >= self.count
        ):
            raise ValueError("Shard index must be within the frozen manifest")
        if self.evaluator_version != "lane-c-metrics/1":
            raise ValueError("Unknown metrics schema version")


@dataclass(frozen=True, slots=True)
class GroupCount:
    """A consenting evaluator supplies voluntary group labels; no inference."""

    group: str
    total: int
    technical_pass: int
    human_pass: int
    human_reviewed: int

    def validate(self) -> None:
        if not isinstance(self.group, str):
            raise ValueError("Group key must be an approved stratum")
        fields = self.group.split("/")
        if len(fields) != 3:
            raise ValueError("Invalid tone/gender/age stratum format")
        tone, gender, age = fields
        if tone not in {f"tone-{i}" for i in range(1, 11)}:
            raise ValueError("Unknown recorded tone group")
        if gender not in {
            "female", "male", "nonbinary", "self_described", "withheld",
        }:
            raise ValueError("Unknown voluntarily provided gender group")
        if age not in {"10-19", "20-29", "30-39", "40-59", "60+"}:
            raise ValueError("Unknown age stratum")
        for value in (self.total, self.technical_pass, self.human_pass,
                      self.human_reviewed):
            if not _is_count(value, ceiling=FROZEN_FACE_COUNT):
                raise ValueError("Group counts must be bounded integers")
        if any(x > self.total for x in (
            self.technical_pass, self.human_pass, self.human_reviewed,
        )):
            raise ValueError("Group counters cannot exceed the group size")
        if self.human_pass > min(self.human_reviewed, self.technical_pass):
            raise ValueError("A failing technical record cannot pass overall review")


@dataclass(frozen=True, slots=True)
class ShardSummary:
    header: ShardHeader
    real_count: int
    synthetic_count: int
    faults: tuple[tuple[str, int], ...]
    groups: tuple[GroupCount, ...]

    def validate(self, gate: FeatureGate) -> None:
        self.header.validate(gate)
        if not _is_count(self.real_count, ceiling=MAX_ROWS_PER_SHARD):
            raise ValueError("Invalid real-face count")
        if not _is_count(self.synthetic_count, ceiling=MAX_ROWS_PER_SHARD):
            raise ValueError("Invalid synthetic count")
        if self.real_count + self.synthetic_count > MAX_ROWS_PER_SHARD:
            raise ValueError("Shard cannot exceed the complete frozen set")
        if len(self.groups) > MAX_GROUPS:
            raise ValueError("Too many strata; schema may have been modified")
        if len({group.group for group in self.groups}) != len(self.groups):
            raise ValueError("Duplicate stratum in one shard")
        for group in self.groups:
            group.validate()
        if sum(group.total for group in self.groups) != self.real_count:
            raise ValueError("Stratum counts do not reconcile to real observations")
        if tuple(sorted(self.groups, key=lambda x: x.group)) != self.groups:
            raise ValueError("Group export must be stably sorted")
        if tuple(sorted(self.faults)) != self.faults:
            raise ValueError("Fault export must be stably sorted")
        if len({code for code, _ in self.faults}) != len(self.faults):
            raise ValueError("Duplicate fault counter")
        for code, count in self.faults:
            if not isinstance(code, str) or not code or len(code) > 64:
                raise ValueError("Invalid finite fault-code label")
            if not code.replace("_", "").isupper():
                raise ValueError("Fault label is not a canonical upper-case code")
            if not _is_count(count, ceiling=MAX_ROWS_PER_SHARD):
                raise ValueError("Invalid fault count")


@dataclass(slots=True)
class _MutableGroup:
    total: int = 0
    technical_pass: int = 0
    human_pass: int = 0
    human_reviewed: int = 0


@dataclass(slots=True)
class ShardAccumulator:
    """Store counters only; discard each consented observation immediately."""

    gate: FeatureGate
    header: ShardHeader
    real_count: int = 0
    synthetic_count: int = 0
    faults: Counter[str] = field(default_factory=Counter)
    groups: dict[str, _MutableGroup] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.header.validate(self.gate)

    def ingest(self, observation: RealFaceObservation) -> None:
        """No source photo, identity or specimen path can enter this interface."""
        observation.group.validate()
        measurement = observation.row
        verdict = score_pixel_evidence(self.gate, measurement)
        if self.real_count + self.synthetic_count >= MAX_ROWS_PER_SHARD:
            raise ValueError("Frozen shard exceeds maximum face count")
        if measurement.synthetic:
            self.synthetic_count += 1
            self.faults["SYNTHETIC_NOT_REAL_FACE"] += 1
            return
        self.real_count += 1
        key = observation.group.key()
        group = self.groups.setdefault(key, _MutableGroup())
        group.total += 1
        if verdict.technical_pass:
            group.technical_pass += 1
        if verdict.human_pass is not None:
            group.human_reviewed += 1
        if verdict.technical_pass and verdict.human_pass is True:
            group.human_pass += 1
        for fault in verdict.faults:
            self.faults[fault] += 1
        if verdict.human_pass is None:
            self.faults["HUMAN_REVIEW_REQUIRED"] += 1

    def ingest_many(self, observations: Iterable[RealFaceObservation]) -> None:
        for row in observations:
            self.ingest(row)

    def snapshot(self) -> ShardSummary:
        """Immutable counters, suitable for audited checkpoint comparisons."""
        groups = tuple(
            GroupCount(name, row.total, row.technical_pass,
                       row.human_pass, row.human_reviewed)
            for name, row in sorted(self.groups.items())
        )
        report = ShardSummary(
            header=self.header,
            real_count=self.real_count,
            synthetic_count=self.synthetic_count,
            faults=tuple(sorted(self.faults.items())),
            groups=groups,
        )
        report.validate(self.gate)
        return report


@dataclass(frozen=True, slots=True)
class AggregateSummary:
    """Safe-to-surface totals; small strata are suppressed in displayed rates."""

    feature_id: str
    state: GateState
    included_shards: int
    expected_shards: int
    real_faces: int
    synthetic_rows: int
    overall_acceptance: float | None
    disclosed_strata_rates: Mapping[str, float]
    suppressed_strata: int
    faults: tuple[str, ...]


def merge_shards(
    gate: FeatureGate,
    summaries: Iterable[ShardSummary],
    *,
    expected_frozen_sha256: str,
    manifest_reviewed: bool = False,
) -> AggregateSummary:
    """Fail closed on partial shards, duplicate indices and unchecked manifests.

    A caller-supplied ``manifest_reviewed`` boolean is **not** verification:
    the external, authorized Lane A runner must check the frozen hash and
    provenance independently. This function cannot certify a study alone.
    """
    gate.validate()
    if not _is_lowercase_sha256(expected_frozen_sha256):
        raise ValueError("Required manifest SHA-256 is invalid")
    if type(manifest_reviewed) is not bool:
        raise ValueError("Manifest review requires an explicit boolean")
    parts = tuple(summaries)
    seen: set[int] = set()
    count: int | None = None
    real = 0
    synthetic = 0
    by_group: dict[str, _MutableGroup] = {}
    errors: Counter[str] = Counter()
    for shard in parts:
        shard.validate(gate)
        if shard.header.manifest_sha256 != expected_frozen_sha256:
            raise ValueError("Cannot merge different frozen datasets")
        if count is None:
            count = shard.header.count
        if shard.header.count != count:
            raise ValueError("Shard count differs between summaries")
        if shard.header.index in seen:
            raise ValueError("Duplicate shard index could double-count a face")
        seen.add(shard.header.index)
        real += shard.real_count
        synthetic += shard.synthetic_count
        if real + synthetic > FROZEN_FACE_COUNT:
            raise ValueError("Aggregate exceeds fixed face count")
        for code, amount in shard.faults:
            errors[code] += amount
        for row in shard.groups:
            group = by_group.setdefault(row.group, _MutableGroup())
            group.total += row.total
            group.technical_pass += row.technical_pass
            group.human_pass += row.human_pass
            group.human_reviewed += row.human_reviewed

    failures: set[str] = set()
    if not manifest_reviewed:
        failures.add("EXTERNAL_MANIFEST_REVIEW_REQUIRED")
    if count is None or len(seen) != count or seen != set(range(count)):
        failures.add("SHARDS_MISSING")
    if real != FROZEN_FACE_COUNT:
        failures.add("FROZEN_FACE_COUNT_INCOMPLETE")
    if synthetic > 0:
        failures.add("SYNTHETIC_DATA_PRESENT")
    if not by_group:
        failures.add("NO_VALID_STRATA")
    tones = {name.split("/")[0] for name in by_group}
    if tones != {f"tone-{tone}" for tone in range(1, 11)}:
        failures.add("TONE_COVERAGE_MISSING")
    exposed: dict[str, float] = {}
    suppressed = 0
    accepted = 0
    for name, values in sorted(by_group.items()):
        accepted += values.human_pass
        if values.total < MIN_GROUP_FACES:
            suppressed += 1
            failures.add("STRATUM_UNDERSAMPLED")
            continue
        exposed[name] = values.human_pass / values.total
        if values.human_reviewed != values.total:
            failures.add("HUMAN_REVIEW_INCOMPLETE")
        if exposed[name] < MIN_SUCCESS_RATE:
            failures.add("STRATUM_QUALITY_INSUFFICIENT")
    overall = accepted / real if real else None
    if overall is None or overall < MIN_SUCCESS_RATE:
        failures.add("OVERALL_QUALITY_INSUFFICIENT")
    if any(errors[code] > 0 for code in FATAL_FAULTS):
        failures.add("NONNEGOTIABLE_PIXEL_BOUNDARY_FAILURE")
    if errors["HUMAN_REVIEW_REQUIRED"] > 0:
        failures.add("HUMAN_REVIEW_INCOMPLETE")
    state: GateState = (
        "UNPROVEN" if not manifest_reviewed else
        "PASS" if not failures else "FAIL"
    )
    return AggregateSummary(
        feature_id=gate.id,
        state=state,
        included_shards=len(seen),
        expected_shards=count or 0,
        real_faces=real,
        synthetic_rows=synthetic,
        overall_acceptance=overall,
        disclosed_strata_rates=exposed,
        suppressed_strata=suppressed,
        faults=tuple(sorted(failures)),
    )
