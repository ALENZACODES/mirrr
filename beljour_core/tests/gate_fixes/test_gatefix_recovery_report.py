"""Stretch: no-mesh recovery stage counts in the real-face markdown report.

Pass definition: detect rows' recovery_stages, recovered_stage and
detection_reason are summed into a per-stage table (calls and faces
recovered) plus typed no-face counts; runs without recovery add nothing; the
runner appends the section to its report. Synthetic rows only. Author: John Khan.
"""
from __future__ import annotations

import sys
from typing import Any

import pytest
from gatefix_gates import REALFACE

if str(REALFACE) not in sys.path:
    sys.path.insert(0, str(REALFACE))

import recovery_report  # noqa: E402

RETIRE_RUNNER_SECTION = (
    "Retire: checks that run_realface.py appends the C16 recovery_lines() markdown section. "
    "Main's runner does not: it writes per-row retry_stage_counts and reason_code and sums "
    "recovery into the .gates.json evidence (r17a_recovery_counts, "
    "plumb_api/quality/recovery_counts.py). recovery_report.py reads the C16 row fields "
    "(recovery_stages, recovered_stage, detection_reason) that main's rows no longer carry.")


def detect(face: str, stages: dict[str, int], stage: str = "", reason: str = "") -> dict[str, Any]:
    return {"module": "landmarks", "check": "detect", "face_id": face, "pass": bool(stage),
            "recovery_stages": stages, "recovered_stage": stage, "detection_reason": reason,
            "faces": int(bool(stage)), "yunet_faces": 1}


ROWS = [detect("a", {}),
        detect("b", {"recover_margin": 2, "recover_rotate": 5, "matched_by_recover_rotate": 1},
               "recover_rotate"),
        detect("c", {"recover_margin": 2, "recover_multiscale": 2}, reason="face_box_without_mesh"),
        {"module": "regions", "check": "masks", "face_id": "a", "pass": True}]


def test_stage_totals_sum_calls_recoveries_and_reasons() -> None:
    calls, recovered, reasons = recovery_report.stage_totals(ROWS)
    assert calls == {"recover_margin": 4, "recover_rotate": 5, "recover_multiscale": 2}
    assert recovered == {"recover_rotate": 1}
    assert reasons == {"face_box_without_mesh": 1}


def test_lines_hold_a_table_in_ladder_order_and_nothing_without_recovery() -> None:
    lines = recovery_report.recovery_lines(ROWS)
    assert lines[2:4] == ["| Stage | Mesh calls | Faces recovered |", "|---|---|---|"]
    assert lines[4] == "| recover_margin | 4 | 0 |"
    assert "| recover_rotate | 5 | 1 |" in lines
    assert "| total | 11 | 1 |" in lines
    assert "Typed detection results: face_box_without_mesh 1" in lines
    assert recovery_report.recovery_lines([detect("a", {})]) == []


@pytest.mark.skip(reason=RETIRE_RUNNER_SECTION)
def test_runner_adds_the_section_to_its_report() -> None:
    source = (REALFACE / "run_realface.py").read_text(encoding="utf-8")
    assert "recovery_lines(rows)" in source
