"""Offline R16 Lane C commerce contracts. All images are geometric drawings.

No network access, no real faces, no keys, no copyrighted products. Author: John Khan.
"""
from __future__ import annotations

import io
import json
import tempfile
from dataclasses import replace
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from plumb_api.commerce.catalogue import by_id, products, public_catalogue, require_product, source, validate_source
from plumb_api.commerce.preview import preview_local
from plumb_api.commerce.ranking import Profile, alternatives, concerns_from_skin, from_skin_profile, rank
from plumb_api.commerce.sessions import CommerceSessions
from plumb_api.config import Settings
from plumb_api.consent import attestation
from plumb_api.errors import PlumbError
from plumb_api.main import create_app
from plumb_api.services.skin_match import local_skin_profile
from plumb_api.youcam.cache import CachedResult

SESSION = {"X-Beljour-Session": "commerceLaneCPrivate00"}
SESSION_OTHER = {"X-Beljour-Session": "commerceLaneCPrivate02"}


def synthetic_photo(tone: str = "warm") -> bytes:
    """A geometric ellipse, not a face photograph or source from any face dataset."""
    rgb = {"warm": (118, 78, 55), "cool": (120, 72, 94)}[tone]
    img = Image.new("RGB", (640, 640), (236, 235, 240))
    d = ImageDraw.Draw(img)
    d.ellipse((200, 130, 440, 530), fill=rgb)
    d.rectangle((0, 0, 640, 5), fill=(0, 0, 145))
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=90)
    return out.getvalue()


@pytest.fixture
def api():
    with tempfile.TemporaryDirectory() as root:
        settings = Settings(data_dir=Path(root), demo_only=True, unit_reserve=0,
                            rate_limit_enabled=False, session_cap_public=40)
        application = create_app(settings)
        with TestClient(application) as client:
            response = client.post("/api/photos", files={"file": ("drawn.jpg", synthetic_photo(), "image/jpeg")},
                                   headers=SESSION)
            assert response.status_code == 200, response.text
            yield client, response.json()["photo_id"], application


def test_catalogue_complete_permissive_and_without_real_brand_references():
    cat = public_catalogue()
    assert cat["currency"] == "CAD" and "Fictional" in cat["note"]
    assert len(cat["products"]) == 4 * 10 * 4 + 8
    assert all(p["sample"] and p["label"].startswith("Fictional") for p in cat["products"])
    assert all(p["name"] in {q.name for q in products()} for p in cat["products"])
    assert len(by_id()) == len(cat["products"])
    assert not any(token in {p["name"].lower() for p in cat["products"]}
                   for token in ("provider", "influencer", "clinical cure"))
    assert all(p["swatch"].startswith("#") and len(p["swatch"]) == 7 for p in cat["products"])
    assert all(p["currency"] == "CAD" and isinstance(p["price_cents"], int) for p in cat["products"])
    assert validate_source(source())["version"] == "r16c-2026-10-24"


def test_catalogue_rejects_mutation_and_duplicate_ids():
    modified = json.loads(json.dumps(source()))
    modified["formulas"].append(modified["formulas"][0])
    with pytest.raises(ValueError, match="duplicate"):
        validate_source(modified)
    modified = json.loads(json.dumps(source()))
    modified["depth_swatches"][1] = "red"
    with pytest.raises(ValueError, match="swatch"):
        validate_source(modified)
    modified = json.loads(json.dumps(source()))
    modified["formulas"][0]["price_cents"] = -1
    with pytest.raises(ValueError, match="price"):
        validate_source(modified)
    with pytest.raises(PlumbError) as exc:
        require_product("someone-elses-item")
    assert exc.value.status == 404


@pytest.mark.parametrize("depth,tone", [(1, "cool"), (1, "warm"), (4, "neutral"), (7, "olive"),
                                       (9, "cool"), (9, "warm"), (10, "neutral")])
def test_rank_uses_exact_depth_and_tone_for_every_foundation(depth: int, tone: str):
    rows = rank(Profile(depth, tone, "manual"), {"redness": 30, "oiliness": 42})
    bases = [r for r in rows if r["product"]["category"] == "complexion"]
    assert bases and all(r["product"]["depth"] == depth and r["product"]["undertone"] == tone
                         for r in bases)
    assert len(rows) <= 16
    assert all(r["why"] and all(isinstance(w, str) for w in r["why"]) for r in rows)
    assert len({r["product"]["id"] for r in rows}) == len(rows)


def test_deep_cool_and_warm_yield_different_ranked_ids():
    cool = rank(Profile(9, "cool", "manual"), {"redness": 25})
    warm = rank(Profile(9, "warm", "manual"), {"redness": 25})
    assert [r["product"]["id"] for r in cool] != [r["product"]["id"] for r in warm]
    assert cool[0]["product"]["undertone"] == "cool"
    assert warm[0]["product"]["undertone"] == "warm"
    assert cool[0]["product"]["swatch"] != warm[0]["product"]["swatch"]
    assert cool[0]["why"][0] == "W6 local depth 9 and cool undertone"


