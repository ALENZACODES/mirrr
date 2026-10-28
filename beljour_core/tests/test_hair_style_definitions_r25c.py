"""Author: John Khan. Versioned criteria for R25c women style guides; definition-only validation."""

from __future__ import annotations

import json
from pathlib import Path

from plumb_api.engines.hair_women.style_guides import STYLE_KEYS, TEXTURES

ROOT = Path(__file__).resolve().parents[2]
DEFINITION = ROOT / "tests/realface/pass_definitions_r25c/women_style_guides.json"


def test_new_style_definition_covers_every_authored_id_once() -> None:
    definition = json.loads(DEFINITION.read_text(encoding="utf-8"))
    assert definition["format"] == "beljour-r25c-women-style-guide-acceptance/1"
    assert definition["version"] == 1
    assert definition["status"] == "UNPROVEN"
    assert tuple(definition["styles"]) == STYLE_KEYS
    assert len(set(definition["styles"])) == len(STYLE_KEYS)
    assert tuple(definition["textures"]) == TEXTURES
    assert definition["levels"] == [1.0, 2.0, 3.5, 5.0]
    assert definition["face_sets"] == ["frozen-1000", "frozen-10000"]


def test_written_mask_privacy_and_disclosure_limits_are_not_softened() -> None:
    definition = json.loads(DEFINITION.read_text(encoding="utf-8"))
    requirements = definition["requirement"]
    for name in ("off_mask_changed_pixels_max", "protected_changed_pixels_max",
                 "alpha_changed_pixels_max", "neutral_changed_pixels_max", "fold_count_max", "nan_count_max"):
        assert requirements[name] == 0
    for name in ("simulation_disclosure", "original_first", "identity_guard_default_on",
                 "no_mesh_counts_as_refusal_not_success", "each_style_requires_rendered_pixel_evidence"):
        assert requirements[name] is True
    assert requirements["provisional_appearance_status"] == "UNPROVEN"


def test_new_definition_preserves_historical_slice_rule_and_regression_floor() -> None:
    definition = json.loads(DEFINITION.read_text(encoding="utf-8"))
    acceptance = definition["acceptance"]
    assert acceptance["overall_min"] == 0.95
    assert acceptance["every_slice_min"] == 0.95
    assert acceptance["minimum_slice_faces"] == 1
    assert acceptance["missing_results_in_denominator"] is True
    assert acceptance["no_regression"] is True
    assert acceptance["max_regression_drop"] == 0.0
    assert acceptance["independent_human_review_required"] is True
    assert "hair_texture" in definition["group_reporting"]
    assert "intersection" in definition["group_reporting"]


def test_committed_gender_and_hair_definitions_are_not_replaced() -> None:
    definition = json.loads(DEFINITION.read_text(encoding="utf-8"))
    assert definition["parent_gate"] == "tests/realface/pass_definitions/hair_studio.json"
    assert definition["author"] == "John Khan"
    assert "local-masked-tonal-simulation" == definition["mode"]
    assert any("UNPROVEN" in entry for entry in definition["notes"])
