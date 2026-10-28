"""R17B evidence, parity, and definition contracts. Author: John Khan.

This module is intentionally provider-independent. It gives the R17B engines a
single typed vocabulary for preregistered pass definitions, synthetic parity
records, local real-face evidence, and aggregate status. It never loads a face,
contacts a network service, or promotes missing evidence to a pass.
"""
from __future__ import annotations

import hashlib
import json
import math
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import asdict, dataclass, field
from typing import Any, Literal

EvidenceStatus = Literal["passed", "failed", "not_tested"]
MetricDirection = Literal["max", "min", "eq"]


@dataclass(frozen=True)
class MetricRule:
    """A single measurable preregistered threshold."""

    name: str
    direction: MetricDirection
    threshold: float | bool
    description: str

    def validate(self) -> None:
        if not self.name or any(char.isspace() for char in self.name):
            raise ValueError("metric rule name must be a non-empty token")
        if self.direction not in {"max", "min", "eq"}:
            raise ValueError("unsupported metric direction")
        if isinstance(self.threshold, float) and not math.isfinite(self.threshold):
            raise ValueError("metric threshold must be finite")
        if not self.description.strip():
            raise ValueError("metric rule requires a description")

    def passes(self, value: float | bool) -> bool:
        self.validate()
        if self.direction == "eq":
            return value == self.threshold
        if isinstance(value, bool) or isinstance(self.threshold, bool):
            raise TypeError("numeric min/max rule received boolean")
        if not math.isfinite(float(value)):
            return False
        if self.direction == "max":
            return float(value) <= float(self.threshold)
        return float(value) >= float(self.threshold)


@dataclass(frozen=True)
class PassDefinition:
    """Versioned written acceptance criteria for one engine or W feature."""

    id: str
    group: str
    title: str
    scope: str
    rules: tuple[MetricRule, ...]
    required_evidence: tuple[str, ...] = ()
    notes: tuple[str, ...] = ()
    version: int = 1
    author: str = "John Khan"

    def validate(self) -> None:
        if self.author != "John Khan":
            raise ValueError("R17B definitions must use author John Khan")
        if self.version < 1:
            raise ValueError("definition version must be positive")
        if not self.id or not self.group or not self.title or not self.scope:
            raise ValueError("definition identity fields must be non-empty")
        if len(set(self.required_evidence)) != len(self.required_evidence):
            raise ValueError("required evidence names must be unique")
        if len({rule.name for rule in self.rules}) != len(self.rules):
            raise ValueError("metric rule names must be unique")
        if not self.rules:
            raise ValueError("definition must have at least one measurable rule")
        for rule in self.rules:
            rule.validate()

    def canonical(self) -> str:
        self.validate()
        return json.dumps(asdict(self), sort_keys=True, separators=(",", ":"))

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.canonical().encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class EvidenceRecord:
    """One immutable local evaluation result."""

    definition_id: str
    definition_sha256: str
    case_id: str
    input_sha256: str
    status: EvidenceStatus
    metrics: Mapping[str, float | bool] = field(default_factory=dict)
    missing: tuple[str, ...] = ()
    notes: tuple[str, ...] = ()

    def validate(self) -> None:
        if self.status not in {"passed", "failed", "not_tested"}:
            raise ValueError("invalid evidence status")
        for value in self.metrics.values():
            if isinstance(value, bool):
                continue
            if not math.isfinite(float(value)):
                raise ValueError("evidence metric must be finite")
        if self.status == "not_tested" and not self.missing:
            raise ValueError("not_tested evidence must state what is missing")
        if self.status in {"passed", "failed"} and self.missing:
            raise ValueError("tested evidence cannot retain missing prerequisites")
        for digest in (self.definition_sha256, self.input_sha256):
            if len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
                raise ValueError("evidence hashes must be lowercase sha256")

    def canonical(self) -> str:
        self.validate()
        return json.dumps(asdict(self), sort_keys=True, separators=(",", ":"))


@dataclass(frozen=True)
class GroupSummary:
    group: str
    total: int
    tested: int
    passed: int
    failed: int
    not_tested: int
    ready: bool
    definition_sha256: tuple[str, ...]

    def validate(self) -> None:
        if self.total < 0 or min(self.tested, self.passed, self.failed, self.not_tested) < 0:
            raise ValueError("summary counts must be non-negative")
        if self.tested != self.passed + self.failed:
            raise ValueError("tested count must equal passed plus failed")
        if self.total != self.tested + self.not_tested:
            raise ValueError("total count mismatch")
        if self.ready != (self.total > 0 and self.failed == 0 and self.not_tested == 0):
            raise ValueError("ready flag does not match evidence counts")


