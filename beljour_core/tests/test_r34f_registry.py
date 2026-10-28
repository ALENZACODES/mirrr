"""R34F ownership stays in Lane F's private ledger; shared contribution order is unchanged.

Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import f

REPO = Path(__file__).resolve().parents[2]
MIRRORED = ("illumination_sensitivity", "reference_ambiguity", "shade_safety")


def test_every_r34f_module_and_test_is_present() -> None:
    assert f.LANE_F_R34_OWNER == "F"
    assert f.r34_paths(REPO) == list(f.LANE_F_R34_MODULES)
    assert all((REPO / path).is_file() for path in f.LANE_F_R34_TESTS)
    assert len(set(f.LANE_F_R34_MODULES)) == len(f.LANE_F_R34_MODULES)
    assert len(set(f.LANE_F_R34_TESTS)) == len(f.LANE_F_R34_TESTS)


def test_review_modules_name_their_browser_mirrors() -> None:
    for stem in MIRRORED:
        web = f"web/src/engines/shade/{stem.replace('_', '-')}.ts"
        assert web in f.LANE_F_R34_MODULES
        text = " ".join((REPO / f"api/plumb_api/engines/shade/{stem}.py").read_text(encoding="utf-8").split())
        assert f"Mirrored in {web}" in text


def test_r34f_row_claims_synthetic_evidence_only() -> None:
    rows = f.r34_rows(REPO)
    assert len(rows) == 1
    row = rows[0]
    assert row["id"] == "r34f-lighting-and-reference-consultation"
    assert row["owner"] == "F" and row["status"] == "Built" and row["tested"] == "synthetic_only"
    assert row["modules"] == list(f.LANE_F_R34_MODULES) and row["tests"] == list(f.LANE_F_R34_TESTS)
    assert "scores" not in row and "passed" not in row


def test_private_ledger_does_not_join_shared_contributions() -> None:
    assert f.CONTRIBUTIONS == ()
    shared = {path for item in f.LANE_F_OWNERSHIP if item.module_paths is not None
              for path in item.module_paths(REPO)}
    assert not shared & set(f.LANE_F_R34_MODULES)
