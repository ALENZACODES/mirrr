"""Definition-parser, missing evidence, and real-face qualification boundaries.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.quality_r2h import decode_definition, evaluate_local_metrics, load_definition

DEFINITIONS = Path(__file__).resolve().parents[3] / "tests" / "realface" / "pass_definitions_r2h"


@pytest.mark.parametrize("command", ["cleanup", "upscale"])
def test_written_pass_definition_is_valid(command: str) -> None:
    definition = load_definition(DEFINITIONS / f"{command}.json")
    assert definition.key == command
    assert definition.minimum_faces == 100_000
    assert all(metric.unit for metric in definition.metrics)
    assert "identity_cosine" in {entry.name for entry in definition.metrics}


@pytest.mark.parametrize("command", ["cleanup", "upscale"])
def test_all_synthetic_pass_numbers_are_still_unproven(command: str) -> None:
    definition = load_definition(DEFINITIONS / f"{command}.json")
    measured = {
        entry.name: entry.threshold + (0.1 if entry.comparator == "at_least" else -0.1)
        for entry in definition.metrics
    }
    verdict = evaluate_local_metrics(definition, measured, sample_count=100_000)
    assert verdict.outcome == "unproven"
    assert verdict.realface_pass is False
    assert "frozen_realface_run_not_verified" in verdict.incomplete
    assert not verdict.failed


@pytest.mark.parametrize("command", ["cleanup", "upscale"])
def test_missing_identity_is_never_silently_accepted(command: str) -> None:
    definition = load_definition(DEFINITIONS / f"{command}.json")
    verdict = evaluate_local_metrics(definition, {}, external_verified=True, sample_count=100_000)
    assert verdict.outcome == "unproven"
    assert "identity_cosine" in verdict.incomplete


def test_failed_metric_stays_fail_even_if_realface_is_missing() -> None:
    definition = load_definition(DEFINITIONS / "cleanup.json")
    verdict = evaluate_local_metrics(definition, {"identity_cosine": 0.1})
    assert verdict.outcome == "fail"
    assert verdict.failed == ("identity_cosine",)


def test_cannot_mutate_pass_definition_with_extra_field() -> None:
    original = json.loads((DEFINITIONS / "upscale.json").read_text())
    original["unexpected"] = "not approved"
    with pytest.raises(CommandValidationError):
        decode_definition(original)


def test_metric_comparison_is_directional() -> None:
    definition = load_definition(DEFINITIONS / "cleanup.json")
    limits = {entry.name: entry.threshold for entry in definition.metrics}
    verdict = evaluate_local_metrics(definition, limits)
    assert verdict.outcome == "unproven"
    assert verdict.failed == ()
    limits["skin_max_lstar_increase"] = 8.0
    failing = evaluate_local_metrics(definition, limits)
    assert failing.outcome == "fail"
    assert failing.failed == ("skin_max_lstar_increase",)


@pytest.mark.parametrize("sample", [-1, 1.5, "100000", True])
def test_invalid_sample_count_fails(sample: object) -> None:
    definition = load_definition(DEFINITIONS / "upscale.json")
    with pytest.raises(CommandValidationError):
        evaluate_local_metrics(definition, {}, sample_count=sample)


def test_source_definitions_have_no_test_photographs() -> None:
    for path in DEFINITIONS.glob("*.json"):
        raw = path.read_text()
        assert "data:image" not in raw
        assert "image_path" not in raw
        assert "\"realface_pass\": true" not in raw
