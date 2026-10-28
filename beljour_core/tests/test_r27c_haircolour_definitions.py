"""Proof the local colour evidence adds gates without weakening W28/W39 parents.

Definitions are evaluated without loading a photo or model.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
FOLDER = ROOT / "tests/realface/pass_definitions_r27c"
PARENT = ROOT / "tests/realface/pass_definitions"


def test_new_supplemental_definition_is_versioned_and_unproven() -> None:
    definition = json.loads((FOLDER / "observed_hair_colour.json").read_text(encoding="utf-8"))
    assert definition["version"] == 1
    assert definition["author"] == "John Khan"
    assert definition["status"] == "UNPROVEN"
    assert definition["scope"] == ["W28", "W39"]
    assert "frozen-1000" in definition["face_sets"]
    assert "frozen-10000" in definition["face_sets"]
    assert definition["supplemental_checks"]["outside_changed_pixels_max"] == 0
    assert definition["supplemental_checks"]["alpha_changed_pixels_max"] == 0
    assert definition["supplemental_checks"]["neutral_level_changed_pixels_max"] == 0
    assert definition["supplemental_checks"]["mask_observed_false_status"] == "UNPROVEN"
    assert definition["supplemental_checks"]["simulated_results_do_not_count_as_realface_pass"]


@pytest.mark.parametrize("parent", ["balayage_w28.json", "curl_w39.json"])
def test_written_parent_quality_thresholds_are_not_relaxed(parent: str) -> None:
    definition = json.loads((FOLDER / "observed_hair_colour.json").read_text(encoding="utf-8"))
    previous = json.loads((PARENT / parent).read_text(encoding="utf-8"))
    assert previous["format"] == "beljour-realface-pass/1"
    assert definition["inherited_gate"]["overall_min"] >= previous["threshold"]["overall"]
    assert definition["inherited_gate"]["every_slice_min"] >= previous["threshold"]["every_slice"]
    assert definition["inherited_gate"]["minimum_slice_faces"] <= previous["minimum_slice_faces"]
    assert definition["inherited_gate"]["max_regression_drop"] <= previous["regression"]["max_drop"]
    expected = f"tests/realface/pass_definitions/{parent}"
    assert expected in definition["parent_definitions"]


def test_readme_does_not_claim_measured_realface_pass() -> None:
    text = (FOLDER / "README.md").read_text(encoding="utf-8")
    assert "UNPROVEN" in text
    assert "Author: John Khan" in text
    assert "95%" in text
    assert "parent" in text.lower()
