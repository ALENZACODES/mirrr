"""Bounded in-memory edit and provider preview memo; no persistent photos.

Provider identity includes the authorized source hash, product and canonical
fixed-intensity request. A slider nudge reuses that provider image and only
recomposites locally. Cache entries are never serialized or logged.
"""
from __future__ import annotations

import hashlib
import json
import math
import time
from collections import OrderedDict
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import Any, TypeVar, cast

from .strength import level_ticks

T = TypeVar("T")
MAX_IMAGE_BYTES = 20_000_000
MAX_CACHE_BYTES = 48_000_000
MAX_CACHE_ITEMS = 32
DEFAULT_TTL = 600.0


@dataclass(frozen=True)
class ProviderImage:
    image: bytes
    mime: str

    def __post_init__(self) -> None:
        if not 0 < len(self.image) <= MAX_IMAGE_BYTES:
            raise ValueError("Provider image exceeds cache limits")
        if self.mime not in ("image/png", "image/jpeg", "image/webp"):
            raise ValueError("Unsupported provider image type")


class ProviderImageCache:
    """Single-process, TTL-bound image LRU; no cross-user key except source content hash."""

    def __init__(self, *, clock: Callable[[], float] = time.monotonic) -> None:
        self._clock = clock
        self._rows: OrderedDict[str, tuple[float, ProviderImage]] = OrderedDict()
        self._bytes = 0
        self.hits = 0
        self.misses = 0

    @staticmethod
    def key(photo_hash: str, product_id: str, request: Mapping[str, Any]) -> str:
        if len(photo_hash) != 64 or any(c not in "0123456789abcdef" for c in photo_hash):
            raise ValueError("Photo identity must be a lowercase SHA-256")
        if not product_id or len(product_id) > 80:
            raise ValueError("Invalid catalogue item")
        canonical = json.dumps(request, sort_keys=True, separators=(",", ":"), allow_nan=False)
        return hashlib.sha256((photo_hash + "|" + product_id + "|" + canonical).encode()).hexdigest()

    def get(self, key: str) -> ProviderImage | None:
        self._evict_expired()
        row = self._rows.get(key)
        if row is None:
            self.misses += 1
            return None
        self._rows.move_to_end(key)
        self.hits += 1
        return row[1]

    def put(self, key: str, image: ProviderImage) -> None:
        if len(image.image) > MAX_CACHE_BYTES:
            return
        previous = self._rows.pop(key, None)
        if previous is not None:
            self._bytes -= len(previous[1].image)
        self._rows[key] = (self._clock(), image)
        self._bytes += len(image.image)
        self._evict_expired()
        while len(self._rows) > MAX_CACHE_ITEMS or self._bytes > MAX_CACHE_BYTES:
            _old_key, (_time, old) = self._rows.popitem(last=False)
            self._bytes -= len(old.image)

    def clear(self) -> None:
        self._rows.clear()
        self._bytes = 0

    def _evict_expired(self) -> None:
        now = self._clock()
        expired = [key for key, (created, _row) in self._rows.items()
                   if now - created > DEFAULT_TTL or now < created]
        for key in expired:
            _, row = self._rows.pop(key)
            self._bytes -= len(row.image)

    @property
    def bytes_used(self) -> int:
        return self._bytes


@dataclass(frozen=True)
class EditKey:
    photo_hash: str
    edit: str
    level: int

    def __post_init__(self) -> None:
        if len(self.photo_hash) != 64 or any(c not in "0123456789abcdef" for c in self.photo_hash):
            raise ValueError("Photo edit key needs SHA-256")
        if not self.edit or len(self.edit) > 100:
            raise ValueError("Missing edit name")
        if type(self.level) is not int or not 10 <= self.level <= 50:
            raise ValueError("Edit level must be integer tenths from 10 to 50")


class PhotoEditCache:
    """Caches immutable landmark/mask/reading *metadata*, never a user's RGB image."""

    def __init__(self, *, clock: Callable[[], float] = time.monotonic) -> None:
        self._clock = clock
        self._items: OrderedDict[EditKey, tuple[float, Any]] = OrderedDict()
        self.hits = 0
        self.computes = 0

    def get_or_compute(self, key: EditKey, factory: Callable[[], T]) -> T:
        now = self._clock()
        row = self._items.get(key)
        if row is not None and 0 <= now - row[0] <= DEFAULT_TTL:
            self._items.move_to_end(key)
            self.hits += 1
            return cast(T, row[1])
        if row is not None:
            del self._items[key]
        value = factory()
        self.computes += 1
        self._items[key] = (now, value)
        while len(self._items) > MAX_CACHE_ITEMS:
            self._items.popitem(last=False)
        return value

    def drop_photo(self, photo_hash: str) -> None:
        for key in list(self._items):
            if key.photo_hash == photo_hash:
                del self._items[key]

    def clear(self) -> None:
        self._items.clear()


def canonical_level_cache_key(photo_hash: str, edit: str, level: float) -> EditKey:
    if not math.isfinite(level):
        raise ValueError("Invalid edit level")
    return EditKey(photo_hash, edit, level_ticks(level))
