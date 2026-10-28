"""R18 Lane C preregistered real-face checks; synthetic-only self-tests.

Lane A owns the official runner and face manifest. These cases deliberately
provide no real face observations and cannot be reported as release PASS.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPECS = ROOT / "tests" / "realface" / "pass_definitions_r18c"


def _quality_module() -> Any:
    location = SPECS / "evaluate.py"
    spec = importlib.util.spec_from_file_location("lane_c_r18c_pass_definitions", location)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


Q = _quality_module()
IDS = ("commerce-match", "commerce-vto", "menshair-fade", "menshair-cuts", "menshair-fibres")


def load(identifier: str) -> Any:
    return Q.Definition.parse(json.loads((SPECS / (identifier + ".json")).read_text()))


def good_row(definition: Any, tone: str, gender: str, age: str) -> dict[str, object]:
    row: dict[str, object] = {"monk": tone, "gender": gender, "age": age,
                              "consent_valid": True, "review_human": True}
    for criterion in definition.criteria:
        if type(criterion.limit) is bool:
            row[criterion.field] = criterion.limit
        elif criterion.operator == "ge":
            row[criterion.field] = float(criterion.limit) + 0.01
        elif criterion.operator == "le":
            row[criterion.field] = float(criterion.limit)
        else:
            row[criterion.field] = criterion.limit
    return row


@pytest.mark.parametrize("identifier", IDS)
def test_a_groupwise_synthetic_assessment_loads_and_scores_every_definition(identifier: str) -> None:
    definition = load(identifier)
    samples = [good_row(definition, tone, gender, age)
               for tone in Q.MONK for gender in Q.GENDERS for age in Q.AGES]
    result = Q.evaluate(definition, samples)
    assert result.status == "SYNTHETIC_OK"
    assert result.total == len(samples) == 100
    assert result.passed == 100 and result.overall == 1.0
    assert len(result.groups) == 10 + 2 + 5 + 100
    assert all(group.eligible and group.rate == 1.0 for group in result.groups)
    assert result.to_json()["status"] == "SYNTHETIC_OK"
    # The identical scores are categorically NOT a release claim.
    blocked = Q.evaluate(definition, samples, mode="real", human_review_completed=True,
                         frozen_manifest_sha256="f" * 64)
    assert blocked.status == "UNPROVEN"
    assert "100,000 frozen real faces not measured" in blocked.reasons
    assert any(not group.eligible for group in blocked.groups)


@pytest.mark.parametrize("identifier", IDS)
def test_missing_demographic_slice_or_metrics_always_blocks_the_result(identifier: str) -> None:
    definition = load(identifier)
    samples = [good_row(definition, tone, gender, age)
               for tone in Q.MONK for gender in Q.GENDERS for age in Q.AGES]
    samples[0].pop(definition.criteria[0].field)
    bad = Q.evaluate(definition, samples)
    assert bad.status == "SYNTHETIC_FAIL" and bad.passed == 99
    removed = [row for row in samples if row["monk"] != "10"]
    result = Q.evaluate(definition, removed)
    assert result.status == "SYNTHETIC_FAIL"
    assert any(group.tested == 0 for group in result.groups)
    samples[0]["monk"] = "unsupported"
    assert Q.evaluate(definition, samples).status == "SYNTHETIC_FAIL"
    assert Q.evaluate(definition, [], mode="real").status == "UNPROVEN"


@pytest.mark.parametrize("identifier", IDS)
def test_quality_definition_cannot_loosen_threshold_or_skip_human_review(identifier: str) -> None:
    raw = json.loads((SPECS / (identifier + ".json")).read_text())
    for field, value in (("overall", 0.5), ("every_slice", 0.50), ("minimum_slice_faces", 1)):
        invalid = json.loads(json.dumps(raw))
        invalid["gates"][field] = value
        with pytest.raises(ValueError):
            Q.Definition.parse(invalid)
    for name, value in (("human_required", False), ("consent_required", False)):
        invalid = json.loads(json.dumps(raw))
        invalid[name] = value
        with pytest.raises(ValueError):
            Q.Definition.parse(invalid)
    invalid = json.loads(json.dumps(raw))
    invalid["required_slices"]["monk"].pop()
    with pytest.raises(ValueError):
        Q.Definition.parse(invalid)


def test_ownership_and_provenance_files_contain_no_face_data() -> None:
    for identifier in IDS:
        location = SPECS / (identifier + ".json")
        doc = json.loads(location.read_text())
        assert doc["status"] == "UNPROVEN" and doc["face_set"]["number_of_faces"] == 100000
        source = location.read_text()
        assert "data:image" not in source and "base64" not in source
        assert "John Khan" in source
