"""Shared typed evidence helpers for R18B Lane B engines. Author: John Khan."""
from __future__ import annotations

import hashlib
import json
import math
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import asdict, dataclass
from typing import ClassVar, Protocol, TypeVar


class FrozenCaseLike(Protocol):
    @property
    def case_id(self) -> str: ...

    @property
    def input_sha256(self) -> str: ...

    @property
    def feature_ids(self) -> tuple[str, ...]: ...


class FrozenManifestLike(Protocol):
    @property
    def cases(self) -> Sequence[FrozenCaseLike]: ...

    @property
    def sha256(self) -> str: ...

    def validate(self, *, require_complete: bool = True) -> None: ...


@dataclass(frozen=True)
class FrozenResultRow:
    _valid_features: ClassVar[tuple[str, ...]]
    _domain: ClassVar[str]
    case_id: str
    feature_id: str
    status: str
    definition_sha256: str
    input_sha256: str
    metrics_sha256: str

    def validate(self) -> None:
        self.validate_common(self._valid_features, self._domain)

    def validate_common(self, valid_features: Iterable[str], domain: str) -> None:
        if self.feature_id not in frozenset(valid_features):
            raise ValueError(f"unknown {domain} feature")
        if self.status not in {"passed", "failed", "not_tested"}:
            raise ValueError("invalid status")
        for digest in (self.definition_sha256, self.input_sha256, self.metrics_sha256):
            if len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
                raise ValueError("invalid sha256")


RowT = TypeVar("RowT", bound=FrozenResultRow)


@dataclass(frozen=True)
class FrozenResultLedger:
    _format: ClassVar[str]
    manifest_sha256: str
    rows: tuple[FrozenResultRow, ...]
    author: str = "John Khan"

    def validate(self, manifest: FrozenManifestLike) -> None:
        for row in self.rows:
            row.validate()
        self.validate_common(manifest)

    def canonical(self, manifest: FrozenManifestLike) -> str:
        self.validate(manifest)
        return canonical_result_ledger(self._format, self, manifest)

    def sha256(self, manifest: FrozenManifestLike) -> str:
        return hashlib.sha256(self.canonical(manifest).encode("utf-8")).hexdigest()

    def validate_common(self, manifest: FrozenManifestLike) -> None:
        manifest.validate(require_complete=False)
        if self.author != "John Khan":
            raise ValueError("author must be John Khan")
        if self.manifest_sha256 != manifest.sha256:
            raise ValueError("manifest hash mismatch")
        required = {(case.case_id, feature) for case in manifest.cases for feature in case.feature_ids}
        by_case = {case.case_id: case for case in manifest.cases}
        seen: set[tuple[str, str]] = set()
        for row in self.rows:
            key = (row.case_id, row.feature_id)
            if key in seen:
                raise ValueError("duplicate result row")
            if key not in required:
                raise ValueError("result row is outside frozen manifest")
            if row.input_sha256 != by_case[row.case_id].input_sha256:
                raise ValueError("result input hash mismatch")
            seen.add(key)


