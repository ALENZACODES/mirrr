"""R14 pass definition before run: atomic, bounded per-IP/per-class admission;
429 + Retry-After before provider work; deterministic refill and proxy trust;
all spending routes protected. Synthetic pixels only. Author: John Khan.
"""
from __future__ import annotations

import io
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

import pytest
from PIL import Image

os.environ["PLUMB_NO_AUTOCREATE"] = "1"
from fastapi.testclient import TestClient  # noqa: E402

from plumb_api.config import Settings, load_settings  # noqa: E402
from plumb_api.consent import attestation  # noqa: E402
from plumb_api.demo.synthetic import SyntheticYouCam  # noqa: E402
from plumb_api.main import create_app  # noqa: E402
from plumb_api.rate_limit import (  # noqa: E402
    RATE_LIMIT_MESSAGE,
    SPENDING_ROUTES,
    BucketPolicy,
    ClientIP,
    RateLimitReply,
    TokenBuckets,
)


class Clock:
    def __init__(self) -> None:
        self.now = 100.0
    def __call__(self) -> float:
        return self.now

def test_burst_refill_and_ip_isolation() -> None:
    clock = Clock()
    bucket = TokenBuckets(BucketPolicy(2, 0.25), clock=clock)
    assert bucket.admit("192.0.2.1", "styling").allowed
    assert bucket.admit("192.0.2.1", "styling").allowed
    denied = bucket.admit("192.0.2.1", "styling")
    assert not denied.allowed and denied.retry_after_seconds == 4
    assert bucket.admit("192.0.2.2", "styling").allowed
    clock.now += 3
    assert bucket.admit("192.0.2.1", "styling").retry_after_seconds == 1
    clock.now += 1
    assert bucket.admit("192.0.2.1", "styling").allowed
    assert not bucket.admit("192.0.2.1", "styling").allowed

def test_route_classes_have_separate_buckets() -> None:
    bucket = TokenBuckets(BucketPolicy(1, 1))
    assert bucket.admit("192.0.2.1", "styling").allowed
    assert not bucket.admit("192.0.2.1", "styling").allowed
    assert bucket.admit("192.0.2.1", "skin").allowed
    assert bucket.admit("192.0.2.1", "resume").allowed

def test_atomic_bucket_cannot_over_admit_parallel_requests() -> None:
    bucket = TokenBuckets(BucketPolicy(7, 0.01), clock=lambda: 100.0)
    with ThreadPoolExecutor(max_workers=8) as executor:
        decisions = list(executor.map(lambda _: bucket.admit("192.0.2.1", "styling"), range(80)))
    assert sum(d.allowed for d in decisions) == 7

def test_table_is_bounded_and_active_buckets_are_not_evicted() -> None:
    clock = Clock()
    bucket = TokenBuckets(BucketPolicy(1, 1), clock=clock, max_entries=2, idle_seconds=2)
    assert bucket.admit("a", "styling").allowed
    assert bucket.admit("b", "styling").allowed
    assert not bucket.admit("c", "styling").allowed
    assert bucket.entry_count == 2
    assert not bucket.admit("a", "styling").allowed
    clock.now += 3
    assert bucket.admit("c", "styling").allowed
    assert bucket.entry_count == 1

def test_expiry_cannot_refill_faster_than_policy() -> None:
    clock = Clock()
    bucket = TokenBuckets(BucketPolicy(2, 0.1), clock=clock, idle_seconds=1)
    assert bucket.idle_seconds == 20
    assert bucket.admit("a", "styling").allowed
    assert bucket.admit("a", "styling").allowed
    clock.now += 5
    assert not bucket.admit("a", "styling").allowed

def test_backwards_and_nonfinite_clocks_do_not_add_tokens() -> None:
    clock = Clock()
    bucket = TokenBuckets(BucketPolicy(1, 1), clock=clock)
    assert bucket.admit("a", "styling").allowed
    clock.now -= 10
    assert not bucket.admit("a", "styling").allowed
    clock.now = float("nan")
    assert not bucket.admit("a", "styling").allowed

@pytest.mark.parametrize("capacity,refill", [(0,1),(1001,1),(True,1),(1,0),(1,-1),(1,float("nan")),(1,float("inf"))])
def test_invalid_policy_fails_closed(capacity: int, refill: float) -> None:
    with pytest.raises(ValueError):
        BucketPolicy(capacity, refill)

def scope(peer: str, value: str | None = None) -> dict[str, Any]:
    return {"type":"http", "client":(peer,1234), "headers":[] if value is None else [(b"x-forwarded-for",value.encode())]}

def test_forwarded_headers_are_ignored_by_default() -> None:
    assert ClientIP().resolve(scope("192.0.2.1", "198.51.100.9")) == "192.0.2.1"

