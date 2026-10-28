"""Bounded, session-local resource reuse across successive effect strengths.

Mask/tile/landmark inputs are invariant under level changes, so their cache
keys exclude level. Render outputs vary by level and include it in the key.
Eviction and reset zero mutable bytearrays; no objects go to persistent storage.
"""

from __future__ import annotations

import re
from collections import OrderedDict
from collections.abc import Callable
from dataclasses import dataclass
from typing import Literal

from .strength import validate_level

ResourceKind = Literal["mask", "tile", "landmark", "render"]
HASH = re.compile(r"[0-9a-f]{64}\Z")


@dataclass(frozen=True)
class CacheStats:
    entries: int
    bytes_used: int
    computations: int
    hits: int
    evictions: int


def _key(photo_sha256: str, edit: str, kind: ResourceKind, resource_id: str, level: float) -> str:
    if not HASH.fullmatch(photo_sha256):
        raise ValueError("photo identity needs a lowercase SHA-256 digest")
    if not re.fullmatch(r"[a-z0-9_-]{1,48}", edit):
        raise ValueError("invalid edit identifier")
    if not re.fullmatch(r"[a-z0-9_-]{1,48}", resource_id):
        raise ValueError("invalid cache resource identifier")
    if kind not in ("tile", "mask", "landmark", "render"):
        raise ValueError("invalid cache resource type")
    value = validate_level(level)
    base = f"{photo_sha256}/{edit}/{kind}/{resource_id}"
    return f"{base}/{value:.1f}" if kind == "render" else base


class PhotoEditCache:
    """Non-shared RAM-only LRU; intermediate buffers count towards the byte cap."""

    def __init__(self, byte_cap: int = 16 * 1024 * 1024, entry_cap: int = 256) -> None:
        if not 1 <= byte_cap <= 64 * 1024 * 1024 or not 1 <= entry_cap <= 2048:
            raise ValueError("invalid local cache budget")
        self.byte_cap = byte_cap
        self.entry_cap = entry_cap
        self._entries: OrderedDict[str, bytearray] = OrderedDict()
        self._bytes_used = 0
        self._computations = 0
        self._hits = 0
        self._evictions = 0

    @property
    def stats(self) -> CacheStats:
        return CacheStats(len(self._entries), self._bytes_used, self._computations, self._hits, self._evictions)

    def _evict(self) -> None:
        while self._entries and (self._bytes_used > self.byte_cap or len(self._entries) > self.entry_cap):
            _, old = self._entries.popitem(last=False)
            self._bytes_used -= len(old)
            old[:] = b"\0" * len(old)
            self._evictions += 1

    def get(
        self,
        photo_sha256: str,
        edit: str,
        kind: ResourceKind,
        resource_id: str,
        level: float,
        compute: Callable[[], bytes],
    ) -> bytes:
        key = _key(photo_sha256, edit, kind, resource_id, level)
        if key in self._entries:
            self._entries.move_to_end(key)
            self._hits += 1
            return bytes(self._entries[key])
        data = compute()
        if not isinstance(data, bytes):
            raise ValueError("cached resource producer must return bytes")
        if len(data) > self.byte_cap:
            raise ValueError("resource exceeds local cache budget")
        self._computations += 1
        self._entries[key] = bytearray(data)
        self._bytes_used += len(data)
        self._evict()
        return bytes(data)

    def invalidate_photo(self, photo_sha256: str) -> None:
        if not HASH.fullmatch(photo_sha256):
            raise ValueError("invalid photo digest")
        for key in tuple(self._entries):
            if key.startswith(photo_sha256 + "/"):
                old = self._entries.pop(key)
                self._bytes_used -= len(old)
                old[:] = b"\0" * len(old)

    def clear(self) -> None:
        for buffer in self._entries.values():
            buffer[:] = b"\0" * len(buffer)
        self._entries.clear()
        self._bytes_used = 0
