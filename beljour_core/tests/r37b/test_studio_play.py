from __future__ import annotations

from pathlib import Path

import pytest

from plumb_api.filters.qa import cover, proof_wall
from plumb_api.filters import studio_play


def _benchmark(recipes: list[dict[str, object]]) -> dict[str, object]:
    entries = []
    for recipe in recipes:
        entries.append({
            "id": recipe["id"],
            "version": recipe["version"],
            "rank": recipe["rank"],
            "coldMs": 9.1 + float(recipe["rank"]),
            "warmSamplesMs": [6.2, 6.4, 6.5, 6.3, 6.35, 6.45, 6.55],
            "warmP50Ms": 6.4,
            "warmP95Ms": 6.535,
            "outputSha256": "b" * 64,
        })
    return {
        "format": "beljour-filter-latency-v1",
        "generatedAtUtc": "2026-10-25T17:00:00Z",
        "scope": "synthetic_node_v8_not_browser_or_real_faces",
        "runtime": "node_v8_web_filter_engine",
        "platform": {"os": "linux", "arch": "x64", "node": "v22.16.0"},
        "timing": {
            "clock": "performance.now",
            "cold": "clear LUT then render once",
            "warm": "same LUT, complete render",
            "repetitions": 7,
            "quantile": "linear_interpolation_sorted_samples",
            "parallelism": 1,
        },
        "fixture": {
            "kind": "code_drawn_portrait",
            "width": 80,
            "height": 96,
            "channels": 3,
            "skinMask": True,
            "personMask": True,
            "inputSha256": "a" * 64,
        },
        "recipeManifestSha256": proof_wall._manifest_hash(recipes),
        "webSourceSha256": proof_wall._source_tree_hash(),
        "realFacesEvaluated": 0,
        "mobileOrBrowserBudgetVerified": False,
        "filters": entries,
    }


def test_validate_and_resolve_pack() -> None:
    assert studio_play.pack_names() == ("lut-class",)
    assert studio_play.validate("lut-class") == []
    recipes = studio_play.resolve_pack("lut-class")
    assert [recipe["id"] for recipe in recipes] == ["SP01", "SP02", "SP03", "SP04"]
    assert {recipe["editorial"]["family"] for recipe in recipes} == {
        "Masthead", "Cover Evening", "Editorial Day", "Heritage"
    }
    assert all(not recipe["presets"] for recipe in recipes)
    assert all(recipe["stages"] for recipe in recipes)


def test_cover_gate_passes_for_lut_pack() -> None:
    recipes = studio_play.resolve_pack("lut-class")
    rows = cover.evaluate_many(recipes)
    audit = cover.cover_gate(recipes, rows)
    assert audit["complete"] is True
    assert audit["problems"] == []
    assert cover.summary(rows)["passes"] == len(rows)


def test_manifest_and_licence_rows() -> None:
    manifest = studio_play.manifest("lut-class")
    assert manifest["format"] == "beljour-studio-play/1"
    assert len(manifest["looks"]) == 4
    rows = studio_play.licence_rows("lut-class")
    assert len(rows) == 8
    assert all(row["licence"].startswith("BELJOUR") for row in rows)


def test_proof_wall_publish_for_lut_pack(tmp_path: Path) -> None:
    recipes = studio_play.resolve_pack("lut-class")
    rows = cover.evaluate_many(recipes)
    proof = proof_wall.build_proof(recipes, rows, _benchmark(recipes), required_filters=4)
    paths = proof_wall.publish(tmp_path, proof)
    assert set(paths) == {"grades", "latency", "proof", "summary"}
    assert paths["grades"].read_text(encoding="utf-8").splitlines()[0].startswith("rank,id,name")
    assert "BELJOUR" in paths["summary"].read_text(encoding="utf-8")


def test_duplicate_or_missing_pack_rows_are_refused() -> None:
    recipes = studio_play.resolve_pack("lut-class")
    rows = cover.evaluate_many(recipes)
    with pytest.raises(ValueError, match="expected 4"):
        proof_wall.build_proof(recipes[:-1], rows[:-6], _benchmark(recipes[:-1]), required_filters=4)
