"""Operator aggregate input must be complete and contain no private artifacts.
Author: John Khan.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from plumb_api.engines.shade.skn03_checkpoint import load_skn03_c18_binding

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "api/scripts/skn03_checkpoint.py"


def input_payload(*, fixed: int = 11) -> dict[str, object]:
    return {
        "counts": {
            "still_correct": 939,
            "corrected": fixed,
            "regressed": 0,
            "still_incorrect": 61 - fixed,
        },
        "c18_digest": load_skn03_c18_binding()["digest"],
        "frozen_manifest_digest": "d" * 64,
        "causes": {"other": 61 - fixed},
        "independently_labelled": 1000,
        "compatible_baseline": True,
        "human_review_complete": True,
    }


def run_command(tmp_path: Path, source: object) -> subprocess.CompletedProcess[str]:
    input_file = tmp_path / "operator-aggregate.json"
    input_file.write_text(json.dumps(source), encoding="utf-8")
    return subprocess.run(
        [sys.executable, str(SCRIPT), str(input_file)],
        cwd=ROOT / "api", capture_output=True, text=True, check=False, timeout=20,
        env={**os.environ, "PYTHONPATH": str(ROOT / "api")},
    )


def test_reported_only_run_refuses_to_invent_a_denominator() -> None:
    result = subprocess.run(
        [sys.executable, str(SCRIPT)], cwd=ROOT / "api",
        capture_output=True, text=True, check=False, timeout=20,
        env={**os.environ, "PYTHONPATH": str(ROOT / "api")},
    )
    assert result.returncode == 3
    record = json.loads(result.stdout)
    assert record["verified_denominator"] is None
    assert record["status"] == "UNPROVEN"
    assert record["release_pass"] is False


def test_operator_candidate_reaches_numeric_target_without_release_claim(tmp_path: Path) -> None:
    result = run_command(tmp_path, input_payload())
    assert result.returncode == 0
    record = json.loads(result.stdout)
    assert record["candidate_correct"] == 950
    assert record["minimum_correct"] == 950
    assert record["status"] == "BOX_REVIEW_REQUIRED"
    assert record["release_pass"] is False


def test_under_target_is_evidence_not_a_green_result(tmp_path: Path) -> None:
    result = run_command(tmp_path, input_payload(fixed=10))
    assert result.returncode == 3
    assert json.loads(result.stdout)["additional_required"] == 1


@pytest.mark.parametrize("extra", ["image", "person", "filename", "session", "photo_hash"])
def test_private_and_unknown_keys_are_refused(tmp_path: Path, extra: str) -> None:
    data = input_payload()
    data[extra] = "unavailable"
    result = run_command(tmp_path, data)
    assert result.returncode == 2
    assert not result.stdout


def test_tampered_catalogue_is_rejected_without_suggesting_a_replacement(tmp_path: Path) -> None:
    data = input_payload()
    data["c18_digest"] = "e" * 64
    result = run_command(tmp_path, data)
    assert result.returncode == 2
    assert "C18" in result.stderr


def test_missing_transitions_cannot_drop_failed_cases(tmp_path: Path) -> None:
    data = input_payload()
    data["counts"] = {"still_correct": 950, "corrected": 0, "regressed": 0}
    result = run_command(tmp_path, data)
    assert result.returncode == 2