def input_fingerprint(parts: Iterable[bytes | str]) -> str:
    """Hash length-delimited evidence inputs without exposing their contents."""

    digest = hashlib.sha256()
    for part in parts:
        raw = part.encode("utf-8") if isinstance(part, str) else bytes(part)
        digest.update(len(raw).to_bytes(8, "big"))
        digest.update(raw)
    return digest.hexdigest()


def missing_evidence(definition: PassDefinition, available: Iterable[str]) -> tuple[str, ...]:
    definition.validate()
    have = set(available)
    return tuple(item for item in definition.required_evidence if item not in have)


def evaluate_definition(
    definition: PassDefinition,
    *,
    case_id: str,
    input_sha256: str,
    available_evidence: Iterable[str],
    metrics: Mapping[str, float | bool],
    notes: Sequence[str] = (),
) -> EvidenceRecord:
    """Evaluate only preregistered rules; missing prerequisites remain Not tested."""

    definition.validate()
    missing = missing_evidence(definition, available_evidence)
    if missing:
        return EvidenceRecord(
            definition_id=definition.id,
            definition_sha256=definition.sha256,
            case_id=case_id,
            input_sha256=input_sha256,
            status="not_tested",
            metrics={},
            missing=missing,
            notes=tuple(notes),
        )
    missing_metrics = tuple(rule.name for rule in definition.rules if rule.name not in metrics)
    if missing_metrics:
        return EvidenceRecord(
            definition_id=definition.id,
            definition_sha256=definition.sha256,
            case_id=case_id,
            input_sha256=input_sha256,
            status="not_tested",
            metrics={},
            missing=tuple(f"metric:{name}" for name in missing_metrics),
            notes=tuple(notes),
        )
    selected = {rule.name: metrics[rule.name] for rule in definition.rules}
    passed = all(rule.passes(selected[rule.name]) for rule in definition.rules)
    record = EvidenceRecord(
        definition_id=definition.id,
        definition_sha256=definition.sha256,
        case_id=case_id,
        input_sha256=input_sha256,
        status="passed" if passed else "failed",
        metrics=selected,
        notes=tuple(notes),
    )
    record.validate()
    return record


def summarize_group(group: str, records: Sequence[EvidenceRecord]) -> GroupSummary:
    for record in records:
        record.validate()
    passed = sum(record.status == "passed" for record in records)
    failed = sum(record.status == "failed" for record in records)
    not_tested = sum(record.status == "not_tested" for record in records)
    tested = passed + failed
    summary = GroupSummary(
        group=group,
        total=len(records),
        tested=tested,
        passed=passed,
        failed=failed,
        not_tested=not_tested,
        ready=bool(records) and failed == 0 and not_tested == 0,
        definition_sha256=tuple(sorted({record.definition_sha256 for record in records})),
    )
    summary.validate()
    return summary


def definitions_fingerprint(definitions: Mapping[str, PassDefinition]) -> str:
    """Stable hash used to bind a run to the exact written thresholds."""

    rows: list[str] = []
    for name in sorted(definitions):
        definition = definitions[name]
        if name != definition.id:
            raise ValueError("definition mapping key must equal definition id")
        rows.append(definition.canonical())
    return input_fingerprint(rows)


def validate_definition_set(
    definitions: Mapping[str, PassDefinition],
    *,
    expected_ids: Iterable[str],
) -> dict[str, Any]:
    expected = tuple(expected_ids)
    if len(set(expected)) != len(expected):
        raise ValueError("expected definition ids must be unique")
    if set(definitions) != set(expected):
        missing = sorted(set(expected) - set(definitions))
        extra = sorted(set(definitions) - set(expected))
        raise ValueError(f"definition ids mismatch; missing={missing}; extra={extra}")
    for definition in definitions.values():
        definition.validate()
    return {
        "count": len(definitions),
        "ids": list(expected),
        "sha256": definitions_fingerprint(definitions),
        "author": "John Khan",
        "quality_result": "criteria_only_no_realface_pass",
    }
