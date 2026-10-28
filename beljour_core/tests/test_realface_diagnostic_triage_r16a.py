"""Synthetic-only R16A contracts for per-face failure reasons and Wilson triage.

Do not infer demographic truth or permit an observed tiny-group percentage to
become an acceptance verdict. No licensed photographs, weights or keys.
Author: John Khan.
"""
from __future__ import annotations

import copy
import math
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "api"))
from plumb_api.quality import realface_summary as diag  # noqa: E402


def counts(passed: int, total: int) -> dict[str, int | float | None]:
    return {"passed": passed, "total": total, "rate": passed / total if total else None}


def fixture() -> tuple[dict[str, object], list[dict[str, object]], list[dict[str, object]]]:
    faces = [{"face_id": f"synthetic{i:03d}", "labels": {"source": "drawn",
              "occlusion": "hijab" if i < 3 else "none"}} for i in range(50)]
    rows: list[dict[str, object]] = []
    for i in range(50):
        reason = "multi_face_ambiguous" if i < 5 else "side_profile_no_face" if i < 10 else "out_of_bounds"
        rows.append({"module": "regions", "check": "masks", "face_id": f"synthetic{i:03d}",
                     "run_id": "synthetic-run", "metric_pass": i >= 13, "reason_code": reason if i < 13 else None})
    gate = {"id": "regions", "threshold": {"overall": .95, "every_slice": .95},
            "status": "FAIL", "all_faces": counts(37, 50),
            "slices": [{"dimension": "source", "value": "drawn", **counts(37, 50)},
                       {"dimension": "occlusion", "value": "hijab", **counts(0, 3)},
                       {"dimension": "occlusion", "value": "none", **counts(37, 47)}]}
    evidence: dict[str, object] = {"run_id": "synthetic-run", "gates": [gate]}
    return evidence, faces, rows


@pytest.mark.parametrize("passed,total,expected", [
    (0, 0, None), (0, 1, (0.0, 0.7934506856227627)),
    (1, 1, (0.20654931437723745, 1.0)),
    (5, 10, (0.23659309051256394, 0.7634069094874361)),
    (50, 100, (0.4038315303659956, 0.5961684696340044)),
])
def test_wilson_reference_intervals(passed, total, expected):
    observed = diag.wilson_interval(passed, total)
    if expected is None:
        assert observed is None
    else:
        assert observed == pytest.approx(expected, rel=1e-8, abs=1e-8)


@pytest.mark.parametrize("passed,total,threshold,status,reason", [
    (0, 0, .95, "UNPROVEN", "no_observations"),
    (0, 3, .95, "UNPROVEN", "small_group"),
    (3, 3, .95, "UNPROVEN", "small_group"),
    (0, 20, .95, "FAIL", "interval_below_threshold"),
    (19, 20, .95, "UNPROVEN", "interval_crosses_threshold"),
    (95, 100, .95, "UNPROVEN", "interval_crosses_threshold"),
    (500, 500, .95, "PASS", "interval_meets_threshold"),
    (100, 100, .98, "UNPROVEN", "interval_crosses_threshold"),
    (1000, 1000, .98, "PASS", "interval_meets_threshold"),
])
def test_tri_state_is_derived_from_interval_not_point_rate(passed, total, threshold, status, reason):
    result = diag.classify(passed, total, threshold)
    assert result["status"] == status
    assert result["reason"] == reason
    assert result["total"] == total
    assert result["passed"] == passed


@pytest.mark.parametrize("passed,total", [(-1, 20), (21, 20), (1, -1),
                                           (1.0, 2), (True, 10), (1, 1.5)])
def test_invalid_counts_fail_closed(passed, total):
    with pytest.raises(ValueError):
        diag.wilson_interval(passed, total)


@pytest.mark.parametrize("value", [float("nan"), float("inf"), -.1, 0, 1.01, True, None])
def test_invalid_threshold_fails_closed(value):
    with pytest.raises(ValueError):
        diag.classify(20, 20, value)


def test_minimum_cannot_be_relaxed_below_twenty():
    with pytest.raises(ValueError, match="twenty"):
        diag.classify(19, 19, .95, minimum=1)


def test_aggregate_reports_one_reason_per_failed_face():
    evidence, faces, rows = fixture()
    result = diag.aggregate(evidence, faces, rows)
    assert result["format"] == diag.VERSION
    assert result["face_count"] == 50
    gate = result["gates"][0]
    assert gate["whole_set"]["status"] == "FAIL"
    assert gate["written_gate_status"] == "FAIL"
    assert gate["failure_reasons"] == {"multi_face": 5, "out_of_bounds": 3, "side_profile": 5}
    assert sum(gate["failure_reasons"].values()) == 13


