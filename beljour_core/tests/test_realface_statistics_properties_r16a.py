"""R16A statistical and provenance properties across many fabricated cohorts.

These are numerical contracts for the aggregate reporter, NOT real-face quality
measurements or thresholds inferred from data. The loops use deterministic
small, medium and large synthetic cohorts; no test image exists.
Author: John Khan.
"""
from __future__ import annotations

import copy
import json
import math
import random

import pytest

from plumb_api.quality import realface_regression as regression
from plumb_api.quality import realface_summary as summary


def count(n: int, k: int) -> dict[str, int | float | None]:
    return {"passed": k, "total": n, "rate": k / n if n else None}


def synthetic(n: int, failing: set[int]) -> tuple[dict[str, object], list[dict[str, object]],
                                                 list[dict[str, object]]]:
    faces = [{"face_id": f"generated{i:05d}", "labels": {"source": "drawn",
              "slice": "frontal" if i % 2 == 0 else "profile",
              "monk_gender_age": "3/female/30-39"}} for i in range(n)]
    rows = [{"module": "regions", "face_id": f"generated{i:05d}", "run_id": "synthetic",
             "check": "masks", "metric_pass": i not in failing,
             "reason_code": "out_of_bounds" if i in failing else "single_face"}
            for i in range(n)]
    even_n = (n + 1) // 2
    even_pass = sum(i not in failing for i in range(0, n, 2))
    odd_pass = sum(i not in failing for i in range(1, n, 2))
    gate = {"id": "regions", "status": "FAIL", "threshold": {"overall": .95, "every_slice": .95},
            "all_faces": count(n, n - len(failing)),
            "slices": [{"dimension": "source", "value": "drawn", **count(n, n - len(failing))},
                       {"dimension": "slice", "value": "frontal", **count(even_n, even_pass)},
                       {"dimension": "slice", "value": "profile", **count(n - even_n, odd_pass)},
                       {"dimension": "monk_gender_age", "value": "3/female/30-39",
                        **count(n, n - len(failing))}]}
    return {"run_id": "synthetic", "gates": [gate]}, faces, rows


