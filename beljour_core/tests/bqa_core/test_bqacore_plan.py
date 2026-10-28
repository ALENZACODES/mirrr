"""Suite plan (PLN-01..03), scorecards and automated reports (AUTO-01..03) on synthetic rows.

Author: John Khan.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

import pytest
from conftest import synthetic_row

from lab.bqa_core import sets as sts
from lab.bqa_core.plan import parse_plan, plan_problems, release_report, stale_marks
from lab.bqa_core.registry import load_registry
from lab.bqa_core.reports import (
    dashboard_markdown,
    flaky_problems,
    group_report,
    latest_run,
    parse_flaky,
    runs_on_file,
    working_days_between,
)
from lab.bqa_core.results import write_jsonl
from lab.bqa_core.scorecard import build_scorecard, scorecard_markdown
from lab.bqa_core.stats import group_entry


def full_plan(**overrides: Any) -> dict[str, Any]:
    reg = load_registry()
    suites = {suite: {"owner_role": f"{suite.lower()} lead", "dataset_version": "GOLD-v1",
                      "gate": reg.by_suite(suite)[0].key} for suite in reg.suites()}
    suites.update(overrides)
    return {"format": "beljour-bqa-plan/1", "suites": suites}


def test_complete_plan_has_no_problems() -> None:
    """PLN-01: a suite plan with owner role, dataset version and gate for every suite."""
    assert plan_problems(parse_plan(full_plan())) == []


def test_plan_problems_are_specific() -> None:
    raw = full_plan(FND={"owner_role": "", "dataset_version": "../gold", "gate": "ZZZ-01"},
                    NOPE={"owner_role": "x", "dataset_version": "D", "gate": "FND-01"})
    del raw["suites"]["SUM"]
    found = plan_problems(parse_plan(raw))
    assert "SUM: not in the plan" in found
    assert "FND: owner_role missing" in found
    assert "FND: dataset_version must be an opaque id" in found
    assert "FND: gate 'ZZZ-01' is not a report check key" in found
    assert "NOPE: not a suite of the report" in found
    with pytest.raises(ValueError):
        parse_plan({"format": "other", "suites": {}})


def test_scorecard_refuses_pass_on_older_build(context: dict[str, object]) -> None:
    """PLN-03: rows from another build never make a suite pass."""
    rc = str(context["build"])
    keys = [c.key for c in load_registry().by_suite("MOD")]
    rows = [synthetic_row(context, key) for key in keys]
    assert build_scorecard(rows, rc).suites["MOD"].outcome == "pass"
    rows[0] = synthetic_row(context, keys[0], build="0" * 40)
    card = build_scorecard(rows, rc)
    assert card.suites["MOD"].outcome == "pending"
    assert card.suites["MOD"].stale == [keys[0]]
    assert card.stale_rows() == [keys[0]]
    rows.append(synthetic_row(context, keys[0]))
    assert build_scorecard(rows, rc).suites["MOD"].outcome == "pass"
    with pytest.raises(ValueError):
        build_scorecard(rows, "")


def test_scorecard_fail_pending_and_triage(context: dict[str, object]) -> None:
    rc = str(context["build"])
    rows = [synthetic_row(context, "MOD-01", "FAIL"), synthetic_row(context, "ARC-01", "ERROR"),
            synthetic_row(context, "FND-01", evidence_kind="automated", triage_only=True)]
    card = build_scorecard(rows, rc)
    assert card.suites["MOD"].outcome == "fail"
    assert card.suites["ARC"].outcome == "fail"
    assert card.checks["FND-01"].outcome == "pending"
    assert card.suites["FND"].counts == {"pass": 0, "fail": 0, "pending": 3}
    text = scorecard_markdown(card)
    assert "| MOD | fail |" in text and "MOD-01 (FAIL)" in text


def test_stale_marks_and_release_report(context: dict[str, object]) -> None:
    """PLN-02: a release report from the plan with pass / fail per suite."""
    raw = full_plan()
    raw["suites"]["MOD"]["marked"] = {"status": "pass", "build": "old"}
    plans = parse_plan(raw)
    rc = str(context["build"])
    assert stale_marks(plans, rc) == ["MOD"]
    card = build_scorecard([synthetic_row(context, "MOD-01")], rc)
    report = release_report(plans, card)
    assert "| MOD | mod lead | GOLD-v1 | MOD-01 | pending | 1 | 0 | 2 |" in report
    assert "refused): MOD" in report
    assert "NOT IN PLAN" in release_report({}, card)


def test_group_report_worst_first(context: dict[str, object]) -> None:
    """AUTO-02: the per-group report is assembled from rows with no manual step."""
    groups = [group_entry("mst_band", "1-2", 29, 30, minimum=0.7),
              group_entry("mst_band", "9-10", 18, 30, minimum=0.7)]
    rows = [synthetic_row(context, "MOD-01", groups=groups)]
    text, data = group_report(rows, build="abc")
    assert [g["value"] for g in data["groups"]] == ["9-10", "1-2"]
    assert text.index("| 9-10 |") < text.index("| 1-2 |")
    assert "(no group results" in group_report([], build="abc")[0]


def write_run(work: Path, run_id: str, build: str, outcome: str,
              rows: list[dict[str, object]], finished: str = "2026-10-25T10:00:00Z") -> Path:
    folder = work / run_id
    write_jsonl(folder / "results" / "bqa_core.jsonl", rows)
    run = {"format": "beljour-bqa-run/1", "run_id": run_id, "build": build, "dataset_id": "D",
           "snapshots": {"catalogue": "c", "trend": "t"}, "started_utc": "2026-10-25T09:00:00Z",
           "finished_utc": finished, "settings_sha256": "1" * 64,
           "packages": [{"name": "bqa_core", "outcome": outcome, "rows": len(rows),
                         "seconds": 1.0}]}
    (folder / "run.json").write_text(json.dumps(run))
    return folder


def test_runs_on_file_and_dashboard(tmp_path: Path, context: dict[str, object]) -> None:
    """AUTO-01: complete runs on file per release candidate; dashboard of the latest run."""
    rows = [synthetic_row(context, "MOD-01", build="b1", groups=[
        group_entry("light", "dim_evening", 10, 30, minimum=0.8)])]
    write_run(tmp_path, "R-1", "b1", "ok", rows, "2026-10-25T10:00:00Z")
    write_run(tmp_path, "R-2", "b2", "crashed", [], "2026-10-25T11:00:00Z")
    found = runs_on_file(tmp_path, ["b1", "b2", "b3"], ["bqa_core"])
    assert [(f.build, f.complete) for f in found] == [("b1", True), ("b2", False),
                                                       ("b3", False)]
    assert found[1].reason == "packages not ok: bqa_core"
    assert found[2].reason == "no run on file"
    latest = latest_run(tmp_path)
    assert latest is not None and latest.name == "R-2"
    text = dashboard_markdown(tmp_path / "R-1")
    assert "MOD-01 light=dim_evening" in text and "| bqa_core | ok |" in text
    assert latest_run(tmp_path / "empty") is None


def test_flaky_register_working_days() -> None:
    """AUTO-03: unowned flaky tests older than 5 working days are flagged."""
    assert working_days_between(date(2026, 10, 23), date(2026, 10, 26)) == 1
    assert working_days_between(date(2026, 10, 26), date(2026, 10, 26)) == 0
    entries = parse_flaky([
        {"test_id": "t1", "owner": "", "first_flaky": "2026-10-15", "resolved": ""},
        {"test_id": "t2", "owner": "X-01", "first_flaky": "2026-10-01", "resolved": ""},
        {"test_id": "t3", "owner": "", "first_flaky": "2026-10-21", "resolved": ""},
        {"test_id": "t4", "owner": "", "first_flaky": "2026-09-01", "resolved": "yes"},
        {"test_id": "t5", "owner": "", "first_flaky": "", "resolved": ""},
    ])
    count, problems = flaky_problems(entries, date(2026, 10, 26))
    assert count == 4
    assert problems == ["t1: flaky and unowned for more than 5 working days",
                        "t5: first-flaky date missing"]


def test_plan_dataset_versions_must_exist_in_set_folders(tmp_path: Path) -> None:
    """PLN-01 with set folders: a plan may only name dataset versions that exist."""
    sts.write_version(tmp_path, "gold", "v1", {"c.npz": b"1"})
    known = sts.all_dataset_versions(tmp_path)
    assert known == {"GOLD-v1"}
    raw = full_plan(FND={"owner_role": "shade lead", "dataset_version": "GOLD-v9",
                         "gate": "FND-01"})
    found = plan_problems(parse_plan(raw), known_versions=known)
    assert "FND: dataset version GOLD-v9 has no set folder" in found
    assert all("GOLD-v1" not in problem for problem in found)
