"""R19c fictional shopping comparisons; generated Python/TS evidence, never live API.

These rows are from our authored sample catalogue; no skin photos, clinical
scores, vendor catalogue feeds, products or external services are used.
Author: John Khan.
"""
from __future__ import annotations

import json
import sys
from typing import Any

import pytest

from plumb_api.commerce.catalogue import by_id, products, source
from plumb_api.commerce.shortlist import ShortlistOptions, shortlist


def ranked_fixture() -> list[dict[str, Any]]:
    """Sample every category and four tones at fixed depth; deterministic scores."""
    selected = [row for row in products() if row.depth is None or
                row.depth == 5 and row.undertone in ("cool", "neutral", "warm", "olive")]
    assert len(selected) <= 32
    return [{"product": row.to_json(), "score": 390 - 7 * pos,
             "why": ["Synthetic catalogue-only ranking"],
             "label": "Fictional samples"} for pos, row in enumerate(selected)]


SCENARIOS: tuple[dict[str, Any], ...] = (
    {"budget_cents": 0},
    {"budget_cents": 1500},
    {"budget_cents": 5000},
    {"budget_cents": 10_000},
    {"budget_cents": 100_000},
    {"budget_cents": 7000, "goal": "lower-cost"},
    {"budget_cents": 7000, "goal": "visual-try-on"},
    {"budget_cents": 7000, "goal": "shade-first"},
    {"budget_cents": 7000, "category": "complexion"},
    {"budget_cents": 7000, "category": "cheek"},
    {"budget_cents": 7000, "category": "lip"},
    {"budget_cents": 7000, "visual_only": True},
    {"budget_cents": 7000, "coverage": "sheer"},
    {"budget_cents": 7000, "coverage": "none"},
    {"budget_cents": 7000, "preferred_concern": "texture"},
    {"budget_cents": 7000, "preferred_concern": "radiance"},
    {"budget_cents": 7000, "max_items": 1},
    {"budget_cents": 7000, "max_items": 16},
)


@pytest.mark.parametrize("options", SCENARIOS, ids=lambda p: str(p))
def test_deterministic_budget_limited_local_comparison(options: dict[str, Any]) -> None:
    choices = ShortlistOptions(**options)
    first = shortlist(ranked_fixture(), choices).public()
    assert first == shortlist(ranked_fixture(), choices).public()
    assert first["simulated"] and first["checkout_enabled"] is False
    assert first["provider_calls"] == 0 and first["source"] == "owned-catalogue"
    assert len(first["items"]) <= choices.max_items
    seen: set[str] = set()
    for item in first["items"]:
        assert item["product"]["id"] in by_id()
        assert item["product"] == by_id()[item["product"]["id"]].to_json()
        assert item["sample_price_cents"] <= choices.budget_cents
        assert item["product"]["id"] not in seen
        assert item["score"] == item["base_score"] + item["price_bonus"] + item["visualization_bonus"] + item["concern_bonus"] + (10 if choices.goal == "shade-first" and item["product"]["category"] == "complexion" else 0)
        seen.add(item["product"]["id"])
    trio = first["three_piece"]
    if trio is not None:
        assert len(trio["products"]) == 3
        assert [by_id()[sku].category for sku in trio["products"]] == ["complexion", "cheek", "lip"]
        assert trio["subtotal_cents"] == sum(by_id()[sku].price_cents for sku in trio["products"])
        assert trio["subtotal_cents"] <= choices.budget_cents
        assert trio["checkout_enabled"] is False


def test_tampered_rank_rows_are_discarded_not_displayed() -> None:
    rows = ranked_fixture()
    row = rows[0]
    for field, invalid in [("name", "Company A"), ("price_cents", 1), ("swatch", "#ffffff"),
                           ("category", "other"), ("depth", 99), ("undertone", "ghost")]:
        forged = {"product": {**row["product"], field: invalid}, "score": 1_000}
        outcome = shortlist([forged, row]).public()
        assert outcome["discarded_untrusted_rows"] == 1
        assert len(outcome["items"]) == 1
        assert outcome["items"][0]["product"] == row["product"]
    for badscore in [-1, 1_001, 12.2, "100", True, None]:
        outcome = shortlist([{"product": row["product"], "score": badscore}]).public()
        assert outcome["items"] == [] and outcome["discarded_untrusted_rows"] == 1
    assert shortlist([row, row]).public()["discarded_untrusted_rows"] == 1
    assert shortlist([{"product": {"id": "not-ours"}, "score": 77}]).public()["items"] == []


@pytest.mark.parametrize("options", [
    {"budget_cents": -1}, {"budget_cents": 100001}, {"budget_cents": True},
    {"max_items": 0}, {"max_items": 17}, {"max_items": 3.5},
    {"category": "men"}, {"goal": "buy-now"}, {"coverage": "opaque"},
    {"preferred_concern": "diagnosis"}, {"visual_only": 1},
])
def test_boundary_rejection_before_results(options: dict[str, Any]) -> None:
    with pytest.raises(ValueError):
        shortlist(ranked_fixture(), ShortlistOptions(**options))


def test_excess_rows_rejected_and_group_order_stable() -> None:
    rows = ranked_fixture()
    with pytest.raises(ValueError):
        shortlist(rows + rows + rows)
    result = shortlist(rows, ShortlistOptions(max_items=16)).public()
    ordered = [item["product"]["category"] for item in result["items"]]
    assert ordered[:5] == ["complexion", "cheek", "lip", "prep", "finish"]
    assert all(c in source()["concerns"] for c in ["texture", "radiance"])


def parity_vectors() -> dict[str, Any]:
    rows = ranked_fixture()
    return {"format": "beljour-commerce-shortlist-r19c/1", "synthetic_only": True,
            "provider_calls": 0, "scenarios": [
                {"options": options, "ranked": rows,
                 "outcome": shortlist(rows, ShortlistOptions(**options)).public()}
                for options in SCENARIOS
            ], "malformed": [
                {"ranked": [rows[0], {"product": {**rows[1]["product"], "name": "forged"}, "score": 500}],
                 "options": {"budget_cents": 7000},
                 "outcome": shortlist([rows[0], {"product": {**rows[1]["product"], "name": "forged"}, "score": 500}],
                                      ShortlistOptions(budget_cents=7000)).public()},
            ]}


if __name__ == "__main__" and "--emit-vectors" in sys.argv:
    print(json.dumps(parity_vectors(), separators=(",", ":")))
