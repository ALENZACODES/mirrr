"""R17B release-preflight tests. Author: John Khan."""
from __future__ import annotations

import copy
from typing import cast

import pytest

from plumb_api.arena.r17b_preflight import (
    definition_hash,
    finite_metric,
    group_summary,
    manifest_hash,
    parse_evidence,
    parse_feature,
    release_candidate,
    run_preflight,
    scorecard,
)


def feature(feature_id: str = "W19", family: str = "hair_women") -> dict[str, object]:
    return {
        "feature_id": feature_id,
        "family": family,
        "status": "built",
        "python_module": f"api/plumb_api/engines/{family}",
        "web_module": f"web/src/engines/{family}",
        "pass_definition": "Outside protected pixels remain stable and measured quality gates pass.",
    }


def evidence(feature_row: dict[str, object], status: str = "passed", group: str = "synthetic") -> dict[str, object]:
    parsed = parse_feature(feature_row)
    measured = status != "not_tested"
    return {
        "feature_id": parsed.feature_id,
        "group": group,
        "status": status,
        "cases": 4 if measured else 0,
        "passed": 4 if status == "passed" else 0,
        "failed": 1 if status == "failed" else 0,
        "definition_sha256": definition_hash(parsed),
        "evidence_sha256": "b" * 64 if measured else None,
    }


def owned(row: dict[str, object]) -> set[str]:
    return {str(row["python_module"]), str(row["web_module"])}


def test_parse_feature_accepts_w_row():
    assert parse_feature(feature()).feature_id == "W19"


def test_parse_feature_accepts_upscale():
    row = feature("UPSCALE2", "upscale")
    assert parse_feature(row).family == "upscale"


def test_parse_feature_accepts_gender():
    assert parse_feature(feature("GENDER", "gender_look")).feature_id == "GENDER"


def test_parse_feature_accepts_shave():
    assert parse_feature(feature("SHAVE", "shave")).family == "shave"


@pytest.mark.parametrize("feature_id", ["W0", "W101", "X1", "", "W-1"])
def test_parse_feature_rejects_bad_id(feature_id: str):
    row = feature()
    row["feature_id"] = feature_id
    with pytest.raises(ValueError):
        parse_feature(row)


@pytest.mark.parametrize("family", ["commerce", "menshair", "", "other"])
def test_parse_feature_rejects_foreign_family(family: str):
    row = feature()
    row["family"] = family
    with pytest.raises(ValueError):
        parse_feature(row)


def test_parse_feature_requires_built_status():
    row = feature()
    row["status"] = "planned"
    with pytest.raises(ValueError):
        parse_feature(row)


def test_parse_feature_rejects_parent_path():
    row = feature()
    row["python_module"] = "../other"
    with pytest.raises(ValueError):
        parse_feature(row)


def test_parse_feature_rejects_absolute_path():
    row = feature()
    row["web_module"] = "/tmp/engine"
    with pytest.raises(ValueError):
        parse_feature(row)


def test_parse_feature_requires_substantive_definition():
    row = feature()
    row["pass_definition"] = "short"
    with pytest.raises(ValueError):
        parse_feature(row)


def test_definition_hash_is_deterministic():
    parsed = parse_feature(feature())
    assert definition_hash(parsed) == definition_hash(parsed)
    assert len(definition_hash(parsed)) == 64


def test_definition_hash_changes_with_definition():
    first = parse_feature(feature())
    second_row = feature()
    second_row["pass_definition"] = "A different complete acceptance rule with measurable protected-region limits."
    second = parse_feature(second_row)
    assert definition_hash(first) != definition_hash(second)


def test_parse_evidence_accepts_passed():
    row = feature()
    parsed = parse_evidence(evidence(row))
    assert parsed.passed == 4
    assert parsed.failed == 0


def test_parse_evidence_accepts_not_tested():
    parsed = parse_evidence(evidence(feature(), "not_tested"))
    assert parsed.cases == 0
    assert parsed.evidence_sha256 is None


def test_parse_evidence_rejects_pass_with_failure():
    row = evidence(feature())
    row["failed"] = 1
    with pytest.raises(ValueError):
        parse_evidence(row)


def test_parse_evidence_rejects_failed_without_failure():
    row = evidence(feature(), "failed")
    row["failed"] = 0
    with pytest.raises(ValueError):
        parse_evidence(row)


def test_parse_evidence_rejects_not_tested_counts():
    row = evidence(feature(), "not_tested")
    row["cases"] = 1
    with pytest.raises(ValueError):
        parse_evidence(row)


def test_parse_evidence_rejects_bad_hash():
    row = evidence(feature())
    row["definition_sha256"] = "abc"
    with pytest.raises(ValueError):
        parse_evidence(row)


def test_parse_evidence_requires_hash_for_measured_result():
    row = evidence(feature())
    row["evidence_sha256"] = None
    with pytest.raises(ValueError):
        parse_evidence(row)


def test_preflight_passes_complete_owned_feature():
    row = feature()
    report = run_preflight([row], [evidence(row)], owned(row))
    assert report.ok
    assert report.evidence_passed == 1


def test_preflight_reports_missing_python_owner():
    row = feature()
    report = run_preflight([row], [evidence(row)], {str(row["web_module"])})
    assert {issue.code for issue in report.issues} == {"python_module_unowned"}


def test_preflight_reports_missing_web_owner():
    row = feature()
    report = run_preflight([row], [evidence(row)], {str(row["python_module"])})
    assert {issue.code for issue in report.issues} == {"web_module_unowned"}


