"""Server route regression: disabled provider never gets a YouCam request."""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock

from tests.test_commerce_r16c import SESSION, api as api


def test_skin_matching_and_sample_preview_flag_off(api: object) -> None:
    client, photo_id, app = api
    state = app.state.plumb
    state.settings = SimpleNamespace(live=False, youcam_styling=False, youcam_skin=False, kill_switch=True)
    state.gateway.run = AsyncMock(side_effect=AssertionError("No provider calls allowed"))
    matched = client.post("/api/commerce/match", json={
        "photo_id": photo_id, "local_only": False,
        "manual_depth": 9, "manual_undertone": "cool"}, headers=SESSION)
    assert matched.status_code == 200, matched.text
    assert matched.json()["units_spent"] == 0
    preview = client.post("/api/commerce/try-on", json={
        "photo_id": photo_id, "product_id": "quiet-veil-09-warm", "local_only": False,
        "level": 3.2, "lock_level": 5.0}, headers=SESSION)
    assert preview.status_code == 200, preview.text
    assert preview.json()["source"] == "local"
    assert preview.json()["identity_guard"]["applied"] is True
    assert preview.json()["provider_calls"] == 0
    skin = client.post("/api/skin/match", json={
        "photo_id": photo_id, "local_only": True}, headers=SESSION)
    assert skin.status_code == 200, skin.text
    assert skin.json()["source"] == "local"
    assert state.gateway.run.await_count == 0


def test_level_validation_occurs_before_provider_or_photo_access(api: object) -> None:
    client, photo_id, app = api
    state = app.state.plumb
    state.gateway.run = AsyncMock(side_effect=AssertionError("Bad level should fail"))
    for level in (0.9, 5.1, 3.05, "3.0", True):
        result = client.post("/api/commerce/try-on", json={
            "photo_id": photo_id, "product_id": "quiet-veil-09-warm",
            "level": level, "local_only": True}, headers=SESSION)
        assert result.status_code == 422, (level, result.text)
    assert state.gateway.run.await_count == 0
