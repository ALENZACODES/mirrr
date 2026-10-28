"""Private task status and image access, including restart and deletion races.

All pixels are synthetic. Provider work is mocked; no network is used.
Author: John Khan.
"""
from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

os.environ["PLUMB_NO_AUTOCREATE"] = "1"

from plumb_api.config import Settings  # noqa: E402
from plumb_api.main import create_app  # noqa: E402
from plumb_api.youcam.cache import CachedResult  # noqa: E402
from tests.replay_helpers import RESULT, cassette, client_for, credit, jpeg  # noqa: E402

A = "privateTaskOwnerAAAAAAAA"
B = "privateTaskOwnerBBBBBBBB"
KEY = "k2" + "a" * 46
OTHER_KEY = "k2" + "b" * 46


def header(session: str) -> dict[str, str]:
    return {"X-Beljour-Session": session}


@pytest.fixture
def app_client(tmp_path):
    app = create_app(Settings(data_dir=tmp_path, fixtures_dir=tmp_path / "none"))
    with TestClient(app) as client:
        yield app.state.plumb, client


def upload(client, session=A, seed=10):
    reply = client.post("/api/photos", headers=header(session),
                        files={"file": ("synthetic.jpg", jpeg(seed, 480, 512), "image/jpeg")})
    assert reply.status_code == 200, reply.text
    return reply.json()["photo_id"]


def cache_result(state, owner, key=KEY):
    state.cache.put(key, CachedResult("makeup-vto", owner, {}, image=RESULT, image_type="image/jpeg"))


def get_task(client, session=None, key=KEY):
    return client.get(f"/api/tasks/{key}", headers=header(session) if session else {})


def assert_private(response):
    assert response.status_code == 404
    assert response.json() == {"error": {"code": "task_gone",
                                           "message": "That task is not available in this browser session."}}
    assert "image" not in response.text


def test_cached_result_without_ledger_requires_photo_owner(app_client):
    state, client = app_client
    owner = upload(client)
    cache_result(state, owner)
    own = get_task(client, A)
    assert own.status_code == 200
    assert own.json()["status"] == "done"
    assert own.json()["image"].startswith("data:image/jpeg;base64,")
    assert_private(get_task(client, B))
    assert_private(get_task(client))


@pytest.mark.parametrize("status", ["creating", "created", "failed", "ambiguous", "succeeded"])
def test_pending_and_failure_metadata_are_private_too(app_client, status):
    state, client = app_client
    owner = upload(client)
    ledger = state.gateway.ledger
    ledger.begin(KEY, "makeup-vto", "v2.0", session_id=A, owner_sha=owner, units=1)
    if status in {"created", "succeeded"}:
        ledger.created(KEY, "synthetic-task")
    if status == "succeeded":
        ledger.succeeded(KEY)
    elif status == "failed":
        ledger.failed(KEY, "private provider failure detail")
    elif status == "ambiguous":
        ledger.ambiguous(KEY, "private provider failure detail")
    own = get_task(client, A)
    assert own.status_code == 200
    assert own.json()["feature"] == "makeup-vto"
    assert_private(get_task(client, B))
    assert_private(get_task(client))


def test_ledger_session_can_read_resumed_result_after_photo_storage_loss(app_client):
    state, client = app_client
    owner = "f" * 64
    state.gateway.ledger.adopt(KEY, "makeup-vto", "v2.0", "resumed-task", session_id=A, owner_sha=owner)
    cache_result(state, owner)
    assert not (state.photos.root / f"{owner}.jpg").exists()
    assert get_task(client, A).json()["status"] == "done"
    assert_private(get_task(client, B))
    assert_private(get_task(client))


def test_mismatched_ledger_photo_cannot_authorize_another_cached_photo(app_client):
    state, client = app_client
    owner = upload(client, B)
    state.gateway.ledger.adopt(KEY, "makeup-vto", "v2.0", "mismatched-task", session_id=A, owner_sha="f" * 64)
    cache_result(state, owner)
    assert_private(get_task(client, A))
    assert get_task(client, B).json()["status"] == "done"


