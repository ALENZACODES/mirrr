"""Per-IP admission for routes that can spend free YouCam units.

The bucket is checked before request parsing, session creation or any provider call.
Settings loaded from the environment enable it by default; direct Settings objects
used by offline tests leave it disabled unless the test opts in. One process owns a
bounded, in-memory table. Deploy one API worker while this limiter is in use: multiple
processes need a shared store before their capacity can be treated as one global cap.
IP addresses stay in memory, expire with their buckets, and are never logged.

Author: John Khan.
"""
from __future__ import annotations

import ipaddress
import math
import re
import threading
import time
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import Any, Literal

from pydantic import BaseModel
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

RATE_LIMIT_MESSAGE = "Too many requests from this connection. Wait a moment and try again."
# These are the only HTTP routes that submit or resume unit-spending jobs. Keep
# aliases in the same class so switching endpoints cannot bypass one IP's budget.
SPENDING_ROUTES: Mapping[str, str] = {
    "/api/tasks/start": "styling",
    "/api/makeup/try": "styling",
    "/api/skin/match": "skin",
    "/api/tasks/resume": "resume",
}
HEADER_NAME = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
IPAddress = ipaddress.IPv4Address | ipaddress.IPv6Address
IPNetwork = ipaddress.IPv4Network | ipaddress.IPv6Network


class RateLimitErrorBody(BaseModel):
    code: Literal["rate_limited"] = "rate_limited"
    message: str = RATE_LIMIT_MESSAGE
    retry_after_seconds: int


class RateLimitReply(BaseModel):
    error: RateLimitErrorBody


RATE_LIMIT_RESPONSES: dict[int | str, dict[str, Any]] = {
    429: {"model": RateLimitReply, "description": "Per-IP request allowance exhausted; retry after Retry-After."},
}


@dataclass(frozen=True)
class BucketPolicy:
    capacity: int = 12
    refill_per_second: float = 0.2

    def __post_init__(self) -> None:
        if not isinstance(self.capacity, int) or isinstance(self.capacity, bool) or not 1 <= self.capacity <= 1000:
            raise ValueError("rate limit capacity must be 1..1000")
        if not math.isfinite(self.refill_per_second) or not 0 < self.refill_per_second <= 100:
            raise ValueError("rate limit refill must be in (0,100]")


@dataclass
class Bucket:
    tokens: float
    updated: float


@dataclass(frozen=True)
class Admission:
    allowed: bool
    retry_after_seconds: int = 0


class TokenBuckets:
    """Atomic nonblocking token buckets with a finite resident-IP bound.

    A full table refuses new clients until an idle bucket expires. Evicting an
    active bucket would let an attacker rotate addresses to reset its allowance.
    Expiry is never shorter than the time needed to refill a complete bucket.
    The injectable monotonic clock keeps refill tests deterministic, with no sleeps.
    """

    def __init__(self, policy: BucketPolicy, *, max_entries: int = 10000,
                 idle_seconds: float = 600, clock: Callable[[], float] = time.monotonic):
        if not isinstance(max_entries, int) or isinstance(max_entries, bool) or not 1 <= max_entries <= 100000:
            raise ValueError("rate limit table size must be 1..100000")
        if not math.isfinite(idle_seconds) or idle_seconds <= 0:
            raise ValueError("rate limit idle expiry must be positive")
        self.policy = policy
        self.max_entries = max_entries
        self.idle_seconds = max(idle_seconds, policy.capacity / policy.refill_per_second)
        self.clock = clock
        self._buckets: dict[tuple[str, str], Bucket] = {}
        self._lock = threading.Lock()
        self._last_cleanup = float("-inf")

    @property
    def entry_count(self) -> int:
        with self._lock:
            return len(self._buckets)

    def admit(self, ip: str, route_class: str) -> Admission:
        now = self.clock()
        if not math.isfinite(now):
            return Admission(False, 1)
        key = (ip, route_class)
        with self._lock:
            if now - self._last_cleanup >= min(60.0, self.idle_seconds):
                self._buckets = {k: b for k, b in self._buckets.items()
                                 if now - b.updated < self.idle_seconds}
                self._last_cleanup = now
            bucket = self._buckets.get(key)
            if bucket is None:
                if len(self._buckets) >= self.max_entries:
                    retry = min(self.idle_seconds - max(0.0, now - b.updated)
                                for b in self._buckets.values())
                    return Admission(False, max(1, math.ceil(retry)))
                bucket = Bucket(float(self.policy.capacity), now)
                self._buckets[key] = bucket
            elapsed = max(0.0, now - bucket.updated)
            bucket.tokens = min(float(self.policy.capacity),
                                bucket.tokens + elapsed * self.policy.refill_per_second)
            bucket.updated = max(bucket.updated, now)
            if bucket.tokens >= 1.0:
                bucket.tokens -= 1.0
                return Admission(True)
            retry = math.ceil((1.0 - bucket.tokens) / self.policy.refill_per_second)
            return Admission(False, max(1, retry))


