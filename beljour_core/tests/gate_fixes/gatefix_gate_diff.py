"""Numbers-only difference between two .gates.json reports (for example d502a0b and C16).

Usage: python api/tests/gate_fixes/gatefix_gate_diff.py BEFORE.gates.json AFTER.gates.json
       [--json OUT]

Per gate: verdict before and after, primary passed/total and the change, the
not-applicable / not-measured counts when present, and every kill-list reason
whose face count changed. It reads only the aggregate fields gates.evaluate()
writes; no face id, file name or image is read or printed. It gives no PASS
verdict of its own (compare_commits.py and the regression rule do that).
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Mapping
from pathlib import Path
from typing import Any

FORMAT = "beljour-realface-gate-diff/1"


def _gates(report: Mapping[str, Any]) -> dict[str, Mapping[str, Any]]:
    gates = report.get("gates")
    if not isinstance(gates, list):
        raise ValueError("a .gates.json report has a gates list")
    return {str(gate["id"]): gate for gate in gates if isinstance(gate, Mapping) and "id" in gate}


def _counts(gate: Mapping[str, Any] | None) -> tuple[int | None, int | None]:
    if gate is None:
        return None, None
    overall = gate.get("overall") or {}
    passed, total = overall.get("passed"), overall.get("total")
    return (passed if isinstance(passed, int) else None, total if isinstance(total, int) else None)


def _kill(gate: Mapping[str, Any] | None) -> dict[str, int]:
    if gate is None:
        return {}
    return {str(item["reason"]): int(item["faces"]) for item in gate.get("kill_list", [])
            if isinstance(item, Mapping) and "reason" in item and "faces" in item}


def _set_aside(gate: Mapping[str, Any] | None) -> dict[str, int]:
    counts = (gate or {}).get("applicability") or {}
    out: dict[str, int] = {}
    for status in ("not_applicable", "not_measured"):
        for reason, number in (counts.get(status) or {}).items():
            out[f"{status}:{reason}"] = int(number)
    return out


def diff(before: Mapping[str, Any], after: Mapping[str, Any]) -> dict[str, Any]:
    old, new = _gates(before), _gates(after)
    rows = []
    for name in sorted(set(old) | set(new)):
        (p0, t0), (p1, t1) = _counts(old.get(name)), _counts(new.get(name))
        kill0, kill1 = _kill(old.get(name)), _kill(new.get(name))
        changed = {reason: {"before": kill0.get(reason, 0), "after": kill1.get(reason, 0)}
                   for reason in sorted(set(kill0) | set(kill1))
                   if kill0.get(reason, 0) != kill1.get(reason, 0)}
        rows.append({"gate": name,
                     "status": {"before": (old.get(name) or {}).get("status"),
                                "after": (new.get(name) or {}).get("status")},
                     "passed": {"before": p0, "after": p1,
                                "change": None if p0 is None or p1 is None else p1 - p0},
                     "total": {"before": t0, "after": t1},
                     "set_aside": {"before": _set_aside(old.get(name)),
                                   "after": _set_aside(new.get(name))},
                     "kill_list_changes": changed})
    return {"format": FORMAT, "gates": rows,
            "selected_status": {"before": before.get("selected_status"),
                                "after": after.get("selected_status")},
            "p0_status": {"before": before.get("p0_status"), "after": after.get("p0_status")}}


def _cell(value: object) -> str:
    return "-" if value is None else str(value)


def markdown(result: Mapping[str, Any]) -> str:
    selected, p0 = result["selected_status"], result["p0_status"]
    lines = ["## Gate difference (numbers only)", "",
             f"Selected: {_cell(selected['before'])} -> {_cell(selected['after'])}; "
             f"P0: {_cell(p0['before'])} -> {_cell(p0['after'])}.", "",
             "| Gate | Verdict | Passed/total before | Passed/total after | Change |",
             "|---|---|---|---|---|"]
    for row in result["gates"]:
        passed, total, status = row["passed"], row["total"], row["status"]
        change = passed["change"]
        lines.append(f"| {row['gate']} | {_cell(status['before'])} -> {_cell(status['after'])} | "
                     f"{_cell(passed['before'])}/{_cell(total['before'])} | "
                     f"{_cell(passed['after'])}/{_cell(total['after'])} | "
                     f"{'-' if change is None else f'{change:+d}'} |")
    for row in result["gates"]:
        if not row["kill_list_changes"] and row["set_aside"]["before"] == row["set_aside"]["after"]:
            continue
        lines += ["", f"### {row['gate']}"]
        for key, counts in sorted(row["set_aside"]["after"].items()):
            lines.append(f"- set aside {key}: {row['set_aside']['before'].get(key, 0)} -> {counts}")
        for reason, counts in row["kill_list_changes"].items():
            lines.append(f"- {reason}: {counts['before']} -> {counts['after']}")
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("before", type=Path)
    parser.add_argument("after", type=Path)
    parser.add_argument("--json", type=Path, help="also write the difference as JSON")
    args = parser.parse_args(argv)
    try:
        result = diff(json.loads(args.before.read_text(encoding="utf-8")),
                      json.loads(args.after.read_text(encoding="utf-8")))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f"gate diff: unreadable report ({type(exc).__name__})", file=sys.stderr)
        return 2
    print(markdown(result), end="")
    if args.json is not None:
        args.json.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
