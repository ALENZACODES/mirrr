"""R14 fixture retirement pass definition, recorded before running this test:
all committed records use approved styling, each stored image is unique, and every
former fixture-only route produces an input-derived local result (or a clear mesh/
confidence refusal), without touching the provider. No real faces. Author: John Khan.
"""
from __future__ import annotations

import hashlib
import io
import json
import os
from pathlib import Path
from unittest.mock import AsyncMock

import numpy as np
import pytest
from PIL import Image

os.environ["PLUMB_NO_AUTOCREATE"] = "1"
from fastapi.testclient import TestClient  # noqa: E402

from plumb_api.config import Settings  # noqa: E402
from plumb_api.demo.fixture_meta import describe, problems  # noqa: E402
from plumb_api.main import create_app  # noqa: E402
from plumb_api.providers.youcam import STYLING  # noqa: E402
from plumb_api.services import local_features, shade  # noqa: E402
from plumb_api.youcam.cache import ResultCache  # noqa: E402
from tests.local_feature_helpers import drawn_photo  # noqa: E402

FIXTURES = Path(__file__).resolve().parents[1] / "plumb_api" / "demo" / "fixtures"


def test_only_approved_styling_records_remain() -> None:
    paths = sorted(FIXTURES.glob("*.json"))
    assert len(paths) == 7  # 60 original records minus the 53 explicitly retired records.
    for path in paths:
        record = json.loads(path.read_text())
        assert record["feature"] in STYLING
        assert record["status"] == "active" and record["provider"] == "youcam"
        assert not problems(record)
        assert "replaced_in" not in record
        assert record["data"]["_synthetic"] is True


def test_fixture_images_are_unique_and_shared_blobs_stay_labelled() -> None:
    images = [p for p in FIXTURES.iterdir() if p.suffix.lower() in {".jpg", ".png", ".webp"}]
    hashes = [hashlib.sha256(p.read_bytes()).hexdigest() for p in images]
    assert len(hashes) == len(set(hashes))
    for path in FIXTURES.glob("*.json"):
        meta = json.loads(path.read_text())
        assert (FIXTURES / meta["image_file"]).is_file()
        assert meta["data"].get("_synthetic"), "shared mock imagery is never a real API result"


@pytest.mark.parametrize("feature", ["skin-analysis", "skin-tone-analysis", "face-attr-analysis", "face-reshape", "face-lift", "skin-simulation", "aging", "teeth-whiten", "unknown"])
def test_recorder_cannot_reintroduce_retired_fixtures(feature: str) -> None:
    with pytest.raises(ValueError, match="only approved"):
        describe(feature)
    assert problems({"feature": feature})


def test_old_fixture_on_disk_is_not_served_from_runtime_cache(tmp_path: Path) -> None:
    folder = tmp_path / "fixtures"
    folder.mkdir()
    (folder / "old.json").write_text(json.dumps({"feature": "aging", "image_sha": "a", "data": {}, "status": "active"}))
    assert ResultCache(tmp_path / "data", folder).get_fixture("old") is None


@pytest.fixture
def client(tmp_path: Path):
    app = create_app(Settings(data_dir=tmp_path, fixtures_dir=tmp_path / "none"))
    app.state.plumb.gateway.run = AsyncMock(side_effect=AssertionError("local route attempted provider request"))
    with TestClient(app) as connection:
        connection.headers["X-Beljour-Session"] = "localFixtureSessionR14"
        photo, points = drawn_photo()
        response = connection.post("/api/photos", files={"file": ("drawn.png", photo, "image/png")})
        assert response.status_code == 200, response.text
        yield connection, app, response.json()["photo_id"], points


@pytest.mark.parametrize("path,extra", [
    ("/api/skin/analyze", {}),
    ("/api/shade/analyze", {}),
    ("/api/face/proportions", {}),
    ("/api/surgery/preview", {"selection": {"cheek_filler": 30}}),
    ("/api/skin/simulate", {"strengths": {"texture": .5}}),
    ("/api/transform/aging", {}),
])
def test_every_retired_route_runs_local_engines_on_the_input(client, path: str, extra: dict) -> None:
    connection, app, photo_id, points = client
    original = app.state.plumb.photos.get(photo_id).data
    response = connection.post(path, json={"photo_id": photo_id, "landmarks": points, **extra})
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["source"] == "local" and data["units_spent"] == 0
    assert data["provenance"]["badge"] == "Local simulation"
    assert data["provenance"]["provider"] == "local"
    assert data["lifecycle"] == "active"
    assert app.state.plumb.photos.get(photo_id).data == original
    app.state.plumb.gateway.run.assert_not_called()
    assert app.state.plumb.cache.spent_total() == 0
    if path.endswith("aging"):
        assert len(data["frames"]) == 3 and data["estimated_age"] is None
        assert all(frame["age"] is None for frame in data["frames"])
        assert len({frame["image"] for frame in data["frames"]}) == 3
    if path.endswith("/skin/analyze"):
        assert data["scores"] == [] and data["skin_age"] is None and data["overall"] is None
        assert data["photo_analysis"] and data["photo_condition"]
    if path.endswith("/shade/analyze"):
        assert data["foundation"]
        lightness = data["measurement"]["measured_lab"][0]
        assert all(shade.hex_to_lab(row["hex"])[0] <= lightness + 1.0001 for row in data["foundation"])
        assert data["measurement"]["tested_against_real_products"] is False


