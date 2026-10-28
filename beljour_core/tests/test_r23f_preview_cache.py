"""Five tenths-level nudges cause no extra mocked provider calls or skin readings."""
from __future__ import annotations

import asyncio
import io
from types import SimpleNamespace
from unittest.mock import AsyncMock

import numpy as np
import pytest
from PIL import Image

from plumb_api.commerce.preview_cache import EditKey, PhotoEditCache, ProviderImage, ProviderImageCache
from plumb_api.commerce.service import CommerceService
from plumb_api.commerce.strength import level_ticks


def png(value: int) -> bytes:
    pix = np.full((64, 64, 3), value, dtype=np.uint8)
    result = io.BytesIO()
    Image.fromarray(pix, "RGB").save(result, "PNG")
    return result.getvalue()


def test_five_level_changes_one_mock_provider_call() -> None:
    asyncio.run(_five_level_changes_one_mock_provider_call())


async def _five_level_changes_one_mock_provider_call() -> None:
    state = SimpleNamespace()
    state.settings = SimpleNamespace(live=True, youcam_styling=True, kill_switch=False, youcam_skin=True)
    state.gateway = SimpleNamespace(run=AsyncMock(return_value=SimpleNamespace(
        image=png(120), image_type="image/png", source="live", units=1)))
    state.ref = lambda photo: photo
    state.skin_match = None
    photo = SimpleNamespace(data=png(98), sha="b" * 64)
    results = []
    for strength in (30, 40, 50, 60, 70):
        # The API normally builds a new service per request, just like this.
        result = await CommerceService(state).try_on(photo, "quiet-veil-09-warm",
                                                     local_only=False, strength=strength, lock_level=1.0)
        results.append(result)
    assert state.gateway.run.await_count == 1
    assert [result["provider_calls"] for result in results] == [1, 0, 0, 0, 0]
    assert [result["units_spent"] for result in results] == [1, 0, 0, 0, 0]
    assert all(result["identity_guard"]["applied"] for result in results)
    assert all(result["source"] == "youcam" for result in results)
    assert len({result["image"] for result in results}) >= 3


def test_photo_edit_cache_reuses_one_reading_across_five_levels() -> None:
    memo = PhotoEditCache()
    hashed = "c" * 64
    counters = {"reading": 0, "masks": 0, "landmarks": 0}

    def prepare() -> tuple[str, str, str]:
        for field in counters:
            counters[field] += 1
        return ("synthetic reading", "supplied masks", "supplied landmarks")

    base = EditKey(hashed, "shade_reading_and_geometry", level_ticks(3.0))
    for level in (2.0, 2.1, 2.2, 2.3, 2.4):
        _derived_edit_key = EditKey(hashed, "preview", level_ticks(level))
        assert memo.get_or_compute(base, prepare)[0] == "synthetic reading"
    assert counters == {"reading": 1, "masks": 1, "landmarks": 1}
    assert memo.computes == 1
    assert memo.hits == 4
    memo.drop_photo(hashed)
    memo.get_or_compute(base, prepare)
    assert memo.computes == 2


def test_provider_cache_bounded_ttl_and_immutable_identity() -> None:
    now = [1.0]
    cache = ProviderImageCache(clock=lambda: now[0])
    request = {"effects": [{"color": "#883322", "intensity": 100}]}
    key = cache.key("f" * 64, "fake-sku", request)
    assert key == cache.key("f" * 64, "fake-sku", request)
    assert key != cache.key("e" * 64, "fake-sku", request)
    assert cache.get(key) is None
    cache.put(key, ProviderImage(png(90), "image/png"))
    assert cache.get(key) is not None
    assert cache.hits == 1 and cache.misses == 1
    now[0] += 601
    assert cache.get(key) is None
    assert cache.bytes_used == 0


def test_bad_provider_cache_content_never_enters() -> None:
    with pytest.raises(ValueError):
        ProviderImage(b"", "image/png")
    with pytest.raises(ValueError):
        ProviderImage(b"data", "image/svg+xml")
    with pytest.raises(ValueError):
        ProviderImageCache.key("not a sha", "sku", {})
