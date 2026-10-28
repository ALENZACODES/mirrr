"""Manual landmarks changed on the same photo cannot silently reuse stale plans.

Also verifies bounded photo/cache isolation across several synthetic sessions.
Author: John Khan.
"""
from __future__ import annotations

import hashlib

import numpy as np
import pytest

from plumb_api.engines.posture.session import MAX_PHOTOS, PostureCache
from plumb_api.engines.posture.synthetic import front_figure


def digest(name: str) -> str:
    return hashlib.sha256(name.encode("utf-8")).hexdigest()


def test_invalidate_after_manual_edit_forces_recomputation() -> None:
    cache = PostureCache()
    original = front_figure(lean=2.0).controls
    revised = front_figure(lean=5.0).controls
    photo_hash = digest("same-photo-with-user-changed-controls")
    first = cache.plan(photo_hash, "lean", 5, lambda: original)
    second = cache.plan(photo_hash, "lean", 5, lambda: revised)
    assert first is second
    assert second.measure_before == first.measure_before
    cache.invalidate_photo(photo_hash)
    next_plan = cache.plan(photo_hash, "lean", 5, lambda: revised)
    assert next_plan is not first
    assert next_plan.measure_before != first.measure_before
    assert cache.plan_count == 1


def test_invalidation_discards_only_the_selected_photo() -> None:
    cache = PostureCache()
    a = digest("a")
    b = digest("b")
    fig = front_figure(lean=4)
    a_plan = cache.plan(a, "lean", 2, lambda: fig.controls)
    b_plan = cache.plan(b, "lean", 2, lambda: fig.controls)
    assert a_plan is not b_plan
    cache.band(a, "lean", lambda: fig.person)
    cache.band(b, "lean", lambda: fig.person)
    bytes_before = cache.band_bytes
    cache.invalidate_photo(a)
    assert cache.band_bytes < bytes_before
    assert cache.plan_count == 1
    assert cache.plan(b, "lean", 2, lambda: fig.controls) is b_plan


def test_five_photos_evict_oldest_keypoints_and_their_plans() -> None:
    cache = PostureCache()
    fig = front_figure(lean=4)
    seen = 0

    def new_controls() -> object:
        nonlocal seen
        seen += 1
        return fig.controls

    for i in range(MAX_PHOTOS + 1):
        cache.plan(digest(str(i)), "lean", 2, new_controls)
    assert seen == MAX_PHOTOS + 1
    assert cache.plan_count == MAX_PHOTOS
    cache.plan(digest("0"), "lean", 2, new_controls)
    assert seen == MAX_PHOTOS + 2


def test_cached_bands_do_not_expose_shared_mutable_arrays() -> None:
    cache = PostureCache()
    fig = front_figure(lean=4)
    hash_one = digest("mutability")
    output = cache.band(hash_one, "lean", lambda: fig.person)
    original = output.copy()
    output[:20, :20] = 0
    next_mask = cache.band(hash_one, "lean", lambda: fig.person)
    assert np.array_equal(next_mask, original)
    assert not np.shares_memory(output, next_mask)
    assert not np.shares_memory(next_mask, fig.person)


@pytest.mark.parametrize("bad", ["", "B" * 64, "0" * 63, "photo.png"])
def test_invalidation_requires_a_valid_content_hash(bad: str) -> None:
    cache = PostureCache()
    with pytest.raises(ValueError, match="photo hash"):
        cache.invalidate_photo(bad)
