"""Each R19c quality field is mandatory on synthetic fixture rows, not real-face evidence.

Tests never alter Lane A's runner, frozen cohorts, quality metric definitions,
models or photographs. Release remains UNPROVEN. Author: John Khan.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parents[2]
HERE = ROOT / "tests" / "realface" / "pass_definitions_r19c"
SPEC = importlib.util.spec_from_file_location("lane_c_quality_r19c_fields", HERE / "r19c_suite.py")
assert SPEC is not None and SPEC.loader is not None
suite = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = suite
SPEC.loader.exec_module(suite)
FEATURES = tuple(sorted(suite.FEATURES))
NEW = tuple(name for name in FEATURES if name in {
    "menshair-render-detail", "menshair-broad-preset-library", "menshair-colour-palette",
    "menshair-fibre-topical", "commerce-sample-shortlist", "commerce-illustrated-hair-workshop",
})


def matrix(feature: str) -> list[dict[str, Any]]:
    measures = suite.definition(feature).criteria
    return [dict({"monk": monk, "gender": gender, "age": age,
                  "review_human": True, "consent_valid": True},
                 **{metric.field: metric.limit for metric in measures})
            for monk in suite.Q.MONK for gender in suite.Q.GENDERS for age in suite.Q.AGES]


@pytest.mark.parametrize("feature", NEW)
def test_every_new_feature_requires_each_independent_metric(feature: str) -> None:
    rows = matrix(feature)
    baseline = suite.evaluate(feature, rows)
    assert baseline.status == "SYNTHETIC_OK" and baseline.total == 100
    assert len(suite.definition(feature).criteria) >= 8
    for metric in suite.definition(feature).criteria:
        saved = rows[0][metric.field]
        try:
            rows[0].pop(metric.field)
            failed = suite.evaluate(feature, rows)
            assert failed.status == "SYNTHETIC_FAIL", f"Missing {feature}/{metric.field} was not fatal"
            assert failed.passed == 99
            if isinstance(metric.limit, bool):
                rows[0][metric.field] = not metric.limit
            elif metric.operator == "le":
                rows[0][metric.field] = float(metric.limit) + 1.0
            elif metric.operator == "ge":
                rows[0][metric.field] = float(metric.limit) - 1.0
            else:
                rows[0][metric.field] = float(metric.limit) + 1.0
            failed = suite.evaluate(feature, rows)
            assert failed.status == "SYNTHETIC_FAIL" and failed.passed == 99
        finally:
            rows[0][metric.field] = saved


@pytest.mark.parametrize("feature", NEW)
def test_quality_cohorts_cannot_drop_out_and_real_mode_is_unproven(feature: str) -> None:
    original = matrix(feature)
    assert suite.evaluate(feature, original, mode="real", manifest_sha256="a" * 64,
                          human_review=True).status == "UNPROVEN"
    modified = [dict(r) for r in original]
    modified.pop()
    score = suite.evaluate(feature, modified)
    assert score.status == "SYNTHETIC_FAIL"
    assert len(score.groups) == 117
    assert any(not group.eligible for group in score.groups)
    modified.append(dict(original[0]))
    modified[-1]["monk"] = "not-reported"
    assert suite.evaluate(feature, modified).status == "SYNTHETIC_FAIL"


@pytest.mark.parametrize("feature", NEW)
def test_no_sensitive_face_data_or_weakened_frozen_manifest(feature: str) -> None:
    data = json.loads((HERE / f"{feature}.json").read_text(encoding="utf8"))
    assert data["author"] == "John Khan"
    assert data["status"] == "UNPROVEN"
    assert data["face_set"]["no_training_faces"] is True
    assert data["face_set"]["number_of_faces"] == 100000
    assert data["gates"]["overall"] >= 0.95 and data["gates"]["every_slice"] >= 0.95
    assert data["human_required"] and data["consent_required"]
    assert set(data["required_slices"]) == {"monk", "gender", "age"}
    for forbidden in ("data:image", "base64,", "private_s3", "portrait.jpg", "medical diagnosis", "celeb"):
        assert forbidden not in json.dumps(data).lower()
