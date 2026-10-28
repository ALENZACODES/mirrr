"""W1-W100 in the arena registry (round 2 plan section 10).

Pass definition (written before the run): features.json carries exactly W1..W100 generated
from the committed source, in John's order and groups (18/26/14/18/16/8, gap grades
57/28/13/2); every row says Not tested; the Top 5 are built with modules and tests that
exist; W14 is blocked with its reason; a W score without a recorded result is rejected by
both women.validate_women and registry.validate. Author: John Khan.
"""
from __future__ import annotations

import collections
import json
import subprocess
import sys
from pathlib import Path

from plumb_api.arena import registry, women

ROOT = Path(__file__).resolve().parents[2]


def rows() -> list[dict]:
    return registry.women_rows()


def test_block_is_generated_and_in_sync() -> None:
    out = subprocess.run([sys.executable, str(ROOT / "api/scripts/women_registry.py"), "--check"],
                         capture_output=True, text=True, cwd=ROOT)
    assert out.returncode == 0, out.stdout + out.stderr
    assert "0 problems" in out.stdout


def test_exactly_w1_to_w100_in_johns_groups() -> None:
    data = rows()
    assert [r["id"] for r in data] == [f"W{i}" for i in range(1, 101)]
    groups = collections.Counter(r["group"] for r in data)
    assert groups == {"Makeup": 18, "Hair": 26, "Lips & Smile": 14, "Eyes, Lashes & Brows": 18,
                      "Skin & More": 16, "Workflow": 8}
    assert collections.Counter(r["gap"] for r in data) == {"A": 57, "B": 28, "C": 13, "B/C": 2}
    assert women.validate_women(data) == []


def test_statuses_are_honest() -> None:
    historical = {r["id"]: r for r in rows()}
    assert all(r["tested"] == "Not tested" for r in historical.values())
    assert {wid for wid, row in historical.items() if row["status"] == "built"} == set(women.BUILT)

    reviewed_rows = women.build_rows(women.load_source())
    reviewed = {row["id"]: row for row in reviewed_rows}
    source_built = {
        row["id"] for row in women.load_source()["features"]
        if row["status"] == "built"
    }
    assert {wid for wid, row in reviewed.items() if row["status"] == "built"} == source_built
    assert len(source_built) >= 90, "Reviewed simulation evidence must not regress"
    for wid in source_built:
        assert reviewed[wid]["modules"] and reviewed[wid]["tests"]
        for path in reviewed[wid]["modules"] + reviewed[wid]["tests"]:
            assert (ROOT / path).exists(), path
        assert reviewed[wid]["tested"] == "Not tested"

    assert historical["W14"]["status"] == "blocked"
    assert "Celebrity" in historical["W14"]["blocked_reason"]
    assert historical["W3"]["status"] == "blocked"
    assert "catalogue" in historical["W3"]["blocked_reason"]
    assert [historical[w]["top5_rank"] for w in women.TOP5] == [1, 2, 3, 4, 5]
    assert all(not any(k in row for k in women.SCORE_KEYS) for row in historical.values())
    assert all(not any(k in row for k in women.SCORE_KEYS) for row in reviewed.values())


def test_a_w_score_without_a_recorded_result_is_rejected() -> None:
    data = rows()
    scored = [dict(r) for r in data]
    scored[5] = dict(scored[5], scores={"realism": 8.1})
    problems = women.validate_women(scored)
    assert any("W6" in p and "recorded result" in p for p in problems)
    raw = json.loads(registry.REGISTRY_PATH.read_text(encoding="utf-8"))
    raw["women"]["rows"][5]["score"] = 9
    feats, _ = registry.load()
    assert any("W6" in p and "recorded result" in p for p in registry.validate(feats, raw=raw))
    with_result = [dict(r) for r in data]
    with_result[5] = dict(with_result[5], scores={"realism": 8.1}, result="api/plumb_api/arena/women-100-features.json")
    assert not any("recorded result" in p for p in women.validate_women(with_result))


def test_rule_breaks_are_caught() -> None:
    data = [dict(r) for r in rows()]
    assert any("W1..W100" in p for p in women.validate_women(data[:-1]))
    broken = [dict(r) for r in data]
    broken[13] = {k: v for k, v in broken[13].items() if k != "blocked_reason"}
    assert any("blocked rows need a reason" in p for p in women.validate_women(broken))
    broken = [dict(r) for r in data]
    broken[40] = dict(broken[40], modules=["api/plumb_api/engines/shade/finder.py"])
    assert any("only built rows list modules" in p for p in women.validate_women(broken))
    broken = [dict(r) for r in data]
    broken[5] = dict(broken[5], modules=["api/plumb_api/engines/not_here.py"])
    assert any("does not exist" in p for p in women.validate_women(broken))
    broken = [dict(r) for r in data]
    broken[2] = dict(broken[2], tested="Passed")
    assert any("Not tested" in p for p in women.validate_women(broken))


def test_new_engines_are_owned_and_documented() -> None:
    feats, infra = registry.load()
    unowned = registry.unowned_modules(feats, infra)
    for module in ("api/plumb_api/engines/shade", "api/plumb_api/engines/haircolour",
                   "api/plumb_api/services/salon_pack.py", "web/src/engines/shade"):
        assert module not in unowned
    docs = (ROOT / "docs/FEATURES.md").read_text(encoding="utf-8")
    assert women.markdown(women.build_rows(women.load_source())) in docs
