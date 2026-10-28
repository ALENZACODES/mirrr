"""Golden diffs and approvals (REG-01..03, MON-03) and the retest matrix (RET-01, RET-02).

Author: John Khan.
"""

from __future__ import annotations

import random
from pathlib import Path
from typing import Any

import pytest
from conftest import synthetic_row

from lab.bqa_core import golden as gld
from lab.bqa_core.registry import load_registry
from lab.bqa_core.retest import (
    Ticket,
    covered_suites,
    load_matrix,
    parse_matrix,
    parse_tickets,
    ticket_problems,
)
from lab.bqa_core.stats import group_entry

APPROVAL = {"change_key": "MOD-01", "approver": "J-01", "reason": "Fixed sidecar field",
            "date": "2026-10-25"}


def rows(context: dict[str, object], status: str = "PASS", rate: float = 0.9) -> list[Any]:
    group = group_entry("mst_band", "5-6", 25, 30, minimum=0.7)
    return [synthetic_row(context, "MOD-01", status, measured={"rate": rate}, groups=[group]),
            synthetic_row(context, "MOD-02")]


def test_diff_finds_failures_fixes_numbers_and_shape(context: dict[str, object]) -> None:
    """REG-01: the golden diff names new failures, fixes and changed numbers."""
    golden = gld.make_golden(rows(context), "b1")
    assert gld.diff_golden(golden, rows(context)).changes() == []
    failed = gld.diff_golden(golden, rows(context, "FAIL", 0.5))
    assert failed.new_failures == ["MOD-01"]
    assert failed.changed_numbers == ["MOD-01/rate"]
    fixed = gld.diff_golden(gld.make_golden(rows(context, "FAIL"), "b0"), rows(context))
    assert fixed.fixed == ["MOD-01"]
    shape = gld.diff_golden(golden, rows(context)[:1] + [synthetic_row(context, "ARC-01", "ERROR")])
    assert "ARC-01" in shape.added and "ARC-01" in shape.new_failures
    assert "MOD-02" in shape.removed
    moved = gld.diff_golden(golden, rows(context, "UNPROVEN"))
    assert moved.status_changes == ["MOD-01"]
    assert gld.diff_golden(golden, rows(context, rate=0.9 + 1e-9)).changed_numbers == []


def test_accept_needs_approvals_and_keeps_permanent(context: dict[str, object],
                                                    tmp_path: Path) -> None:
    """REG-02: every accepted change has a named approver id, reason and date."""
    golden = gld.make_golden(rows(context), "b1")
    golden["permanent"] = {"MOD-01/D-0001": {"status": "PASS", "permanent": True}}
    candidate = rows(context, "UNPROVEN")
    with pytest.raises(PermissionError, match="MOD-01"):
        gld.accept(golden, candidate, "b2", [])
    with pytest.raises(PermissionError):
        gld.accept(golden, candidate, "b2", [dict(APPROVAL, approver="Alex")])
    accepted = gld.accept(golden, candidate, "b2", [APPROVAL])
    assert accepted["build"] == "b2"
    assert accepted["permanent"] == golden["permanent"]
    path = tmp_path / "golden.json"
    gld.save_golden(path, accepted)
    assert gld.load_golden(path)["entries"]["MOD-01"] == {"status": "UNPROVEN"}
    path.write_text('{"format": "x"}')
    with pytest.raises(ValueError):
        gld.load_golden(path)


def test_approval_problems() -> None:
    bad = {"change_key": "", "approver": "someone", "reason": "", "date": "soon"}
    assert len(gld.approval_problems([bad])) == 4
    assert gld.approval_problems([APPROVAL]) == []
    assert gld.unapproved(["MOD-01", "MOD-02"], [APPROVAL]) == ["MOD-02"]


def snap(run_id: str, when: str, status: str, build: str = "b1") -> gld.RunSnapshot:
    run = {"run_id": run_id, "build": build, "dataset_id": "D", "finished_utc": when,
           "snapshots": {"catalogue": "c", "trend": "t"}, "settings_sha256": "s"}
    row = {"check_key": "MOD-01", "status": status, "measured": {}, "groups": []}
    return gld.snapshot(run, [row])


def test_rerun_until_green_detection() -> None:
    """REG-03: FAIL then PASS with the same build, data and settings is flagged."""
    history = [snap("R-2", "2026-10-25T11", "PASS"), snap("R-1", "2026-10-25T10", "FAIL")]
    assert gld.rerun_until_green(history) == ["MOD-01@R-2"]
    changed = [snap("R-1", "2026-10-25T10", "FAIL"), snap("R-2", "2026-10-25T11", "PASS", "b2")]
    assert gld.rerun_until_green(changed) == []


