"""Versioned 82-slot tier gate is written, not executed against real faces.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

from plumb_api.commands.quality_tiers import TIER_LONG_EDGES


def test_quality_tier_gate_definitions_have_matching_nonrelease_criteria() -> None:
    root = Path(__file__).resolve().parents[3]
    definition = root / "tests/realface/pass_definitions_r13h/quality_generator_tiers.json"
    raw = json.loads(definition.read_text(encoding="utf-8"))
    assert raw["status"] == "NOT_RUN"
    assert raw["owner"] == "H" and raw["author"] == "John Khan"
    assert {row["name"]: row["minimum_output_long_edge"] for row in raw["tiers"]} == TIER_LONG_EDGES
    assert raw["required_supplemental_slots"] == 82
    assert raw["existing_five_command_slots_unmodified"] == 205
    assert raw["mandatory_pipeline"] == ["cleanup", "upscale"]
    assert raw["identity_guard_default_on"] is True
    assert raw["strength_levels"]["count_per_tier"] == 41
    assert raw["required_external_face_count"] == 100000
    assert raw["required_evidence"]
    assert raw["existing_performance_budget_ms"] == {"preview": 100, "export": 2000}
    assert raw["production_identity_model_qualified"] is False
    assert raw["real_face_release_qualified"] is False
    assert raw["synthetic_results_must_not_clear_gate"] is True
