"""Engineering grid study of reference gaps without creating any product shades.

All colour values are synthetic; measurements cannot imply a human fairness PASS.
Author: John Khan.
"""
from __future__ import annotations

import math

import pytest

from plumb_api.engines.shade.coverage import (
    STATUS_COVERED,
    STATUS_TOO_DEEP,
    STATUS_TOO_FAR,
    audit_reference_grid,
    compare_point,
    study_levels,
)
from plumb_api.engines.shade.finder import extended_reference_table, thresholds


def test_existing_extension_is_used_but_never_rewritten() -> None:
    current = extended_reference_table()
    assert len(current) >= 96
    stored = tuple((row["id"], tuple(row["lab"])) for row in current)
    first = compare_point((22.0, 8.53, 11.31))
    assert first.status == STATUS_COVERED
    assert first.closest_id is not None
    assert first.reference_lightness is not None
    assert first.reference_lightness <= first.lab[0] + 1.0
    assert tuple((row["id"], tuple(row["lab"])) for row in current) == stored


def test_known_too_deep_point_is_not_offered_lighter_swatch() -> None:
    report = compare_point((8.0, 3.0, 4.0))
    assert report.status == STATUS_TOO_DEEP
    assert report.closest_id is None
    assert report.closest_delta_e is None
    assert report.reference_lightness is None
    assert not report.covered


def test_unrepresentable_chroma_produces_explicit_distance_refusal() -> None:
    report = compare_point((60.0, -25.0, -30.0))
    assert report.status == STATUS_TOO_FAR
    assert report.closest_delta_e is not None
    assert report.closest_delta_e > thresholds()["confidence"]["refuse_delta_e_above"]
    assert not report.covered


def test_full_depth_and_hue_grid_reports_real_shortfalls() -> None:
    points = study_levels(
        levels=[15, 20, 25, 30, 40, 50, 60, 70, 80, 85],
        hues=[20, 40, 55, 65, 80, 100, 120],
        chromas=[12, 18, 27],
    )
    assert len(points) == 210
    report = audit_reference_grid(points)
    assert report.total == 210
    assert report.covered + report.too_deep + report.too_far == 210
    assert report.too_deep > 0
    assert report.too_far > 0
    assert 0 < report.covered_fraction < 1.0
    assert sum(total for _, total in report.depth_counts.values()) == 210
    assert sum(total for _, total in report.undertone_counts.values()) == 210
    assert max(report.depth_counts) == 10
    assert min(report.depth_counts) == 1


def test_schema_is_privacy_safe_and_does_not_claim_product_validity() -> None:
    points = study_levels([30, 55], [40, 80], [18])
    obj = audit_reference_grid(points).public(include_cases=True)
    assert obj["format"] == "beljour-reference-coverage/1"
    assert obj["kind"] == "synthetic_lab_grid_not_real_face_results"
    assert obj["total"] == len(obj["cases"]) == 4
    assert obj["maximum_allowed_delta_e"] == 6.0
    assert "not a physical product" in obj["note"]
    for record in obj["cases"]:
        assert set(record) == {
            "lab", "depth_band", "undertone", "closest_reference",
            "closest_delta_e", "reference_lightness", "status",
        }


def test_undertone_and_depth_counts_are_order_independent() -> None:
    cases = study_levels([18, 33, 50, 66, 82], [40, 53, 68, 84], [18])
    a = audit_reference_grid(cases)
    b = audit_reference_grid(reversed(cases))
    assert a.covered == b.covered
    assert a.too_deep == b.too_deep
    assert a.too_far == b.too_far
    assert a.depth_counts == b.depth_counts
    assert a.undertone_counts == b.undertone_counts


@pytest.mark.parametrize("value", [
    [], (), [1], [1, 2], [1, 2, 3, 4], [float("nan"), 1, 2],
    [-1, 3, 5], [101, 3, 5], [50, -129, 0], [50, 0, 128],
    [50, True, 3], [50, "5", 3],
])
def test_invalid_grid_case_fails_closed(value: object) -> None:
    with pytest.raises(ValueError):
        compare_point(value)


@pytest.mark.parametrize("hue", [float("nan"), float("inf")])
def test_nonfinite_hue_rejected_before_grid_creation(hue: float) -> None:
    with pytest.raises(ValueError):
        study_levels([40], [hue], [18])


def test_grid_respects_size_limit_and_nonempty_lists() -> None:
    with pytest.raises(ValueError):
        study_levels([], [40], [18])
    with pytest.raises(ValueError):
        study_levels([40], [], [18])
    with pytest.raises(ValueError):
        study_levels([40], [40], [])
    with pytest.raises(ValueError):
        study_levels(range(101), range(21), [10])
    assert len(study_levels(range(50), range(20), [10, 20])) == 2000


def test_no_undefined_zero_case_summary() -> None:
    with pytest.raises(ValueError):
        audit_reference_grid([])
    with pytest.raises(ValueError):
        audit_reference_grid(((40.0, 12.0, 12.0) for _ in range(2049)))


def test_all_covered_cases_keep_a_reference_not_lighter_than_the_input() -> None:
    grid = study_levels([20, 30, 40, 50, 60, 70, 80], [30, 53, 65, 85], [12, 18])
    for item in audit_reference_grid(grid).samples:
        if item.closest_id is not None:
            assert item.reference_lightness is not None
            assert item.reference_lightness <= item.lab[0] + 1.0
            assert item.closest_delta_e is not None
            assert math.isfinite(item.closest_delta_e)
