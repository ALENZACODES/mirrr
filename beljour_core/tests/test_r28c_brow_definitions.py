"""Validate the new written brow contract without running or opening faces.

The inherited engineering minimums remain untouched. Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

from plumb_api.engines.brows import BrowTrialSession, compare_brow_styles

ROOT = Path(__file__).resolve().parents[2]
DEFINITION = ROOT / "tests/realface/pass_definitions_r28c/brow_observed.json"


def test_definition_is_versioned_and_never_a_synthetic_quality_pass() -> None:
    row = json.loads(DEFINITION.read_text(encoding="utf-8"))
    assert row["version"] == 1
    assert row["author"] == "John Khan"
    assert row["scope"] == ["W69", "W70", "W72"]
    assert row["status"] == "UNPROVEN"
    assert row["human_required"]
    assert row["checks"]["simulated_appearance_cannot_satisfy_human_review"]
    assert row["face_sets"] == ["frozen-1000", "frozen-10000"]


def test_pass_contract_does_not_relax_existing_women_quality_floor() -> None:
    row = json.loads(DEFINITION.read_text(encoding="utf-8"))
    inherited = row["inherited_gate"]
    assert inherited["overall_min"] >= 0.95
    assert inherited["every_slice_min"] >= 0.95
    assert inherited["minimum_slice_faces"] <= 1
    assert inherited["max_regression_drop"] <= 0
    assert inherited["missing_results_count_in_denominator"]
    checks = row["checks"]
    assert checks["outside_changed_pixels_max"] == 0
    assert checks["protected_changed_pixels_max"] == 0
    assert checks["alpha_changed_pixels_max"] == 0
    assert checks["guard_called_on_eligible_previews"]


def test_public_brow_trial_and_board_exports_are_reachable() -> None:
    assert BrowTrialSession.__name__ == "BrowTrialSession"
    assert callable(compare_brow_styles)


def test_definition_readme_preserves_unproven_status() -> None:
    readme = (DEFINITION.parent / "README.md").read_text(encoding="utf-8")
    assert "UNPROVEN" in readme
    assert "Author: John Khan" in readme
    assert "95%" in readme