def test_deleting_one_of_two_owners_revokes_only_that_session_task_access(app_client):
    state, client = app_client
    owner = upload(client, A)
    assert upload(client, B) == owner
    state.gateway.ledger.adopt(KEY, "makeup-vto", "v2.0", "shared-photo-task", session_id=A, owner_sha=owner)
    cache_result(state, owner)
    assert get_task(client, A).status_code == get_task(client, B).status_code == 200
    deleted = client.delete(f"/api/photos/{owner}", headers=header(A))
    assert deleted.status_code == 200
    assert deleted.json()["results_removed"] == 0
    assert state.gateway.ledger.get(KEY).session_id is None
    assert_private(get_task(client, A))
    assert get_task(client, B).json()["status"] == "done"
    assert client.delete(f"/api/photos/{owner}", headers=header(B)).json()["results_removed"] == 1
    assert_private(get_task(client, B))


def test_late_result_after_explicit_photo_delete_stays_private(app_client):
    state, client = app_client
    owner = upload(client)
    state.gateway.ledger.adopt(KEY, "makeup-vto", "v2.0", "pending-task", session_id=A, owner_sha=owner)
    assert client.delete(f"/api/photos/{owner}", headers=header(A)).status_code == 200
    # A provider completion may race the deletion. It must not restore permission.
    cache_result(state, owner)
    state.gateway.ledger.succeeded(KEY)
    assert_private(get_task(client, A))
    assert_private(get_task(client, B))


@pytest.mark.parametrize("loss", ["bytes_missing", "ttl_purge"])
def test_delete_revokes_task_grant_after_source_loss_and_blocks_late_results(app_client, loss):
    state, client = app_client
    owner = upload(client)
    ledger = state.gateway.ledger
    ledger.adopt(KEY, "makeup-vto", "v2.0", "source-lost-task", session_id=A, owner_sha=owner, units=1)
    cache_result(state, owner)
    if loss == "bytes_missing":
        (state.photos.root / f"{owner}.jpg").unlink()
        assert state.photos.owned_by(owner, A)
    else:
        assert state.photos.purge_expired(now=10**12) == 1
        assert not state.photos.owners(owner)
    assert get_task(client, A).json()["status"] == "done"
    deleted = client.delete(f"/api/photos/{owner}", headers=header(A))
    assert deleted.status_code == 200, deleted.text
    assert deleted.json() == {"deleted": True, "results_removed": 1}
    assert state.cache.get(KEY) is None
    entry = ledger.get(KEY)
    assert (entry.session_id, entry.task_id, entry.units, entry.status) == (None, "source-lost-task", 1, "created")
    assert not state.photos.owned_by(owner, A)
    assert_private(get_task(client, A))
    cache_result(state, owner)
    ledger.succeeded(KEY)
    assert_private(get_task(client, A))
    assert_private(get_task(client, B))
    assert client.delete(f"/api/photos/{owner}", headers=header(A)).status_code == 404


def test_source_loss_deletion_preserves_another_sessions_recovered_task(app_client):
    state, client = app_client
    owner = upload(client, A)
    assert upload(client, B) == owner
    ledger = state.gateway.ledger
    ledger.adopt(KEY, "makeup-vto", "v2.0", "lost-a-task", session_id=A, owner_sha=owner, units=1)
    other = ledger.adopt(OTHER_KEY, "makeup-vto", "v2.0", "lost-b-task", session_id=B, owner_sha=owner, units=2)
    cache_result(state, owner)
    cache_result(state, owner, OTHER_KEY)
    assert state.photos.purge_expired(now=10**12) == 1
    for stranger in (None, "privateTaskStrangerCCCCC"):
        response = client.delete(f"/api/photos/{owner}", headers=header(stranger) if stranger else {})
        assert response.status_code == 404
        assert ledger.get(KEY).session_id == A
        assert ledger.get(OTHER_KEY) == other
        assert state.cache.get(KEY) is not None
        assert state.cache.get(OTHER_KEY) is not None
    deleted = client.delete(f"/api/photos/{owner}", headers=header(A))
    assert deleted.status_code == 200
    assert deleted.json()["results_removed"] == 0
    assert ledger.get(KEY).session_id is None
    assert ledger.get(OTHER_KEY) == other
    assert state.cache.get(OTHER_KEY) is not None
    assert get_task(client, B, OTHER_KEY).json()["status"] == "done"
    assert_private(get_task(client, A))
    assert_private(get_task(client, A, OTHER_KEY))
    assert client.delete(f"/api/photos/{owner}", headers=header(B)).json()["results_removed"] == 2
    assert ledger.get(OTHER_KEY).session_id is None
    assert ledger.get(OTHER_KEY).units == 2
    assert_private(get_task(client, B, OTHER_KEY))


