"""Pure amount-scale and local cache tests; no real photographs."""

from __future__ import annotations

from collections import Counter
from functools import partial

import pytest

from plumb_api.pro import (
    PhotoEditCache,
    ResourceKind,
    StrengthLevels,
    from_legacy_amount,
    legacy_amount,
    nudge,
    validate_level,
)

HASH_ONE = "a" * 64
HASH_TWO = "b" * 64


def test_strength_endpoints_roundtrip_and_preexisting_presets() -> None:
    assert validate_level(1.0) == 1.0
    assert validate_level(5.0) == 5.0
    assert legacy_amount(1.0) == 0
    assert legacy_amount(3.0) == 0.5
    assert legacy_amount(5.0) == 1
    assert from_legacy_amount(0) == 1.0
    assert from_legacy_amount(50) == 3.0
    assert from_legacy_amount(100) == 5.0
    for level in range(10, 51):
        assert validate_level(level / 10) == level / 10


@pytest.mark.parametrize("bad", [0.9, 5.1, 1.05, 3.39, -2.0, float("nan"), float("inf"), True])
def test_strength_off_step_and_nonfinite_rejected(bad: float) -> None:
    with pytest.raises(ValueError):
        validate_level(bad)


def test_remember_each_effect_and_nudges_are_bounded() -> None:
    levels = StrengthLevels()
    levels.set("sharpen", 4.2)
    levels.set("clarity", 1.3)
    assert levels.get("identity_lock") == 5.0
    assert levels.get("sharpen") == 4.2
    assert levels.get("clarity") == 1.3
    assert levels.change("sharpen", 1) == 4.3
    assert nudge(5.0, 1) == 5.0
    assert nudge(1.0, -1) == 1.0
    assert levels.snapshot().sharpen == 4.3
    levels.clear()
    assert levels.get("sharpen") == 3.0
    assert levels.get("identity_lock") == 5.0


def test_five_level_changes_reuse_masks_landmarks_tiles() -> None:
    calls: Counter[str] = Counter()
    cache = PhotoEditCache(byte_cap=1024, entry_cap=40)

    def count(kind: str) -> bytes:
        calls[kind] += 1
        return bytes([calls[kind]]) * 8

    kinds: tuple[ResourceKind, ...] = ("mask", "tile", "landmark", "render")
    for level in (1.0, 2.0, 3.0, 4.0, 5.0):
        for kind in kinds:
            result = cache.get(HASH_ONE, "curves", kind, "main", level, partial(count, kind))
            assert len(result) == 8
    assert calls == {"mask": 1, "tile": 1, "landmark": 1, "render": 5}
    assert cache.stats.computations == 8
    assert cache.stats.hits == 12


def test_cache_invalidation_never_leaks_across_photo_ids() -> None:
    cache = PhotoEditCache(byte_cap=16, entry_cap=2)
    cache.get(HASH_ONE, "curves", "mask", "a", 3.0, lambda: b"one")
    cache.get(HASH_TWO, "curves", "tile", "a", 3.0, lambda: b"two")
    cache.invalidate_photo(HASH_ONE)
    assert cache.stats.entries == 1
    cache.clear()
    assert cache.stats.bytes_used == 0
    assert cache.stats.entries == 0


def test_cache_budget_forces_deterministic_lru_eviction() -> None:
    cache = PhotoEditCache(byte_cap=16, entry_cap=2)
    for index in range(5):
        cache.get(HASH_ONE, "curve", "render", str(index), 3.0, lambda: bytes(range(8)))
    assert cache.stats.entries == 2
    assert cache.stats.bytes_used == 16
    assert cache.stats.evictions == 3
    with pytest.raises(ValueError):
        cache.get(HASH_ONE, "curve", "mask", "oversized", 3, lambda: b"x" * 17)
