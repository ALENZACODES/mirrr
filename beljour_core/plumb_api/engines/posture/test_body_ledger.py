"""R28E completion ledger: binding, duplicates, refusals and shard merges. Author: John Khan."""
from __future__ import annotations

import json
from typing import Any

import pytest

from . import body_freeze as F
from .body_ledger import BodyLedger, LedgerError
from .body_measurement import measurement_record, parse_measurement


@pytest.fixture(scope="module")
def run() -> F.FrozenRun:
    return F.freeze_manifest(F.control_rows(1), shard_count=4)


def _item(run: F.FrozenRun, index: int = 0, fix: str | None = None, **changes: Any):  # type: ignore[no-untyped-def]
    body = run.bodies[index]
    chosen = fix or F.FIX_IDS_BY_VIEW[body.view][-1]
    return parse_measurement(measurement_record(run.fingerprint, body.shard, body.photo_sha256, chosen, **changes))


def test_records_bind_to_run_shard_body_and_view(run: F.FrozenRun) -> None:
    ledger = BodyLedger(run)
    assert ledger.record(_item(run)) == "accepted"
    body = run.bodies[1]
    other_view = F.FIX_IDS_BY_VIEW["side" if body.view == "front" else "front"][0]
    cases = [
        (measurement_record("c" * 64, body.shard, body.photo_sha256, F.FIX_IDS_BY_VIEW[body.view][0]), "changed_frozen_run"),
        (measurement_record(run.fingerprint, body.shard, "d" * 64, F.FIX_IDS_BY_VIEW[body.view][0]), "unknown_body"),
        (measurement_record(run.fingerprint, (body.shard + 1) % 4, body.photo_sha256, F.FIX_IDS_BY_VIEW[body.view][0]),
         "wrong_shard"),
        (measurement_record(run.fingerprint, body.shard, body.photo_sha256, other_view), "wrong_view"),
    ]
    for record, code in cases:
        with pytest.raises(LedgerError, match=code):
            ledger.record(parse_measurement(record))


def test_duplicates_never_inflate_passes(run: F.FrozenRun) -> None:
    ledger = BodyLedger(run)
    ledger.record(_item(run))
    assert ledger.record(_item(run)) == "duplicate_ignored"
    assert ledger.completion()["passed_jobs"] == 1
    with pytest.raises(LedgerError, match="conflicting_duplicate"):
        ledger.record(_item(run, reduction=0.05))


def test_refusals_stay_in_the_denominator(run: F.FrozenRun) -> None:
    ledger = BodyLedger(run)
    body = run.bodies[2]
    fix = F.FIX_IDS_BY_VIEW[body.view][0]
    ledger.record(parse_measurement({"format": "beljour-posture-body-measurement/1", "run": run.fingerprint,
                                     "shard": body.shard, "photo_sha256": body.photo_sha256, "fix": fix,
                                     "view": body.view, "status": "refused", "refusal": "engine_refused"}))
    ledger.record(_item(run, 3, reduction=0.01))
    done = ledger.completion()
    assert done == {"expected_jobs": run.job_count, "recorded_jobs": 2, "missing_jobs": run.job_count - 2,
                    "refused_jobs": 1, "passed_jobs": 0, "failed_jobs": 1, "duplicates_ignored": 0}


def test_shard_ledgers_merge_only_within_one_run(run: F.FrozenRun) -> None:
    left, right = BodyLedger(run), BodyLedger(run)
    left.record(_item(run, 0))
    right.record(_item(run, 1))
    right.record(_item(run, 0))
    merged = left.merge(right)
    assert merged.completion()["recorded_jobs"] == 2
    assert merged.completion()["duplicates_ignored"] == 1
    other = F.freeze_manifest(F.control_rows(1), shard_count=8)
    with pytest.raises(LedgerError, match="changed_frozen_run"):
        left.merge(BodyLedger(other))
    conflicting = BodyLedger(run)
    conflicting.record(_item(run, 0, reduction=0.02))
    with pytest.raises(LedgerError, match="conflicting_duplicate"):
        left.merge(conflicting)


def test_shard_receipts_hash_jobs_without_listing_them(run: F.FrozenRun) -> None:
    ledger = BodyLedger(run)
    ledger.record(_item(run, 0))
    receipts = ledger.shard_receipts()
    assert sum(item["expected_jobs"] for item in receipts) == run.job_count
    assert sum(item["recorded_jobs"] for item in receipts) == 1
    assert run.bodies[0].photo_sha256 not in json.dumps(receipts)
    again = BodyLedger(run)
    again.record(_item(run, 0))
    assert again.shard_receipts() == receipts
