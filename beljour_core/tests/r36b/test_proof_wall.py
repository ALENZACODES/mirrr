"""BELJOUR reproducible Cover Test and Node timing handoff invariants.

Small timing data in this unit test is fabricated to exercise validation only.
The exported proof files come from the measured Node bench, not unit tests.
Created by John Khan.
"""
from __future__ import annotations

import copy
import csv
import json
from dataclasses import replace
from pathlib import Path
from typing import Any

import pytest

from plumb_api.filters.qa import cover, proof_wall
from plumb_api.filters.recipe import registry

CAT = registry.default()
RECIPES = CAT.ranked()[:2]


@pytest.fixture(scope="module")
def rows() -> list[cover.CoverResult]:
    return cover.evaluate_many(RECIPES)


@pytest.fixture
def timing() -> dict[str, Any]:
    """Validation-only data, not a timing claim or proof artefact."""
    return {
        "format": "beljour-filter-latency-v1",
        "generatedAtUtc": "2026-10-25T20:00:00Z",
        "scope": "synthetic_node_v8_not_browser_or_real_faces",
        "runtime": "node_v8_web_filter_engine",
        "platform": {"os": "linux", "arch": "x64", "node": "v22.16.0"},
        "timing": {"clock": "performance.now", "quantile": "linear_interpolation_sorted_samples",
                   "parallelism": 1, "repetitions": 3},
        "fixture": {"kind": "code_drawn_portrait", "width": 80, "height": 96,
                    "channels": 3, "skinMask": True, "personMask": True,
                    "inputSha256": "c" * 64},
        "recipeManifestSha256": proof_wall._manifest_hash(RECIPES),
        "webSourceSha256": proof_wall._source_tree_hash(),
        "realFacesEvaluated": 0,
        "mobileOrBrowserBudgetVerified": False,
        "filters": [
            {"id": recipe["id"], "version": recipe["version"], "rank": recipe["rank"],
             "coldMs": 22.0, "warmSamplesMs": [10.0, 11.0, 12.0], "warmP50Ms": 11.0,
             "warmP95Ms": 11.9, "outputSha256": "a" * 64}
            for recipe in RECIPES
        ],
    }


def test_valid_complete_two_recipe_handoff(rows: list[cover.CoverResult],
                                            timing: dict[str, Any]) -> None:
    proof = proof_wall.build_proof(RECIPES, rows, timing, required_filters=2)
    assert proof["summary"]["passes"] == 12
    assert proof["summary"]["evaluated"] == 12
    assert proof["summary"]["realFacesEvaluated"] == 0
    assert proof["summary"]["syntheticGrade"] == "S6/6"
    assert len(proof["grades"]) == len(proof["latency"]) == 2
    for grade, measured in zip(proof["grades"], proof["latency"], strict=True):
        assert grade["syntheticGrade"] == "S6/6"
        assert grade["tonesPassed"] == 6
        assert grade["identityDriftMax"] >= 0
        assert grade["textureAlignmentMin"] <= 1
        assert grade["id"] == measured["id"]
        assert grade["realFacesEvaluated"] == 0
        assert measured["warmP50Ms"] == 11
        assert measured["warmP95Ms"] == 11.9
        assert measured["mobileOrBrowserBudgetVerified"] is False
    assert "UNVERIFIED" in proof["claims"]["release"]
    assert "not browser" in proof["claims"]["latency"]


def test_proof_rejects_subset_falsely_claimed_as_all(rows: list[cover.CoverResult],
                                                     timing: dict[str, Any]) -> None:
    with pytest.raises(ValueError, match="expected 61"):
        proof_wall.build_proof(RECIPES, rows, timing)


def test_proof_rejects_missing_skin_tone(rows: list[cover.CoverResult],
                                         timing: dict[str, Any]) -> None:
    with pytest.raises(ValueError, match="missing"):
        proof_wall.build_proof(RECIPES, rows[1:], timing, required_filters=2)


def test_proof_rejects_forged_pass_flag(rows: list[cover.CoverResult],
                                        timing: dict[str, Any]) -> None:
    altered = replace(rows[0], metrics=replace(rows[0].metrics, identity_drift=0.95),
                      problems=())
    with pytest.raises(ValueError, match="problem list"):
        proof_wall.build_proof(RECIPES, [altered, *rows[1:]], timing,
                               required_filters=2)


def test_proof_rejects_duplicate_records(rows: list[cover.CoverResult],
                                         timing: dict[str, Any]) -> None:
    with pytest.raises(ValueError, match="repeated"):
        proof_wall.build_proof(RECIPES, [*rows, rows[0]], timing,
                               required_filters=2)


def test_proof_rejects_swapped_family(rows: list[cover.CoverResult],
                                      timing: dict[str, Any]) -> None:
    altered = replace(rows[0], family="Heritage")
    with pytest.raises(ValueError, match="metadata"):
        proof_wall.build_proof(RECIPES, [altered, *rows[1:]], timing,
                               required_filters=2)


