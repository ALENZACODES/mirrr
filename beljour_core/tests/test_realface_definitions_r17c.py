"""Preregistered Lane C quality definitions; structural evidence only, never face results.

The production runner belongs to Lane A. We import its unchanged validator by
absolute path rather than patching its ID registry, and explicitly refuse to
promote a standalone definition to an observed PASS. Author: John Khan.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

import pytest

from plumb_api.engines.menshair.render import available_presets

ROOT = Path(__file__).resolve().parents[2]
SPEC = ROOT / "tests" / "realface" / "definitions.py"
INPUTS = {
    "commerce_match": ROOT / "api" / "plumb_api" / "commerce" / "realface-commerce-match-r17c.json",
    "commerce_vto": ROOT / "api" / "plumb_api" / "commerce" / "realface-commerce-vto-r17c.json",
    "menshair_local": ROOT / "api" / "plumb_api" / "engines" / "menshair" / "realface-menshair-r17c.json",
}


def registry() -> Any:
    spec = importlib.util.spec_from_file_location("lane_c_read_only_realface_definitions", SPEC)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def load_definition(check_id: str) -> dict[str, Any]:
    value = json.loads(INPUTS[check_id].read_text(encoding="utf-8"))
    assert isinstance(value, dict)
    return value


@pytest.mark.parametrize("check_id", sorted(INPUTS))
def test_each_definition_passes_unmodified_lane_a_schema(check_id: str) -> None:
    validator = registry()
    data = load_definition(check_id)
    assert validator.validate(data, check_id) is data
    assert data["author"] == "John Khan"
    assert data["format"] == "beljour-realface-pass/1"
    assert data["version"] > 2
    assert data["test_kind"] == "quality"
    assert data["face_set"]["id"] == "frozen-10000"
    assert data["face_set"]["number_of_faces"] == 10000
    assert data["threshold"] == {"overall": 0.95, "every_slice": 0.95}
    assert data["regression"]["required"] is True
    assert data["regression"]["max_drop"] == 0.0
    assert data["regression"]["same_faces"] is True
    assert data["regression"]["same_definition"] is True
    assert data["required_monk_tones"] == list(map(str, range(1, 11)))
    assert data["required_matrix"]["gender"] == ["female", "male"]
    assert data["required_matrix"]["age"] == ["10-19", "20-29", "30-39", "40-59", "60+"]
    assert "monk_gender_age" in data["slices"]
    assert data["minimum_slice_faces"] == 1
    assert data["human_required"] is True
    assert data["expected_checks"] == len(data["expected_check_names"])
    assert data["expected_checks"] > 0
    assert "*" in data["rules"]
    assert all(check_id != row for row in validator.REGISTERED_IDS)


def test_menshair_checks_cover_every_published_style_once_without_duplicates() -> None:
    data = load_definition("menshair_local")
    authored = json.loads((ROOT / "api" / "plumb_api" / "engines" / "menshair" / "presets.json").read_text(encoding="utf8"))
    catalogue_ids = [style["id"] for style in authored["styles"]]
    published_ids = [style.id for style in available_presets()]
    expected = ["menshair:" + style_id for style_id in catalogue_ids]
    checks = data["expected_check_names"]
    assert published_ids == catalogue_ids, "the engine and source catalogue must agree on order"
    assert len(set(catalogue_ids)) == len(catalogue_ids), "catalogue IDs cannot repeat"
    assert data["expected_checks"] == len(expected)
    assert len(checks) == len(set(checks)) == len(expected), "no duplicate or missing checks"
    assert checks == expected, "every current published style needs exactly one quality check"
    assert all(name.startswith("menshair:local-") for name in checks)
    assert data["test_protocol"]["source_style_version"] == authored["version"]
    assert any(rule["field"] == "outside_mask_max_channel_delta" and rule["value"] == 0
               for rule in data["rules"]["*"])


@pytest.mark.parametrize("check_id", ["commerce_match", "commerce_vto", "menshair_local"])
def test_observations_without_matching_hash_or_real_measurements_cannot_pass(check_id: str) -> None:
    mod = registry()
    definition = load_definition(check_id)
    content_bytes = INPUTS[check_id].read_bytes()
    sha = hashlib.sha256(content_bytes).hexdigest()
    parsed = mod.Definition(check_id, sha, definition, committed=False)
    assert parsed.expected_faces == 10000
    for row in (
        {"check": definition["expected_check_names"][0], "metric_pass": True, "definition_sha256": "wrong"},
        {"check": definition["expected_check_names"][0], "metric_pass": True, "definition_sha256": sha},
        {"check": "exception", "metric_pass": True, "definition_sha256": sha},
        {"check": "made-up-check", "metric_pass": True, "definition_sha256": sha},
    ):
        assert parsed.row_problems(row), "An unmeasured/mismatched row must never claim PASS"


@pytest.mark.parametrize("check_id", sorted(INPUTS))
def test_looser_threshold_or_missing_slices_is_rejected(check_id: str) -> None:
    mod = registry()
    data = load_definition(check_id)
    data["threshold"]["every_slice"] = "pass"
    with pytest.raises(mod.DefinitionError):
        mod.validate(data, check_id)
    data = load_definition(check_id)
    data["required_monk_tones"].remove("10")
    with pytest.raises(mod.DefinitionError):
        mod.validate(data, check_id)
    data = load_definition(check_id)
    data["regression"]["max_drop"] = 0.001
    with pytest.raises(mod.DefinitionError):
        mod.validate(data, check_id)


def test_no_face_assets_are_packaged_with_lane_c_quality_definitions() -> None:
    for location in INPUTS.values():
        blob = location.read_bytes()
        assert location.suffix == ".json"
        assert blob.startswith(b"{\n")
        assert b"base64" not in blob and b"data:image" not in blob
        assert b"frozen-10000" in blob


def test_provider_10k_run_is_explicitly_not_claimed_as_completed() -> None:
    for check_id in ("commerce_match", "commerce_vto"):
        source = load_definition(check_id)
        description = json.dumps(source["test_protocol"])
        assert "provider" in description.lower() or "YouCam" in description
        assert "UNPROVEN" in description or "NOT measured" in description
    style = load_definition("menshair_local")
    authored = json.loads((ROOT / "api" / "plumb_api" / "engines" / "menshair" / "presets.json").read_text(encoding="utf8"))
    assert style["expected_checks"] == len(authored["styles"])
    assert style["expected_checks"] * style["face_set"]["number_of_faces"] == len(authored["styles"]) * 10000
