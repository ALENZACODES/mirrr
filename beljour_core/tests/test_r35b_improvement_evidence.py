"""BELJOUR synthetic Cover Test ledger validation and tamper cases.

Missing faces, duplicate readings, swapped families and falsified pass flags
must never become a release-quality claim. Created by John Khan.
"""
from __future__ import annotations

from dataclasses import replace

import pytest

from plumb_api.filters.qa import cover
from plumb_api.filters.recipe import registry

CAT = registry.default()
RECIPES = [CAT.get("C08"), CAT.get("C09")]


@pytest.fixture(scope="module")
def evidence_rows() -> list[cover.CoverResult]:
    return cover.evaluate_many(RECIPES)


def test_complete_two_recipe_ledger_is_valid(evidence_rows: list[cover.CoverResult]) -> None:
    outcome = cover.cover_gate(RECIPES, evidence_rows)
    assert outcome["complete"]
    assert outcome["expected"] == 12
    assert outcome["observed"] == 12
    assert outcome["filters"] == 2
    assert outcome["realFacesEvaluated"] == 0
    assert set(outcome["worstByFilter"]) == {"C08", "C09"}


def test_worst_structural_readings_are_aggregated_per_filter(
    evidence_rows: list[cover.CoverResult],
) -> None:
    outcome = cover.cover_gate(RECIPES, evidence_rows)
    for rid in ("C08", "C09"):
        rows = [row for row in evidence_rows if row.filter_id == rid]
        assert outcome["worstByFilter"][rid]["identityDriftMax"] == max(
            row.metrics.identity_drift for row in rows
        )
        assert outcome["worstByFilter"][rid]["textureAlignmentMin"] == min(
            row.metrics.texture_alignment for row in rows
        )


def test_single_missing_tone_blocks_complete_gate(evidence_rows: list[cover.CoverResult]) -> None:
    left = [row for row in evidence_rows if (row.filter_id, row.tone) != ("C08", "dark")]
    outcome = cover.cover_gate(RECIPES, left)
    assert not outcome["complete"]
    assert any("C08/dark: cover result missing" in item for item in outcome["problems"])


def test_double_entry_does_not_inflate_coverage(evidence_rows: list[cover.CoverResult]) -> None:
    outcome = cover.cover_gate(RECIPES, [*evidence_rows, evidence_rows[0]])
    assert not outcome["complete"]
    assert any("repeated cover record" in item for item in outcome["problems"])


def test_row_from_other_filter_is_rejected(evidence_rows: list[cover.CoverResult]) -> None:
    other = replace(evidence_rows[0], filter_id="C107")
    outcome = cover.cover_gate(RECIPES, [*evidence_rows, other])
    assert not outcome["complete"]
    assert any("unexpected cover result" in item for item in outcome["problems"])


def test_unknown_skin_tone_is_rejected(evidence_rows: list[cover.CoverResult]) -> None:
    other = replace(evidence_rows[0], tone="unknown")
    outcome = cover.cover_gate(RECIPES, [*evidence_rows, other])
    assert not outcome["complete"]
    assert any("unexpected cover result" in item for item in outcome["problems"])


def test_swapped_light_fails_when_pixel_metrics_still_pass(
    evidence_rows: list[cover.CoverResult],
) -> None:
    altered = replace(evidence_rows[0], light="Studio" if evidence_rows[0].light != "Studio" else "Window")
    outcome = cover.cover_gate(RECIPES, [altered, *evidence_rows[1:]])
    assert not outcome["complete"]
    assert any("editorial metadata" in item for item in outcome["problems"])


def test_swapped_family_fails_when_pixel_metrics_still_pass(
    evidence_rows: list[cover.CoverResult],
) -> None:
    altered = replace(evidence_rows[0], family="Heritage" if evidence_rows[0].family != "Heritage" else "Salon Suite")
    outcome = cover.cover_gate(RECIPES, [altered, *evidence_rows[1:]])
    assert not outcome["complete"]
    assert any("editorial metadata" in item for item in outcome["problems"])


def test_forged_pass_flag_cannot_override_broken_identity_metrics(
    evidence_rows: list[cover.CoverResult],
) -> None:
    first = evidence_rows[0]
    altered = replace(first, metrics=replace(first.metrics, identity_drift=0.9), problems=())
    outcome = cover.cover_gate(RECIPES, [altered, *evidence_rows[1:]])
    assert not outcome["complete"]
    assert any("stored problem list" in item for item in outcome["problems"])
    assert any("facial detail" in item for item in outcome["problems"])


def test_forged_clean_texture_metrics_are_checked_against_limits(
    evidence_rows: list[cover.CoverResult],
) -> None:
    first = evidence_rows[0]
    altered = replace(first, metrics=replace(first.metrics, texture_ratio=0.12), problems=())
    outcome = cover.cover_gate(RECIPES, [altered, *evidence_rows[1:]])
    assert not outcome["complete"]
    assert any("texture not preserved" in item for item in outcome["problems"])


def test_nonfinite_identity_score_is_a_hard_error(evidence_rows: list[cover.CoverResult]) -> None:
    first = evidence_rows[0]
    altered = replace(first, metrics=replace(first.metrics, identity_drift=float("nan")))
    outcome = cover.cover_gate(RECIPES, [altered, *evidence_rows[1:]])
    assert not outcome["complete"]
    assert any("non-finite cover metric" in item for item in outcome["problems"])


def test_nonfinite_white_level_is_a_hard_error(evidence_rows: list[cover.CoverResult]) -> None:
    first = evidence_rows[0]
    altered = replace(first, metrics=replace(first.metrics, white_level=float("inf")))
    outcome = cover.cover_gate(RECIPES, [altered, *evidence_rows[1:]])
    assert not outcome["complete"]
    assert any("non-finite cover metric" in item for item in outcome["problems"])


def test_missing_editorial_recipe_metadata_blocks_ledger(
    evidence_rows: list[cover.CoverResult],
) -> None:
    no_family = dict(RECIPES[0], editorial={"light": "Window"})
    outcome = cover.cover_gate([no_family, RECIPES[1]], evidence_rows)
    assert not outcome["complete"]
    assert any("incomplete editorial grade" in item for item in outcome["problems"])


def test_same_filter_under_two_ranks_blocks_ledger(
    evidence_rows: list[cover.CoverResult],
) -> None:
    second = dict(RECIPES[1], rank=RECIPES[0]["rank"])
    outcome = cover.cover_gate([RECIPES[0], second], evidence_rows)
    assert not outcome["complete"]
    assert any("repeated rank" in item for item in outcome["problems"])


def test_report_selection_cannot_be_falsely_collapsed_to_one_recipe(
    evidence_rows: list[cover.CoverResult],
) -> None:
    reduced = [row for row in evidence_rows if row.filter_id == "C08"]
    outcome = cover.cover_gate(RECIPES, reduced)
    assert outcome["observed"] == 6
    assert outcome["expected"] == 12
    assert not outcome["complete"]
