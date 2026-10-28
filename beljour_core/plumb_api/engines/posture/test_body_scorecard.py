"""R28E group-complete scorecard: 308 rows, honest NOT_RUN/UNPROVEN/NUMERIC_FAIL.

Uses the artificial balanced control only; CHECKS_OK there is bookkeeping, not quality.
Author: John Khan.
"""
from __future__ import annotations

import json
from collections import Counter
from collections.abc import Callable
from typing import Any

import pytest

from . import body_freeze as F
from .body_ledger import BodyLedger
from .body_measurement import FACE_FIX_IDS, measurement_record, parse_measurement
from .body_scorecard import REGISTERED_ROWS, ROWS_PER_FIX, build_scorecard


def _fill(run: F.FrozenRun, change: Callable[[F.FrozenBody, str], dict[str, Any] | None] = lambda b, f: {}) -> BodyLedger:
    """Record one measurement per job; `change` returns overrides or None to skip a job."""
    ledger = BodyLedger(run)
    for body in run.bodies:
        for fix in F.FIX_IDS_BY_VIEW[body.view]:
            overrides = change(body, fix)
            if overrides is None:
                continue
            similarity = {"identity_similarity": 0.99} if fix in FACE_FIX_IDS else {}
            ledger.record(parse_measurement(measurement_record(
                run.fingerprint, body.shard, body.photo_sha256, fix, **{**similarity, **overrides})))
    return ledger


@pytest.fixture(scope="module")
def full_run() -> F.FrozenRun:
    return F.freeze_manifest(F.control_rows(), shard_count=8)


def test_308_rows_44_per_fix_even_with_no_results(full_run: F.FrozenRun) -> None:
    card = build_scorecard(BodyLedger(full_run))
    assert (REGISTERED_ROWS, ROWS_PER_FIX) == (308, 44)
    assert len(card["rows"]) == 308
    assert Counter(row["fix"] for row in card["rows"]) == {fix: 44 for fix in card["fixes"]}
    assert card["fixes"] == ["J10", "J11", "J12", "J13", "J14", "J15", "J16"]
    assert card["numeric_status"] == "NOT_RUN" and card["release_status"] == "NOT_RUN"


def test_balanced_control_checks_ok_but_release_stays_not_run(full_run: F.FrozenRun) -> None:
    card = build_scorecard(_fill(full_run))
    assert card["row_status_counts"] == {"CHECKS_OK": 308}
    assert card["numeric_status"] == "CHECKS_OK"
    assert card["release_status"] == "NOT_RUN"
    assert card["completion"]["missing_jobs"] == 0
    text = json.dumps(card)
    assert not any(body.photo_sha256 in text for body in full_run.bodies[:50])


def test_one_failing_intersection_fails_it_and_its_parents(full_run: F.FrozenRun) -> None:
    def fail_some(body: F.FrozenBody, fix: str) -> dict[str, Any]:
        bad = body.view == "side" and body.body_size == "large" and body.monk == "7" and fix == "J14"
        return {"reduction": 0.01} if bad and int(body.photo_sha256[:2], 16) % 2 == 0 else {}
    card = build_scorecard(_fill(full_run, fail_some))
    failed = {(row["slice"], row["group"]) for row in card["rows"] if row["status"] == "NUMERIC_FAIL"}
    assert ("body_size_monk", "large/7") in failed
    assert all(row["fix"] == "J14" for row in card["rows"] if row["status"] == "NUMERIC_FAIL")
    assert card["numeric_status"] == "NUMERIC_FAIL"


def test_a_single_missing_result_is_incomplete_not_failure(full_run: F.FrozenRun) -> None:
    target = full_run.bodies[0]
    card = build_scorecard(_fill(full_run, lambda b, f: None if b is target and f == F.FIX_IDS_BY_VIEW[b.view][0] else {}))
    statuses = Counter(row["status"] for row in card["rows"])
    assert statuses["INCOMPLETE"] >= 4 and "NUMERIC_FAIL" not in statuses
    assert card["numeric_status"] == "UNPROVEN"


def test_refusals_count_against_the_group_rate() -> None:
    run = F.freeze_manifest(F.control_rows(), shard_count=2)
    ledger = _fill(run, lambda b, f: None if b.monk == "3" and b.view == "front" and f == "J11" else {})
    for body in run.bodies:
        if body.monk == "3" and body.view == "front":
            ledger.record(parse_measurement({"format": "beljour-posture-body-measurement/1", "run": run.fingerprint,
                                             "shard": body.shard, "photo_sha256": body.photo_sha256, "fix": "J11",
                                             "view": "front", "status": "refused", "refusal": "engine_refused"}))
    card = build_scorecard(ledger)
    row = next(r for r in card["rows"] if r["fix"] == "J11" and r["slice"] == "monk" and r["group"] == "3")
    assert (row["refused_jobs"], row["passed_jobs"], row["status"]) == (60, 0, "NUMERIC_FAIL")


def test_thin_sets_are_underpowered_and_never_whole_set_evidence() -> None:
    run = F.freeze_manifest(F.control_rows(5), shard_count=2)
    card = build_scorecard(_fill(run))
    statuses = Counter(row["status"] for row in card["rows"])
    # 5 per intersection: size x tone rows hold 5 bodies and tone rows 15, both under 20.
    assert statuses["UNDERPOWERED"] == 7 * (30 + 10)
    powered = [row for row in card["rows"] if row["slice"] in ("view", "body_size")]
    assert powered and all(row["status"] == "CHECKS_OK" for row in powered)
    assert card["set_status"] == "UNPROVEN"
    assert card["numeric_status"] == "UNPROVEN"


def test_absent_view_groups_stay_not_run() -> None:
    run = F.freeze_manifest(F.control_rows(20, views=("front",)), shard_count=2)
    card = build_scorecard(_fill(run))
    side = [row for row in card["rows"] if row["view"] == "side"]
    assert side and all(row["status"] == "NOT_RUN" and row["bodies"] == 0 for row in side)
    assert card["numeric_status"] == "UNPROVEN"
