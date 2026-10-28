"""Recorded YouCam replies, replayed with no network: the fixture replay client.

A cassette is a JSON file of request and reply pairs (format "beljour-cassette/1"). The
replay plugs into the REAL YouCamClient through an httpx transport, so tests and spikes run
the same upload, create, poll, download and delete code as live mode, against recordings.

  replay   ReplayTransport(cassette)  -> answers each request with the next recorded reply
           for the same method and path; a request with no recording is an error, never a
           network call.
  record   RecordingTransport(inner)  -> passes requests to a real transport and writes
           down what came back, redacted (no key, no signed URLs, placeholder ids).

Redaction rules (also checked by scripts/check_fixtures.py):
  * Authorization headers and any header holding the key are never written.
  * Signed upload and download URLs become https://storage.replay/<n> and
    https://results.replay/<n>, and the same rewrite is applied to the replies that
    contained them, so the replayed client follows the placeholders.
  * File ids and task ids become file-<n> and task-<n>, consistently in paths and bodies.
  * Result images are saved next to the cassette as blob files, not inline.

Author: John Khan.
"""
from __future__ import annotations

import base64
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

import httpx

from ..youcam.client import YouCamClient

FORMAT = "beljour-cassette/1"
REPLAY_BASE = "https://api.replay"
REPLAY_KEY = "replay-no-key"
_SIGNED_QUERY = re.compile(r"(X-Amz-|Signature=|Expires=|sig=|token=)", re.I)


class ReplayMiss(Exception):
    """A request the cassette has no reply for."""


@dataclass
class Interaction:
    method: str
    path: str                     # path plus query, e.g. /s2s/v2.0/task/hair-color/task-1
    host: str                     # "api", "storage" or "results"
    status: int
    json: Any = None
    blob: str | None = None       # file name of a binary reply, next to the cassette
    content_type: str | None = None
    request_json: Any = None      # what we sent (redacted), for reading the cassette

    def to_json(self) -> dict:
        out: dict[str, Any] = {"request": {"method": self.method, "host": self.host, "path": self.path},
                               "response": {"status": self.status}}
        if self.request_json is not None:
            out["request"]["json"] = self.request_json
        if self.json is not None:
            out["response"]["json"] = self.json
        if self.blob:
            out["response"]["blob"] = self.blob
            out["response"]["content_type"] = self.content_type
        return out

    @classmethod
    def from_json(cls, data: dict) -> Interaction:
        req, resp = data["request"], data["response"]
        return cls(method=req["method"].upper(), path=req["path"], host=req.get("host", "api"),
                   status=int(resp["status"]), json=resp.get("json"), blob=resp.get("blob"),
                   content_type=resp.get("content_type"), request_json=req.get("json"))


@dataclass
class Cassette:
    name: str
    interactions: list[Interaction]
    synthetic: bool = False       # True: hand made in the reply shape the docs describe, not recorded
    recorded_at: str | None = None
    notes: str = ""
    root: Path | None = None      # folder holding blob files
    blobs: dict[str, bytes] = field(default_factory=dict)  # in memory blobs (tests)

    @classmethod
    def load(cls, path: Path) -> Cassette:
        data = json.loads(Path(path).read_text())
        if data.get("format") != FORMAT:
            raise ValueError(f"{path} is not a {FORMAT} file")
        return cls(name=data["name"], interactions=[Interaction.from_json(i) for i in data["interactions"]],
                   synthetic=bool(data.get("synthetic")), recorded_at=data.get("recorded_at"),
                   notes=data.get("notes", ""), root=Path(path).parent)

    def to_json(self) -> dict:
        return {"format": FORMAT, "name": self.name, "synthetic": self.synthetic,
                "recorded_at": self.recorded_at, "notes": self.notes,
                "interactions": [i.to_json() for i in self.interactions]}

    def save(self, path: Path) -> Path:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        for name, data in self.blobs.items():
            (path.parent / name).write_bytes(data)
        path.write_text(json.dumps(self.to_json(), indent=1, sort_keys=True) + "\n")
        return path

    def blob(self, name: str) -> bytes:
        if name in self.blobs:
            return self.blobs[name]
        if self.root is None:
            raise ReplayMiss(f"blob {name} has no folder")
        file = self.root / name
        if not file.exists():
            raise ReplayMiss(f"blob {name} is missing next to the cassette")
        return file.read_bytes()


def _host_kind(url: httpx.URL) -> str:
    host = url.host or ""
    if host.startswith("storage."):
        return "storage"
    if host.startswith("results."):
        return "results"
    return "api"


def _path(url: httpx.URL) -> str:
    return url.raw_path.decode()


