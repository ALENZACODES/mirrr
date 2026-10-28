"""R18 Lane C skin-to-commerce matching, no live vendor traffic.

Requests are routed through the actual FastAPI service and fake adapter/cached
Skin AI result. The source catalogue is fictional; photos are drawn in tests.
Author: John Khan.
"""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from plumb_api.commerce.catalogue import by_id, public_catalogue
from plumb_api.commerce.ranking import Profile, rank
from plumb_api.consent import attestation
from tests.test_commerce_r16c import SESSION, api  # noqa: F401


@pytest.mark.parametrize("depth", (1, 3, 5, 7, 9, 10))
@pytest.mark.parametrize("undertone", ("cool", "neutral", "warm", "olive"))
def test_all_fictional_shade_classes_are_deterministic_and_unbranded(depth: int, undertone: str) -> None:
    profile = Profile(depth, undertone, "manual")
    first = rank(profile, {"redness": 30, "texture": 40}, finish="natural")
    assert first == rank(profile, {"redness": 30, "texture": 40}, finish="natural")
    assert first
    assert len({item["product"]["id"] for item in first}) == len(first)
    assert all(item["product"]["id"] in by_id() and item["product"]["sample"] is True
               for item in first)
    for ranked in first:
        p = ranked["product"]
        if p["category"] == "complexion":
            assert (p["depth"], p["undertone"]) == (depth, undertone)
        assert not p["id"].startswith("youcam-")
        assert "Fictional" in p["label"]


@pytest.mark.parametrize("flag", (
    {"live": False, "youcam_skin": True, "youcam_styling": True, "kill_switch": False},
    {"live": True, "youcam_skin": False, "youcam_styling": True, "kill_switch": False},
    {"live": True, "youcam_skin": True, "youcam_styling": True, "kill_switch": True},
    {"live": True, "youcam_skin": True, "youcam_styling": False, "kill_switch": False},
))
def test_off_flags_allow_end_to_end_manual_match_preview_and_bag_with_no_calls(api, flag: dict) -> None:
    client, photo_id, app = api
    state = app.state.plumb
    state.settings = SimpleNamespace(**flag)
    state.gateway.run = AsyncMock(side_effect=AssertionError("Vendor invoked with adapter disabled"))
    match = client.post("/api/commerce/match", headers=SESSION, json={
        "photo_id": photo_id, "local_only": False, "manual_depth": 9,
        "manual_undertone": "warm", "finish": "natural"})
    assert match.status_code == 200, match.text
    payload = match.json()
    assert payload["source"] == "manual" and payload["units_spent"] == 0
    assert payload["recommendations"][0]["product"]["sample"] is True
    sku = payload["recommendations"][0]["product"]["id"]
    preview = client.post("/api/commerce/try-on", headers=SESSION, json={
        "photo_id": photo_id, "product_id": sku, "local_only": True, "strength": 62})
    assert preview.status_code == 200, preview.text
    result = preview.json()
    assert result["source"] == "local" and result["provider_calls"] == 0
    assert "simulation" in result["label"].lower()
    bag = client.post("/api/commerce/bag/add", headers=SESSION, json={"product_id": sku, "quantity": 2})
    assert bag.status_code == 200 and bag.json()["items"] == 2
    assert state.gateway.run.await_count == 0


def test_consented_fake_skin_ai_flows_to_only_local_fictional_ranked_products(api) -> None:
    client, photo_id, app = api
    state = app.state.plumb
    state.settings = SimpleNamespace(live=True, youcam_skin=True, youcam_styling=True, kill_switch=False)
    state.gateway.run = AsyncMock(side_effect=AssertionError("The real YouCam gateway must not be called"))
    fake_skin = AsyncMock(return_value={
        "source": "youcam", "cached": True, "units_spent": 0,
        "concerns": [
            {"concern": "wrinkle", "raw_score": 12},
            {"concern": "moisture", "raw_score": 40},
            {"concern": "not-allowed", "raw_score": 1},
            {"concern": "spots", "raw_score": float("nan")},
        ],
    })
    state.skin_match = SimpleNamespace(match=fake_skin)
    matched = client.post("/api/commerce/match", headers=SESSION, json={
        "photo_id": photo_id, "local_only": False, "finish": "dewy",
        "consent": attestation(photo_id, "skin-match")})
    assert matched.status_code == 200, matched.text
    result = matched.json()
    assert result["source"] == "youcam" and result["cached"] is True
    assert result["units_spent"] == 0
    assert result["skin_analysis_provenance"] == "YouCam Skin AI via existing adapter"
    assert result["cosmetic_concerns"] == {"wrinkles": 12, "moisture": 40}
    assert len(result["recommendations"]) > 1
    assert all(entry["product"]["id"] in by_id() and entry["product"]["sample"] is True
               for entry in result["recommendations"])
    assert fake_skin.await_count == 1
    assert state.gateway.run.await_count == 0


def test_catalogue_cannot_claim_real_ecommerce_endorsements() -> None:
    catalogue = public_catalogue()
    assert catalogue["currency"] == "CAD"
    assert all(p["currency"] == "CAD" and p["sample"] is True for p in catalogue["products"])
    assert all("Fictional" in p["label"] and p["price_cents"] >= 0 for p in catalogue["products"])
    assert all(p["id"] in by_id() for p in catalogue["products"])
    assert all(p["vto"] in ("foundation", "blush", "lip", None) for p in catalogue["products"])
