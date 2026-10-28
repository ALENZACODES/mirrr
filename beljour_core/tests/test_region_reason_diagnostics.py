"""Synthetic count-only region-mask reasons preserve every frozen observation."""
from __future__ import annotations

import json
import sys
from importlib import import_module
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests" / "realface"))
triage = import_module("region_reasons")


def faces() -> list[dict[str, object]]:
    return [
        {"face_id": "opaque-1", "labels": {"race": "Black"}},
        {"face_id": "opaque-2", "labels": {"race": "Black"}},
        {"face_id": "opaque-3", "labels": {"race": "East Asian"}},
        {"face_id": "opaque-4", "labels": {"race": "unknown"}},
    ]


def rows() -> list[dict[str, object]]:
    return [
        {"face_id": "opaque-1", "module": "regions", "check": "masks",
         "metric_pass": True, "eyes_inside": 1.0, "skin_share": .7},
        {"face_id": "opaque-2", "module": "regions", "check": "dependency_missing",
         "metric_pass": False, "reason_code": "no_face"},
        {"face_id": "opaque-3", "module": "regions", "check": "masks",
         "metric_pass": False, "empty": "eyes"},
    ]


def gates() -> list[dict[str, object]]:
    return [{
        "id": "regions", "all_faces": {"passed": 1, "total": 4},
        "slices": [
            {"dimension": "race", "value": "Black", "passed": 1, "total": 2},
            {"dimension": "race", "value": "East Asian", "passed": 0, "total": 1},
            {"dimension": "race", "value": "unknown", "passed": 0, "total": 1},
        ],
    }]


def test_all_frozen_images_contribute_exactly_one_reason_or_pass() -> None:
    summary = triage.summarize(faces(), rows(), gates())
    assert summary["denominator"] == 4
    assert summary["passed"] == 1
    groups = {item["race"]: item for item in summary["group_counts"]}
    assert groups["Black"]["reasons"] == {"mesh_missing": 1}
    assert groups["East Asian"]["reasons"] == {"missing_region_mask": 1}
    assert groups["unknown"]["reasons"] == {"incomplete": 1}
    assert summary["observed_black_to_best"]["status"] == "UNPROVEN"
    assert "opaque-1" not in json.dumps(summary)


def test_empty_and_invalid_geometry_have_separate_causes() -> None:
    sample = rows()
    sample[2] = {"face_id": "opaque-3", "module": "regions", "check": "masks",
                 "invalid_geometry": True, "empty": "eyes", "metric_pass": False}
    report = triage.summarize(faces(), sample, gates())
    assert report["group_counts"][1]["reasons"] == {"invalid_geometry": 1}


@pytest.mark.parametrize("metric,value,expected", [
    ("eyes_inside", .92, "eyes_outside_face"),
    ("eyes_inside", float("nan"), "eyes_outside_face"),
    ("skin_share", .32, "skin_share_outside"),
    ("skin_share", 1.01, "skin_share_outside"),
    ("skin_share", None, "skin_share_outside"),
])
def test_specific_failures_are_not_collapsed_to_generic_error(
    metric: str, value: object, expected: str
) -> None:
    sample = rows()
    sample[2] = {"face_id": "opaque-3", "module": "regions", "check": "masks",
                 "eyes_inside": 1.0, "skin_share": .75, "empty": "", "metric_pass": False}
    sample[2][metric] = value
    groups = triage.summarize(faces(), sample, gates())["group_counts"]
    assert groups[1]["reasons"] == {expected: 1}


def test_unregistered_face_cannot_disappear_or_inflate_counts() -> None:
    sample = rows()
    sample.append({"face_id": "other-id", "module": "regions", "check": "masks",
                   "metric_pass": True})
    with pytest.raises(ValueError, match="unregistered"):
        triage.summarize(faces(), sample, gates())


def test_duplicate_region_observation_is_refused() -> None:
    sample = rows()
    sample.append(dict(sample[0]))
    with pytest.raises(ValueError, match="multiple region"):
        triage.summarize(faces(), sample, gates())


def test_bad_race_label_cannot_be_serialized() -> None:
    sample = faces()
    sample[0]["labels"]["race"] = "/private/faces/example.jpg"
    with pytest.raises(ValueError, match="race labels"):
        triage.summarize(sample, rows(), gates())


def test_gate_mismatch_is_unproven_not_a_forged_pass() -> None:
    sample = gates()
    sample[0]["all_faces"]["passed"] = 4
    outcome = triage.summarize(faces(), rows(), sample)
    assert outcome["observed_black_to_best"]["status"] == "UNPROVEN"
    assert "disagree" in outcome["observed_black_to_best"]["reason"]


def test_missing_regions_gate_is_diagnostic_only() -> None:
    result = triage.summarize(faces(), rows(), [])
    assert result["status"] == "DIAGNOSTIC_ONLY"
    assert result["observed_black_to_best"]["status"] == "UNPROVEN"


def test_unsupported_row_type_cannot_appear_as_a_pass() -> None:
    sample = rows()
    sample[0]["check"] = "other"
    summary = triage.summarize(faces(), sample, gates())
    assert summary["passed"] == 0
    assert summary["group_counts"][0]["reasons"] == {"incomplete": 1, "mesh_missing": 1}