def test_trust_is_limited_to_explicit_networks_and_nearest_untrusted_hop() -> None:
    resolver = ClientIP("X-Forwarded-For", ("10.0.0.0/8", "2001:db8:1::/48"))
    assert resolver.resolve(scope("192.0.2.1", "198.51.100.9")) == "192.0.2.1"
    assert resolver.resolve(scope("10.0.0.2", "198.51.100.9")) == "198.51.100.9"
    assert resolver.resolve(scope("10.0.0.2", "203.0.113.1, 198.51.100.9, 10.0.0.3")) == "198.51.100.9"
    assert resolver.resolve(scope("2001:db8:1::1", "2001:db8:2::1")) == "2001:db8:2::1"

@pytest.mark.parametrize("value", ["garbage","","192.0.2.1:443","192.0.2.1, invalid","fe80::1%eth0","1"*1025])
def test_malformed_forwarding_falls_back_to_peer(value: str) -> None:
    assert ClientIP("x-forwarded-for", ("10.0.0.0/8",)).resolve(scope("10.0.0.1", value)) == "10.0.0.1"

def test_repeated_proxy_headers_and_mapped_addresses() -> None:
    resolver = ClientIP("x-forwarded-for", ("10.0.0.0/8",))
    request = scope("10.0.0.1", "192.0.2.1")
    request["headers"].append((b"x-forwarded-for", b"192.0.2.2"))
    assert resolver.resolve(request) == "10.0.0.1"
    assert ClientIP().resolve(scope("::ffff:192.0.2.1")) == "192.0.2.1"
    assert ClientIP().resolve({"type":"http"}) == "unknown"

def test_proxy_header_requires_a_trust_boundary() -> None:
    for header, networks in [("x-forwarded-for",()), ("bad\nheader",("10.0.0.0/8",)), ("x-forwarded-for",("bad",))]:
        with pytest.raises(ValueError):
            ClientIP(header, networks)

def synthetic_photo() -> bytes:
    out = io.BytesIO()
    Image.new("RGB", (480,512), (152,100,75)).save(out,"PNG")
    return out.getvalue()

def app_for(tmp_path: Path, **kwargs: Any) -> tuple[Any,SyntheticYouCam]:
    fake = SyntheticYouCam()
    settings = Settings(data_dir=tmp_path, fixtures_dir=tmp_path/"empty", youcam_api_key="test",
                        unit_reserve=0, session_cap_public=0, rate_limit_enabled=True,
                        rate_limit_capacity=2, rate_limit_refill_s=0.01, **kwargs)
    return create_app(settings, client=fake), fake

def test_denied_makeup_call_never_spends_or_contacts_provider(tmp_path: Path) -> None:
    app,fake = app_for(tmp_path)
    with TestClient(app, client=("192.0.2.1",1234), headers={"X-Beljour-Session":"rateLimitPrivateSessionR14"}) as first:
        pid = first.post("/api/photos",files={"file":("drawn.png",synthetic_photo(),"image/png")}).json()["photo_id"]
        body = {"photo_id":pid,"lip_id":"L01","consent":attestation(pid,"makeup")}
        assert first.post("/api/makeup/try",json={}).status_code == 422
        assert first.post("/api/makeup/try",json={}).status_code == 422
        before = (len(fake.calls),app.state.plumb.cache.spent_total())
        response = first.post("/api/makeup/try",json=body,headers={"Origin":"http://localhost:8080"})
        assert response.status_code == 429
        reply = RateLimitReply.model_validate(response.json())
        assert reply.error.code == "rate_limited" and reply.error.message == RATE_LIMIT_MESSAGE
        assert int(response.headers["retry-after"]) == reply.error.retry_after_seconds
        assert response.headers["cache-control"] == "no-store"
        assert response.headers["access-control-allow-origin"] == "http://localhost:8080"
        assert "Retry-After" in response.headers["access-control-expose-headers"]
        assert before == (len(fake.calls),app.state.plumb.cache.spent_total())
        assert first.get("/api/health").status_code == 200
        assert first.post("/api/quote",json={"action":"enhance"}).status_code == 200
    with TestClient(app, client=("192.0.2.2",1234)) as second:
        assert second.post("/api/makeup/try",json={}).status_code == 422

@pytest.mark.parametrize("path",sorted(SPENDING_ROUTES))
def test_all_spending_routes_are_protected_before_dispatch(tmp_path: Path,path: str) -> None:
    app,fake = app_for(tmp_path)
    with TestClient(app,client=("192.0.2.1",1234)) as client:
        client.post(path, json={})
        client.post(path, json={})
        response = client.post(path,json={})
        assert response.status_code == 429
        assert response.json()["error"]["code"] == "rate_limited"
        assert not fake.calls and app.state.plumb.cache.spent_total() == 0
        schema = client.get("/openapi.json").json()
        assert schema["paths"][path]["post"]["responses"]["429"]["content"]["application/json"]["schema"]["$ref"].endswith("/RateLimitReply")

def test_makeup_and_task_aliases_share_one_allowance(tmp_path: Path) -> None:
    app,_ = app_for(tmp_path)
    with TestClient(app,client=("192.0.2.1",1234)) as client:
        assert client.post("/api/tasks/start",json={}).status_code == 422
        assert client.post("/api/makeup/try",json={}).status_code == 422
        assert client.post("/api/tasks/start",json={}).status_code == 429
        assert client.post("/api/skin/match",json={}).status_code == 422

