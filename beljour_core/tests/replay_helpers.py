"""Shared builders for the round 1 tests: replayed YouCam clients, providers and gateways.
No network, no key, no FastAPI. Author: John Khan."""
from __future__ import annotations

import asyncio
import hashlib
import io
import json
from pathlib import Path

import httpx
import numpy as np
from PIL import Image

from plumb_api.config import Settings
from plumb_api.ledger import TaskLedger
from plumb_api.providers.replay import (
    REPLAY_BASE,
    REPLAY_KEY,
    Cassette,
    Interaction,
    ReplayTransport,
    credit_reply,
    synthetic_cassette,
    task_interactions,
)
from plumb_api.providers.youcam import Job, YouCamProvider
from plumb_api.youcam.cache import ResultCache
from plumb_api.youcam.client import YouCamClient
from plumb_api.youcam.gateway import PhotoRef, YouCamGateway


def jpeg(seed: int = 0, w: int = 64, h: int = 80, colour: tuple[int, int, int] | None = None) -> bytes:
    if colour is None:
        arr = (np.random.default_rng(seed).random((h, w, 3)) * 255).astype(np.uint8)
    else:
        arr = np.zeros((h, w, 3), np.uint8) + np.array(colour, np.uint8)
    out = io.BytesIO()
    Image.fromarray(arr).save(out, "JPEG")
    return out.getvalue()


RESULT = jpeg(99, colour=(200, 40, 60))


def settings(tmp: Path, **kw) -> Settings:
    base = {"youcam_api_key": REPLAY_KEY, "data_dir": tmp, "fixtures_dir": tmp / "none"}
    base.update(kw)
    return Settings(**base)


def cassette(*steps: list[Interaction], blobs: dict[str, bytes] | None = None) -> Cassette:
    flat = [i for group in steps for i in group]
    return synthetic_cassette("test", flat, blobs if blobs is not None else {"r.jpg": RESULT})


def credit(amount: float = 1000.0) -> list[Interaction]:
    """The balance reply; replay repeats the last GET reply, so one covers every check."""
    return [Interaction("GET", "/s2s/v1.0/client/credit", "api", 200, json=credit_reply(amount))]


def makeup_task(n: int = 1, polls: int = 1, **kw) -> list[Interaction]:
    return task_interactions("makeup-vto", n=n, polls_running=polls, result_blob="r.jpg", **kw)


class Wrapped(httpx.MockTransport):
    """A replay transport with a hook that can replace any reply or raise, to simulate
    lost replies and refused requests."""

    def __init__(self, replay: ReplayTransport, hook):
        self.replay = replay
        self.hook = hook
        super().__init__(self._handle)

    def _handle(self, request: httpx.Request) -> httpx.Response:
        out = self.hook(request)
        if out is not None:
            return out
        return self.replay._handle(request)


def client_for(c: Cassette, hook=None, poll_timeout_s: float = 30.0, poll_interval_s: float = 1.0
               ) -> tuple[YouCamClient, ReplayTransport]:
    replay = ReplayTransport(c)
    transport: httpx.MockTransport = Wrapped(replay, hook) if hook else replay
    clock = [0.0]

    async def tick(s: float) -> None:
        clock[0] += s
        await asyncio.sleep(0)

    client = YouCamClient(REPLAY_KEY, REPLAY_BASE, httpx.AsyncClient(transport=transport),
                          poll_interval_s=poll_interval_s, poll_timeout_s=poll_timeout_s,
                          sleep=tick, clock=lambda: clock[0])
    return client, replay


def provider_for(tmp: Path, c: Cassette, hook=None, **kw) -> tuple[YouCamProvider, ReplayTransport]:
    client, replay = client_for(c, hook, **{k: v for k, v in kw.items() if k.startswith("poll_")})
    s = settings(tmp, **{k: v for k, v in kw.items() if not k.startswith("poll_")})
    return YouCamProvider(s, client, TaskLedger(tmp / "ledger.sqlite3")), replay


def job(feature: str = "makeup-vto", key: str | None = None, payload: dict | None = None, units: int = 1) -> Job:
    payload = payload if payload is not None else {"effects": [{"category": "lip_color"}]}
    key = key or "k2" + hashlib.sha256(json.dumps([feature, payload]).encode()).hexdigest()[:46]
    return Job(request_key=key, feature=feature, version="v2.0", image=jpeg(1), content_type="image/jpeg",
               payload=payload, owner_sha="owner", units=units)


def gateway_for(tmp: Path, c: Cassette | None, hook=None, client=None, **kw) -> tuple[YouCamGateway, ReplayTransport | None]:
    replay = None
    if client is None and c is not None:
        client, replay = client_for(c, hook, poll_timeout_s=kw.pop("poll_timeout_s", 30.0))
    s = settings(tmp, **kw)
    cache = ResultCache(s.data_dir, s.fixtures_dir, s.result_ttl_seconds)
    return YouCamGateway(s, cache, client), replay


def photo(seed: int = 1) -> PhotoRef:
    data = jpeg(seed)
    return PhotoRef(hashlib.sha256(data).hexdigest(), data)


MAKEUP_PAYLOAD = {"version": "1.0", "effects": [{"category": "lip_color", "pattern": {"name": "full"},
                                                 "palettes": [{"color": "#B04A5A", "colorIntensity": 70}]}]}


def run(coro):
    return asyncio.run(coro)