def test_permanent_cases_from_defects() -> None:
    """MON-03: P0 and pattern P1 defects become permanent golden cases."""
    golden = gld.make_golden([], "b1")
    p0 = {"id": "D-0001", "severity": "P0", "check_key": "JRN-02", "pattern": ""}
    p1 = {"id": "D-0002", "severity": "P1", "check_key": "PRD-03", "pattern": "yes"}
    p1_single = {"id": "D-0003", "severity": "P1", "check_key": "PRD-03", "pattern": ""}
    assert gld.add_permanent(golden, p0) and gld.add_permanent(golden, p1)
    assert not gld.add_permanent(golden, p1_single)
    assert sorted(golden["permanent"]) == ["JRN-02/D-0001", "PRD-03/D-0002"]


def suite_rows(context: dict[str, object], suites: list[str]) -> list[dict[str, Any]]:
    return [{"suite": suite, "build": "b1", "status": "PASS"} for suite in suites] + [
        {"suite": "ZZZ", "build": "b1", "status": "PENDING_REAL_DATA"}]


def test_retest_tickets(context: dict[str, object]) -> None:
    """RET-01, RET-02: linked runs cover the matrix; model changes never at catalogue depth."""
    matrix = load_matrix()
    runs = {"R-cat": suite_rows(context, ["SWA", "PDQ", "LBL", "COL", "FND", "CON"]),
            "R-model": suite_rows(context, list(matrix.changes["model"]))}
    assert covered_suites(runs["R-cat"], "b1") == {"SWA", "PDQ", "LBL", "COL", "FND", "CON"}
    tickets = parse_tickets([
        {"ticket_id": "T-1", "change_type": "catalogue", "build": "b1", "run_id": "R-cat"},
        {"ticket_id": "T-2", "change_type": "model", "build": "b1", "run_id": "R-model"},
        {"ticket_id": "T-3", "change_type": "model", "build": "b1", "run_id": "R-cat"},
        {"ticket_id": "T-4", "change_type": "trend", "build": "b1", "run_id": "R-none"},
        {"ticket_id": "T-5", "change_type": "weather", "build": "b1", "run_id": "R-cat"},
    ])
    found = [ticket_problems(ticket, runs, matrix) for ticket in tickets]
    assert found[0] == [] and found[1] == []
    assert found[2] == ["T-3: run does not cover DET, LMK, SEG, SKN, LGT, VTO, PRD, OPA, RLS, "
                        "HAR, ROB, RB2, NEG, CAT, FAI, REG, MST"]
    depth_only = {"R-d": suite_rows(context, ["SWA", "PDQ"])}
    assert ticket_problems(Ticket("T-6", "model", "b1", "R-d"), depth_only, matrix) == [
        "T-6: model change tested at catalogue depth only (RET-02)"]
    assert found[3] == ["T-4: no linked run on file"]
    assert found[4] == ["T-5: unknown change type 'weather'"]


def test_matrix_validation() -> None:
    with pytest.raises(ValueError):
        parse_matrix({"format": "beljour-bqa-retest/1", "changes": {"model": ["NOPE"]},
                      "catalogue_depth_suites": []})
    with pytest.raises(ValueError):
        parse_matrix({"format": "other"})
    assert "model" in load_matrix().changes


def test_golden_properties_on_seeded_rows(context: dict[str, object]) -> None:
    """Property test: a run never differs from its own golden copy, and accepting a
    candidate with every change approved makes the next diff empty."""
    rng = random.Random(41)
    keys = load_registry().keys()
    statuses = ["PASS", "FAIL", "UNPROVEN", "ERROR", "PENDING_REAL_DATA"]
    for _ in range(40):
        picked = rng.sample(keys, 5)
        first = [synthetic_row(context, key, rng.choice(statuses),
                               measured={"rate": round(rng.random(), 3)},
                               reason_codes=["exception:X"]) for key in picked]
        second = [dict(row, status=rng.choice(statuses),
                       measured={"rate": round(rng.random(), 3)}) for row in first]
        golden = gld.make_golden(first, "b1")
        assert gld.diff_golden(golden, first).changes() == []
        diff = gld.diff_golden(golden, second)
        assert not set(diff.new_failures) & set(diff.fixed)
        approvals = [dict(APPROVAL, change_key=key) for key in diff.changes()]
        accepted = gld.accept(golden, second, "b2", approvals)
        assert gld.diff_golden(accepted, second).changes() == []
