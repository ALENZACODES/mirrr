"""Additional Lane C server integration contracts, using fake gateway and drawn shapes.

The route is mounted on the actual FastAPI application; provider mocks never
call external services. Only fictional sample SKUs may reach the bag or VTO.
Author: John Khan.
"""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from plumb_api.commerce.catalogue import by_id, require_product
from plumb_api.commerce.ranking import Profile, rank
from plumb_api.commerce.sessions import CommerceSessions, TTL_SECONDS
from plumb_api.consent import attestation
from tests.test_commerce_r16c import SESSION, SESSION_OTHER, api  # noqa: F401


@pytest.mark.parametrize("body", [
    {"manual_depth": 9},
    {"manual_undertone": "cool"},
    {"manual_depth": 0, "manual_undertone": "cool"},
    {"manual_depth": 11, "manual_undertone": "warm"},
    {"manual_depth": 9, "manual_undertone": "unknown"},
    {"manual_depth": True, "manual_undertone": "cool"},
    {"manual_depth": 9, "manual_undertone": "warm", "bogus": "key"},
])
def test_malformed_manual_profile_fails_before_analysis(api, body: dict) -> None:
    client, photo_id, app = api
    app.state.plumb.gateway.run = AsyncMock(side_effect=AssertionError("provider called"))
    response = client.post("/api/commerce/match", json={"photo_id": photo_id, **body}, headers=SESSION)
    assert response.status_code == 422
    assert app.state.plumb.gateway.run.await_count == 0


@pytest.mark.parametrize("enabled", [
    {"live": False, "youcam_skin": True, "youcam_styling": True, "kill_switch": False},
    {"live": True, "youcam_skin": True, "youcam_styling": True, "kill_switch": True},
    {"live": True, "youcam_skin": True, "youcam_styling": False, "kill_switch": False},
    {"live": True, "youcam_skin": False, "youcam_styling": True, "kill_switch": False},
])
def test_every_off_configuration_never_calls_provider(api, enabled: dict) -> None:
    client, photo_id, app = api
    state = app.state.plumb
    state.settings = SimpleNamespace(**enabled)
    state.gateway.run = AsyncMock(side_effect=AssertionError("vendor usage not allowed"))
    body = {"photo_id": photo_id, "local_only": False, "finish": "natural",
            "manual_depth": 10, "manual_undertone": "cool"}
    matched = client.post("/api/commerce/match", json=body, headers=SESSION)
    assert matched.status_code == 200, matched.text
    assert matched.json()["units_spent"] == 0 and matched.json()["source"] == "manual"
    assert matched.json()["recommendations"][0]["product"]["undertone"] == "cool"
    local = client.post("/api/commerce/try-on", json={"photo_id": photo_id,
        "product_id": "quiet-veil-10-cool", "local_only": True}, headers=SESSION)
    assert local.status_code == 200
    assert local.json()["provider_calls"] == 0 and local.json()["source"] == "local"
    assert state.gateway.run.await_count == 0


def test_opt_in_requires_exact_photo_scope_and_attested_adult(api) -> None:
    client, photo_id, app = api
    state = app.state.plumb
    state.settings = SimpleNamespace(live=True, youcam_skin=True, youcam_styling=True, kill_switch=False)
    state.gateway.run = AsyncMock(side_effect=AssertionError("provider called on mismatched consent"))
    for request_body in (
        {"photo_id": photo_id},
        {"photo_id": photo_id, "consent": attestation(photo_id, "makeup")},
        {"photo_id": photo_id, "consent": attestation("e" * 64, "skin-match")},
    ):
        response = client.post("/api/commerce/match", json=request_body, headers=SESSION)
        assert response.status_code in (403, 428), response.text
    for request_body in (
        {"photo_id": photo_id, "product_id": "quiet-veil-09-warm"},
        {"photo_id": photo_id, "product_id": "quiet-veil-09-warm", "consent": attestation(photo_id, "skin-match")},
        {"photo_id": photo_id, "product_id": "quiet-veil-09-warm", "consent": attestation("e" * 64, "makeup")},
    ):
        response = client.post("/api/commerce/try-on", json=request_body, headers=SESSION)
        assert response.status_code in (403, 428), response.text
    assert state.gateway.run.await_count == 0