class ReplayTransport(httpx.MockTransport):
    """Answers from a cassette. Each (host, method, path) has its own queue, consumed in
    order; the last reply for a path repeats if it is polled again (a finished task stays
    finished)."""

    def __init__(self, cassette: Cassette, strict: bool = True):
        self.cassette = cassette
        self.strict = strict
        self.log: list[str] = []
        self.sent: list[tuple[str, str, Any]] = []
        self._queues: dict[tuple[str, str, str], list[Interaction]] = {}
        for item in cassette.interactions:
            self._queues.setdefault((item.host, item.method, item.path), []).append(item)
        self._last: dict[tuple[str, str, str], Interaction] = {}
        super().__init__(self._handle)

    def _handle(self, request: httpx.Request) -> httpx.Response:
        key = (_host_kind(request.url), request.method.upper(), _path(request.url))
        self.log.append(" ".join(key))
        body: Any = None
        if request.content and request.headers.get("content-type", "").startswith("application/json"):
            try:
                body = json.loads(request.content)
            except ValueError:
                body = None
        self.sent.append((key[1], key[2], body))
        queue = self._queues.get(key)
        if queue:
            item = queue.pop(0)
            self._last[key] = item
        elif key in self._last and key[1] == "GET":
            item = self._last[key]
        else:
            raise ReplayMiss(f"no recorded reply for {key[1]} {key[0]}{key[2]}")
        if item.blob:
            return httpx.Response(item.status, content=self.cassette.blob(item.blob),
                                  headers={"content-type": item.content_type or "application/octet-stream"})
        return httpx.Response(item.status, json=item.json)

    def unused(self) -> list[str]:
        return [f"{i.method} {i.host}{i.path}" for q in self._queues.values() for i in q]


async def _no_sleep(_s: float) -> None:
    return None


def replay_client(cassette: Cassette, *, poll_interval_s: float = 0.0, poll_timeout_s: float = 30.0,
                  strict: bool = True) -> tuple[YouCamClient, ReplayTransport]:
    """A real YouCamClient wired to a cassette. No key, no network, no waiting."""
    transport = ReplayTransport(cassette, strict=strict)
    http = httpx.AsyncClient(transport=transport)
    clock = [0.0]

    async def tick(s: float) -> None:
        clock[0] += s

    client = YouCamClient(REPLAY_KEY, REPLAY_BASE, http, poll_interval_s=poll_interval_s,
                          poll_timeout_s=poll_timeout_s, sleep=tick, clock=lambda: clock[0])
    return client, transport


# Recording ----------------------------------------------------------------------------------
class Redactor:
    """Replaces real ids and signed URLs with placeholders, the same way everywhere."""

    def __init__(self, secrets: tuple[str, ...] = ()):
        self.secrets = tuple(s for s in secrets if s)
        self.map: dict[str, str] = {}
        self._counts: dict[str, int] = {}

    def placeholder(self, real: str, kind: str) -> str:
        if real not in self.map:
            self._counts[kind] = self._counts.get(kind, 0) + 1
            n = self._counts[kind]
            self.map[real] = {"storage": f"https://storage.replay/{n}", "results": f"https://results.replay/{n}",
                              "file": f"file-{n}", "task": f"task-{n}"}[kind]
        return self.map[real]

    def text(self, value: str) -> str:
        for real, fake in sorted(self.map.items(), key=lambda kv: -len(kv[0])):
            value = value.replace(real, fake)
        for secret in self.secrets:
            value = value.replace(secret, "[redacted]")
        return value

    def walk(self, value: Any, parent_key: str = "") -> Any:
        """Redact a decoded JSON value. URLs and ids found under known keys are mapped."""
        if isinstance(value, dict):
            return {k: self.walk(v, k) for k, v in value.items() if k.lower() not in ("authorization", "headers")}
        if isinstance(value, list):
            return [self.walk(v, parent_key) for v in value]
        if isinstance(value, str):
            key = parent_key.lower()
            if key in ("file_id", "src_file_id", "ref_file_id") or key.endswith("_file_id"):
                return self.placeholder(value, "file")
            if key == "task_id":
                return self.placeholder(value, "task")
            if value.startswith("http"):
                if key in ("url", "download_url") or "result" in key or "urls" in key:
                    return self.placeholder(value, "results")
                if _SIGNED_QUERY.search(value):
                    return self.placeholder(value, "storage")
            return self.text(value)
        return value


def redact_upload_reply(data: Any, red: Redactor) -> Any:
    """The file API reply holds signed upload URLs under files[].requests[].url."""
    if isinstance(data, dict):
        inner = data.get("data", data)
        for entry in (inner.get("files") or []) if isinstance(inner, dict) else []:
            for req in entry.get("requests") or []:
                if isinstance(req.get("url"), str):
                    red.placeholder(req["url"], "storage")
    return red.walk(data)


