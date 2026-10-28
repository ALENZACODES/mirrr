"""R32F ownership stays in Lane F's private ledger; shared contribution order is unchanged.

Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import f

REPO = Path(__file__).resolve().parents[2]


def test_every_r32f_module_and_test_is_present() -> None:
    assert f.LANE_F_R32_OWNER == "F"
    assert f.r32_paths(REPO) == list(f.LANE_F_R32_MODULES)
    assert all((REPO / path).is_file() for path in f.LANE_F_R32_TESTS)
    assert len(set(f.LANE_F_R32_MODULES)) == len(f.LANE_F_R32_MODULES)
    assert len(set(f.LANE_F_R32_TESTS)) == len(f.LANE_F_R32_TESTS)


def test_every_python_module_has_its_browser_mirror() -> None:
    python = [p for p in f.LANE_F_R32_MODULES if p.endswith(".py")]
    web = {p for p in f.LANE_F_R32_MODULES if p.endswith(".ts")}
    assert len(python) == len(web) == 3
    for path in python:
        stem = Path(path).stem.replace("_", "-")
        assert f"web/src/engines/shade/{stem}.ts" in web
        text = " ".join((REPO / path).read_text(encoding="utf-8").split())
        assert f"Mirrored in web/src/engines/shade/{stem}.ts" in text


def test_r32f_row_claims_synthetic_evidence_only() -> None:
    rows = f.r32_rows(REPO)
    assert len(rows) == 1
    row = rows[0]
    assert row["id"] == "r32f-skin-reference-accuracy"
    assert row["owner"] == "F" and row["status"] == "Built"
    assert row["tested"] == "synthetic_only"
    assert row["modules"] == list(f.LANE_F_R32_MODULES)
    assert row["tests"] == list(f.LANE_F_R32_TESTS)
    assert "scores" not in row and "passed" not in row


def test_private_ledger_does_not_join_shared_contributions() -> None:
    assert f.CONTRIBUTIONS == ()
    shared = {path for item in f.LANE_F_OWNERSHIP if item.module_paths is not None
              for path in item.module_paths(REPO)}
    assert not shared & set(f.LANE_F_R32_MODULES)
