"""Merging shards with Wilson 95% intervals, statuses and refusals.

Author: John Khan.
"""

from __future__ import annotations

from typing import Any

import pytest

from lab.facescale import merge as MG
from lab.facescale.metrics import FACE_CHECK, FAIL, PASS, REFUSED, Accumulator
from lab.facescale.results import RunMeta, build_result

META = RunMeta("fs-1", "plan-a", 400, 256, "core", ("gender",), "fake", "eng-1", "def-1")
THRESHOLDS = MG.load_thresholds({"format": MG.THRESHOLD_FORMAT,
                                 "modules": {"gender": 0.9, "regions": 0.5}})


@pytest.mark.parametrize(("passed", "n", "low", "high"), [
    (5, 10, 0.2366, 0.7634),
    (0, 10, 0.0, 0.2775),
    (10, 10, 0.7225, 1.0),
    (81, 263, 0.2553, 0.3662),
    (950, 1000, 0.9346, 0.9618),
])
def test_wilson_known_values(passed: int, n: int, low: float, high: float) -> None:
    lo, hi = MG.wilson(passed, n)
    assert lo == pytest.approx(low, abs=1e-4)
    assert hi == pytest.approx(high, abs=1e-4)


def test_wilson_edges() -> None:
    assert MG.wilson(0, 0) == (0.0, 1.0)
    with pytest.raises(ValueError):
        MG.wilson(5, 4)


@pytest.mark.parametrize(("passed", "n", "threshold", "status"), [
    (990, 1000, 0.95, "PASS"),
    (800, 1000, 0.95, "FAIL"),
    (950, 1000, 0.95, "UNPROVEN"),
    (19, 19, 0.5, "UNPROVEN"),
    (100, 100, None, "UNPROVEN"),
])
def test_status_rules(passed: int, n: int, threshold: float | None, status: str) -> None:
    assert MG.status_for(passed, n, threshold) == status


def _shard(index: int, passes: int, fails: int, refused: int = 0, *,
           meta: RunMeta = META, source: str = "S01", group: str = "a/b/c") -> dict[str, Any]:
    acc = Accumulator()
    statuses = [PASS] * passes + [FAIL] * fails + [REFUSED] * refused
    for n, status in enumerate(statuses):
        rows = [("gender", FACE_CHECK, status, 0.01 * (n % 7 + 1), "low" if status else ""),
                ("gender", "identity", status, 0.01, "low" if status else "")]
        acc.add_item(f"{index:032x}{n:032x}", source, group, rows)
    return build_result(meta, index, f"m{index}", acc.result(), acc.failure_list(), acc.faces,
                        planned=len(statuses), complete=True)


def test_exact_merge_of_400_shards() -> None:
    shards = [_shard(i, 40 + i % 5, i % 3, 1, source=f"S0{1 + i % 3}",
                     group=f"g{i % 4}") for i in range(400)]
    merged = MG.merge_results(shards)
    assert merged.shards == list(range(400))
    expect_pass = sum(40 + i % 5 for i in range(400))
    expect_fail = sum(i % 3 for i in range(400))
    assert merged.items == expect_pass + expect_fail + 400
    rep = MG.report(merged, THRESHOLDS)
    (gender,) = rep["modules"]
    assert gender["passed"] == expect_pass
    assert gender["n"] == expect_pass + expect_fail
    assert gender["refused"] == 400
    assert gender["rate"] == pytest.approx(expect_pass / (expect_pass + expect_fail), abs=1e-6)
    assert gender["status"] in {"PASS", "FAIL", "UNPROVEN"}
    assert {r["group"] for r in rep["module_group"]} == {"g0", "g1", "g2", "g3"}
    assert {r["source"] for r in rep["module_source"]} == {"S01", "S02", "S03"}
    assert sum(r["n"] for r in rep["module_source"]) == gender["n"]
    assert len(rep["worst_slices"]) <= 20
    assert rep["worst_slices"][0]["ci_high"] <= rep["worst_slices"][-1]["ci_high"]


def test_merge_is_order_free() -> None:
    shards = [_shard(i, 30, i % 4) for i in range(12)]
    a = MG.report(MG.merge_results(shards), THRESHOLDS)
    b = MG.report(MG.merge_results(list(reversed(shards))), THRESHOLDS)
    assert a["modules"] == b["modules"]


@pytest.mark.parametrize("field", ["run_id", "plan_hash", "tier", "working_side", "engine_hash"])
def test_mixed_identity_is_refused(field: str) -> None:
    other = RunMeta(**{**META.as_dict(), "modules": META.modules,
                       field: 128 if field == "working_side" else "other"})
    with pytest.raises(MG.MergeError, match=f"mixed {field}"):
        MG.merge_results([_shard(0, 5, 0), _shard(1, 5, 0, meta=other)])


def test_repeated_shard_and_empty_input_are_refused() -> None:
    with pytest.raises(MG.MergeError, match="twice"):
        MG.merge_results([_shard(0, 5, 0), _shard(0, 5, 0)])
    with pytest.raises(MG.MergeError, match="no shard"):
        MG.merge_results([])


def test_plan_family_allows_extended_plans() -> None:
    newer = RunMeta(**{**META.as_dict(), "modules": META.modules, "plan_hash": "plan-b"})
    shards = [_shard(0, 5, 0), _shard(1, 5, 0, meta=newer)]
    merged = MG.merge_results(shards, {"plan-a", "plan-b"})
    assert merged.items == 10
    with pytest.raises(MG.MergeError, match="family"):
        MG.merge_results(shards, {"plan-b"})


def test_incomplete_shards_are_listed() -> None:
    shard = _shard(3, 5, 0)
    shard["complete"] = False
    merged = MG.merge_results([shard, _shard(4, 5, 0)])
    assert merged.incomplete == [3]


def test_thresholds_are_validated() -> None:
    with pytest.raises(MG.MergeError, match="format"):
        MG.load_thresholds({"modules": {}})
    with pytest.raises(MG.MergeError, match="rate"):
        MG.load_thresholds({"format": MG.THRESHOLD_FORMAT, "modules": {"x": 2}})
    with pytest.raises(MG.MergeError, match="default"):
        MG.load_thresholds({"format": MG.THRESHOLD_FORMAT, "modules": {}, "default": "x"})
    t = MG.load_thresholds({"format": MG.THRESHOLD_FORMAT, "modules": {}, "default": 0.8})
    assert t.get("anything") == 0.8


def test_markdown_report_has_the_tables() -> None:
    rep = MG.report(MG.merge_results([_shard(i, 30, 2) for i in range(3)]), THRESHOLDS)
    text = MG.markdown(rep)
    assert text.startswith("# Facescale test results")
    assert "## Worst 20 slices" in text and "| gender |" in text
    assert "eng-1" in text


def test_read_results_reports_bad_files(tmp_path: Any) -> None:
    bad = tmp_path / "shard-00000.json.gz"
    bad.write_bytes(b"broken")
    with pytest.raises(MG.MergeError, match="shard-00000"):
        MG.read_results([bad])
