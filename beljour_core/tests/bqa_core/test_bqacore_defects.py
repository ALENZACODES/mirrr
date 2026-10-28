"""Defect audits on synthetic defect logs (DEF-01..03, BUG-01, BUG-03, MAN-03, SUM-03).

Author: John Khan.
"""

from __future__ import annotations

import csv
from pathlib import Path

import pytest

from lab.bqa_core import defects as dfx

FIELDS = ["id", "type", "severity", "build", "dataset_id", "check_key", "affected_groups",
          "filed", "first_response", "status", "reviewed", "pattern", "post_launch",
          "resolution", "attachments"]


def defect(**values: str) -> dict[str, str]:
    base = {"id": "D-0001", "type": "wrong_face", "severity": "P2", "build": "b1",
            "dataset_id": "GOLD-v1", "check_key": "JRN-02", "affected_groups": "mst_band=9-10",
            "filed": "2026-10-19T09:00:00Z", "first_response": "2026-10-19T13:00:00Z",
            "status": "closed", "reviewed": "yes", "pattern": "", "post_launch": "",
            "resolution": "fixed", "attachments": "EV-0001"}
    base.update(values)
    return base


def synthetic_log(tmp_path: Path, rows: list[dict[str, str]]) -> Path:
    path = tmp_path / "synthetic_defects.csv"
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    return path


def test_load_and_complete(tmp_path: Path) -> None:
    """DEF-01, BUG-01: complete defects carry every required field."""
    items = dfx.load_defects(synthetic_log(tmp_path, [defect()]))
    assert dfx.missing_fields(items[0]) == []
    assert items[0].affected_groups == (("mst_band", "9-10"),)
    assert dfx.completeness(items) == (1, 1)


def test_missing_fields_are_named() -> None:
    items = dfx.parse_defects([defect(type="", severity="P7", check_key="NOPE-1",
                                      affected_groups="mst_band=11-12", filed="")])
    assert dfx.missing_fields(items[0]) == ["affected_groups", "check_key", "filed",
                                            "severity", "type"]
    local = dfx.parse_defects([defect(check_key="LOCAL-0042")])
    assert dfx.missing_fields(local[0]) == []


@pytest.mark.parametrize("field, value", [
    ("attachments", "face_0001.jpg"),
    ("resolution", "see data:image/png;base64,AAAA"),
    ("type", "A" * 240),
])
def test_image_data_is_refused(field: str, value: str) -> None:
    with pytest.raises(dfx.DefectError):
        dfx.parse_defects([defect(**{field: value})])


def test_gate_blockers() -> None:
    """DEF-02, SUM-03: open P0 and unreviewed P1 block the gate."""
    items = dfx.parse_defects([
        defect(id="D-1", severity="P0", status="open"),
        defect(id="D-2", severity="P0", status="closed"),
        defect(id="D-3", severity="P1", reviewed="no"),
        defect(id="D-4", severity="P1", reviewed="yes"),
    ])
    assert dfx.gate_blockers(items) == ["D-1: open P0", "D-3: unreviewed P1"]


def test_weekly_review_and_response_time() -> None:
    """DEF-03, BUG-03: weekly groups by band and type; median response hours."""
    items = dfx.parse_defects([
        defect(id="D-1"),
        defect(id="D-2", affected_groups="mst_band=1-2;device_tier=low",
               first_response="2026-10-20T09:00:00Z"),
        defect(id="D-3", filed="2026-10-27T09:00:00Z", affected_groups="device_tier=low",
               type="", first_response=""),
    ])
    assert dfx.weekly_pattern_review(items) == {
        "2026-W43": {"mst_band=1-2|wrong_face": 1, "mst_band=9-10|wrong_face": 1},
        "2026-W44": {"mst_band=none|untyped": 1},
    }
    assert dfx.response_hours(items) == [4.0, 24.0]
    assert dfx.median_response_hours(items) == 14.0
    assert dfx.median_response_hours([]) is None


def test_rerun_closures() -> None:
    """REG-03: closures that only re-ran the test are found."""
    items = dfx.parse_defects([defect(id="D-1", resolution="passed on retry"),
                               defect(id="D-2", resolution="Re-run green"),
                               defect(id="D-3", resolution="rerun", status="open")])
    assert dfx.rerun_closures(items) == ["D-1", "D-2"]


def test_manual_failures_cite_a_key() -> None:
    """MAN-03: every manual failure cross-references a test id or creates one."""
    total, problems = dfx.manual_failure_problems([
        {"id": "M-1", "check_key": "PRD-03", "local_case": ""},
        {"id": "M-2", "check_key": "", "local_case": "LOCAL-001"},
        {"id": "M-3", "check_key": "XYZ-99", "local_case": ""},
        {"id": "M-4", "check_key": "", "local_case": "note.png"},
    ])
    assert total == 4
    assert problems == ["M-3: no registry key or local case id",
                        "M-4: local_case: names an image file; attach an evidence id instead",
                        "M-4: no registry key or local case id"]
