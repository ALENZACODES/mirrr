"""
Qloo Taste AI client for Beljour.

Wraps the Qloo Hackathon API (https://hackathon.api.qloo.com) with:
- Entity resolution (search by name → Qloo UID)
- Taste profile (affinities from a seed set of entities)
- Tag inference (which aesthetic / vibe tags cluster around the taste profile)
- Heatmap (optional — geographic affinity, not used in beauty flow)
- In-memory TTL cache (server-side only; never exposes raw API data to browser)

Env vars:
    QLOO_API_KEY   — required for live mode
    QLOO_BASE_URL  — optional, defaults to https://hackathon.api.qloo.com
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Sequence
from typing import Any

import httpx

log = logging.getLogger(__name__)

_DEFAULT_BASE = "https://hackathon.api.qloo.com"
_DEFAULT_TIMEOUT = 15.0  # seconds


# ---------------------------------------------------------------------------
# Simple in-process TTL cache (no external deps)
# ---------------------------------------------------------------------------

class _CacheEntry:
    __slots__ = ("value", "expires_at")

    def __init__(self, value: Any, ttl: float) -> None:
        self.value = value
        self.expires_at = time.monotonic() + ttl


class TtlCache:
    """Thread-safe-ish LRU-ish TTL cache backed by a plain dict."""

    def __init__(self, max_size: int = 1024, ttl: float = 6 * 3600) -> None:
        self._max = max_size
        self._ttl = ttl
        self._store: dict[str, _CacheEntry] = {}

    def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        if time.monotonic() > entry.expires_at:
            self._store.pop(key, None)
            return None
        # refresh access order
        self._store.pop(key)
        self._store[key] = entry
        return entry.value

    def set(self, key: str, value: Any) -> None:
        if key in self._store:
            self._store.pop(key)
        elif len(self._store) >= self._max:
            # evict oldest
            oldest = next(iter(self._store))
            self._store.pop(oldest)
        self._store[key] = _CacheEntry(value, self._ttl)

    def clear(self) -> None:
        self._store.clear()


# ---------------------------------------------------------------------------
# Qloo error
# ---------------------------------------------------------------------------

class QlooError(Exception):
    def __init__(self, message: str, *, status: int | None = None, path: str | None = None) -> None:
        super().__init__(message)
        self.status = status
        self.path = path

    def __repr__(self) -> str:
        return f"QlooError({self!s}, status={self.status}, path={self.path!r})"


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------

class QlooClient:
    """
    Async Qloo Taste AI client.

    Usage::

        client = QlooClient(api_key="...")
        entities = await client.search("Radiohead", entity_type="urn:entity:artist")
        taste   = await client.taste_profile([e["id"] for e in entities[:1]])
        tags    = await client.insight_tags(taste["results"]["entities"])
    """

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str = _DEFAULT_BASE,
        timeout: float = _DEFAULT_TIMEOUT,
        cache: TtlCache | None = None,
    ) -> None:
        import os
        self._api_key = api_key or os.environ.get("QLOO_API_KEY", "")
        self._base = base_url.rstrip("/")
        self._timeout = timeout
        self._cache = cache or TtlCache()
        # single shared async client; caller must manage lifecycle
        self._http: httpx.AsyncClient | None = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def __aenter__(self) -> "QlooClient":
        self._http = httpx.AsyncClient(
            base_url=self._base,
            headers=self._auth_headers(),
            timeout=self._timeout,
        )
        return self

    async def __aexit__(self, *_: Any) -> None:
        if self._http:
            await self._http.aclose()
            self._http = None

    def _auth_headers(self) -> dict[str, str]:
        if not self._api_key:
            raise QlooError("QLOO_API_KEY is not set — cannot call Qloo API")
        return {"X-API-Key": self._api_key, "Accept": "application/json"}

    # ------------------------------------------------------------------
    # Low-level GET / POST
    # ------------------------------------------------------------------

    async def _get(self, path: str, params: dict | None = None) -> dict:
        cache_key = f"GET:{path}:{params!r}"
        hit = self._cache.get(cache_key)
        if hit is not None:
            log.debug("qloo cache HIT %s", path)
            return hit

        client = self._http or httpx.AsyncClient(
            base_url=self._base, headers=self._auth_headers(), timeout=self._timeout
        )
        try:
            resp = await client.get(path, params=params or {})
        except httpx.TimeoutException as exc:
            raise QlooError(f"Qloo request timed out: {path}") from exc
        finally:
            if self._http is None:
                await client.aclose()

        if resp.status_code != 200:
            raise QlooError(
                f"Qloo {path} returned {resp.status_code}: {resp.text[:200]}",
                status=resp.status_code,
                path=path,
            )

        data = resp.json()
        self._cache.set(cache_key, data)
        return data

    async def _post(self, path: str, body: dict) -> dict:
        cache_key = f"POST:{path}:{body!r}"
        hit = self._cache.get(cache_key)
        if hit is not None:
            log.debug("qloo cache HIT %s", path)
            return hit

        client = self._http or httpx.AsyncClient(
            base_url=self._base, headers=self._auth_headers(), timeout=self._timeout
        )
        try:
            resp = await client.post(path, json=body)
        except httpx.TimeoutException as exc:
            raise QlooError(f"Qloo POST timed out: {path}") from exc
        finally:
            if self._http is None:
                await client.aclose()

        if resp.status_code not in (200, 201):
            raise QlooError(
                f"Qloo POST {path} returned {resp.status_code}: {resp.text[:200]}",
                status=resp.status_code,
                path=path,
            )

        data = resp.json()
        self._cache.set(cache_key, data)
        return data

    # ------------------------------------------------------------------
    # Qloo API methods
    # ------------------------------------------------------------------

    async def search(
        self,
        query: str,
        *,
        entity_type: str | None = None,
        limit: int = 5,
    ) -> list[dict]:
        """
        Search for entities by name.

        Args:
            query: free-text name, e.g. "Radiohead" or "ramen"
            entity_type: optional URN filter, e.g. "urn:entity:artist"
            limit: max results

        Returns:
            List of entity dicts with at least {"id": ..., "name": ..., "type": ...}
        """
        params: dict[str, Any] = {"query": query, "limit": limit}
        if entity_type:
            params["type"] = entity_type

        data = await self._get("/v2/search", params=params)
        return data.get("results", {}).get("entities", [])

    async def taste_profile(
        self,
        entity_ids: Sequence[str],
        *,
        output_type: str | None = None,
        limit: int = 20,
        filter_types: list[str] | None = None,
    ) -> dict:
        """
        Get Qloo taste recommendations from a seed set of entity IDs.

        Args:
            entity_ids: Qloo entity IDs the user likes
            output_type: optional URN for the type of output, e.g. "urn:entity:tag"
            limit: max output entities
            filter_types: optional list of entity type URNs to constrain output

        Returns:
            Raw Qloo response with results.entities list and affinity scores
        """
        body: dict[str, Any] = {
            "signal": {"entities": list(entity_ids)},
            "limit": limit,
        }
        if output_type:
            body["output_type"] = output_type
        if filter_types:
            body["filter"] = {"types": filter_types}

        return await self._post("/v2/taste", body)

    async def insight_tags(
        self,
        entity_ids: Sequence[str],
        *,
        tag_types: list[str] | None = None,
        limit: int = 30,
    ) -> list[dict]:
        """
        Get tags (ambience, vibe, aesthetic) associated with entities.

        Args:
            entity_ids: entity IDs to query tags for
            tag_types: optional tag type URN filters
            limit: max tags

        Returns:
            List of tag dicts with {"id": ..., "name": ..., "type": ..., "affinity": ...}
        """
        body: dict[str, Any] = {
            "signal": {"entities": list(entity_ids)},
            "output_type": "urn:entity:tag",
            "limit": limit,
        }
        if tag_types:
            body["filter"] = {"types": tag_types}

        data = await self._post("/v2/taste", body)
        return data.get("results", {}).get("entities", [])

    async def resolve_name(
        self,
        name: str,
        *,
        preferred_types: list[str] | None = None,
    ) -> dict | None:
        """
        Resolve a free-text name to a single best-match Qloo entity.

        Returns the best match or None if nothing found.
        """
        results = await self.search(name, limit=10)
        if not results:
            return None

        if preferred_types:
            for entity in results:
                if entity.get("type") in preferred_types:
                    return entity

        return results[0]

    async def resolve_many(
        self,
        names: Sequence[str],
        *,
        preferred_types: list[str] | None = None,
        concurrency: int = 5,
    ) -> list[dict | None]:
        """
        Resolve multiple names concurrently, respecting concurrency limit.
        """
        sem = asyncio.Semaphore(concurrency)

        async def _resolve(name: str) -> dict | None:
            async with sem:
                try:
                    return await self.resolve_name(name, preferred_types=preferred_types)
                except QlooError as exc:
                    log.warning("qloo resolve failed for %r: %s", name, exc)
                    return None

        return list(await asyncio.gather(*(_resolve(n) for n in names)))