def test_preflight_reports_duplicate_feature():
    row = feature()
    report = run_preflight([row, copy.deepcopy(row)], [evidence(row)], owned(row))
    assert "duplicate_feature" in {issue.code for issue in report.issues}


def test_preflight_reports_unknown_evidence_feature():
    row = feature()
    extra = feature("W20")
    report = run_preflight([row], [evidence(row), evidence(extra)], owned(row))
    assert "evidence_for_unknown_feature" in {issue.code for issue in report.issues}


def test_preflight_reports_definition_mismatch():
    row = feature()
    ev = evidence(row)
    ev["definition_sha256"] = "c" * 64
    report = run_preflight([row], [ev], owned(row))
    assert "definition_hash_mismatch" in {issue.code for issue in report.issues}


def test_preflight_reports_missing_evidence_record():
    row = feature()
    report = run_preflight([row], [], owned(row))
    assert "missing_evidence_record" in {issue.code for issue in report.issues}


def test_preflight_reports_duplicate_evidence_group():
    row = feature()
    ev = evidence(row)
    report = run_preflight([row], [ev, copy.deepcopy(ev)], owned(row))
    assert "duplicate_evidence_group" in {issue.code for issue in report.issues}


def test_manifest_hash_ignores_input_order():
    first = feature("W19", "hair_women")
    second = feature("W1", "makeup_w")
    parsed_features = [parse_feature(first), parse_feature(second)]
    parsed_evidence = [parse_evidence(evidence(first)), parse_evidence(evidence(second))]
    assert manifest_hash(parsed_features, parsed_evidence) == manifest_hash(
        list(reversed(parsed_features)), list(reversed(parsed_evidence))
    )


def test_manifest_hash_changes_with_evidence_status():
    row = feature()
    parsed = [parse_feature(row)]
    passed = [parse_evidence(evidence(row))]
    untested = [parse_evidence(evidence(row, "not_tested"))]
    assert manifest_hash(parsed, passed) != manifest_hash(parsed, untested)


def test_release_candidate_requires_100k_faces():
    row = feature()
    report = run_preflight([row], [evidence(row)], owned(row))
    assert not release_candidate(report, 99_999)
    assert release_candidate(report, 100_000)


def test_release_candidate_rejects_not_tested():
    row = feature()
    report = run_preflight([row], [evidence(row, "not_tested")], owned(row))
    assert not release_candidate(report, 100_000)


def test_release_candidate_rejects_failed():
    row = feature()
    report = run_preflight([row], [evidence(row, "failed")], owned(row))
    assert not release_candidate(report, 100_000)


def test_release_candidate_rejects_issues():
    row = feature()
    report = run_preflight([row], [evidence(row)], set())
    assert not release_candidate(report, 100_000)


@pytest.mark.parametrize("faces", [-1, True, 1.5, "100000"])
def test_release_candidate_validates_face_count(faces: object):
    row = feature()
    report = run_preflight([row], [evidence(row)], owned(row))
    with pytest.raises(ValueError):
        release_candidate(report, cast(int, faces))


def test_group_summary_counts_statuses_and_cases():
    first = feature("W19", "hair_women")
    second = feature("W20", "hair_women")
    rows = [evidence(first), evidence(second, "not_tested")]
    summary = group_summary(rows)
    assert summary["synthetic"] == {"passed": 1, "failed": 0, "not_tested": 1, "cases": 4}


def test_group_summary_separates_groups():
    row = feature()
    rows = [evidence(row, group="synthetic"), evidence(row, group="realface")]
    summary = group_summary(rows)
    assert set(summary) == {"synthetic", "realface"}


def test_scorecard_is_privacy_safe_summary():
    row = feature()
    report = run_preflight([row], [evidence(row)], owned(row))
    card = scorecard(report)
    assert card["ok"] is True
    assert card["issues"] == 0
    assert "manifest_sha256" in card
    assert not any(key in card for key in ("pixels", "mask", "landmarks"))


@pytest.mark.parametrize("value", [0, 1, -2.5, 3.75])
def test_finite_metric_accepts_finite_numbers(value: float):
    assert finite_metric(value) == float(value)


@pytest.mark.parametrize("value", [float("nan"), float("inf"), float("-inf"), True, "1"])
def test_finite_metric_rejects_non_finite_or_non_numeric(value: object):
    with pytest.raises(ValueError):
        finite_metric(value)


def test_two_features_two_families_are_supported():
    hair = feature("W19", "hair_women")
    makeup = feature("W1", "makeup_w")
    rows = [hair, makeup]
    evidence_rows = [evidence(hair), evidence(makeup)]
    modules = owned(hair) | owned(makeup)
    report = run_preflight(rows, evidence_rows, modules)
    assert report.ok
    assert report.features == 2


def test_workflow_feature_is_supported():
    row = feature("W94", "workflow_w")
    assert run_preflight([row], [evidence(row)], owned(row)).ok


def test_upscale_feature_is_supported():
    row = feature("UPSCALE4", "upscale")
    assert run_preflight([row], [evidence(row)], owned(row)).ok


def test_gender_feature_is_supported():
    row = feature("GENDER", "gender_look")
    assert run_preflight([row], [evidence(row)], owned(row)).ok


def test_shave_feature_is_supported():
    row = feature("SHAVE", "shave")
    assert run_preflight([row], [evidence(row)], owned(row)).ok
