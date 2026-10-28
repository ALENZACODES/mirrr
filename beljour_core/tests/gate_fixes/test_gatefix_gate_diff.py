"""Stretch: the numbers-only gate diff tool between two .gates.json reports.

Pass definition: per gate it reports verdicts, passed/total and the change,
set-aside counts and only the kill-list reasons whose counts changed; gates
present in one report only show "-"; the CLI prints markdown and writes JSON;
an unreadable report exits 2. Synthetic aggregate reports only.
Author: John Khan.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import gatefix_gate_diff as gate_diff


def report(status: str, gates: list[dict[str, Any]]) -> dict[str, Any]:
    return {"selected_status": status, "p0_status": status, "gates": gates}


def gate(name: str, passed: int, total: int, status: str, kill: dict[str, int],
         **extra: Any) -> dict[str, Any]:
    return {"id": name, "status": status, "overall": {"passed": passed, "total": total},
            "kill_list": [{"reason": r, "faces": n} for r, n in kill.items()], **extra}


BEFORE = report("FAIL", [
    gate("teeth", 244, 983, "FAIL", {"warmth_ok eq True": 694, "incomplete check set": 45}),
    gate("balayage_w28", 0, 983, "FAIL", {"mask_observed eq True": 938}),
])
AFTER = report("UNPROVEN", [
    gate("teeth", 600, 785, "UNPROVEN", {"warmth_ok eq True": 140, "incomplete check set": 45},
         applicability={"not_applicable": {"mouth_closed": 198}, "not_measured": {}}),
    gate("balayage_w28", 0, 45, "UNPROVEN", {},
         applicability={"not_applicable": {}, "not_measured": {"hair_mask_not_supplied": 938}}),
    gate("filters", 950, 983, "FAIL", {"hue_turn le 6.0": 3}),
])


def test_diff_reports_counts_changes_and_new_gates() -> None:
    result = gate_diff.diff(BEFORE, AFTER)
    rows = {row["gate"]: row for row in result["gates"]}
    assert rows["teeth"]["passed"] == {"before": 244, "after": 600, "change": 356}
    changes = rows["teeth"]["kill_list_changes"]
    assert changes == {"warmth_ok eq True": {"before": 694, "after": 140}}
    assert rows["teeth"]["set_aside"]["after"] == {"not_applicable:mouth_closed": 198}
    assert rows["balayage_w28"]["status"] == {"before": "FAIL", "after": "UNPROVEN"}
    assert rows["filters"]["passed"]["change"] is None
    assert result["selected_status"] == {"before": "FAIL", "after": "UNPROVEN"}


def test_markdown_holds_numbers_and_reasons_only() -> None:
    text = gate_diff.markdown(gate_diff.diff(BEFORE, AFTER))
    assert "| teeth | FAIL -> UNPROVEN | 244/983 | 600/785 | +356 |" in text
    assert "- warmth_ok eq True: 694 -> 140" in text
    assert "- set aside not_measured:hair_mask_not_supplied: 0 -> 938" in text
    assert "| filters | - -> FAIL | -/- | 950/983 | - |" in text


def test_cli_prints_markdown_writes_json_and_refuses_bad_input(tmp_path: Path) -> None:
    before, after, out = tmp_path / "a.gates.json", tmp_path / "b.gates.json", tmp_path / "d.json"
    before.write_text(json.dumps(BEFORE), encoding="utf-8")
    after.write_text(json.dumps(AFTER), encoding="utf-8")
    assert gate_diff.main([str(before), str(after), "--json", str(out)]) == 0
    assert json.loads(out.read_text(encoding="utf-8"))["format"] == gate_diff.FORMAT
    after.write_text("{\"gates\": 3}", encoding="utf-8")
    assert gate_diff.main([str(before), str(after)]) == 2
