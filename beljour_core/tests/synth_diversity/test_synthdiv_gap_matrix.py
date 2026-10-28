"""Coverage matrix: all cells of 14 contracts and deterministic gap ordering.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.stress_extra_cases import extra_cases
from lab.synth_diversity.stress_gap_matrix import (
    GAP_CONTRACTS,
    compare_gaps,
    contract_cells,
    gap_matrix,
)
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_spec import StressCase
from lab.synth_diversity.types import SyntheticInputError


def anchors(seed: int = 3) -> list[StressCase]:
    return list(StressSchedule(seed=seed, count=len(ALL_PROFILES)).cases())


def test_fourteen_contracts_with_full_cross_products() -> None:
    assert len(GAP_CONTRACTS) == 14
    matrix = gap_matrix(anchors())
    expected = sum(len(contract_cells(a, b)) for a, b in GAP_CONTRACTS)
    assert len(matrix.counts) == len(matrix.cells()) == expected
    assert ("fitzpatrick=VI", "vitiligo=segmental") in matrix.counts


def test_child_age_band_is_not_a_cell() -> None:
    cells = gap_matrix(anchors()).counts
    assert not any("age_band=0-9" in cell for pair in cells for cell in pair)


def test_counts_per_contract_sum_to_cases() -> None:
    matrix = gap_matrix(anchors())
    for left, right in GAP_CONTRACTS:
        assert sum(matrix.counts[cell] for cell in contract_cells(left, right)) == len(anchors())


def test_unrepresented_cells_are_listed_as_gaps() -> None:
    matrix = gap_matrix(anchors())
    gaps = {(cell.left, cell.right) for cell in matrix.missing()}
    assert ("fitzpatrick=I", "vitiligo=generalised") in gaps
    assert all(matrix.counts[gap] == 0 for gap in gaps)


def test_gap_order_is_deterministic_and_ranked() -> None:
    first = gap_matrix(anchors(3)).missing()
    assert first == gap_matrix(anchors(3)).missing()
    ranks = [cell.rank for cell in first]
    assert ranks == sorted(ranks)
    deep = [cell for cell in first if cell.rank == 0]
    flags = [cell.left in ("fitzpatrick=V", "fitzpatrick=VI") for cell in deep]
    assert flags == sorted(flags, reverse=True)


def test_minimum_turns_thin_cells_into_gaps() -> None:
    loose = gap_matrix(anchors(), minimum=1)
    strict = gap_matrix(anchors(), minimum=3)
    assert len(strict.missing()) > len(loose.missing())
    assert all(cell.deficit == 3 - cell.count for cell in strict.missing())


def test_extra_cases_close_some_gaps() -> None:
    before = gap_matrix(anchors())
    after = gap_matrix([*anchors(), *extra_cases(3)])
    change = compare_gaps(before, after)
    assert ("albinism=true", "scar=linear") in change["closed"]
    assert ("vitiligo=segmental", "freckles=light") in change["closed"]
    assert change["opened"] == []


def test_report_is_about_declared_inputs_only() -> None:
    data = gap_matrix(anchors()).to_dict(limit=5)
    assert data["about"] == "DECLARED_SYNTHETIC_INPUTS_ONLY"
    assert data["lane_g_groups"] == "NOT_SUBSTITUTED"
    assert len(data["most_important_gaps"]) == 5


def test_validation() -> None:
    with pytest.raises(SyntheticInputError):
        gap_matrix(anchors(), minimum=0)
    with pytest.raises(SyntheticInputError):
        gap_matrix(["not a case"])  # type: ignore[list-item]
    with pytest.raises(SyntheticInputError):
        compare_gaps(gap_matrix(anchors(), 1), gap_matrix(anchors(), 2))
