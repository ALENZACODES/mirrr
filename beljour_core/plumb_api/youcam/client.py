"""Thin async client for the YouCam S2S v2 API.

Flow, as documented: POST /s2s/v2.0/file -> PUT bytes to the pre signed url -> POST
/s2s/v2.0/task/<feature> -> poll GET /s2s/v2.0/task/<feature>/<task_id> until
"success" or "error" -> download the result image -> delete the task.

Every task is polled to the end. If our own wait runs out, polling carries on in the
background, because a task that is never polled can time out and still be charged.
"""
from __future__ import annotations

import asyncio
import collections
import logging
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field

import httpx

log = logging.getLogger("plumb.youcam")


class YouCamError(Exception):
    def __init__(self, code: str, message: str, status: int | None = None):
        super().__init__(f"{code}: {message}")
        self.code = code
        self.message = message
        self.status = status


@dataclass
class TaskOutcome:
    task_id: str
    results: dict
    image: bytes | None = None
    image_type: str | None = None
    series: list[dict] = field(default_factory=list)


class RateLimiter:
    """Sliding window limiter. YouCam allows 250 requests per 300 seconds; we keep a margin."""

    def __init__(self, max_calls: int = 230, window_s: float = 300.0,
                 clock: Callable[[], float] = time.monotonic,
                 sleep: Callable[[float], Awaitable[None]] = asyncio.sleep):
        self.max_calls, self.window_s = max_calls, window_s
        self._clock, self._sleep = clock, sleep
        self._calls: collections.deque[float] = collections.deque()

    async def acquire(self) -> None:
        while True:
            now = self._clock()
            while self._calls and now - self._calls[0] >= self.window_s:
                self._calls.popleft()
            if len(self._calls) < self.max_calls:
                self._calls.append(now)
                return
            await self._sleep(self.window_s - (now - self._calls[0]) + 0.01)


def find_result_image_url(results: dict | list | None) -> str | None:
    """Image tasks return data.results.url. Some docs show a list with download_url."""
    if isinstance(results, dict):
        for key in ("url", "download_url"):
            if isinstance(results.get(key), str):
                return results[key]
        urls = results.get("urls")
        if isinstance(urls, list) and urls and isinstance(urls[0], str):
            return urls[0]
    if isinstance(results, list) and results:
        first = results[0]
        if isinstance(first, dict):
            return find_result_image_url(first)
    return None


