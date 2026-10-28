"""Tests for reading C13 runner results into exact per-image fairness rows.

The C13 results here are written by hand in the documented
``beljour-facescale-shard/1`` shape; hashes are SHA-256 of small integers.
Author: John Khan.
"""

from __future__ import annotations

import gzip
import hashlib
import json
from pathlib import Path

import pytest

from lab.facescale_synth.cli import main
from lab.facescale_synth.fairness.facescale import (
    FacescaleError,
    code_of,
    read_failure_rows,
    read_shard_results,
    rows_from_facescale,
)
from lab.facescale_synth.fairness.report import Thresholds, build_report
from lab.facescale_synth.fairness.traits import TraitRecord, parse_tags, write_records

CELL_FIELDS = [
    "module",
    "check",
    "source",
    "group",
    "pass",
    "fail",
    "refused",
    "error",
    "seconds_sum",
    "seconds_n",
    "p50",
    "p95",
    "hist",
]


def _hash(i: int) -> str:
    return hashlib.sha256(str(i).encode()).hexdigest()


def _records(count: int) -> dict[str, TraitRecord]:
    out = {}
    for i in range(count):
        band = "VI" if i % 2 else "I"
        tags = parse_tags({"fitzpatrick": band, "age_band": "30-39"})
        out[_hash(i)] = TraitRecord(_hash(i), "S20", tags, "stress approximation")
    return out


def _result(shard: int, items: int, cells: list[list[object]]) -> dict[str, object]:
    return {
        "format": "beljour-facescale-shard/1",
        "run_id": "run1",
        "plan_hash": "p" * 8,
        "shard_index": shard,
        "sources": {"S20": items},
        "cell_fields": CELL_FIELDS,
        "cells": cells,
        "failures": [],
    }


def _cell(check: str, passed: int, failed: int, refused: int = 0) -> list[object]:
    return [
        "regions",
        check,
        "S20",
        "unlabelled",
        passed,
        failed,
        refused,
        0,
        0.0,
        0,
        None,
        None,
        [],
    ]


def _run() -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    """40 tagged items over two shards; 'eyes' fails every odd (band VI) item except 5 refusals."""
    failures = []
    for i in range(1, 40, 2):
        status = 2 if i < 10 else 1
        failures.append(
            {
                "face": _hash(i)[:16],
                "source": "S20",
                "group": "unlabelled",
                "module": "regions",
                "check": "eyes",
                "status": status,
                "reason": "" if status == 2 else "Landmark Miss",
            }
        )
    results = [
        _result(0, 20, [_cell("eyes", 10, 5, 5), _cell("__face__", 10, 10), _cell("mouth", 20, 0)]),
        _result(1, 20, [_cell("eyes", 10, 10), _cell("__face__", 10, 10), _cell("mouth", 20, 0)]),
    ]
    return results, failures


def test_rows_are_rebuilt_exactly_per_image() -> None:
    results, failures = _run()
    joined = rows_from_facescale(results, failures, _records(40), "S20")
    assert {(r.module, r.check) for r in joined.rows} == {("regions", "eyes"), ("regions", "mouth")}
    eyes = [r for r in joined.rows if r.check == "eyes"]
    assert len(eyes) == 40
    assert all(r.passed == (r.values["fitzpatrick"] == "I") for r in eyes)
    reasons = {r.reason for r in eyes if not r.passed}
    assert reasons == {"refused", "landmark_miss"}
    report = build_report(joined, Thresholds(0.8), families=["fitzpatrick"], min_n=10)
    status = {(c.check, c.slice[0][1]): c.status for c in report.cells}
    assert status[("eyes", "VI")] == "FAIL" and status[("eyes", "I")] == "PASS"
    assert status[("mouth", "VI")] == "PASS"


def test_capped_failure_rows_are_refused() -> None:
    results, failures = _run()
    with pytest.raises(FacescaleError, match="uncapped"):
        rows_from_facescale(results, failures[:-1], _records(40), "S20")


def test_partial_runs_and_unknown_images_are_refused() -> None:
    results, failures = _run()
    with pytest.raises(FacescaleError, match="tagged"):
        rows_from_facescale(results, failures, _records(41), "S20")
    stray = [*failures, {**failures[0], "face": "f" * 16}]
    with pytest.raises(FacescaleError, match="outside"):
        rows_from_facescale(results, stray, _records(40), "S20")
    with pytest.raises(FacescaleError, match="no trait records"):
        rows_from_facescale(results, failures, _records(40), "S21")


def test_files_read_plain_or_gzipped(tmp_path: Path) -> None:
    results, failures = _run()
    plain = tmp_path / "s0.json"
    plain.write_text(json.dumps(results[0]))
    packed = tmp_path / "s1.json.gz"
    packed.write_bytes(gzip.compress(json.dumps(results[1]).encode()))
    loaded = read_shard_results([plain, packed])
    assert [r["shard_index"] for r in loaded] == [0, 1]
    rows = tmp_path / "failures.jsonl.gz"
    rows.write_bytes(gzip.compress("".join(json.dumps(f) + "\n" for f in failures).encode()))
    assert len(list(read_failure_rows([rows]))) == 20
    other = dict(results[1])
    other["run_id"] = "run2"
    (tmp_path / "s2.json").write_text(json.dumps(other))
    with pytest.raises(FacescaleError, match="more than one run"):
        read_shard_results([plain, tmp_path / "s2.json"])
    (tmp_path / "bad.json").write_text(json.dumps({"format": "x"}))
    with pytest.raises(FacescaleError, match="not a"):
        read_shard_results([tmp_path / "bad.json"])


def test_code_of_makes_safe_codes() -> None:
    assert code_of("Landmark Miss") == "landmark_miss"
    assert code_of("warp_turn") == "warp_turn"
    assert code_of("3d/pose!") == "c_3d_pose"
    assert code_of("") == "c_"


def test_cli_reads_c13_results(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    results, failures = _run()
    tags = tmp_path / "tags.jsonl"
    write_records(tags, _records(40).values())
    shard_files = []
    for result in results:
        path = tmp_path / f"s{result['shard_index']}.json.gz"
        path.write_bytes(gzip.compress(json.dumps(result).encode()))
        shard_files.append(str(path))
    rows = tmp_path / "failures.jsonl"
    rows.write_text("".join(json.dumps(f) + "\n" for f in failures))
    thresholds = tmp_path / "thresholds.json"
    thresholds.write_text(json.dumps({"format": "beljour-thresholds/1", "default": 0.8}))
    argv = ["fairness", "report", "--tags", str(tags), "--thresholds", str(thresholds)]
    argv += ["--facescale-results", *shard_files, "--facescale-failures", str(rows)]
    argv += ["--families", "fitzpatrick", "--out", str(tmp_path / "out")]
    assert main(argv) == 0
    assert '"fail": 1' in capsys.readouterr().out
    assert main([*argv[:-1], str(tmp_path / "out2"), "--facescale-source", "S20"]) == 0
    short = [*argv]
    short[short.index(str(rows))] = str(tmp_path / "empty.jsonl")
    (tmp_path / "empty.jsonl").write_text("")
    short[-1] = str(tmp_path / "out3")
    assert main(short) == 2
    assert "uncapped" in capsys.readouterr().err