def test_photo_delete_does_not_revoke_another_photo_task(app_client):
    state, client = app_client
    first = upload(client, seed=10)
    second = upload(client, seed=11)
    ledger = state.gateway.ledger
    ledger.adopt(KEY, "makeup-vto", "v2.0", "first-task", session_id=A, owner_sha=first)
    ledger.adopt(OTHER_KEY, "makeup-vto", "v2.0", "second-task", session_id=A, owner_sha=second)
    assert client.delete(f"/api/photos/{first}", headers=header(A)).status_code == 200
    assert ledger.get(KEY).session_id is None
    assert ledger.get(OTHER_KEY).session_id == A
    assert get_task(client, A, OTHER_KEY).json()["status"] == "running"


def test_old_anonymous_task_entries_do_not_authorize_any_private_result(app_client):
    state, client = app_client
    owner = "f" * 64
    state.gateway.ledger.adopt(KEY, "makeup-vto", "v2.0", "old-task", session_id="anonymous", owner_sha=owner)
    cache_result(state, owner)
    assert_private(get_task(client))
    assert_private(get_task(client, A))


def test_only_explicit_sample_task_is_public(tmp_path):
    fixtures = Path(__file__).resolve().parents[1] / "plumb_api" / "demo" / "fixtures"
    app = create_app(Settings(data_dir=tmp_path, fixtures_dir=fixtures))
    state = app.state.plumb
    cache_result(state, state.sample_sha)
    with TestClient(app) as client:
        assert get_task(client).json()["status"] == "done"
        assert get_task(client, B).json()["status"] == "done"


def test_unknown_and_malformed_task_contracts_remain(app_client):
    _, client = app_client
    assert get_task(client).json() == {"request_key": KEY, "status": "unknown"}
    assert client.get("/api/tasks/not-a-task!").status_code == 400
    assert client.get("/api/tasks/" + "a" * 65).status_code == 400


def test_signed_resume_grants_only_private_resuming_session(tmp_path, monkeypatch):
    provider_client, replay = client_for(cassette(credit()))
    app = create_app(Settings(youcam_api_key="replay", data_dir=tmp_path, fixtures_dir=tmp_path / "none",
                              resume_secret="synthetic-resume-signing-test"), client=provider_client)
    state = app.state.plumb
    owner = "f" * 64
    ticket = state.gateway.signer.issue(KEY, "restarted-task", "makeup-vto", "v2.0", owner, 1).to_json()
    resumed = []
    monkeypatch.setattr(state.gateway.provider, "resume", lambda *args: resumed.append(args))
    with TestClient(app) as client:
        response = client.post("/api/tasks/resume", headers=header(A), json={"tickets": [ticket]})
        assert response.status_code == 200
        assert response.json()["tasks"][0]["status"] == "running"
        assert len(resumed) == 1
        assert state.gateway.ledger.get(KEY).session_id == A
        cache_result(state, owner)
        assert get_task(client, A).json()["status"] == "done"
        assert_private(get_task(client, B))
        assert_private(get_task(client))
    assert replay.log == []


def test_route_schema_keeps_dependencies_out_of_request_parameters(app_client):
    _, client = app_client
    spec = client.get("/openapi.json").json()
    for path in spec["paths"].values():
        for operation in path.values():
            assert all(p["name"] != "state" for p in operation.get("parameters", []))
    upload_schema = spec["paths"]["/api/photos"]["post"]["requestBody"]
    assert upload_schema["required"] is True
    assert "multipart/form-data" in upload_schema["content"]
    query = spec["paths"]["/api/photos/{photo_id}.jpg"]["get"]["parameters"]
    session_query = next(p for p in query if p["name"] == "s")
    assert session_query["required"] is False
    assert session_query["schema"]["anyOf"][0]["maxLength"] == 64