@pytest.mark.parametrize("path,extra", [
    ("/api/shade/analyze", {}), ("/api/face/proportions", {}),
    ("/api/surgery/preview", {"selection": {"cheek_filler": 30}}),
    ("/api/skin/simulate", {"strengths": {"texture": .5}}), ("/api/transform/aging", {}),
])
def test_no_mesh_returns_typed_refusal_instead_of_example(client, path: str, extra: dict) -> None:
    connection, app, photo_id, _ = client
    response = connection.post(path, json={"photo_id": photo_id, **extra})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "face_points_required"
    app.state.plumb.gateway.run.assert_not_called()


@pytest.mark.parametrize("points", [[], [[.5, .5]] * 468, [[.5, .5]] * 478, [[-1., .5]] * 478, [[1.1, .5]] * 478])
def test_invalid_landmarks_are_rejected(points: list) -> None:
    with pytest.raises(Exception) as caught:
        local_features.measured_mesh(points, 480, 512)
    assert caught.value.code in {"bad_landmarks", "face_too_small"}


def test_only_implemented_local_procedures_are_advertised(client) -> None:
    connection, app, photo_id, points = client
    rows = connection.get("/api/surgery/procedures").json()["procedures"]
    assert rows and all(row["engine"] == "local" for row in rows)
    ids = {row["id"] for row in rows}
    assert ids == set(local_features.SHAPE_PROCEDURES) | local_features.LOCAL_WARPS
    assert "lip_filler" not in ids
    response = connection.post("/api/surgery/preview", json={"photo_id": photo_id, "selection": {"lip_filler": 50}, "landmarks": points})
    assert response.status_code == 422 and response.json()["error"]["code"] == "local_effect_unavailable"
    app.state.plumb.gateway.run.assert_not_called()


def test_texture_preview_has_no_disease_or_treatment_claim(client) -> None:
    connection, _, photo_id, points = client
    response = connection.post("/api/skin/simulate", json={"photo_id": photo_id, "strengths": {"acne": .5}, "landmarks": points})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "local_effect_unavailable"


def test_local_quotes_cost_zero_and_name_server_processing(client) -> None:
    connection, _, photo_id, _ = client
    for action in ("skin", "shade", "proportions", "surgery", "simulate", "aging"):
        quote = connection.post("/api/quote", json={"photo_id": photo_id, "action": action}).json()
        assert quote["units"] == 0 and quote["scope"] == "local" and quote["can_apply"]
        assert "server" in quote["data_flow"] and "no YouCam call" in quote["data_flow"]


def test_skin_photo_metrics_come_from_pixels() -> None:
    dark = io.BytesIO()
    bright = io.BytesIO()
    Image.fromarray(np.full((64,64,3), 30, np.uint8)).save(dark, "PNG")
    Image.fromarray(np.full((64,64,3), 200, np.uint8)).save(bright, "PNG")
    a = local_features.skin_analysis(dark.getvalue())
    b = local_features.skin_analysis(bright.getvalue())
    assert a["photo_analysis"]["mean_luminance"] < b["photo_analysis"]["mean_luminance"]
    assert a["scores"] == b["scores"] == []


def test_recorder_plan_only_uses_approved_makeup_with_photo_bound_consent() -> None:
    from plumb_api.demo.plan import estimated_units, run_plan
    calls = []
    def post(path: str, body: dict) -> dict:
        calls.append((path, body))
        assert body["consent"]["photo_id"] == body["photo_id"] == "a" * 64
        assert body["consent"]["scope"] == "makeup" and body["consent"]["adult"] is True
        return {"source": "live"}
    report = run_plan(post, "a" * 64, log=lambda _message: None)
    assert report == {"/api/makeup/try": 7}
    assert estimated_units() == 7
    assert {path for path, _body in calls} == {"/api/makeup/try"}
    assert len({json.dumps({key: value for key, value in body.items() if key != "consent"}, sort_keys=True)
                for _path, body in calls}) == 7
    with pytest.raises(RuntimeError, match="recording failed"):
        run_plan(lambda _path, _body: {"error": {"code": "consent_required"}}, "a" * 64, log=lambda _message: None)


def test_recording_reuses_identical_blobs_without_duplicate_fixture_images(tmp_path: Path) -> None:
    from plumb_api.youcam.cache import CachedResult
    cache = ResultCache(tmp_path / "data", tmp_path / "fixtures")
    pixels = b"synthetic test image bytes"
    for key in ("first", "second"):
        cache.write_fixture(key, CachedResult("makeup-vto", "sha", {"_synthetic": True}, 1, pixels, "image/jpeg", 1))
    records = [json.loads(path.read_text()) for path in (tmp_path / "fixtures").glob("*.json")]
    assert len(records) == 2
    assert len({record["image_file"] for record in records}) == 1
    assert len(list((tmp_path / "fixtures").glob("*.jpg"))) == 1
    assert cache.get_fixture("first").image == cache.get_fixture("second").image == pixels
