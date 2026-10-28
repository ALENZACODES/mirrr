"""Nearby-reference inspection: existing tolerances only, refusals stay refusals.

Synthetic Lab readings and in-house references only. Author: John Khan.
"""
from __future__ import annotations

import dataclasses

import numpy as np

from plumb_api.engines.shade.finder import (
    NO_WHITE,
    ShadeResult,
    WhiteBalance,
    extended_reference_table,
    find_from_pixels,
    thresholds,
)
from plumb_api.engines.shade.loaders import shade_by_id
from plumb_api.engines.shade.reference_ambiguity import inspect_reference_ambiguity, nearby_limit
from plumb_api.engines.shade.sensitivity_parity import CASTS, base_colours, case_reading

NEUTRAL = WhiteBalance((1.0, 1.0, 1.0), "neutral", False)


def reading(rgb: tuple[int, int, int]) -> ShadeResult:
    zones = {name: np.tile(np.asarray([rgb], dtype=np.float64), (300, 1)) for name in ("cheek_right", "cheek_left",
                                                                                       "forehead")}
    return find_from_pixels(zones, NEUTRAL, extended_reference_table())


def test_limit_is_the_existing_full_confidence_match_distance() -> None:
    assert nearby_limit() == thresholds()["confidence"]["match_delta_e_ok"] == 2.5


def test_alternatives_are_near_never_lighter_and_never_the_selection() -> None:
    seen = {"clear": 0, "ambiguous": 0}
    for _, base in base_colours():
        result, _, _ = case_reading(base, CASTS["daylight"])
        decision = inspect_reference_ambiguity(result)
        assert decision.status in seen
        seen[decision.status] += 1
        assert decision.selected_id == result.best["id"]  # type: ignore[index]
        assert decision.confidence == result.confidence["overall"]
        for alt in decision.alternatives:
            assert alt.record.id != decision.selected_id
            assert alt.delta_e <= 2.5 and alt.lighter_by <= 1.0
            assert decision.selected_delta_e is not None and alt.delta_e >= decision.selected_delta_e
    assert seen["clear"] > 0 and seen["ambiguous"] > 0


def test_a_refused_reading_gets_no_alternatives() -> None:
    refused = find_from_pixels({}, NO_WHITE)
    decision = inspect_reference_ambiguity(refused)
    assert (decision.status, decision.code, decision.alternatives) == ("refused", "reading_refused", ())
    assert decision.public()["alternatives"] == []


def test_selection_from_another_table_is_incompatible() -> None:
    result = reading((150, 112, 92))
    assert not result.refused
    moved = dataclasses.replace(result, best={**result.best, "id": "LG-01C"})  # type: ignore[dict-item]
    decision = inspect_reference_ambiguity(moved)
    assert (decision.status, decision.code) == ("refused", "incompatible_baseline")
    assert decision.confidence == result.confidence["overall"]


def test_public_form_names_in_house_swatches_only() -> None:
    result, _, _ = case_reading(base_colours()[3][1], CASTS["daylight"])
    body = inspect_reference_ambiguity(result).public()
    assert body["format"] == "beljour-reference-ambiguity/1" and "not product" in body["note"]
    for alt in body["alternatives"]:
        assert shade_by_id(alt["id"], "reference").name == alt["name"]