def canonical_result_ledger(
    format_name: str,
    ledger: FrozenResultLedger,
    manifest: FrozenManifestLike,
) -> str:
    ledger.validate_common(manifest)
    payload = {
        "format": format_name,
        "author": ledger.author,
        "manifest_sha256": ledger.manifest_sha256,
        "rows": [asdict(row) for row in ledger.rows],
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"))


def pending_result_keys(
    manifest: FrozenManifestLike,
    ledger: FrozenResultLedger,
) -> tuple[tuple[str, str], ...]:
    ledger.validate_common(manifest)
    required = {(case.case_id, feature) for case in manifest.cases for feature in case.feature_ids}
    done = {(row.case_id, row.feature_id) for row in ledger.rows}
    return tuple(sorted(required - done))


def merge_result_rows(
    manifest: FrozenManifestLike,
    ledgers: Sequence[FrozenResultLedger],
) -> tuple[FrozenResultRow, ...]:
    rows: list[FrozenResultRow] = []
    seen: set[tuple[str, str]] = set()
    for ledger in ledgers:
        ledger.validate_common(manifest)
        for row in ledger.rows:
            key = (row.case_id, row.feature_id)
            if key in seen:
                raise ValueError("overlapping shard result")
            seen.add(key)
            rows.append(row)
    return tuple(sorted(rows, key=lambda row: (row.case_id, row.feature_id)))


def metrics_sha256(metrics: Mapping[str, float | bool]) -> str:
    payload = json.dumps(dict(sorted(metrics.items())), sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def statuses(ledger: FrozenResultLedger) -> dict[str, int]:
    counts = {"passed": 0, "failed": 0, "not_tested": 0}
    for row in ledger.rows:
        counts[row.status] += 1
    return counts


def parse_int(value: object, *, field: str, default: int | None = None) -> int:
    if value is None and default is not None:
        return default
    if isinstance(value, bool):
        raise TypeError(f"{field} must be an integer")
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        if not math.isfinite(value):
            raise TypeError(f"{field} must be finite")
        return int(value)
    if isinstance(value, str):
        return int(value)
    raise TypeError(f"{field} must be an integer-compatible value")


def parse_float(value: object, *, field: str, default: float | None = None) -> float:
    if value is None and default is not None:
        return default
    if isinstance(value, bool):
        raise TypeError(f"{field} must be numeric")
    if isinstance(value, (int, float)):
        result = float(value)
    elif isinstance(value, str):
        result = float(value)
    else:
        raise TypeError(f"{field} must be numeric")
    if not math.isfinite(result):
        raise TypeError(f"{field} must be finite")
    return result


@dataclass(frozen=True)
class FeatureGate:
    feature_id: str
    tested: int
    failed: int
    not_tested: int
    ready: bool


def build_feature_gates(
    raw: object,
    feature_ids: Sequence[str],
    *,
    minimum_cases: int,
) -> tuple[FeatureGate, ...]:
    if minimum_cases < 1:
        raise ValueError("minimum_cases must be positive")
    if not isinstance(raw, Mapping):
        raise TypeError("invalid coverage payload")
    result: list[FeatureGate] = []
    for feature_id in feature_ids:
        item = raw.get(feature_id)
        if not isinstance(item, Mapping):
            raise TypeError(f"missing coverage for {feature_id}")
        tested = parse_int(item.get("tested"), field=f"{feature_id}.tested")
        failed = parse_int(item.get("failed"), field=f"{feature_id}.failed")
        not_tested = parse_int(item.get("not_tested"), field=f"{feature_id}.not_tested")
        ready = tested >= minimum_cases and failed == 0 and not_tested == 0
        result.append(FeatureGate(feature_id, tested, failed, not_tested, ready))
    return tuple(result)


@dataclass(frozen=True)
class FeatureReportRow:
    case_id: str
    feature_id: str
    status: str
    definition_sha256: str
    input_sha256: str
    metrics: tuple[tuple[str, float | bool], ...]
    missing: tuple[str, ...]

    def validate(self) -> None:
        if not self.case_id.strip() or not self.feature_id.strip():
            raise ValueError("case_id and feature_id are required")
        if self.status not in {"passed", "failed", "not_tested"}:
            raise ValueError("invalid status")
        for digest in (self.definition_sha256, self.input_sha256):
            if len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
                raise ValueError("invalid sha256")


@dataclass(frozen=True)
class FeatureReport:
    dataset_id: str
    rows: tuple[FeatureReportRow, ...]
    author: str = "John Khan"


def validate_feature_report(report: FeatureReport, valid_features: Iterable[str], domain: str) -> None:
    if report.author != "John Khan" or not report.dataset_id.strip():
        raise ValueError("invalid report identity")
    allowed = frozenset(valid_features)
    seen: set[tuple[str, str]] = set()
    for row in report.rows:
        row.validate()
        if row.feature_id not in allowed:
            raise ValueError(f"unknown {domain} feature")
        key = (row.case_id, row.feature_id)
        if key in seen:
            raise ValueError("duplicate case/feature row")
        seen.add(key)


def definition_set_sha256(definition_hashes: Iterable[str]) -> str:
    return hashlib.sha256("\n".join(definition_hashes).encode("ascii")).hexdigest()


def canonical_feature_report(
    format_name: str,
    report: FeatureReport,
    *,
    definition_hash: str,
    registry_features: Sequence[str],
) -> str:
    payload = {
        "format": format_name,
        "author": report.author,
        "dataset_id": report.dataset_id,
        "definition_set_sha256": definition_hash,
        "registry_features": registry_features,
        "rows": [asdict(row) for row in report.rows],
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"))
