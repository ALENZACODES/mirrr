"""Record templates and the inputs pre-flight check; templates must keep checks pending.

Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.bqa_core.checks import run_checks
from lab.bqa_core.cli import main
from lab.bqa_core.paths import REPO_ROOT, InsideRepoError
from lab.bqa_core.templates import input_problems, load_templates, write_templates


def test_template_table_schema() -> None:
    table = load_templates()
    assert "defects.csv" in table.csv_columns and "plan.json" in table.json_skeletons
    assert set(table.folders) >= {"reports", "sets", "outputs", "production"}
    assert all(table.keys[name] for name in table.keys)


def test_write_is_idempotent_and_refuses_repo(tmp_path: Path) -> None:
    written = write_templates(tmp_path / "inputs")
    assert "defects.csv" in written and "README.md" in written
    assert (tmp_path / "inputs" / "golden" / "approvals.json").is_file()
    assert write_templates(tmp_path / "inputs") == []
    header = (tmp_path / "inputs" / "defects.csv").read_text().strip()
    assert header.startswith("id,type,severity")
    assert input_problems(tmp_path / "inputs") == []
    with pytest.raises(InsideRepoError):
        write_templates(REPO_ROOT / "inputs-here")


def test_empty_templates_never_produce_a_pass(tmp_path: Path,
                                              context: dict[str, object]) -> None:
    """Honesty: header-only templates leave record checks without evidence."""
    inputs = tmp_path / "inputs"
    write_templates(inputs)
    rows = {r["check_key"]: r for r in run_checks(dict(context, inputs_dir=str(inputs),
                                                       thresholds={"arc01_replays": 2}))}
    for key in ("SUM-03", "DEF-01", "DEF-02", "MAN-03", "TPL-03", "MST-02", "RET-02"):
        assert rows[key]["status"] in ("UNPROVEN", "PENDING_REAL_DATA"), key
    for key in ("PLN-01", "DSN-01"):
        assert rows[key]["status"] == "FAIL", key


def test_preflight_finds_broken_records(tmp_path: Path,
                                        capsys: pytest.CaptureFixture[str]) -> None:
    inputs = tmp_path / "inputs"
    assert main(["inputs", "--write", str(inputs)]) == 0
    (inputs / "defects.csv").write_text("id,type\n")
    (inputs / "plan.json").write_text("{not json")
    (inputs / "changes.json").write_text(json.dumps({"other": []}))
    assert main(["inputs", "--check", str(inputs)]) == 1
    out = capsys.readouterr().out
    assert "defects.csv: missing columns severity" in out
    assert "plan.json: not valid JSON" in out
    assert "changes.json: missing top-level tickets" in out
