"""run_checks() contract tests for the 29 C18 check keys.

Pass definition: one valid row per key in checks.json order; with no inputs
every people, product or data check is PENDING_REAL_DATA or NOT_APPLICABLE and
none is PASS; a bad context or a broken handler gives ERROR rows instead of an
exception; synthetic records flip FND-01 but stay triage only, while records
marked real are not triage; the CLI writes the run folder. Drawn faces and
synthetic records only. Author: John Khan.
"""
from __future__ import annotations

import json
from collections.abc import Iterator
from pathlib import Path

import pytest
from bqashade_synthetic import BANDS, inputs_folder, trial_rows, write_trials

from lab.bqa_shade import bands, checks, handlers, stats, validate_row
from lab.bqa_shade.__main__ import main
from lab.bqa_shade.contract import Outcome
from lab.bqa_shade.stability import Plan

OWNED = ("LBL-01", "LBL-03", "SKN-01", "SKN-02", "SKN-03", "COL-01", "COL-02", "COL-03",
         "LGT-01", "LGT-02", "LGT-03", "FND-01", "FND-02", "FND-03", "CON-01@27", "CON-02@27",
         "CON-03@27", "VTO-02", "RB2-01", "CAT-B1", "CAT-B2", "CAT-B3", "SWA-01", "SWA-02",
         "SWA-03", "PDQ-01", "PDQ-02", "PDQ-03", "WE1-01")
EVIDENCE_NEEDED = {"LBL-01", "SKN-01", "SKN-02", "COL-02", "COL-03", "LGT-01", "LGT-03",
                   "FND-01", "FND-02", "FND-03", "CON-01@27", "CON-02@27", "VTO-02", "RB2-01",
                   "CAT-B1", "SWA-01", "SWA-02", "SWA-03", "PDQ-03", "WE1-01"}


def tiny_plan(seed: int = 18) -> Plan:
    cells = tuple(c for c in bands.skin_grid() if (c[0], c[1]) in {(5, "warm"), (10, "warm")})
    return Plan(cells, repeats=1, seed=seed, width=160, height=200)


@pytest.fixture(scope="module")
def tiny() -> Iterator[None]:
    with pytest.MonkeyPatch.context() as patch:
        patch.setattr(Plan, "quick", staticmethod(tiny_plan))
        yield


@pytest.fixture(scope="module")
def bare_rows(tiny: None, tmp_path_factory: pytest.TempPathFactory) -> list[dict[str, object]]:
    work = tmp_path_factory.mktemp("work")
    return checks.run_checks({"run_id": "R-BARE", "quick": True, "work_dir": str(work)})


def test_specs_match_the_owned_keys() -> None:
    assert tuple(s.key for s in checks.check_specs()) == OWNED
    assert set(checks.HANDLERS) == set(OWNED)
    for key, handler in checks.HANDLERS.items():
        assert key in (handler.__doc__ or ""), key


def test_one_valid_row_per_key(bare_rows: list[dict[str, object]]) -> None:
    assert tuple(r["check_key"] for r in bare_rows) == OWNED
    for row in bare_rows:
        assert validate_row(row) == [], row["check_key"]
        assert row["run_id"] == "R-BARE"


def test_no_evidence_means_no_pass(bare_rows: list[dict[str, object]]) -> None:
    by_key = {str(r["check_key"]): r for r in bare_rows}
    for key in EVIDENCE_NEEDED:
        assert by_key[key]["status"] in (stats.PENDING, stats.NOT_APPLICABLE), key
    for row in bare_rows:
        assert row["status"] != stats.ERROR, row["check_key"]
        if row["status"] == stats.PASS:
            assert row["triage_only"] is True
    triage = by_key["SKN-01"]
    assert triage["triage_only"] is True and triage["measured"]


def test_bad_context_gives_error_rows() -> None:
    rows = checks.run_checks({"run_id": "R-X", "seed": "seven"})
    assert len(rows) == len(OWNED)
    assert {r["status"] for r in rows} == {stats.ERROR}
    assert rows[0]["reason_codes"] == ["exception:ValueError"]
    assert checks.run_checks({})[0]["run_id"] == "invalid"


def test_broken_handler_is_contained(tiny: None, monkeypatch: pytest.MonkeyPatch) -> None:
    def broken(run: handlers.Run) -> Outcome:
        raise KeyError("boom")

    monkeypatch.setitem(checks.HANDLERS, "PDQ-03", broken)
    rows = checks.run_checks({"run_id": "R-B", "quick": True}, ("PDQ-03", "COL-02"))
    by_key = {str(r["check_key"]): r for r in rows}
    assert by_key["PDQ-03"]["status"] == stats.ERROR
    assert by_key["PDQ-03"]["reason_codes"] == ["exception:KeyError"]
    assert by_key["COL-02"]["status"] == stats.PENDING


def trials_folder(root: Path, provenance: str) -> Path:
    folder = inputs_folder(root, provenance)
    rows = trial_rows({band: 0.97 for band in BANDS}, 120, rate30={b: 0.97 for b in BANDS},
                      top3_rate=1.0)
    write_trials(folder, rows)
    return root


@pytest.mark.parametrize(("provenance", "triage"), [("synthetic", True), ("real", False)])
def test_records_flip_gates(tiny: None, tmp_path: Path, provenance: str, triage: bool) -> None:
    root = trials_folder(tmp_path / "in", provenance)
    rows = checks.run_checks({"run_id": "R-IN", "quick": True, "inputs_dir": str(root)},
                             ("FND-01", "FND-02", "WE1-01", "COL-03"))
    by_key = {str(r["check_key"]): r for r in rows}
    assert by_key["FND-01"]["status"] == stats.PASS
    assert by_key["FND-01"]["triage_only"] is triage
    reasons = by_key["FND-01"]["reason_codes"]
    assert isinstance(reasons, list)
    assert ("records_not_marked_real" in reasons) is triage
    assert by_key["FND-02"]["status"] == stats.PASS
    assert by_key["WE1-01"]["status"] == stats.UNPROVEN
    assert by_key["COL-03"]["status"] == stats.PENDING


def test_write_results(tmp_path: Path) -> None:
    rows = checks.run_checks({"run_id": "R-W"}, ("PDQ-03",))
    path = checks.write_results(rows, tmp_path, "R-W")
    assert path == tmp_path / "R-W" / "results" / "bqa_shade.jsonl"
    lines = path.read_text(encoding="utf-8").splitlines()
    assert [json.loads(line)["check_key"] for line in lines] == ["PDQ-03"]


def test_cli_run_lint_and_probe(tiny: None, tmp_path: Path,
                                capsys: pytest.CaptureFixture[str]) -> None:
    work = tmp_path / "work"
    code = main(["run", "--run-id", "R-CLI", "--work-dir", str(work), "--quick",
                 "--keys", "COL-01,PDQ-03", "--now-utc", "2026-10-25T00:00:00Z"])
    assert code == 0
    run = json.loads((work / "R-CLI" / "run.json").read_text(encoding="utf-8"))
    assert run["format"] == "beljour-bqa-run/1" and run["packages"] == ["bqa_shade"]
    assert (work / "R-CLI" / "reports" / "shade-card.md").is_file()
    rows = (work / "R-CLI" / "results" / "bqa_shade.jsonl").read_text(encoding="utf-8")
    assert '"COL-01"' in rows and '"PDQ-03"' in rows
    report = tmp_path / "r.md"
    report.write_text("The shade looks close.\n", encoding="utf-8")
    assert main(["lint", str(report)]) == 1
    assert main(["probe", "--pairs", "200"]) == 0
    assert "ciede2000" in capsys.readouterr().out