@pytest.mark.parametrize("key,value,match", [
    ("format", "untrusted", "format"),
    ("scope", "browser", "synthetic"),
    ("runtime", "browser", "runtime"),
    ("realFacesEvaluated", 100000, "real-face"),
    ("mobileOrBrowserBudgetVerified", True, "mobile/browser"),
    ("recipeManifestSha256", "wrong", "catalogue"),
    ("webSourceSha256", "wrong", "source has changed"),
    ("generatedAtUtc", "garbage", "timestamp"),
])
def test_latency_claims_fail_closed(rows: list[cover.CoverResult],
                                    timing: dict[str, Any], key: str,
                                    value: Any, match: str) -> None:
    timing[key] = value
    with pytest.raises(ValueError, match=match):
        proof_wall.build_proof(RECIPES, rows, timing, required_filters=2)


@pytest.mark.parametrize("broken", [float("nan"), float("inf"), -1, None, "7", True])
def test_latency_rejects_invalid_warm_samples(timing: dict[str, Any], broken: Any) -> None:
    timing["filters"][0]["warmSamplesMs"][1] = broken
    with pytest.raises(ValueError, match="finite number|positive and finite"):
        proof_wall.verify_latency(timing, RECIPES)


def test_latency_rejects_missing_filter(timing: dict[str, Any]) -> None:
    timing["filters"].pop()
    with pytest.raises(ValueError, match="every"):
        proof_wall.verify_latency(timing, RECIPES)


def test_latency_rejects_out_of_order_ids(timing: dict[str, Any]) -> None:
    timing["filters"].reverse()
    with pytest.raises(ValueError, match="out-of-order"):
        proof_wall.verify_latency(timing, RECIPES)


def test_latency_rejects_forced_fast_p95(timing: dict[str, Any]) -> None:
    timing["filters"][0]["warmP95Ms"] = 3.0
    with pytest.raises(ValueError, match="p95"):
        proof_wall.verify_latency(timing, RECIPES)


def test_latency_rejects_forced_fast_p50(timing: dict[str, Any]) -> None:
    timing["filters"][0]["warmP50Ms"] = 3.0
    with pytest.raises(ValueError, match="p50"):
        proof_wall.verify_latency(timing, RECIPES)


def test_latency_rejects_missing_output_hash(timing: dict[str, Any]) -> None:
    timing["filters"][0]["outputSha256"] = ""
    with pytest.raises(ValueError, match="digest"):
        proof_wall.verify_latency(timing, RECIPES)


def test_latency_rejects_missing_mask_metadata(timing: dict[str, Any]) -> None:
    timing["fixture"]["skinMask"] = False
    with pytest.raises(ValueError, match="fixture"):
        proof_wall.verify_latency(timing, RECIPES)


def test_json_and_two_csv_exports(tmp_path: Path, rows: list[cover.CoverResult],
                                  timing: dict[str, Any]) -> None:
    proof = proof_wall.build_proof(RECIPES, rows, timing, required_filters=2)
    paths = proof_wall.publish(tmp_path / "proof", proof)
    assert set(paths) == {"grades", "latency", "proof", "summary"}
    assert all(path.exists() for path in paths.values())
    with paths["grades"].open(encoding="utf-8", newline="") as stream:
        grades = list(csv.DictReader(stream))
    with paths["latency"].open(encoding="utf-8", newline="") as stream:
        latency = list(csv.DictReader(stream))
    assert len(grades) == len(latency) == 2
    assert grades[0]["syntheticGrade"] == "S6/6"
    assert latency[0]["warmP50Ms"] == "11.0"
    assert json.loads(paths["proof"].read_text(encoding="utf-8")) == proof
    summary = paths["summary"].read_text(encoding="utf-8")
    assert "UNVERIFIED" in summary
    assert "not a browser or mobile-performance claim" in summary


def test_export_rejects_swapped_id(tmp_path: Path, rows: list[cover.CoverResult],
                                   timing: dict[str, Any]) -> None:
    proof = proof_wall.build_proof(RECIPES, rows, timing, required_filters=2)
    broken = copy.deepcopy(proof)
    broken["latency"][1]["id"] = "wrong"
    with pytest.raises(ValueError, match="exact graded"):
        proof_wall.publish(tmp_path, broken)


def test_export_rejects_missing_latency(tmp_path: Path, rows: list[cover.CoverResult],
                                        timing: dict[str, Any]) -> None:
    proof = proof_wall.build_proof(RECIPES, rows, timing, required_filters=2)
    broken = copy.deepcopy(proof)
    broken["latency"].pop()
    with pytest.raises(ValueError, match="equal"):
        proof_wall.publish(tmp_path, broken)
