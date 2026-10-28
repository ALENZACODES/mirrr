"""Validate preregistered W real-face definitions without processing faces.

Author: John Khan.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
DEFINITIONS = ROOT / "tests/realface/pass_definitions_r24c/definitions.py"


def load():
    spec = importlib.util.spec_from_file_location("women_r24c_definitions", DEFINITIONS)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    import sys

    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_r24c_definitions_are_unique_conservative_and_unproven() -> None:
    data = load()
    data.validate_definitions()
    assert set(data.BY_FEATURE) == {"W6", "W39", "W98", "W28", "W93"}
    assert len(data.DEFINITIONS) == 5
    for row in data.DEFINITIONS:
        assert row.guard_lock_default == 5.0
        assert row.require_identity_guard
        assert row.maximum_outside_mask_changes == 0
        assert row.maximum_alpha_changes == 0
        assert row.still_her_score == 100
        assert row.release_status == "UNPROVEN"
        assert "simulation" in row.disclosure
        assert len(row.groups) == 7
        assert row.required_evidence


@pytest.mark.parametrize("feature,limit", [("W6", 0), ("W39", 36), ("W98", 40), ("W28", 30), ("W93", 0)])
def test_feature_limits_match_previous_committed_realface_contract(feature: str, limit: int) -> None:
    row = load().BY_FEATURE[feature]
    assert row.maximum_rgb_channel_delta == limit


def test_missing_unseen_faces_cannot_satisfy_coverage() -> None:
    requirements = load().required_reporting()
    assert any("UNPROVEN" in text for text in requirements)
    assert any("not lower" in text for text in requirements)
    assert any("photographs" in text for text in requirements)
