"""R28F ownership stays in Lane F's private ledger; shared contribution order is unchanged.

Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import f

REPO = Path(__file__).resolve().parents[2]


def test_every_r28f_module_and_test_is_present() -> None:
    assert f.LANE_F_R28_OWNER == "F"
    assert f.r28_paths(REPO) == list(f.LANE_F_R28_MODULES)
    assert all((REPO / path).is_file() for path in f.LANE_F_R28_TESTS)


def test_r28f_row_claims_synthetic_evidence_only() -> None:
    rows = f.r28_rows(REPO)
    assert len(rows) == 1
    row = rows[0]
    assert row["id"] == "r28f-local-hair-consultation"
    assert row["owner"] == "F" and row["tested"] == "synthetic_only"
    assert row["modules"] == list(f.LANE_F_R28_MODULES)
    assert row["tests"] == list(f.LANE_F_R28_TESTS)


def test_private_ledger_does_not_join_shared_contributions() -> None:
    assert f.CONTRIBUTIONS == ()
    shared = {path for item in f.LANE_F_OWNERSHIP if item.module_paths is not None
              for path in item.module_paths(REPO)}
    assert not shared & set(f.LANE_F_R28_MODULES)