def test_shade_swap_only_returns_fictional_catalogue_and_adjacent_depth(api) -> None:
    client, photo_id, _ = api
    result = client.post("/api/commerce/shade-swaps", json={
        "product_id": "quiet-veil-09-warm", "depth": 9, "undertone": "cool"}, headers=SESSION)
    assert result.status_code == 200, result.text
    data = result.json()
    original = require_product("quiet-veil-09-warm")
    assert data["requested"]["id"] == original.sku
    assert data["alternatives"]
    assert all(p["id"] in by_id() and abs(p["depth"] - 9) <= 1 and
               p["formula_id"] == original.formula_id for p in data["alternatives"])
    assert photo_id not in str(data)


def test_revision_conflict_is_atomic_and_private(api) -> None:
    client, _, _ = api
    sku = "quiet-veil-09-warm"
    first = client.post("/api/commerce/bag/add", json={"product_id": sku, "quantity": 2}, headers=SESSION)
    assert first.status_code == 200
    revision = first.json()["revision"]
    second = client.post("/api/commerce/bag/add", json={"product_id": sku, "quantity": 1,
                                                        "revision": revision}, headers=SESSION)
    assert second.status_code == 200
    stale = client.post("/api/commerce/bag/remove", json={"product_id": sku, "revision": revision}, headers=SESSION)
    assert stale.status_code == 409
    correct = client.get("/api/commerce/bag", headers=SESSION).json()
    assert correct["items"] == 3 and correct["subtotal_cents"] == require_product(sku).price_cents * 3
    other = client.get("/api/commerce/bag", headers=SESSION_OTHER).json()
    assert other["items"] == 0
    assert correct["checkout_enabled"] is False and correct["tax_cents"] is None


def test_session_ttl_expires_without_leaking_bag() -> None:
    time = [400.0]
    sessions = CommerceSessions(clock=lambda: time[0])
    sku = "quiet-veil-09-warm"
    session = "laneCPrivateExample00"
    assert sessions.add(session, sku, 2)["items"] == 2
    time[0] += TTL_SECONDS + 1.0
    assert sessions.view(session)["items"] == 0
    assert sessions.view(session)["revision"] == 0


@pytest.mark.parametrize("sku", ["made-up", "not-a-product", "Q1000", "someone\\tunknown"])
def test_server_never_accepts_unlisted_product_names(api, sku: str) -> None:
    client, photo_id, app = api
    state = app.state.plumb
    state.gateway.run = AsyncMock(side_effect=AssertionError("provider called for unknown product"))
    for route, body in (
        ("bag/add", {"product_id": sku}),
        ("wishlist", {"product_id": sku, "selected": True}),
        ("try-on", {"photo_id": photo_id, "product_id": sku, "local_only": True}),
    ):
        response = client.post("/api/commerce/" + route, json=body, headers=SESSION)
        assert response.status_code in (404, 422), response.text
    assert state.gateway.run.await_count == 0


@pytest.mark.parametrize("strength", [-1, 101, "loud", 50.4, True])
def test_invalid_preview_strength_is_not_forwarded_to_youcams_adapter(api, strength: object) -> None:
    client, photo_id, app = api
    state = app.state.plumb
    state.gateway.run = AsyncMock(side_effect=AssertionError("provider called for invalid data"))
    result = client.post("/api/commerce/try-on", json={
        "photo_id": photo_id, "product_id": "quiet-veil-09-warm", "strength": strength,
        "local_only": True}, headers=SESSION)
    assert result.status_code == 422
    assert state.gateway.run.await_count == 0


def test_ranking_explanations_differ_by_finish_and_skin_concern() -> None:
    profile = Profile(depth=9, undertone="warm", confidence="manual")
    natural = rank(profile, {"redness": 80}, finish="natural")
    dewy = rank(profile, {"moisture": 11}, finish="dewy")
    assert [r["product"]["id"] for r in natural] != [r["product"]["id"] for r in dewy]
    assert all(isinstance(r["why"], list) and all(isinstance(reason, str) and reason for reason in r["why"])
               for r in natural + dewy)
    assert all(item["product"]["id"] in by_id() for item in natural + dewy)