class RecordingTransport(httpx.AsyncBaseTransport):
    """Wraps a real transport and writes a redacted cassette. Used only by
    scripts/record_fixture.py on John's machine with his key in the environment."""

    def __init__(self, inner: httpx.AsyncBaseTransport, name: str, secrets: tuple[str, ...] = ()):
        self.inner = inner
        self.redactor = Redactor(secrets)
        self.cassette = Cassette(name=name, interactions=[], synthetic=False)
        self._blob_n = 0

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        response = await self.inner.handle_async_request(request)
        content = await response.aread()
        red = self.redactor
        url_text = str(request.url)
        # signed storage and result URLs were mapped to placeholders when the reply that
        # carried them was recorded; everything else is a YouCam API call
        if url_text in red.map:
            fake = urlsplit(red.map[url_text])
            host_kind = "storage" if fake.netloc.startswith("storage") else "results"
            path = fake.path
        else:
            host_kind = "api"
            path = red.text(_path(request.url))
        req_json = None
        if request.content and request.headers.get("content-type", "").startswith("application/json"):
            try:
                req_json = red.walk(json.loads(request.content))
            except ValueError:
                req_json = None
        ctype = response.headers.get("content-type", "")
        item = Interaction(method=request.method.upper(), path=path, host=host_kind, status=response.status_code,
                           request_json=req_json)
        if ctype.startswith("application/json"):
            try:
                body = json.loads(content)
            except ValueError:
                body = {"_unparsed": True}
            if request.url.path.endswith("/file"):
                body = redact_upload_reply(body, red)
            else:
                body = red.walk(body)
            item.json = body
        elif content:
            self._blob_n += 1
            name = f"{self.cassette.name}.blob{self._blob_n}.{ctype.split('/')[-1].split(';')[0] or 'bin'}"
            self.cassette.blobs[name] = content
            item.blob, item.content_type = name, ctype.split(";")[0]
        self.cassette.interactions.append(item)
        # the body is already decoded, so the encoding and length headers no longer apply
        headers = [(k, v) for k, v in response.headers.items()
                   if k.lower() not in ("content-encoding", "content-length", "transfer-encoding")]
        return httpx.Response(response.status_code, headers=headers, content=content, request=request)

    async def aclose(self) -> None:
        await self.inner.aclose()


def find_secrets(cassette_json: str, extra: tuple[str, ...] = ()) -> list[str]:
    """Problems that must never be committed: a bearer token, a signed URL, the key itself."""
    problems = []
    if re.search(r"Bearer\s+[A-Za-z0-9._-]{8,}", cassette_json):
        problems.append("bearer token")
    if re.search(r"https?://[^\"\s]*(X-Amz-Signature|Signature=|Expires=)", cassette_json):
        problems.append("signed url")
    for secret in extra:
        if secret and secret in cassette_json:
            problems.append("api key")
    return problems


def b64_blob(data: bytes) -> str:
    return base64.b64encode(data).decode()


# Synthetic cassettes ---------------------------------------------------------------------------
def credit_reply(amount: float = 1000.0, expiry_ms: int = 4_102_444_800_000) -> dict:
    """GET /s2s/v1.0/client/credit in the shape the unit_system docs give (see client.py)."""
    return {"status": 200, "results": [{"type": "ApiSubsToken", "amount": int(amount),
                                        "amount_dec": float(amount), "expiry": expiry_ms}]}


def task_interactions(feature: str, *, n: int = 1, polls_running: int = 1, version: str = "v2.0",
                      result_blob: str | None = None, results: dict | None = None,
                      error: str | None = None, refs: int = 0) -> list[Interaction]:
    """The documented reply sequence for one task: file upload (plus one per reference image),
    create, `polls_running` running polls, then success (or error), the result download and
    the delete. Ids are placeholders, numbered by `n`."""
    out: list[Interaction] = []
    for i in range(1 + refs):
        fid = f"file-{n}-{i}"
        out.append(Interaction("POST", "/s2s/v2.0/file", "api", 200, json={"status": 200, "data": {"files": [{
            "content_type": "image/jpeg", "file_name": "beljour.jpeg", "file_id": fid,
            "requests": [{"method": "PUT", "url": f"https://storage.replay/{n}-{i}",
                          "headers": {"Content-Type": "image/jpeg"}}]}]}}))
        out.append(Interaction("PUT", f"/{n}-{i}", "storage", 200))
    task = f"task-{n}"
    out.append(Interaction("POST", f"/s2s/{version}/task/{feature}", "api", 200,
                           json={"status": 200, "data": {"task_id": task}}))
    poll = f"/s2s/{version}/task/{feature}/{task}"
    for _ in range(polls_running):
        out.append(Interaction("GET", poll, "api", 200, json={"status": 200, "data": {"task_status": "running"}}))
    if error:
        out.append(Interaction("GET", poll, "api", 200,
                               json={"status": 200, "data": {"task_status": "error", "error": error}}))
    else:
        body = dict(results or {})
        if result_blob:
            body["url"] = f"https://results.replay/{n}"
        out.append(Interaction("GET", poll, "api", 200,
                               json={"status": 200, "data": {"task_status": "success", "results": body}}))
        if result_blob:
            out.append(Interaction("GET", f"/{n}", "results", 200, blob=result_blob, content_type="image/jpeg"))
    out.append(Interaction("POST", "/s2s/v2.0/task/delete", "api", 200, json={"status": 200, "data": {}}))
    return out


def synthetic_cassette(name: str, steps: list[Interaction], blobs: dict[str, bytes] | None = None,
                       notes: str = "") -> Cassette:
    return Cassette(name=name, interactions=steps, synthetic=True, recorded_at=None,
                    notes=notes or "Hand made in the reply shapes the YouCam docs describe. Not a recording.",
                    blobs=dict(blobs or {}))
