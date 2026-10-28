"""Registered W rows require actual test paths; stale Planned status must fail.

Existing gaps cannot be counted as Built merely to increase a score.
Author: John Khan.
"""
from __future__ import annotations

import copy
import importlib
from collections import Counter
from pathlib import Path

import pytest

from plumb_api.arena import women

ROOT = Path(__file__).resolve().parents[2]


def source() -> dict:
    return women.load_source()


def generator():
    return importlib.import_module("api.scripts.women_registry")


def test_all_built_rows_name_existing_implementation_and_tests() -> None:
    cases = women.build_rows(source())
    assert len(cases) == 100
    assert Counter(item["status"] for item in cases) == {
        "built": 92,
        "planned": 6,
        "blocked": 2,
    }
    for case in cases:
        if case["status"] == "built":
            assert case["modules"] and case["tests"], case["id"]
            assert all((ROOT / path).is_file() for path in case["modules"]), case["id"]
            assert all((ROOT / path).is_file() for path in case["tests"]), case["id"]
            assert case["tested"] == "Not tested"
        else:
            assert not case.get("modules"), case["id"]
    assert women.validate_women(cases) == []


def test_build_with_no_test_paths_is_rejected() -> None:
    modified = source()
    sample = modified["features"][10]
    sample["tests"] = []
    with pytest.raises(ValueError, match="built source must name test"):
        women.build_rows(modified)


def test_generator_detects_a_previously_built_engine_falsely_planned() -> None:
    modified = copy.deepcopy(source())
    modified["features"][3]["status"] = "planned"
    errors = generator().validate_declared_evidence(modified)
    assert any("W4" in error and "planned" in error for error in errors)


def test_generator_detects_malformed_and_missing_test_paths() -> None:
    modified = copy.deepcopy(source())
    modified["features"][9]["tests"] = ["api/tests/not-a-real-test.py"]
    errors = generator().validate_declared_evidence(modified)
    assert any("W10" in error and "missing authored test" in error for error in errors)
    modified["features"][9]["tests"] = []
    errors = generator().validate_declared_evidence(modified)
    assert any("W10" in error and "without authored test" in error for error in errors)


def test_unbuilt_medical_and_brand_dependent_rows_stay_unproven() -> None:
    blocked = {row["id"]: row for row in women.build_rows(source())}
    for feature in ("W3", "W14"):
        assert blocked[feature]["status"] == "blocked"
    for feature in ("W41", "W42", "W68", "W74", "W95", "W97"):
        assert blocked[feature]["status"] == "planned"
    assert all(item["tested"] == "Not tested" for item in blocked.values())
    assert all("scores" not in item for item in blocked.values())
