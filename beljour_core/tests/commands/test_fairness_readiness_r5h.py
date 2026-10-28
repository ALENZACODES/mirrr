"""Label-only fairness gate regressions on invented group summaries.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.fairness_readiness import (
    GapDefinition,
    GroupRate,
    review_group_gap,
)


def definition() -> GapDefinition:
    return GapDefinition("protected_parity", "race", "protected", 0.03, 30, True)


def groups() -> tuple[GroupRate, ...]:
    return (GroupRate("protected", 100, 96, True), GroupRate("other", 100, 98, True))


def test_measured_group_gap_cannot_be_release_pass() -> None:
    result = review_group_gap(definition(), groups())
    assert result.status == "measured"
    assert result.release_qualified is False
    assert result.public_metadata()["release_qualified"] is False
    assert result.observed_gap == pytest.approx(0.02)
    assert result.comparator_group == "other"


def test_too_wide_group_gap_fails() -> None:
    weaker = (GroupRate("protected", 100, 90, True), GroupRate("other", 100, 99, True))
    result = review_group_gap(definition(), weaker)
    assert result.status == "fail"
    assert result.observed_gap == pytest.approx(0.09)
    assert "protected_group_disparity" in result.failures


def test_exact_boundary_is_accepted_without_rounding_looseness() -> None:
    measured = (GroupRate("protected", 100, 96, True), GroupRate("other", 100, 99, True))
    result = review_group_gap(definition(), measured)
    assert result.observed_gap == pytest.approx(0.03)
    assert result.status == "measured"


def test_worst_group_does_not_hide_best_comparator() -> None:
    rows = (*groups(), GroupRate("third", 100, 100, True))
    result = review_group_gap(definition(), rows)
    assert result.status == "fail"
    assert result.comparator_group == "third"
    assert result.observed_gap == pytest.approx(0.04)


@pytest.mark.parametrize("mode", ["underpowered", "labels", "unregistered"])
def test_unproven_group_conditions(mode: str) -> None:
    config = definition()
    rows = groups()
    if mode == "underpowered":
        rows = (GroupRate("protected", 2, 2, True), rows[1])
    elif mode == "labels":
        rows = (replace(rows[0], labels_independently_verified=False), rows[1])
    else:
        config = replace(config, threshold_preregistered=False)
    result = review_group_gap(config, rows)
    assert result.status == "unproven"
    assert result.missing


def test_missing_protected_or_comparator_keeps_gate_unproven() -> None:
    protected_missing = review_group_gap(definition(), (groups()[1],))
    assert protected_missing.status == "unproven"
    assert "protected_group_missing" in protected_missing.missing
    compare_missing = review_group_gap(definition(), (groups()[0],))
    assert compare_missing.status == "unproven"
    assert "comparator_groups_missing" in compare_missing.missing


def test_zero_eligible_cannot_pass() -> None:
    rows = (GroupRate("protected", 0, 0, True), GroupRate("other", 50, 49, True))
    result = review_group_gap(definition(), rows)
    assert result.status == "unproven"
    assert result.observed_gap is None


def test_duplicate_group_labels_rejected() -> None:
    with pytest.raises(CommandValidationError):
        review_group_gap(definition(), (groups()[0], groups()[0]))


@pytest.mark.parametrize("eligible,passed", [(-1, 0), (3, 4), (1.2, 1), (True, 1)])
def test_invalid_group_counts_rejected(eligible: int | float, passed: int) -> None:
    with pytest.raises(CommandValidationError):
        GroupRate("test", eligible, passed, True)


def test_group_labels_must_be_explicit() -> None:
    with pytest.raises(CommandValidationError):
        GroupRate("", 100, 50, True)
    with pytest.raises(CommandValidationError):
        GroupRate("../../../path", 100, 50, True)
    with pytest.raises(CommandValidationError):
        GroupRate("label", 100, 99, 1)


def test_invalid_threshold_and_rules_rejected() -> None:
    for threshold in (float("nan"), -0.1, 1.2):
        with pytest.raises(CommandValidationError):
            replace(definition(), allowed_gap=threshold)
    with pytest.raises(CommandValidationError):
        replace(definition(), minimum_group_size=0)
    with pytest.raises(CommandValidationError):
        replace(definition(), reference_labels_required=False)


def test_group_report_does_not_contain_private_values() -> None:
    data = review_group_gap(definition(), groups()).public_metadata()
    assert "filename" not in repr(data)
    assert "pixels" not in repr(data)
    assert "face_vectors" not in repr(data)
