"""Offline evidence CLI exit codes and failure paths.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_evidence import CHECKS, CheckOutcome, write_evidence
from lab.synth_diversity.stress_evidence_cli import main
from lab.synth_diversity.stress_manifest import write_stress_manifest
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule


def prepared(tmp_path: Path, complete: bool = True) -> list[str]:
    schedule = StressSchedule(seed=25, count=len(ALL_PROFILES))
    write_stress_manifest(tmp_path / "plan", schedule)
    cases = list(schedule.cases())[: None if complete else 5]
    rows = [CheckOutcome(case.ordinal, case.identity, dict.fromkeys(CHECKS, "pass"))
            for case in cases]
    write_evidence(tmp_path / "ev", tmp_path / "plan", rows, "cli_runner")
    return ["--plan", str(tmp_path / "plan"), "--evidence", str(tmp_path / "ev")]


def output(capsys: pytest.CaptureFixture[str]) -> dict[str, object]:
    return json.loads(capsys.readouterr().out)


def test_partition_prints_planning_metadata(capsys: pytest.CaptureFixture[str]) -> None:
    code = main(["partition", "--seed", "25", "--count", "60", "--chunk-size", "25"])
    chunks = output(capsys)["chunks"]
    assert code == 0 and isinstance(chunks, list)
    assert [chunk["stop"] for chunk in chunks] == [25, 50, 60]


def test_verify_succeeds_on_matching_files(tmp_path: Path,
                                           capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["verify", *prepared(tmp_path)]) == 0
    data = output(capsys)
    assert data["verified"] is True and data["rows"] == len(ALL_PROFILES)


def test_audit_exit_code_follows_synthetic_status(tmp_path: Path,
                                                  capsys: pytest.CaptureFixture[str]) -> None:
    args = prepared(tmp_path)
    assert main(["audit", *args, "--min-observations", "1", "--min-wilson-lower", "0.01"]) == 0
    assert output(capsys)["synthetic_status"] == "PASS"
    assert main(["audit", *args]) == 1
    assert output(capsys)["synthetic_status"] == "FAIL"


def test_triage_lists_missing_evidence(tmp_path: Path,
                                       capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["triage", *prepared(tmp_path, complete=False), "--max-notes", "3"]) == 0
    notes = output(capsys)["notes"]
    assert isinstance(notes, list) and len(notes) == 3
    assert notes[0]["kind"] == "missing_evidence"


def test_triage_owner_file_must_be_valid(tmp_path: Path,
                                         capsys: pytest.CaptureFixture[str]) -> None:
    args = prepared(tmp_path)
    owners = tmp_path / "owners.json"
    owners.write_text("[1, 2]")
    assert main(["triage", *args, "--owners", str(owners)]) == 2
    assert "owner mapping" in capsys.readouterr().err


def test_tampered_evidence_exits_two(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    args = prepared(tmp_path)
    rows = tmp_path / "ev" / "synthetic-results.jsonl"
    rows.write_bytes(rows.read_bytes()[:-1])
    assert main(["verify", *args]) == 2
    assert "synthetic evidence error" in capsys.readouterr().err


def test_missing_folders_exit_two(tmp_path: Path) -> None:
    assert main(["verify", "--plan", str(tmp_path / "x"), "--evidence", str(tmp_path / "y")]) == 2


def test_bad_partition_arguments_exit_two() -> None:
    assert main(["partition", "--seed", "1", "--count", "5", "--chunk-size", "2"]) == 2
