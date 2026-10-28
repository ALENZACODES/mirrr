"""R27F ownership stays in Lane F's private ledger; shared contribution order is unchanged.

Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import f

REPO = Path(__file__).resolve().parents[2]


def test_every_r27f_module_and_test_is_present() -> None:
    assert f.LANE_F_R27_OWNER == "F"
    assert f.r27_paths(REPO) == list(f.LANE_F_R27_MODULES)
    assert all((REPO / path).is_file() for path in f.LANE_F_R27_TESTS)
    assert len(f.LANE_F_R27_MODULES) == 12 and len(f.LANE_F_R27_TESTS) == 14


def test_r27f_row_claims_synthetic_evidence_only() -> None:
    rows = f.r27_rows(REPO)
    assert len(rows) == 1
    row = rows[0]
    assert row["id"] == "r27f-local-hair-evidence"
    assert row["owner"] == "F" and row["status"] == "Built" and row["tested"] == "synthetic_only"
    assert row["modules"] == list(f.LANE_F_R27_MODULES) and row["tests"] == list(f.LANE_F_R27_TESTS)
    assert "scores" not in row and "passed" not in row


def test_private_ledger_does_not_join_shared_contributions() -> None:
    assert f.CONTRIBUTIONS == ()
    assert [item.order for item in f.LANE_F_OWNERSHIP][:3] == [2200, 2300, 2600]
    shared = {path for item in f.LANE_F_OWNERSHIP if item.module_paths is not None
              for path in item.module_paths(REPO)}
    assert not shared & set(f.LANE_F_R27_MODULES)