def test_finish_and_concerns_change_rank_but_not_identity():
    profile = Profile(7, "olive", "manual")
    wet = rank(profile, {"moisture": 9}, finish="dewy")
    matte = rank(profile, {"oiliness": 9}, finish="matte")
    assert wet[0]["product"]["id"] != matte[0]["product"]["id"]
    assert "moisture" in " ".join(wet[0]["why"])
    assert all(r["product"]["id"] in by_id() for r in wet + matte)
    assert len(alternatives(wet[0]["product"]["id"], profile)) <= 8


def test_w6_classification_used_not_reimplemented():
    measurement = local_skin_profile(np.full((128, 128, 3), (90, 66, 47), dtype=np.uint8))
    result = from_skin_profile(measurement)
    from plumb_api.engines.shade.finder import depth_band, undertone_of
    assert result.depth == depth_band(measurement.lightness)
    assert result.undertone == undertone_of((measurement.lightness, measurement.a, measurement.b))["undertone"]
    assert result.confidence == "estimate" and "without" not in result.evidence


def test_cosmetic_values_do_not_inject_unapproved_products_or_scores():
    assert concerns_from_skin([{"concern": "not-in-catalogue", "raw_score": 0},
                               {"concern": "redness", "raw_score": float("nan")},
                               {"concern": "redness", "raw_score": 55}]) == {"redness": 55}
    for bad in (-1, 101, True, 1.5):
        with pytest.raises(ValueError):
            rank(Profile(6, "warm", "manual"), {"redness": bad})


def test_bag_totals_removal_wishlist_idempotence_and_no_checkout():
    cart = CommerceSessions()
    sku = "quiet-veil-09-warm"
    subtotal = require_product(sku).price_cents
    a = cart.add("commerceLaneCPrivate00", sku, 2)
    assert a["total_cents"] == subtotal * 2
    assert a["subtotal_cents"] == subtotal * 2 and a["checkout_enabled"] is False
    assert a["tax_cents"] is None and a["shipping_cents"] is None
    assert a["lines"][0]["product"]["id"] == sku
    a = cart.wish("commerceLaneCPrivate00", sku, True)
    assert [p["id"] for p in a["wishlist"]] == [sku]
    a = cart.remove("commerceLaneCPrivate00", sku, 1)
    assert a["items"] == 1 and a["total_cents"] == subtotal
    a = cart.remove("commerceLaneCPrivate00", sku)
    assert a["total_cents"] == 0 and a["wishlist"][0]["id"] == sku
    assert cart.remove("commerceLaneCPrivate00", sku)["revision"] == a["revision"]
    assert cart.view("commerceLaneCPrivate01")["wishlist"] == []
    with pytest.raises(PlumbError) as exc:
        cart.add("anonymous", sku)
    assert exc.value.status == 403
    with pytest.raises(PlumbError) as exc:
        cart.add("commerceLaneCPrivate00", sku, 6)
    assert exc.value.status == 422
    with pytest.raises(PlumbError) as exc:
        cart.add("commerceLaneCPrivate00", sku, 1, revision=999)
    assert exc.value.status == 409
    assert cart.clear("commerceLaneCPrivate00")["wishlist"] == []


def test_session_ttl_eviction_and_previews_store_no_images():
    now = [0.0]
    cart = CommerceSessions(clock=lambda: now[0])
    cart.preview("commerceLaneCPrivate00", "a" * 64, "quiet-veil-09-warm")
    assert cart.view("commerceLaneCPrivate00")["last_preview_sku"] == "quiet-veil-09-warm"
    now[0] = 3601.0
    assert cart.view("commerceLaneCPrivate00")["last_photo_id"] is None


def test_local_preview_returns_a_real_visual_effect_but_never_mutates_input():
    original = synthetic_photo()
    result, meta = preview_local(original, require_product("quiet-veil-09-warm"), 65)
    assert result != original and meta["simulation"] and meta["source"] == "local"
    with Image.open(io.BytesIO(original)) as a, Image.open(io.BytesIO(result)) as b:
        assert a.size == b.size and a.size == (640, 640)
        before = np.asarray(a.convert("RGB"), dtype=np.int16)
        after = np.asarray(b.convert("RGB"), dtype=np.int16)
        assert float(np.abs(after - before).mean()) > 0.5
    assert original == synthetic_photo()
    with pytest.raises(ValueError):
        preview_local(original, require_product("calm-canvas"))


def test_catalogue_route_and_private_cart_are_isolated(api):
    client, photo_id, _ = api
    response = client.get("/api/commerce/catalogue")
    assert response.status_code == 200
    assert response.json()["products"] == public_catalogue()["products"]
    item = "quiet-veil-09-warm"
    response = client.post("/api/commerce/bag/add", json={"product_id": item, "quantity": 2}, headers=SESSION)
    assert response.status_code == 200
    assert response.json()["subtotal_cents"] == 2 * require_product(item).price_cents
    assert client.get("/api/commerce/bag", headers=SESSION_OTHER).json()["items"] == 0
    remove = client.post("/api/commerce/bag/remove", json={"product_id": item}, headers=SESSION)
    assert remove.json()["items"] == 0
    assert client.get("/api/commerce/bag").status_code == 403
    assert photo_id