def test_short_slice_is_unproven_despite_zero_successes():
    evidence, faces, rows = fixture()
    groups = diag.aggregate(evidence, faces, rows)["gates"][0]["slices"]
    hijab = next(item for item in groups if item["value"] == "hijab")
    assert hijab["passed"] == 0
    assert hijab["total"] == 3
    assert hijab["status"] == "UNPROVEN"
    assert hijab["reason"] == "small_group"


def test_aggregate_never_exports_face_hash_or_file_path():
    evidence, faces, rows = fixture()
    rows[0]["file"] = "private-face-that-cannot-leak.png"
    rows[0]["path"] = "/home/operator/private/other.png"
    rendered = diag.markdown(diag.aggregate(evidence, faces, rows))
    assert "private-face" not in rendered
    assert ".png" not in rendered
    assert "synthetic000" not in rendered
    assert "95% CI" in rendered
    assert "UNPROVEN" in rendered


def test_incomplete_face_is_never_dropped_from_denominator():
    evidence, faces, rows = fixture()
    rows.pop(0)
    result = diag.aggregate(evidence, faces, rows)
    assert result["gates"][0]["failure_reasons"]["incomplete"] == 1
    assert sum(result["gates"][0]["failure_reasons"].values()) == 13


def test_duplicate_failure_rows_cannot_inflate_face_failure_count():
    evidence, faces, rows = fixture()
    rows.append(copy.deepcopy(rows[0]))
    result = diag.aggregate(evidence, faces, rows)
    assert sum(result["gates"][0]["failure_reasons"].values()) == 13


def test_verified_failed_count_that_contradicts_rows_is_rejected():
    evidence, faces, rows = fixture()
    evidence["gates"][0]["all_faces"] = counts(49, 50)
    with pytest.raises(ValueError, match="contradict"):
        diag.aggregate(evidence, faces, rows)


def test_unknown_legacy_error_text_not_exported():
    evidence, faces, rows = fixture()
    rows[0]["reason_code"] = "/home/private/operator.png"
    rows[0]["error"] = "contains a private image filename"
    serialized = str(diag.aggregate(evidence, faces, rows))
    assert "private" not in serialized
    assert "operator" not in serialized


@pytest.mark.parametrize("mutation", [
    lambda e, f, r: f.append(copy.deepcopy(f[0])),
    lambda e, f, r: f[0].update(labels={"source": None}),
    lambda e, f, r: r[0].update(face_id="unknown-face"),
    lambda e, f, r: r[0].update(run_id="other-run"),
    lambda e, f, r: r[0].update(module=3),
    lambda e, f, r: e["gates"].append(copy.deepcopy(e["gates"][0])),
    lambda e, f, r: e["gates"][0].update(all_faces=counts(37, 49)),
    lambda e, f, r: e["gates"][0]["slices"].append("malformed"),
])
def test_invalid_gate_or_frozen_face_is_rejected(mutation):
    evidence, faces, rows = fixture()
    mutation(evidence, faces, rows)
    with pytest.raises(ValueError):
        diag.aggregate(evidence, faces, rows)


def test_reason_code_mapping_is_bounded_and_deterministic():
    reasons = {"hijab_no_face": "head_covering", "no_mesh": "no_face",
               "multi_face_ambiguous": "multi_face", "low_confidence": "low_confidence",
               "image_unreadable": "unreadable", "detector_exception": "engine_error"}
    for code, expected in reasons.items():
        result = diag._failed_reason([{"reason_code": code, "metric_pass": False}], passed=False)
        assert result == expected
    assert diag._failed_reason([], passed=False) == "incomplete"
    assert diag._failed_reason([{"metric_pass": False, "check": "masks"}], passed=False) == "threshold_miss"


def test_probability_input_refuses_infinity_even_if_value_is_numeric():
    assert not math.isfinite(float("inf"))
    with pytest.raises(ValueError):
        diag.classify(20, 25, float("inf"))


@pytest.mark.parametrize("unsafe", [
    "C:/private/crop", "image.tiff", "photo.heic",
    "https://private.server/file", "snapshot.avif",
])
def test_aggregate_diagnostic_does_not_echo_embedded_paths_or_image_labels(unsafe):
    for where in ("gate", "dimension", "value"):
        evidence, faces, rows = fixture()
        if where == "gate":
            evidence["gates"][0]["id"] = unsafe
        else:
            evidence["gates"][0]["slices"][0][where] = unsafe
        with pytest.raises(ValueError):
            diag.aggregate(evidence, faces, rows)


def test_histogram_reconciles_to_written_gate_under_missing_observations():
    evidence, faces, rows = fixture()
    rows = [row for row in rows if row["face_id"] not in {"synthetic000", "synthetic001"}]
    aggregate = diag.aggregate(evidence, faces, rows)
    histogram = aggregate["gates"][0]["failure_reasons"]
    assert histogram["incomplete"] == 2
    assert histogram["multi_face"] == 3
    assert sum(histogram.values()) == 50 - evidence["gates"][0]["all_faces"]["passed"]
