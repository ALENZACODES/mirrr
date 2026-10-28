"""run_checks end to end: pending without records, statuses from synthetic records, runner.

The records written here are synthetic stand-ins built in tmp_path; they prove
the code paths and are never real results.
Author: John Khan.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

import pytest
from PIL import Image

from lab.bqa_core import sets as sts
from lab.bqa_core.checks import run_checks
from lab.bqa_core.golden import make_golden, save_golden
from lab.bqa_core.registry import load_registry
from lab.bqa_core.replay import stamp_image
from lab.bqa_core.results import result_problems
from lab.bqa_core.runner import run_all

FAST = {"arc01_replays": 3}


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def synthetic_inputs(root: Path, build: str) -> Path:
    """A complete synthetic inputs folder in which every record-driven check can pass."""
    reg = load_registry()
    defect = {"id": "D-0001", "type": "wrong_face", "severity": "P0", "build": build,
              "dataset_id": "GOLD-v1", "check_key": "JRN-02",
              "affected_groups": "mst_band=9-10", "filed": "2026-10-19T09:00:00Z",
              "first_response": "2026-10-19T11:00:00Z", "status": "closed", "reviewed": "yes",
              "pattern": "", "post_launch": "yes", "resolution": "fixed", "attachments": ""}
    write_csv(root / "defects.csv", [defect])
    write_csv(root / "manual_failures.csv", [{"id": "M-1", "check_key": "PRD-03",
                                              "local_case": ""}])
    suites = {s: {"owner_role": "lead", "dataset_version": "GOLD-v1",
                  "gate": reg.by_suite(s)[0].key} for s in reg.suites()}
    (root / "plan.json").write_text(json.dumps({"format": "beljour-bqa-plan/1",
                                                "suites": suites}))
    (root / "release_candidates.json").write_text(json.dumps({"builds": [build]}))
    golden = make_golden([], "b0")
    golden["permanent"] = {"JRN-02/D-0001": {"status": "PASS", "permanent": True}}
    save_golden(root / "golden" / "golden.json", golden)
    (root / "golden" / "approvals.json").write_text(json.dumps({"approvals": [
        {"change_key": "MOD-01", "approver": "J-01", "reason": "Accepted new probe",
         "date": "2026-10-24"}]}))
    write_csv(root / "flaky.csv", [{"test_id": "t1", "owner": "X-01",
                                    "first_flaky": "2026-10-01", "resolved": ""}])
    (root / "changes.json").write_text(json.dumps({"tickets": []}))
    index = [{"check_key": "FND-01", "evidence_id": f"EV-{i}", "record_type": kind,
              "file_id": f"F-{i}", "date": "2026-10-20"}
             for i, kind in enumerate(("case", "swatch", "judgement", "defect"))]
    write_csv(root / "evidence_index.csv", index)
    write_csv(root / "quotes.csv", [{"quote": "6", "check_key": "MOD-01"}])
    write_csv(root / "records.csv", [{"record_id": "SKU-1", "ingredients": "a",
                                      "allergens": "none", "validated_tone_range": "1-10",
                                      "age_restriction": "none", "health_screen": "passed"}])
    write_csv(root / "references.csv", [{"name": "Std A", "version": "1",
                                         "access_date": "2026-10-01"}])
    write_csv(root / "checklist.csv", [{"line_id": "L1", "check_key": "FND-01",
                                        "ticked": "yes", "evidence_id": "EV-0",
                                        "limitation": "", "run_date": "2026-10-24"}])
    (root / "reports").mkdir()
    (root / "reports" / "study.md").write_text(
        "# Study\n## Result\nTop-1 acceptable 81.0%.\nGround truth: blind applied judging."
        "\n[ref: Std A]\n")
    for kind in sts.KINDS:
        sts.write_version(root / "sets", kind, "v1", {"c1.npz": b"1"}, changelog="+ c1.npz")
    (root / "outputs").mkdir()
    (root / "production").mkdir()
    (root / "production" / "app.js").write_text("const ok = 1;\n")
    return root


@pytest.fixture
def full_context(context: dict[str, object], tmp_path: Path) -> dict[str, object]:
    inputs = synthetic_inputs(tmp_path / "inputs", str(context["build"]))
    return dict(context, inputs_dir=str(inputs), thresholds=FAST)


def by_key(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {str(row["check_key"]): row for row in rows}


def test_without_records_every_record_check_is_pending(context: dict[str, object]) -> None:
    """Honesty rule: no records means PENDING_REAL_DATA, never a made-up pass."""
    rows = by_key(run_checks(dict(context, thresholds=FAST)))
    assert sorted(rows) == sorted(c.key for c in load_registry().by_owner("C17"))
    assert all(result_problems(row) == [] for row in rows.values())
    assert rows["USE-01"]["status"] == "PASS"
    assert rows["MOD-01"]["status"] == "UNPROVEN"
    assert rows["MOD-01"]["reason_codes"] == ["M1:no_public_export", "M5:no_public_export",
                                              "M6:no_engine"]
    for key in ("MOD-02", "MOD-03", "ARC-01"):
        assert rows[key]["status"] == "PASS" and rows[key]["triage_only"] is True
    pending = [k for k, r in rows.items() if r["status"] == "PENDING_REAL_DATA"]
    assert len(pending) == 32
    assert rows["DEF-02"]["reason_codes"] == ["needs:defects.csv"]


def test_synthetic_records_drive_statuses(full_context: dict[str, object]) -> None:
    rows = by_key(run_checks(full_context))
    assert all(result_problems(row) == [] for row in rows.values())
    passing = {"SUM-03", "DEF-01", "DEF-02", "DEF-03", "BUG-03", "MAN-03", "PLN-01", "PLN-02",
               "PLN-03", "REG-01", "REG-02", "MON-03", "TPL-01", "TPL-03", "MST-01", "MST-02",
               "MST-03", "GT-03", "GLO-01", "REF-01", "DSN-01", "SPL-02", "SPL-03", "AUTO-03",
               "ARC-03"}
    wrong = {k: rows[k]["status"] for k in passing if rows[k]["status"] != "PASS"}
    assert wrong == {}
    assert rows["BUG-01"]["status"] == "UNPROVEN"
    assert rows["RET-01"]["status"] == "UNPROVEN"
    assert rows["ARC-02"]["status"] == "UNPROVEN"
    assert rows["TPL-02"]["status"] == "FAIL"
    run_dir = Path(str(full_context["work_dir"])) / str(full_context["run_id"])
    assert (run_dir / "release_report.md").is_file()
    assert (run_dir / "golden_diff.json").is_file()


def test_failures_are_reported(full_context: dict[str, object]) -> None:
    inputs = Path(str(full_context["inputs_dir"]))
    rows = list(csv.DictReader((inputs / "defects.csv").open()))
    rows[0].update(status="open", reviewed="no", type="")
    write_csv(inputs / "defects.csv", rows)
    (inputs / "production" / "debug.js").write_text("DEBUG_OVERLAY\n")
    picture = inputs / "outputs" / "o.png"
    Image.new("RGB", (8, 8)).save(picture)
    stamp_image(picture, inputs / "outputs" / "stamped.png", build="1", catalogue="2",
                trend="3")
    result = by_key(run_checks(full_context))
    for key in ("SUM-03", "DEF-01", "DEF-02", "ARC-03", "ARC-02"):
        assert result[key]["status"] == "FAIL", key
    assert result["ARC-02"]["measured"]["stamped_rate"] == 0.5


def test_bad_context_gives_error_rows(context: dict[str, object]) -> None:
    rows = run_checks(dict(context, work_dir=str(Path(__file__).parent)))
    assert {row["status"] for row in rows} == {"ERROR"}
    assert rows[0]["reason_codes"] == ["exception:InsideRepoError"]
    rows = run_checks(dict(context, thresholds=[1, 2]))
    assert rows[0]["reason_codes"] == ["exception:ValueError"]


def test_runner_runs_core_last_and_core_audits_neighbours(tmp_path: Path,
                                                          context: dict[str, object]) -> None:
    """Through the runner, C17 reads the other packages' rows from the run folder."""
    fake = tmp_path / "fake" / "lab" / "bqa_fakeshade"
    fake.mkdir(parents=True)
    (fake / "__init__.py").write_text("")
    (fake / "checks.py").write_text(
        "from lab.bqa_core.registry import load_registry\n"
        "from lab.bqa_core.results import make_row\n\n\n"
        "def run_checks(context):\n"
        "    return [make_row(context, c, 'PASS', n=30, evidence_kind='automated',"
        " triage_only=c.kind != 'A') for c in load_registry().by_owner('C18')]\n")
    outcome = run_all(dict(context, thresholds=FAST), search_roots=[tmp_path / "fake",
                                                                   Path(__file__).parents[3]],
                      owners={"bqa_fakeshade": "C18", "bqa_core": "C17"},
                      packages=["bqa_fakeshade", "bqa_core"], include_missing=False)
    assert [p["outcome"] for p in outcome.run["packages"]] == ["ok", "ok"]
    core = by_key(next(p for p in outcome.packages if p.name == "bqa_core").rows)
    assert core["AUT-01"]["status"] == "PASS"
    assert core["AUT-03"]["status"] == "PASS"
    assert core["AUTO-02"]["status"] == "PASS"
    assert (outcome.run_dir / "groups.md").is_file()
