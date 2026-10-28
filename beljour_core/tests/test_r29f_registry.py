"""R29F ownership stays in Lane F's private ledger; shared contribution order is unchanged.

Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import f

REPO = Path(__file__).resolve().parents[2]
MIRRORS = {"level_evidence": "level-board", "hair_comparison": "level-board",
           "board_receipt": "board-receipt"}


def test_every_r29f_module_and_test_is_present() -> None:
    assert f.LANE_F_R29_OWNER == "F"
    assert f.r29_paths(REPO) == list(f.LANE_F_R29_MODULES)
    assert all((REPO / path).is_file() for path in f.LANE_F_R29_TESTS)
    assert len(f.LANE_F_R29_MODULES) == 6 and len(f.LANE_F_R29_TESTS) == 11
    assert len(set(f.LANE_F_R29_MODULES + f.LANE_F_R29_TESTS)) == 17


def test_python_modules_name_their_browser_mirrors() -> None:
    for stem, web in MIRRORS.items():
        path = f"web/src/commerce/{web}.ts"
        assert path in f.LANE_F_R29_MODULES
        text = " ".join((REPO / f"api/plumb_api/commerce/{stem}.py").read_text(encoding="utf-8").split())
        assert f"Mirrored in {path}" in text


def test_r29f_row_claims_synthetic_evidence_only() -> None:
    rows = f.r29_rows(REPO)
    assert len(rows) == 1
    row = rows[0]
    assert row["id"] == "r29f-five-stop-comparison"
    assert row["owner"] == "F" and row["status"] == "Built" and row["tested"] == "synthetic_only"
    assert row["modules"] == list(f.LANE_F_R29_MODULES) and row["tests"] == list(f.LANE_F_R29_TESTS)
    assert "scores" not in row and "passed" not in row


def test_private_ledger_does_not_join_shared_contributions() -> None:
    assert f.CONTRIBUTIONS == ()
    shared = {path for item in f.LANE_F_OWNERSHIP if item.module_paths is not None
              for path in item.module_paths(REPO)}
    assert not shared & set(f.LANE_F_R29_MODULES)


def test_new_sources_make_no_network_or_provider_calls() -> None:
    for path in f.LANE_F_R29_MODULES:
        text = (REPO / path).read_text(encoding="utf-8")
        for token in ("fetch(", "XMLHttpRequest", "WebSocket", "youcam", "requests.", "httpx"):
            assert token not in text, (path, token)
