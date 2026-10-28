"""Versioned gate schema, missing-data honesty, and external-release separation.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.quality_gate_r3h import (
    decode_r3h_definition,
    evaluate_r3h_gate,
    load_r3h_definition,
)


ROOT = Path(__file__).resolve().parents[3] / "tests" / "realface" / "pass_definitions_r3h"
NAMES = ("studioquality", "poseonly", "enhance", "denoise", "upscale")


@pytest.mark.parametrize("name", NAMES)
def test_every_definition_is_versioned_and_requires_frozen_100k(name: str) -> None:
    definition = load_r3h_definition(ROOT / f"{name}.json")
    assert definition.command == name
    assert definition.version == "beljour-pro-quality-gate/1"
    assert definition.minimum_faces == 100_000
    assert definition.assumptions is True
    assert "identity_cosine" in {metric.name for metric in definition.metrics}


@pytest.mark.parametrize("name", NAMES)
def test_missing_evidence_never_passes(name: str) -> None:
    definition = load_r3h_definition(ROOT / f"{name}.json")
    result = evaluate_r3h_gate(definition, {}, face_count=0)
    assert result.outcome == "unproven"
    assert "identity_cosine" in result.missing
    assert "frozen_realface_evidence_unverified" in result.missing
    assert not result.realface_pass


def test_bad_actual_metric_is_fail_not_hidden_by_missing_categories() -> None:
    definition = load_r3h_definition(ROOT / "studioquality.json")
    report = evaluate_r3h_gate(definition, {"identity_cosine": 0.20}, face_count=0)
    assert report.outcome == "fail"
    assert report.failed == ("identity_cosine",)
    assert not report.realface_pass


def test_unverified_full_face_count_does_not_pass() -> None:
    definition = load_r3h_definition(ROOT / "denoise.json")
    fields = {metric.name: metric.threshold for metric in definition.metrics}
    labels = definition.required_labels
    report = evaluate_r3h_gate(definition, fields, declared_labels=labels,
                               face_count=100_000, locked_external_evidence=False)
    assert report.outcome == "unproven"
    assert report.inspected == len(definition.metrics)
    assert report.failed == ()
    assert report.missing == ("frozen_realface_evidence_unverified",)


def test_even_verified_metrics_require_separate_release_gate() -> None:
    definition = load_r3h_definition(ROOT / "poseonly.json")
    fields = {metric.name: metric.threshold for metric in definition.metrics}
    report = evaluate_r3h_gate(definition, fields, declared_labels=definition.required_labels,
                               face_count=100_000, locked_external_evidence=True)
    assert report.outcome == "unproven"
    assert report.missing == ("external_release_verdict_not_supplied",)
    assert not report.public_metadata()["realface_pass"]


def test_duplicate_metric_names_are_refused() -> None:
    definition = load_r3h_definition(ROOT / "enhance.json")
    raw = json.loads((ROOT / "enhance.json").read_text())
    raw["metrics"].append(raw["metrics"][0])
    with pytest.raises(CommandValidationError):
        decode_r3h_definition(raw)
    assert definition.minimum_faces == 100_000


@pytest.mark.parametrize("bad", [True, -1, 1.5, float("nan")])
def test_invalid_frozen_count_rejected(bad: object) -> None:
    definition = load_r3h_definition(ROOT / "enhance.json")
    with pytest.raises(CommandValidationError):
        evaluate_r3h_gate(definition, {}, face_count=bad)


def test_missing_required_labels_are_reported_individually() -> None:
    definition = load_r3h_definition(ROOT / "denoise.json")
    report = evaluate_r3h_gate(definition, {}, declared_labels=("source", "tone"))
    assert "label:human_review" in report.missing
    assert "label:source" not in report.missing


def test_cannot_use_alternate_schema_or_boolean_threshold() -> None:
    raw = json.loads((ROOT / "studioquality.json").read_text())
    raw["version"] = "unrecognized"
    with pytest.raises(CommandValidationError):
        decode_r3h_definition(raw)
    raw["version"] = "beljour-pro-quality-gate/1"
    raw["metrics"][0]["threshold"] = True
    with pytest.raises(CommandValidationError):
        decode_r3h_definition(raw)
