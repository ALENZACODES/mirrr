"""Fail-closed reconciliation of normalized face-detection outcomes.

This module deliberately does not claim to implement a private dispatch receipt
schema. The coordinator must map its signed, immutable source fields to the
explicit normalized records before this audit is used to approve a merge.
Only opaque source identifiers are retained; face imagery is never serialized.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any

FAILURE_CLASSES = frozenset({"group", "cropped", "profile", "occlusion", "other"})
OUTCOMES = frozenset({"mesh", "no_mesh", "error"})


class ReceiptMismatch(ValueError):
    """A mismatch forbids reporting this run as reconciled."""


@dataclass(frozen=True)
class ReceiptAudit:
    expected: int
    received: int
    detected: int
    undetected: int
    errors: int
    failure_counts: dict[str, int]
    manifest_sha256: str
    receipts_sha256: str
    commit: str
    definitions_sha256: str
    run_id: str

    def summary(self) -> dict[str, Any]:
        return {
            "expected": self.expected,
            "received": self.received,
            "detected": self.detected,
            "undetected": self.undetected,
            "errors": self.errors,
            "failure_counts": dict(self.failure_counts),
            "manifest_sha256": self.manifest_sha256,
            "receipts_sha256": self.receipts_sha256,
            "commit": self.commit,
            "definitions_sha256": self.definitions_sha256,
            "run_id": self.run_id,
            "status": "reconciled",
        }


def _required_string(record: Mapping[str, Any], field: str) -> str:
    value = record.get(field)
    if not isinstance(value, str) or not value or value.strip() != value:
        raise ReceiptMismatch(f"{field} must be a nonempty canonical string")
    if len(value) > 256 or any(ord(ch) < 32 for ch in value):
        raise ReceiptMismatch(f"{field} contains an invalid identifier")
    return value


def _digest(records: Sequence[Mapping[str, Any]]) -> str:
    payload = json.dumps(records, sort_keys=True, separators=(",", ":"),
                         ensure_ascii=True, allow_nan=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _id(record: Mapping[str, Any]) -> str:
    return _required_string(record, "face_id")


def _assert_unique(records: Sequence[Mapping[str, Any]], label: str) -> None:
    ids = [_id(record) for record in records]
    if len(set(ids)) != len(ids):
        duplicates = Counter(ids)
        raise ReceiptMismatch(f"{label} has duplicate face IDs: "
                              f"{sum(n - 1 for n in duplicates.values())}")


def reconcile(
    manifest: Sequence[Mapping[str, Any]],
    receipts: Sequence[Mapping[str, Any]],
    *,
    commit: str,
    definitions_sha256: str,
    run_id: str,
) -> ReceiptAudit:
    """Validate a complete normalized outcome set without inspecting photos.

    Receipt fields: face_id, outcome, failure_class (required on no_mesh),
    commit, definitions_sha256, run_id, shard. Manifest fields: face_id, shard.
    All receipts must match the same pinned run, source row and shard.
    Errors remain separate from undetected faces, never counted as successes.
    """
    if not manifest:
        raise ReceiptMismatch("empty input manifest is not a completed run")
    for name, value in (("commit", commit), ("definitions_sha256", definitions_sha256),
                        ("run_id", run_id)):
        _required_string({name: value}, name)
    manifest_rows = list(manifest)
    receipt_rows = list(receipts)
    _assert_unique(manifest_rows, "manifest")
    _assert_unique(receipt_rows, "receipts")
    expected = {_id(row): row for row in manifest_rows}
    seen = {_id(row): row for row in receipt_rows}
    if set(expected) != set(seen):
        raise ReceiptMismatch(
            f"manifest mismatch: missing={len(set(expected) - set(seen))}, "
            f"extra={len(set(seen) - set(expected))}"
        )
    failures: Counter[str] = Counter()
    statuses: Counter[str] = Counter()
    for face_id in sorted(expected):
        original = expected[face_id]
        result = seen[face_id]
        shard = original.get("shard")
        if isinstance(shard, bool) or not isinstance(shard, int) or not 0 <= shard < 100:
            raise ReceiptMismatch("manifest contains an invalid shard")
        if result.get("shard") != shard or isinstance(result.get("shard"), bool):
            raise ReceiptMismatch("receipt shard disagrees with the frozen manifest")
        for field, pinned in (("commit", commit),
                              ("definitions_sha256", definitions_sha256),
                              ("run_id", run_id)):
            if _required_string(result, field) != pinned:
                raise ReceiptMismatch(f"receipt {field} does not match pinned run")
        outcome = result.get("outcome")
        if outcome not in OUTCOMES:
            raise ReceiptMismatch("receipt outcome is not recognized")
        statuses[outcome] += 1
        failure_class = result.get("failure_class")
        if outcome == "no_mesh":
            if failure_class not in FAILURE_CLASSES:
                raise ReceiptMismatch("undetected face must have a failure class")
            failures[str(failure_class)] += 1
        elif failure_class is not None:
            raise ReceiptMismatch("only no_mesh outcomes can carry a failure class")
    undetected = statuses["no_mesh"]
    if sum(failures.values()) != undetected:
        raise ReceiptMismatch("failure classes do not reconcile")
    canonical_manifest = [expected[k] for k in sorted(expected)]
    canonical_receipts = [seen[k] for k in sorted(seen)]
    return ReceiptAudit(
        expected=len(expected),
        received=len(seen),
        detected=statuses["mesh"],
        undetected=undetected,
        errors=statuses["error"],
        failure_counts={name: failures[name] for name in sorted(FAILURE_CLASSES)},
        manifest_sha256=_digest(canonical_manifest),
        receipts_sha256=_digest(canonical_receipts),
        commit=commit,
        definitions_sha256=definitions_sha256,
        run_id=run_id,
    )