def test_trusted_proxy_clients_are_separated_but_forgery_cannot_reset(tmp_path: Path) -> None:
    app,_ = app_for(tmp_path,trusted_proxy_header="x-forwarded-for",trusted_proxy_networks=("10.0.0.0/8",))
    with TestClient(app,client=("10.0.0.1",1234)) as client:
        for _ in range(2):
            client.post("/api/tasks/start", json={}, headers={"X-Forwarded-For": "198.51.100.1"})
        assert client.post("/api/tasks/start",json={},headers={"X-Forwarded-For":"198.51.100.1"}).status_code == 429
        assert client.post("/api/tasks/start",json={},headers={"X-Forwarded-For":"198.51.100.2"}).status_code == 422
    with TestClient(app,client=("203.0.113.9",1234)) as client:
        for _ in range(2):
            client.post("/api/tasks/start", json={}, headers={"X-Forwarded-For": "198.51.100.1"})
        assert client.post("/api/tasks/start",json={},headers={"X-Forwarded-For":"198.51.100.2"}).status_code == 429

def test_environment_enables_limiter_but_offline_settings_do_not() -> None:
    assert not Settings().rate_limit_enabled
    assert load_settings({}).rate_limit_enabled
    assert not load_settings({"BELJOUR_RATE_LIMIT_ENABLED":"0"}).rate_limit_enabled
    configured=load_settings({"BELJOUR_RATE_LIMIT_CAPACITY":"9","BELJOUR_RATE_LIMIT_REFILL_PER_SECOND":"0.5",
                              "BELJOUR_TRUSTED_PROXY_HEADER":"x-forwarded-for",
                              "BELJOUR_TRUSTED_PROXY_NETWORKS":"10.0.0.0/8, 2001:db8::/32"})
    assert (configured.rate_limit_capacity,configured.rate_limit_refill_s)==(9,0.5)
    assert configured.trusted_proxy_networks==("10.0.0.0/8","2001:db8::/32")


def test_new_spending_route_cannot_be_added_without_limiter_coverage() -> None:
    """Inspect the actual route declarations, not just the limiter's own route list."""
    import ast
    route_folder = Path(__file__).resolve().parents[1] / "plumb_api" / "routes"
    detected: set[str] = set()
    for path in route_folder.glob("*.py"):
        module = ast.parse(path.read_text())
        for function in (node for node in module.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))):
            spending = any(isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
                           and (ast.unparse(node.func) in {"state.gateway.run", "state.gateway.start", "state.gateway.resume"}
                                or ast.unparse(node.func) == "service_for(state).match") for node in ast.walk(function))
            if not spending:
                continue
            for decorator in function.decorator_list:
                if isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Attribute) and decorator.func.attr == "post":
                    route = decorator.args[0]
                    assert isinstance(route, ast.Constant) and isinstance(route.value, str)
                    detected.add("/api" + route.value)
    assert detected == set(SPENDING_ROUTES)


def test_limiter_denies_before_reading_an_http_body() -> None:
    import asyncio
    import json

    from plumb_api.rate_limit import RateLimitMiddleware
    buckets = TokenBuckets(BucketPolicy(1, 1), clock=lambda: 100)
    assert buckets.admit("192.0.2.4", "styling").allowed
    sent = []

    async def application(scope, receive, send):
        raise AssertionError("denied request reached the app")

    async def receive():
        raise AssertionError("denied request body was read")

    async def send(message):
        sent.append(message)

    middleware = RateLimitMiddleware(application, buckets=buckets, client_ip=ClientIP())
    request = {**scope("192.0.2.4"), "method": "POST", "path": "/api/tasks/start"}
    asyncio.run(middleware(request, receive, send))
    assert sent[0]["status"] == 429
    assert json.loads(sent[1]["body"])["error"]["code"] == "rate_limited"


def test_successful_mocked_calls_then_limit_do_not_spend_a_third_unit(tmp_path: Path) -> None:
    from unittest.mock import AsyncMock
    app, fake = app_for(tmp_path)
    fake.credit = AsyncMock(return_value=1000)
    app.state.rate_limits.clock = lambda: 100
    session = {"X-Beljour-Session": "successfulRateLimitR14"}
    with TestClient(app, client=("192.0.2.8", 1234), headers=session) as client:
        upload = client.post("/api/photos", files={"file": ("drawn.png", synthetic_photo(), "image/png")})
        assert upload.status_code == 200
        photo_id = upload.json()["photo_id"]
        for shade in ("L01", "L02"):
            response = client.post("/api/makeup/try", json={"photo_id": photo_id, "lip_id": shade,
                                   "consent": attestation(photo_id, "makeup")})
            assert response.status_code == 200, response.text
            assert response.json()["units_spent"] == 1
        assert app.state.plumb.cache.spent_total() == 2
        third = client.post("/api/makeup/try", json={"photo_id": photo_id, "lip_id": "L03",
                            "consent": attestation(photo_id, "makeup")})
        assert third.status_code == 429
        assert len(fake.calls) == 2
        assert app.state.plumb.cache.spent_total() == 2