def test_missing_consent_for_live_skin_and_vto_returns_403_before_provider(api):
    client, photo_id, application = api
    gateway = application.state.plumb.gateway
    gateway.run = AsyncMock(side_effect=AssertionError("no provider call without consent"))
    application.state.plumb.settings = SimpleNamespace(live=True, youcam_styling=True, youcam_skin=True, kill_switch=False)
    response = client.post("/api/commerce/match", json={"photo_id": photo_id, "local_only": False}, headers=SESSION)
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "consent_required"
    response = client.post("/api/commerce/try-on", json={"photo_id": photo_id,
        "product_id": "quiet-veil-09-warm"}, headers=SESSION)
    assert response.status_code == 403
    assert gateway.run.await_count == 0


def test_flag_off_and_local_only_make_zero_provider_calls(api):
    client, photo_id, application = api
    gateway = application.state.plumb.gateway
    gateway.run = AsyncMock(side_effect=AssertionError("flag-off must not call YouCam"))
    response = client.post("/api/commerce/match", json={"photo_id": photo_id}, headers=SESSION)
    assert response.status_code == 200, response.text
    match = response.json()
    assert match["source"] == "local" and match["units_spent"] == 0
    assert all(row["product"]["id"] in by_id() for row in match["recommendations"])
    response = client.post("/api/commerce/try-on", json={"photo_id": photo_id,
        "product_id": match["recommendations"][0]["product"]["id"]}, headers=SESSION)
    assert response.status_code == 200, response.text
    assert response.json()["source"] == "local" and response.json()["provider_calls"] == 0
    assert response.json()["image"].startswith("data:image/jpeg;base64,")
    assert gateway.run.await_count == 0


def test_opted_in_skin_and_makeup_uses_existing_gateway_once_each(api):
    client, photo_id, application = api
    state = application.state.plumb
    state.settings = SimpleNamespace(live=True, youcam_styling=True, youcam_skin=True, kill_switch=False)
    original_data = synthetic_photo()
    state.gateway.run = AsyncMock(return_value=CachedResult("makeup-vto", photo_id, {}, image=original_data,
                                                             image_type="image/jpeg", source="live", units=2))

    class RecordedSkinMatch:
        def __init__(self):
            self.calls = []

        async def match(self, photo, *, concerns=None, local_only=False):
            self.calls.append((photo.sha, concerns, local_only))
            return {"source": "youcam", "concerns": [{"concern": "redness", "raw_score": 31}],
                    "units_spent": 9, "cached": False, "fallback": None}

    skin = RecordedSkinMatch()
    state.skin_match = skin
    match = client.post("/api/commerce/match", headers=SESSION, json={
        "photo_id": photo_id, "consent": attestation(photo_id, "skin-match"), "finish": "natural"})
    assert match.status_code == 200, match.text
    response = match.json()
    assert response["source"] == "youcam" and response["cosmetic_concerns"] == {"redness": 31}
    assert skin.calls == [(photo_id, None, False)]
    sku = response["recommendations"][0]["product"]["id"]
    preview = client.post("/api/commerce/try-on", headers=SESSION, json={
        "photo_id": photo_id, "product_id": sku, "consent": attestation(photo_id, "makeup"), "strength": 60})
    assert preview.status_code == 200, preview.text
    assert preview.json()["source"] == "youcam"
    state.gateway.run.assert_awaited_once()
    call = state.gateway.run.await_args
    assert call.args[1] == "makeup-vto" and call.args[2]["effects"][0]["category"] == "foundation"
    assert call.args[0].sha == photo_id


def test_live_preview_spend_error_falls_back_locally(api):
    client, photo_id, app = api
    from plumb_api.errors import BudgetExceeded
    state = app.state.plumb
    state.settings = SimpleNamespace(live=True, youcam_styling=True, youcam_skin=True, kill_switch=False)
    state.gateway.run = AsyncMock(side_effect=BudgetExceeded("unit budget", {"reason": "balance_floor"}))
    response = client.post("/api/commerce/try-on", headers=SESSION, json={
        "photo_id": photo_id, "product_id": "quiet-veil-09-warm", "consent": attestation(photo_id, "makeup")})
    assert response.status_code == 200, response.text
    assert response.json()["source"] == "local" and response.json()["fallback"] == "balance_floor"
    assert response.json()["units_spent"] == 0


def test_explicit_server_photo_deletion_reuses_existing_private_endpoint(api):
    client, photo_id, _ = api
    stranger = client.delete(f"/api/photos/{photo_id}", headers=SESSION_OTHER)
    assert stranger.status_code == 404
    assert client.get(f"/api/photos/{photo_id}.jpg", headers=SESSION).status_code == 200
    deletion = client.delete(f"/api/photos/{photo_id}", headers=SESSION)
    assert deletion.status_code == 200 and deletion.json()["deleted"] is True
    assert client.get(f"/api/photos/{photo_id}.jpg", headers=SESSION).status_code == 404
