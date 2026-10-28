"""R28E offline body command: freeze, report, bounded inputs and safe outputs.

Author: John Khan.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, cast

import pytest

from . import body_command as C
from . import body_freeze as F
from .body_measurement import measurement_record


def _manifest(tmp_path: Path, rows: list[dict[str, Any]] | None = None) -> Path:
    path = tmp_path / "manifest.json"
    path.write_text(json.dumps({"format": "beljour-posture-body-manifest/1", "rows": rows or F.control_rows(1)}))
    return path


def _run(argv: list[str], capsys: pytest.CaptureFixture[str]) -> tuple[int, dict[str, Any]]:
    code = C.main(argv)
    return code, cast(dict[str, Any], json.loads(capsys.readouterr().out.strip().splitlines()[-1]))


def _results(tmp_path: Path, run_file: Path, count: int | None = None) -> Path:
    run = F.load_private_run(json.loads(run_file.read_text()))
    lines = []
    for body in run.bodies[:count]:
        for fix in F.FIX_IDS_BY_VIEW[body.view]:
            lines.append(json.dumps(measurement_record(run.fingerprint, body.shard, body.photo_sha256, fix,
                                                       identity_similarity=0.99)))
    path = tmp_path / "results.jsonl"
    path.write_text("".join(line + "\n" for line in lines))
    return path


def test_freeze_writes_a_private_run_and_prints_aggregates(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    out = tmp_path / "run.json"
    code, printed = _run(["freeze", "--manifest", str(_manifest(tmp_path)), "--out", str(out), "--shards", "4"], capsys)
    assert code == 0
    assert printed["bodies"] == 60 and printed["set_status"] == "UNPROVEN"
    assert out.stat().st_mode & 0o077 == 0
    assert F.load_private_run(json.loads(out.read_text())).fingerprint == printed["fingerprint"]
    code, printed = _run(["freeze", "--manifest", str(_manifest(tmp_path)), "--out", str(out)], capsys)
    assert (code, printed["reason"]) == (2, "output_exists")


def test_report_scores_results_and_keeps_receipts_hashed(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    run_file = tmp_path / "run.json"
    _run(["freeze", "--manifest", str(_manifest(tmp_path)), "--out", str(run_file)], capsys)
    report_file = tmp_path / "report.json"
    code, printed = _run(["report", "--run", str(run_file), "--results", str(_results(tmp_path, run_file, 30)),
                          "--out", str(report_file)], capsys)
    assert code == 0
    assert printed["release_status"] == "NOT_RUN"
    assert printed["numeric_status"] == "UNPROVEN"
    assert printed["completion"]["missing_jobs"] > 0
    report = json.loads(report_file.read_text())
    assert set(report) == {"format", "scorecard", "job_receipts"}
    assert "rows" not in printed
    for body in F.load_private_run(json.loads(run_file.read_text())).bodies[:5]:
        assert body.photo_sha256 not in json.dumps(report)


def test_outputs_inside_the_repository_or_duplicated_are_refused(tmp_path: Path) -> None:
    with pytest.raises(C.CommandRefused, match="output_inside_repository"):
        C.checked_outputs([C.REPO_ROOT / "body-run.json"])
    with pytest.raises(C.CommandRefused, match="duplicate_output_location"):
        C.checked_outputs([tmp_path / "a.json", tmp_path / "x" / ".." / "a.json"])
    with pytest.raises(C.CommandRefused, match="missing_output_folder"):
        C.checked_outputs([tmp_path / "absent" / "a.json"])


def test_invalid_inputs_are_refused_without_echoing_them(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    secret = "private-source-name-" + "z" * 8
    rows = F.control_rows(1)
    rows[0]["source"] = secret
    rows[0]["licence"] = "unknown"
    code, printed = _run(["freeze", "--manifest", str(_manifest(tmp_path, rows)), "--out", str(tmp_path / "r.json")], capsys)
    assert (code, printed["reason"]) == (2, "inadmissible_manifest_row")
    run_file = tmp_path / "run.json"
    _run(["freeze", "--manifest", str(_manifest(tmp_path)), "--out", str(run_file)], capsys)
    long_line = tmp_path / "long.jsonl"
    long_line.write_text(json.dumps({"pad": "x" * C.MAX_LINE_BYTES}) + "\n")
    code, printed = _run(["report", "--run", str(run_file), "--results", str(long_line), "--out",
                          str(tmp_path / "o.json")], capsys)
    assert (code, printed["reason"]) == (2, "invalid_results_line")
    other = tmp_path / "other.jsonl"
    other.write_text(json.dumps(measurement_record("f" * 64, 0, "e" * 64, "J11")) + "\n")
    code, printed = _run(["report", "--run", str(run_file), "--results", str(other), "--out",
                          str(tmp_path / "o2.json")], capsys)
    assert (code, printed["reason"]) == (2, "changed_frozen_run")
    assert not (tmp_path / "o.json").exists() and not (tmp_path / "o2.json").exists()
    assert secret not in capsys.readouterr().out