class YouCamClient:
    def __init__(self, api_key: str, base_url: str, http: httpx.AsyncClient,
                 poll_interval_s: float = 3.0, poll_timeout_s: float = 240.0,
                 limiter: RateLimiter | None = None,
                 sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
                 clock: Callable[[], float] = time.monotonic):
        if not api_key:
            raise ValueError("YouCam API key is missing")
        self._key = api_key
        self._base = base_url.rstrip("/")
        self._http = http
        self.poll_interval_s = poll_interval_s
        self.poll_timeout_s = poll_timeout_s
        self._limiter = limiter or RateLimiter(sleep=sleep, clock=clock)
        self._sleep, self._clock = sleep, clock
        self.background: set[asyncio.Task] = set()

    # low level -------------------------------------------------------------
    @property
    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._key}", "Content-Type": "application/json"}

    async def _call(self, method: str, path: str, json_body: dict | None = None) -> dict:
        await self._limiter.acquire()
        resp = await self._http.request(method, f"{self._base}{path}", headers=self._headers,
                                        json=json_body, timeout=30.0)
        try:
            body = resp.json()
        except ValueError as exc:
            raise YouCamError("bad_response", f"non JSON reply ({resp.status_code})", resp.status_code) from exc
        if resp.status_code >= 400 or (isinstance(body, dict) and body.get("status", 200) >= 400):
            raise YouCamError(str(body.get("error_code", "http_error")),
                              str(body.get("error", resp.text[:200])), resp.status_code)
        return body.get("data", body) if isinstance(body, dict) else {}

    # public steps ----------------------------------------------------------
    async def upload(self, data: bytes, content_type: str, file_name: str) -> str:
        meta = await self._call("POST", "/s2s/v2.0/file", {
            "files": [{"content_type": content_type, "file_name": file_name, "file_size": len(data)}]
        })
        try:
            entry = meta["files"][0]
            request = entry["requests"][0]
        except (KeyError, IndexError, TypeError) as exc:
            raise YouCamError("bad_response", "file API reply had no upload url") from exc
        put = await self._http.request(request.get("method", "PUT"), request["url"],
                                       headers=request.get("headers") or {"Content-Type": content_type},
                                       content=data, timeout=60.0)
        if put.status_code >= 300:
            raise YouCamError("upload_failed", f"storage replied {put.status_code}", put.status_code)
        return entry["file_id"]

    async def create_task(self, feature: str, payload: dict, version: str = "v2.0") -> str:
        data = await self._call("POST", f"/s2s/{version}/task/{feature}", payload)
        task_id = data.get("task_id")
        if not task_id:
            raise YouCamError("bad_response", "task API reply had no task_id")
        return task_id

    async def poll(self, feature: str, task_id: str, version: str = "v2.0",
                   timeout_s: float | None = None) -> dict:
        deadline = self._clock() + (self.poll_timeout_s if timeout_s is None else timeout_s)
        interval = self.poll_interval_s
        while True:
            data = await self._call("GET", f"/s2s/{version}/task/{feature}/{task_id}")
            status = data.get("task_status")
            if status == "success":
                return data
            if status == "error":
                raise YouCamError(str(data.get("error") or "task_error"),
                                  str(data.get("error_message") or "YouCam could not process this photo"))
            if self._clock() >= deadline:
                raise TimeoutError(task_id)
            await self._sleep(interval)
            interval = min(interval * 1.5, 10.0)

    async def delete_task(self, task_id: str) -> None:
        try:
            await self._call("POST", "/s2s/v2.0/task/delete", {"task_id": task_id})
        except (YouCamError, httpx.HTTPError) as exc:  # best effort; results expire anyway
            log.warning("task delete failed for %s: %s", task_id, exc)

    async def credit(self) -> int | None:
        """Remaining units, or None if the reply shape is not one we recognise."""
        try:
            data = await self._call("GET", "/s2s/v1.0/client/credit")
        except (YouCamError, httpx.HTTPError):
            return None
        return _extract_credit(data)

    async def download(self, url: str) -> tuple[bytes, str]:
        resp = await self._http.get(url, timeout=60.0)
        if resp.status_code >= 300:
            raise YouCamError("download_failed", f"result download replied {resp.status_code}")
        return resp.content, resp.headers.get("content-type", "image/jpeg").split(";")[0]

    # whole flow --------------------------------------------------------------
    async def run(self, feature: str, image: bytes, content_type: str, payload: dict,
                  version: str = "v2.0", want_image: bool = True,
                  refs: dict[str, tuple[bytes, str]] | None = None) -> TaskOutcome:
        """`refs` uploads extra images and puts their ids in the payload under the given key,
        e.g. {"ref_file_id": (reference_bytes, "image/jpeg")} for a reference hairstyle."""
        file_id = await self.upload(image, content_type, f"plumb.{content_type.split('/')[-1]}")
        body = {**payload, "src_file_id": file_id}
        for key, (ref_data, ctype) in (refs or {}).items():
            body[key] = await self.upload(ref_data, ctype, f"ref.{ctype.split('/')[-1]}")
        task_id = await self.create_task(feature, body, version)
        try:
            data = await self.poll(feature, task_id, version)
        except TimeoutError as exc:
            self._keep_polling(feature, task_id, version)
            raise YouCamError("timeout", "YouCam is taking longer than usual. Please try again in a minute.") from exc
        outcome = await self.collect(task_id, data, want_image)
        await self.delete_task(task_id)
        return outcome

    async def collect(self, task_id: str, data: dict, want_image: bool = True) -> TaskOutcome:
        """Turn a successful poll reply into a TaskOutcome, downloading any result images.
        Used by run() and by the provider's step by step flow."""
        results = data.get("results") or {}
        outcome = TaskOutcome(task_id, results if isinstance(results, dict) else {"items": results})
        if want_image:
            url = find_result_image_url(results)
            if url:
                outcome.image, outcome.image_type = await self.download(url)
            series = results.get("output") if isinstance(results, dict) else None
            if isinstance(series, list) and series and isinstance(series[0], dict) and "url" in series[0]:
                # aging returns a series of images, each with its own age
                for item in series:
                    img, ctype = await self.download(item["url"])
                    outcome.series.append({"meta": {k: v for k, v in item.items() if k != "url"},
                                           "image": img, "image_type": ctype})
                if outcome.image is None and outcome.series:
                    outcome.image, outcome.image_type = outcome.series[0]["image"], outcome.series[0]["image_type"]
        return outcome

    async def list_templates(self, feature: str, page_size: int = 100, max_pages: int = 20) -> list[dict]:
        """Preset templates for template based features (hairstyles). The path is ASSUMED
        from the YouCam docs pattern, /s2s/v2.0/task/template/<feature>, until spike S1
        confirms it. Follows `next_token` paging if the reply has it."""
        items: list[dict] = []
        token: str | None = None
        for _ in range(max_pages):
            path = f"/s2s/v2.0/task/template/{feature}?page_size={page_size}"
            if token:
                path += f"&starting_token={token}"
            data = await self._call("GET", path)
            page = data.get("templates") if isinstance(data, dict) else None
            if not isinstance(page, list):
                raise YouCamError("bad_response", "template list reply had no templates")
            items.extend(t for t in page if isinstance(t, dict))
            token = data.get("next_token") if isinstance(data, dict) else None
            if not token:
                break
        return items

    def _keep_polling(self, feature: str, task_id: str, version: str) -> None:
        async def finish() -> None:
            try:
                await self.poll(feature, task_id, version, timeout_s=1800)
            except Exception as exc:  # noqa: BLE001  logging only
                log.warning("background poll for %s ended: %s", task_id, exc)
            await self.delete_task(task_id)

        task = asyncio.ensure_future(finish())
        self.background.add(task)
        task.add_done_callback(self.background.discard)


def _extract_credit(data: object) -> int | None:
    """GET /s2s/v1.0/client/credit returns {"status": 200, "results": [{"type", "amount",
    "amount_dec", "expiry"}, ...]} (unit_system docs, checked Oct 22, 2026). The balance is
    the sum of amount_dec (amount is deprecated) over unexpired entries."""
    if not isinstance(data, dict):
        return None
    items = data.get("results")
    if not isinstance(items, list):
        return None
    now_ms = time.time() * 1000
    total = 0.0
    found = False
    for item in items:
        if not isinstance(item, dict):
            continue
        expiry = item.get("expiry")
        if isinstance(expiry, (int, float)) and expiry and expiry < now_ms:
            continue
        value = item.get("amount_dec", item.get("amount"))
        if isinstance(value, (int, float)):
            total += float(value)
            found = True
    return int(total) if found else None