def test_every_wilson_interval_contains_the_empirical_fraction():
    for n in (1, 2, 3, 10, 20, 30, 50, 100, 263, 1000):
        for k in (0, 1, n // 4, n // 2, n - 1, n):
            if k > n:
                continue
            bounds = summary.wilson_interval(k, n)
            assert bounds is not None
            assert 0 <= bounds[0] <= k / n <= bounds[1] <= 1


def test_wilson_symmetry_when_successes_and_failures_are_swapped():
    for n in (1, 3, 20, 263, 1000):
        for k in (0, 1, n // 3, n - 1, n):
            before = summary.wilson_interval(k, n)
            after = summary.wilson_interval(n - k, n)
            assert before is not None and after is not None
            assert before[0] == pytest.approx(1 - after[1], abs=1e-12)
            assert before[1] == pytest.approx(1 - after[0], abs=1e-12)


def test_ci_width_shrinks_with_more_identically_proportioned_samples():
    widths = []
    for n in (20, 100, 500, 1000, 10000):
        bounds = summary.wilson_interval(n // 2, n)
        assert bounds is not None
        widths.append(bounds[1] - bounds[0])
    assert widths == sorted(widths, reverse=True)


def test_one_hundred_percent_pass_at_20_faces_is_still_unproven_near_98pct_target():
    result = summary.classify(20, 20, .98)
    assert result["status"] == "UNPROVEN"
    assert result["reason"] == "interval_crosses_threshold"
    assert result["ci95"][0] < .98


def test_one_hundred_percent_pass_at_1000_faces_can_establish_98pct_screening():
    result = summary.classify(1000, 1000, .98)
    assert result["status"] == "PASS"
    assert result["ci95"][0] >= .98
    # Still only binomial screening of whichever metric was measured.
    assert result["status"] != "RELEASED"


def test_triage_verdict_is_monotone_at_fixed_sample_size():
    n = 263
    ordering = {"FAIL": 0, "UNPROVEN": 1, "PASS": 2}
    sequence = [ordering[summary.classify(k, n, .95)["status"]] for k in range(n + 1)]
    assert sequence == sorted(sequence)
    assert sequence[0] == 0
    assert sequence[-1] >= 1


def test_shard_row_order_cannot_change_an_aggregate_result():
    evidence, faces, rows = synthetic(263, set(range(63)))
    forward = summary.aggregate(evidence, faces, rows)
    rng = random.Random(8)
    rng.shuffle(rows)
    rng.shuffle(faces)
    backward = summary.aggregate(evidence, faces, rows)
    assert forward == backward
    assert forward["face_count"] == 263
    assert forward["gates"][0]["failure_reasons"] == {"out_of_bounds": 63}


def test_slice_rate_cannot_be_relabeled_to_hide_a_bad_group():
    evidence, faces, rows = synthetic(60, set(range(20)))
    evidence["gates"][0]["slices"][1]["value"] = "a-different-cohort"
    with pytest.raises(ValueError, match="membership"):
        summary.aggregate(evidence, faces, rows)


def test_a_report_cannot_delete_the_worst_small_group():
    evidence, faces, rows = synthetic(50, set(range(10)))
    evidence["gates"][0]["slices"] = [r for r in evidence["gates"][0]["slices"]
                                      if r["value"] != "profile"]
    with pytest.raises(ValueError, match="membership"):
        summary.aggregate(evidence, faces, rows)


def test_hiding_failed_members_inside_an_otherwise_correct_slice_fails():
    evidence, faces, rows = synthetic(50, set(range(10)))
    evidence["gates"][0]["slices"][0]["passed"] = 41
    evidence["gates"][0]["slices"][0]["rate"] = 41 / 50
    with pytest.raises(ValueError, match="membership"):
        summary.aggregate(evidence, faces, rows)


def test_composite_label_is_not_a_file_path_and_keeps_its_count():
    evidence, faces, rows = synthetic(40, set(range(5)))
    result = summary.aggregate(evidence, faces, rows)
    item = next(group for group in result["gates"][0]["slices"]
                if group["dimension"] == "monk_gender_age")
    assert item["value"] == "3/female/30-39"
    assert item["total"] == 40


@pytest.mark.parametrize("value", ["../private.png", "/home/face.jpg", "case\\photo.png",
                                           "a\nsecret", "<script>", "C:/records/portrait.webp"])
def test_private_paths_and_active_text_cannot_be_cohort_labels(value):
    evidence, faces, rows = synthetic(40, set())
    evidence["gates"][0]["slices"][0]["value"] = value
    with pytest.raises(ValueError):
        summary.aggregate(evidence, faces, rows)


def test_regression_delta_confidence_bounds_cover_observed_difference():
    for n in (20, 50, 100, 263, 1000):
        for before, after in ((n, n), (n, n // 2), (n // 2, n), (n - 1, n)):
            item = regression._compare_counts((before, n), (after, n), "synthetic")
            assert item["delta_ci95_conservative"] is not None
            assert item["delta_ci95_conservative"][0] <= item["delta"]
            assert item["delta"] <= item["delta_ci95_conservative"][1]


def test_reversing_commits_negates_observed_and_interval_changes():
    item = regression._compare_counts((50, 100), (90, 100), "test")
    reverse = regression._compare_counts((90, 100), (50, 100), "test")
    assert item["delta"] == pytest.approx(-reverse["delta"])
    assert item["delta_ci95_conservative"][0] == pytest.approx(-reverse["delta_ci95_conservative"][1])
    assert item["delta_ci95_conservative"][1] == pytest.approx(-reverse["delta_ci95_conservative"][0])


def test_regression_fields_never_export_arbitrary_hidden_input_metadata():
    before = {"format": regression.SOURCE_FORMAT, "run_id": "drawn",
              "face_set_sha256": "hash", "engine_sha256": "v1", "max_side": 640,
              "model_hashes": {}, "gates": [{"id": "regions", "definition_sha256": "v1",
              "overall": count(100, 99), "all_faces": count(100, 99),
              "slices": [{"dimension": "source", "value": "drawn", **count(100, 99)}]}],
              "untrusted_user_input": {"path": "/home/user/private.jpg"}}
    after = copy.deepcopy(before)
    after["engine_sha256"] = "v2"
    result = regression.compare(before, after)
    assert "/home" not in json.dumps(result)
    assert "untrusted_user_input" not in json.dumps(result)


def test_fail_closed_does_not_depend_on_external_model_or_face_resources():
    before, faces, rows = synthetic(40, {0, 1})
    result = summary.aggregate(before, faces, rows)
    assert "face_count" in result
    assert "identity" not in result
    assert not math.isnan(result["gates"][0]["whole_set"]["rate"])


def test_regression_difference_interval_uses_bonferroni_components():
    for numerator in (0, 1, 20, 50, 95, 100):
        raw = summary.wilson_interval(numerator, 100)
        conservative = summary.wilson_interval(numerator, 100, z=regression.Z_BONFERRONI)
        assert raw is not None and conservative is not None
        assert conservative[0] <= raw[0]
        assert conservative[1] >= raw[1]


def test_invalid_critical_values_cannot_produce_reported_intervals():
    for critical in (float("nan"), float("inf"), -2.0, 0.0):
        with pytest.raises(ValueError, match="critical value"):
            summary.wilson_interval(80, 100, z=critical)