def _address(value: str) -> IPAddress | None:
    # No ports, zone identifiers or hostnames are accepted from forwarded headers.
    # IPv4-mapped IPv6 is one address, not another route to an extra allowance.
    if not value or "%" in value or len(value) > 45:
        return None
    try:
        address = ipaddress.ip_address(value.strip())
    except ValueError:
        return None
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped is not None:
        return address.ipv4_mapped
    return address


class ClientIP:
    """Resolve an address through explicitly trusted proxy networks only.

    The nearest untrusted hop wins when a proxy provides a comma-separated chain.
    A forged leftmost X-Forwarded-For cannot override an untrusted intermediate hop.
    Missing, repeated, overlong or malformed headers fall back to the TCP peer.
    """

    def __init__(self, header: str = "", networks: tuple[str, ...] = ()):
        self.header = header.strip().lower()
        if self.header and (not HEADER_NAME.fullmatch(self.header) or not networks):
            raise ValueError("a trusted proxy header needs explicit trusted proxy networks")
        self.networks: tuple[IPNetwork, ...] = tuple(ipaddress.ip_network(n, strict=False) for n in networks)

    def _trusted(self, address: IPAddress) -> bool:
        return any(address.version == network.version and address in network for network in self.networks)

    def resolve(self, scope: Scope) -> str:
        client = scope.get("client")
        raw_peer = str(client[0]) if client else ""
        peer = _address(raw_peer)
        if peer is None:
            return "unknown"
        if not self.header or not self._trusted(peer):
            return str(peer)
        matching = [v for k, v in scope.get("headers", []) if k.decode("latin-1").lower() == self.header]
        if len(matching) != 1 or len(matching[0]) > 1024:
            return str(peer)
        values = matching[0].decode("latin-1").split(",")
        if not 1 <= len(values) <= 16:
            return str(peer)
        hops = [_address(value.strip()) for value in values]
        if any(hop is None for hop in hops):
            return str(peer)
        address = peer
        for hop in reversed(hops):
            if not self._trusted(address):
                break
            if hop is not None:
                address = hop
        return str(address)


class RateLimitMiddleware:
    def __init__(self, app: ASGIApp, *, buckets: TokenBuckets, client_ip: ClientIP):
        self.app = app
        self.buckets = buckets
        self.client_ip = client_ip

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        path = str(scope.get("path", "")).rstrip("/")
        route_class = SPENDING_ROUTES.get(path)
        if scope["type"] == "http" and scope.get("method") == "POST" and route_class:
            result = self.buckets.admit(self.client_ip.resolve(scope), route_class)
            if not result.allowed:
                reply = RateLimitReply(error=RateLimitErrorBody(retry_after_seconds=result.retry_after_seconds))
                response = JSONResponse(reply.model_dump(), status_code=429, headers={
                    "Retry-After": str(result.retry_after_seconds),
                    "Cache-Control": "no-store",
                    "X-Content-Type-Options": "nosniff",
                })
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)
