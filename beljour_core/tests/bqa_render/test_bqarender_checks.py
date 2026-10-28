"""run_checks contract: never raises, one valid row per key, quick full run, CLI.

Author: John Khan.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.bqa_render import checks
from lab.bqa_render.__main__ import main
from lab.bqa_render.rows import validate_row


def quick(tmp_path: Path, **extra: object) -> dict[str, object]:
    return {"run_id": "synthetic-run", "seed": 1, "work_dir": str(tmp_path / "work"),
            "thresholds": {"bqa_render_limit": 1}, **extra}


def test_bad_context_gives_error_rows_not_an_exception() -> None:
    rows = checks.run_checks({"run_id": "bad id with spaces"}, ["PRD-03", "VID-03"])
    assert [r["status"] for r in rows] == ["ERROR", "ERROR"]
    assert rows[0]["reason_codes"] == ["exception:ValueError"]
    inside = checks.run_checks({"run_id": "r", "work_dir": "."}, ["VID-03"])
    assert inside[0]["status"] == "ERROR"


def test_internal_errors_become_rows(monkeypatch: pytest.MonkeyPatch) -> None:
    def boom(bench: object) -> dict[str, object]:
        raise ZeroDivisionError("synthetic")

    monkeypatch.setitem(checks.CHECKS, "PRD-03", boom)
    rows = checks.run_checks({"run_id": "r"}, ["PRD-03"])
    assert rows[0]["status"] == "ERROR"
    assert rows[0]["reason_codes"] == ["exception:ZeroDivisionError"]


def test_quick_full_run_returns_one_valid_row_per_key(tmp_path: Path) -> None:
    rows = checks.run_checks(quick(tmp_path))
    assert [r["check_key"] for r in rows] == list(checks.CHECKS)
    for row in rows:
        validate_row(row)
        assert row["status"] != "ERROR", row
        assert "work" not in json.dumps(row)
    by_key = {r["check_key"]: r for r in rows}
    for key in ("PAL-01", "WE2-03", "OPA-01", "RLS-01"):
        assert by_key[key]["status"] == "PENDING_REAL_DATA"
    assert by_key["CAT-A3"]["status"] in ("PASS", "FAIL")
    log = tmp_path / "work" / "synthetic-run" / "logs" / "bqa_render-failures.jsonl"
    assert log.is_file()


def test_cli_writes_rows_outside_the_repo(tmp_path: Path,
                                          capsys: pytest.CaptureFixture[str]) -> None:
    code = main(["--run-id", "cli-1", "--work-dir", str(tmp_path), "--limit", "1",
                 "--keys", "VID-03", "LMK-02", "PAL-01"])
    assert code == 0
    printed = capsys.readouterr().out
    assert "VID-03" in printed and "PENDING_REAL_DATA" in printed
    path = tmp_path / "cli-1" / "results" / "bqa_render.jsonl"
    lines = path.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 3 and json.loads(lines[0])["format"] == "beljour-bqa-result/1"
