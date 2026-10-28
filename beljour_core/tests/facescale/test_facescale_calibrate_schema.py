"""Calibration drift table and the shard result schema.

Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from lab.facescale import calibrate as CB
from lab.facescale import merge as MG
from lab.facescale import schema as SC
from lab.facescale.loaders import loader_for
from lab.facescale.metrics import FACE_CHECK, FAIL, PASS, Accumulator
from lab.facescale.registry import load_local
from lab.facescale.results import RunMeta, build_result
from lab.facescale.resume import read_json, shard_name
from lab.facescale.shards import build_plan, save_plan, scan
from lab.facescale.synthetic import all_layouts, sources_file


def _merged(side: int, fail_every: int) -> dict[str, Any]:
    meta = RunMeta("fs", "plan", 1, side, "core", ("gender",), "fake")
    acc = Accumulator()
    for n in range(400):
        status = FAIL if n % fail_every == 0 else PASS
        acc.add_item(f"{n:064x}", "S01", "g", [("gender", FACE_CHECK, status, 0.1, "")])
    shard = build_result(meta, 0, "m", acc.result(), [], acc.faces, planned=400, complete=True)
    thresholds = MG.load_thresholds({"format": MG.THRESHOLD_FORMAT, "modules": {}})
    return MG.report(MG.merge_results([shard]), thresholds)


def test_drift_table_flags_modules_whose_intervals_split() -> None:
    table = CB.drift_table(_merged(640, 50), _merged(256, 3))
    (row,) = table["modules"]
    assert row["rate_gate"] == pytest.approx(0.98) and row["drift"] < -0.25
    assert row["intervals_overlap"] is False and table["drifted"] == ["gender"]
    same = CB.drift_table(_merged(640, 50), _merged(256, 49))
    assert same["drifted"] == []
    assert "| gender |" in CB.drift_markdown(table)


def test_drift_table_refusals() -> None:
    with pytest.raises(CB.CalibrationError, match="same working side"):
        CB.drift_table(_merged(256, 5), _merged(256, 5))
    other = _merged(256, 5)
    other["identity"]["tier"] = "full"
    with pytest.raises(CB.CalibrationError, match="tier"):
        CB.drift_table(_merged(640, 5), other)


def test_real_shard_result_matches_the_schema(tmp_path: Path) -> None:
    from lab.facescale import checkers as C
    from lab.facescale import pool as PL
    from lab.facescale import runner as RN

    local = load_local(sources_file(tmp_path / "s.json", all_layouts(tmp_path / "sets")))
    plan = build_plan(scan([loader_for(e) for e in local.values()]), shard_size=30)
    save_plan(plan, tmp_path / "plan")
    config = RN.ShardConfig(tmp_path / "plan", 0, tmp_path / "out", local, C.fake_spec(),
                            "core", 128, PL.plan_workers(2, 2**33, 2**20, 1))
    RN.run_shard(config)
    data = read_json(tmp_path / "out" / shard_name(0))
    assert SC.validate(data, SC.load_schema()) == []


def test_schema_catches_damage() -> None:
    schema = SC.load_schema()
    assert schema["title"] == "beljour-facescale-shard/1"
    assert SC.validate({"format": "x"}, schema)[0].startswith("$: missing")
    problems = SC.validate({"cells": [["a"]], "tier": "huge", "working_side": 9000,
                            "complete": 1, "failures": [["x" * 80] * 5]},
                           {"type": "object", "properties": schema["properties"]})
    text = json.dumps(problems)
    for expected in ("fewer than 13", "not in", "above 640", "expected boolean", "longer"):
        assert expected in text
    assert SC.validate(True, {"type": "integer"}) != []
    assert SC.validate(None, {"type": ["number", "null"]}) == []
    assert SC.validate({"a": 1}, {"type": "object", "additionalProperties": False}) != []
