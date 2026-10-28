"""R7 acceptance gates: released-only, one vote per photo and setting, plan fallbacks.

Reports here are hand-built dictionaries (no photos). Author: John Khan.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

from lab.python.beljour_lab import photo_review as rv

ROOT = Path(__file__).resolve().parents[2]


def report(spike: str, rows: list[dict], kind: str = "released") -> dict:
    return {"format": "beljour-local-spike-report/1", "spike": spike, "fixture_kinds": [kind], "evaluations": rows}


def ls4_rows(front: int = 6, side: int = 4) -> list[dict]:
    rows = []
    for k in range(front):
        for fix in rv.FRONT_FIXES:
            for stop in ("subtle", "normal", "full"):
                rows.append({"case": f"f{k}", "view": "front", "setting": f"{fix}:{stop}", "auto_pass": True})
    for k in range(side):
        for fix in rv.SIDE_FIXES:
            rows.append({"case": f"s{k}", "view": "side", "setting": f"{fix}:normal", "auto_pass": True})
    return rows


def votes(entries: list[tuple[str, str, str, bool]]) -> dict:
    return {"format": rv.FORMAT, "votes": [{"spike": s, "case": c, "setting": t, "natural": ok, "clear_effect": True}
                                            for s, c, t, ok in entries]}


def test_ls4_front_pass_and_side_fallback():
    v = [("LS4", f"f{k}", f"{fix}:normal", k != 0) for k in range(6) for fix in rv.FRONT_FIXES]
    v += [("LS4", f"s{k}", f"{fix}:normal", k < 2) for k in range(4) for fix in rv.SIDE_FIXES]
    out = rv.evaluate({"LS4": report("LS4", ls4_rows())}, votes(v))
    assert out["LS4"]["front_verdict"] == "PASS"
    assert out["LS4"]["side_verdict"] == "SUBTLE_ONLY_WITH_PREVIEW_LABEL"
    synthetic = rv.evaluate({"LS4": report("LS4", ls4_rows(), "synthetic")}, votes(v))
    assert synthetic["LS4"]["front_verdict"] == "INSUFFICIENT"
    few = rv.evaluate({"LS4": report("LS4", ls4_rows(front=3))}, votes(v))
    assert few["LS4"]["front_verdict"] == "INSUFFICIENT"


def test_ls5_needs_votes_and_browser_timing():
    rows = [{"case": f"c{k}", "setting": "fibres:medium", "auto_pass": True} for k in range(6)]
    v = votes([("LS5", f"c{k}", "fibres:medium", k < 5) for k in range(6)])
    no_timing = rv.evaluate({"LS5": report("LS5", rows)}, v)
    assert no_timing["LS5"]["q8"] == "NOT_MEASURED" and no_timing["LS5"]["verdict"] == "INSUFFICIENT"
    budget = {"format": rv.BUDGET_FORMAT, "device_label": "phone", "timings": [{"tool": "fibre", "size": 1024, "ms": 900}],
              "probes": [], "catalogue": [{"id": "m", "status": "pending"}]}
    assert rv.evaluate({"LS5": report("LS5", rows)}, v, [budget])["LS5"]["verdict"] == "PASS"
    bad = votes([("LS5", f"c{k}", "fibres:medium", k < 2) for k in range(6)])
    assert rv.evaluate({"LS5": report("LS5", rows)}, bad, [budget])["LS5"]["verdict"] == "COVERAGE_MAP_ONLY"


def test_ls6_ls7_ls8_rules():
    rows6 = [{"case": f"p{k}", "setting": "low_light:no_reference", "auto_pass": k < 3} for k in range(6)]
    assert rv.evaluate({"LS6": report("LS6", rows6)}, votes([]))["LS6"]["verdict"] == "LOWER_DEFAULT_STRENGTH"
    rows6 = [dict(r, auto_pass=True) for r in rows6]
    assert rv.evaluate({"LS6": report("LS6", rows6)}, votes([]))["LS6"]["verdict"] == "PASS"
    rows7 = [{"case": f"p{k}", "setting": s, "auto_pass": True} for k in range(6) for s in ("stubble", "short_boxed", "moustache")]
    v7 = [("LS7", f"p{k}", "stubble", True) for k in range(6)] + [("LS7", f"p{k}", "short_boxed", k < 2) for k in range(6)]
    v7 += [("LS7", f"p{k}", "moustache", True) for k in range(6)]
    assert rv.evaluate({"LS7": report("LS7", rows7)}, votes(v7))["LS7"]["verdict"] == "STUBBLE_AND_MOUSTACHE_ONLY"
    assert rv.evaluate({}, votes([]))["LS8"]["verdict"] == "NOT_MEASURED"
    budget = {"format": rv.BUDGET_FORMAT, "device_label": "phone", "catalogue": [], "timings": [],
              "probes": [{"id": "big", "fetched": True, "q13_download": "FAIL", "q13_load": "PASS"}]}
    ls8 = rv.evaluate({}, votes([]), [budget])["LS8"]
    assert ls8["verdict"] == "MOVE_TO_OPTIONAL_PACK" and ls8["failing"] == ["big"]


def test_vote_parsing_rejects_ambiguity():
    with pytest.raises(ValueError, match="format"):
        rv.parse_votes({"format": "x", "votes": []})
    dup = votes([("LS7", "p1", "stubble", True), ("LS7", "p1", "stubble", False)])
    with pytest.raises(ValueError, match="repeats"):
        rv.parse_votes(dup)
    with pytest.raises(ValueError, match="unknown spike"):
        rv.parse_votes(votes([("LS9", "p1", "stubble", True)]))
    blank = {"format": rv.FORMAT, "votes": [{"spike": "LS7", "case": "p", "setting": "stubble", "natural": None, "clear_effect": None}]}
    assert rv.parse_votes(blank) == {}
    with pytest.raises(ValueError, match="true, false or null"):
        rv.parse_votes({"format": rv.FORMAT, "votes": [{"spike": "LS7", "case": "p", "setting": "s", "natural": "yes", "clear_effect": True}]})
    with pytest.raises(ValueError, match="not an R7 spike report"):
        rv.evaluate({"LS4": {"format": "other"}}, votes([]))
    with pytest.raises(ValueError, match="budget"):
        rv.evaluate({}, votes([]), [{"format": "nope"}])


def test_template_and_cli(tmp_path):
    rep = report("LS7", [{"case": "p1", "setting": "stubble", "auto_pass": True}])
    tpl = rv.review_template({"LS7": rep})
    assert tpl["votes"] == [{"spike": "LS7", "case": "p1", "setting": "stubble", "natural": None, "clear_effect": None}]
    (tmp_path / "ls7-report.json").write_text(json.dumps(rep))
    script = ROOT / "api/scripts/review_photos.py"
    run = subprocess.run([sys.executable, str(script), "--reports", str(tmp_path), "--template", str(tmp_path / "v.json")],
                         capture_output=True, text=True)
    assert run.returncode == 0 and (tmp_path / "v.json").exists()
    run = subprocess.run([sys.executable, str(script), "--reports", str(tmp_path), "--votes", str(tmp_path / "v.json"),
                          "--out", str(tmp_path / "a.json")], capture_output=True, text=True)
    assert run.returncode == 0, run.stderr
    assert "LS7: INSUFFICIENT" in run.stdout
