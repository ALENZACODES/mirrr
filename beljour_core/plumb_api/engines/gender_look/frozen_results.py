"""Resumable frozen-1000 result ledger for R18B gender full-look. Author: John Khan."""
from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass

from .frozen1000 import FrozenManifest
from .realface import LEVELS

FORMAT = "beljour.r18b.gender.results/1"


@dataclass(frozen=True)
class ResultRow:
    case_id: str
    level: str
    status: str
    definition_sha256: str
    input_sha256: str
    metrics_sha256: str

    def validate(self) -> None:
        if self.level not in LEVELS:
            raise ValueError("unknown gender level")
        if self.status not in {"passed", "failed", "not_tested"}:
            raise ValueError("invalid status")
        for digest in (self.definition_sha256, self.input_sha256, self.metrics_sha256):
            if len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
                raise ValueError("invalid sha256")


@dataclass(frozen=True)
class ResultLedger:
    manifest_sha256: str
    rows: tuple[ResultRow, ...]
    author: str = "John Khan"

    def validate(self, manifest: FrozenManifest) -> None:
        manifest.validate(require_complete=False)
        if self.author != "John Khan" or self.manifest_sha256 != manifest.sha256:
            raise ValueError("ledger identity mismatch")
        required = {(case.case_id, level) for case in manifest.cases for level in case.levels}
        by_case = {case.case_id: case for case in manifest.cases}
        seen: set[tuple[str, str]] = set()
        for row in self.rows:
            row.validate()
            key = (row.case_id, row.level)
            if key in seen:
                raise ValueError("duplicate result row")
            if key not in required:
                raise ValueError("result row is outside frozen manifest")
            if row.input_sha256 != by_case[row.case_id].input_sha256:
                raise ValueError("result input hash mismatch")
            seen.add(key)

    def canonical(self, manifest: FrozenManifest) -> str:
        self.validate(manifest)
        return json.dumps(
            {"format": FORMAT, "author": self.author, "manifest_sha256": self.manifest_sha256, "rows": [asdict(row) for row in self.rows]},
            sort_keys=True,
            separators=(",", ":"),
        )

    def sha256(self, manifest: FrozenManifest) -> str:
        return hashlib.sha256(self.canonical(manifest).encode("utf-8")).hexdigest()


def pending(manifest: FrozenManifest, ledger: ResultLedger) -> tuple[tuple[str, str], ...]:
    ledger.validate(manifest)
    required = {(case.case_id, level) for case in manifest.cases for level in case.levels}
    done = {(row.case_id, row.level) for row in ledger.rows}
    return tuple(sorted(required - done))


def merge(manifest: FrozenManifest, ledgers: Sequence[ResultLedger]) -> ResultLedger:
    rows: list[ResultRow] = []
    seen: set[tuple[str, str]] = set()
    for ledger in ledgers:
        ledger.validate(manifest)
        for row in ledger.rows:
            key = (row.case_id, row.level)
            if key in seen:
                raise ValueError("overlapping shard result")
            seen.add(key)
            rows.append(row)
    result = ResultLedger(manifest.sha256, tuple(sorted(rows, key=lambda row: (row.case_id, row.level))))
    result.validate(manifest)
    return result


def metrics_sha256(metrics: Mapping[str, float | bool]) -> str:
    payload = json.dumps(dict(sorted(metrics.items())), sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
