"""Bounded in-memory completion ledger for one frozen body run.

Each eligible job (frozen body x fix of its view) is recorded at most once. Records
from another run, the wrong shard, the wrong view, unknown bodies or conflicting
duplicates are refused with stable codes; an identical duplicate is ignored, so it
can never inflate the pass count. An explicit refusal stays in the denominator as a
non-pass. Missing jobs are counted, never assumed. Ledgers from separate shard workers
merge only when they belong to the same frozen run. Author: John Khan.
"""
from __future__ import annotations

import hashlib
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any

from .body_freeze import FIX_IDS_BY_VIEW, FrozenRun
from .body_measurement import Measurement, check_measurement

LEDGER_FORMAT = "beljour-posture-body-ledger/1"


class LedgerError(ValueError):
    """A refused record or merge; stable code, no subject data."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class JobOutcome:
    measurement: Measurement
    passed: bool
    reasons: tuple[str, ...]

    @property
    def refused(self) -> bool:
        return self.measurement.status == "refused"


class BodyLedger:
    def __init__(self, run: FrozenRun, limits: Mapping[str, Any] | None = None) -> None:
        self.run = run
        self.limits = limits
        self._outcomes: dict[str, JobOutcome] = {}
        self.duplicates_ignored = 0

    def record(self, item: Measurement) -> str:
        """Add one parsed measurement; returns "accepted" or "duplicate_ignored"."""
        if item.run != self.run.fingerprint:
            raise LedgerError("changed_frozen_run")
        body = self.run.body(item.photo_sha256)
        if body is None:
            raise LedgerError("unknown_body")
        if item.shard != body.shard:
            raise LedgerError("wrong_shard")
        if item.view != body.view or item.fix not in FIX_IDS_BY_VIEW[body.view]:
            raise LedgerError("wrong_view")
        prior = self._outcomes.get(item.job)
        if prior is not None:
            if prior.measurement == item:
                self.duplicates_ignored += 1
                return "duplicate_ignored"
            raise LedgerError("conflicting_duplicate")
        passed, reasons = check_measurement(item, self.limits)
        self._outcomes[item.job] = JobOutcome(item, passed, reasons)
        return "accepted"

    def record_all(self, items: Iterable[Measurement]) -> None:
        for item in items:
            self.record(item)

    def merge(self, other: BodyLedger) -> BodyLedger:
        """Combine two shard ledgers of the same frozen run into a new ledger."""
        if other.run.fingerprint != self.run.fingerprint or other.run != self.run:
            raise LedgerError("changed_frozen_run")
        merged = BodyLedger(self.run, self.limits)
        for outcome in (*self._outcomes.values(), *other._outcomes.values()):
            merged.record(outcome.measurement)
        merged.duplicates_ignored += self.duplicates_ignored + other.duplicates_ignored
        return merged

    def outcome(self, job: str) -> JobOutcome | None:
        return self._outcomes.get(job)

    def outcomes(self) -> Iterable[JobOutcome]:
        return self._outcomes.values()

    def completion(self) -> dict[str, int]:
        expected = self.run.job_count
        refused = sum(1 for item in self._outcomes.values() if item.refused)
        passed = sum(1 for item in self._outcomes.values() if item.passed)
        recorded = len(self._outcomes)
        return {
            "expected_jobs": expected, "recorded_jobs": recorded, "missing_jobs": expected - recorded,
            "refused_jobs": refused, "passed_jobs": passed, "failed_jobs": recorded - passed - refused,
            "duplicates_ignored": self.duplicates_ignored,
        }

    def shard_receipts(self) -> list[dict[str, Any]]:
        """Per-shard hashed receipts of recorded jobs: counts and a digest, no job identifiers."""
        by_shard: dict[int, list[str]] = {}
        expected: dict[int, int] = {}
        for body in self.run.bodies:
            expected[body.shard] = expected.get(body.shard, 0) + len(FIX_IDS_BY_VIEW[body.view])
        for job, outcome in self._outcomes.items():
            by_shard.setdefault(outcome.measurement.shard, []).append(job)
        receipts = []
        for shard in sorted(expected):
            jobs = sorted(by_shard.get(shard, []))
            digest = hashlib.sha256(f"beljour-body-jobs/1\0{self.run.fingerprint}\0{shard}\0".encode())
            for job in jobs:
                digest.update(job.encode("ascii"))
                digest.update(b"\0")
            receipts.append({"shard": shard, "expected_jobs": expected[shard], "recorded_jobs": len(jobs),
                             "jobs_sha256": digest.hexdigest()})
        return receipts
