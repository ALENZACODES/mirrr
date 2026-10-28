"""Black-to-best declared 3pp point-gap guard; no threshold edits. Author: John Khan."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests/realface"))
from region_gap import MAX_GAP, all_region_gaps, race_region_gap


def gate(black_pass: int, black_total: int, white_pass: int, white_total: int) -> dict:
    return {"id": "iris", "slices": [{"dimension": "race", "value": "Black", "passed": black_pass, "total": black_total},
             {"dimension": "race", "value": "White", "passed": white_pass, "total": white_total}]}


def test_declared_gap_is_three_points_without_changing_original_gate() -> None:
    assert MAX_GAP == 0.03
    data = gate(97, 100, 100, 100)
    result = race_region_gap(data)
    assert result["status"] == "OBSERVED_WITHIN_3_POINTS"
    assert result["gap_points"] == 3.0
    assert data["slices"][0]["passed"] == 97


def test_four_point_gap_fails_and_worst_is_not_hidden_by_average() -> None:
    result = race_region_gap(gate(94, 100, 99, 100))
    assert result["status"] == "FAIL"
    assert result["gap_points"] == 5.0


def test_missing_black_or_missing_comparison_is_unproven() -> None:
    assert race_region_gap({"id": "hair", "slices": []})["status"] == "UNPROVEN"
    assert race_region_gap({"id": "hair", "slices": [{"dimension": "race", "value": "Black", "passed": 30, "total": 30}]})["status"] == "UNPROVEN"


def test_small_group_does_not_pass_on_perfect_one_of_one() -> None:
    result = race_region_gap(gate(1, 1, 500, 500))
    assert result["status"] == "UNPROVEN"


def test_rates_use_count_not_untrusted_rate_field() -> None:
    data = gate(80, 100, 100, 100)
    data["slices"][0]["rate"] = 1.0
    assert race_region_gap(data)["gap_points"] == 20.0


def test_overall_status_is_unproven_even_when_point_gap_fits() -> None:
    result = all_region_gaps({"gates": [gate(97, 100, 100, 100)]})
    assert result["status"] == "UNPROVEN"
    assert result["gates"][0]["status"] == "OBSERVED_WITHIN_3_POINTS"


def test_any_exceeded_region_gap_marks_overall_failure() -> None:
    result = all_region_gaps({"gates": [gate(97, 100, 100, 100), gate(80, 100, 100, 100)]})
    assert result["status"] == "FAIL"


@pytest.mark.parametrize("count,total", [(-1,20), (21,20), (2.0,20), (1,-1)])
def test_invalid_group_counts_cannot_manufacture_parity(count: int | float, total: int) -> None:
    with pytest.raises(ValueError, match="integer numerator"):
        race_region_gap(gate(count, total, 20, 20))
