"""R26E preview budget: bounded drag previews, full release and plan reuse.

Timing here is a coarse CPU smoke bound, not a device latency measurement.
Author: John Khan.
"""
from __future__ import annotations

import statistics
import time

import pytest

from plumb_api.engines.posture.levels import level_plan
from plumb_api.engines.posture.session import PREVIEW_MAX_EDGE, PostureCache, preview_size
from plumb_api.engines.posture.synthetic import front_figure

HASH = "7" * 64


@pytest.mark.parametrize(("width", "height"), [(1000, 1000), (1024, 768), (768, 1365), (4000, 3000)])
def test_drag_preview_never_exceeds_512_px(width: int, height: int) -> None:
    drag = preview_size(width, height, released=False)
    assert max(drag.width, drag.height) <= PREVIEW_MAX_EDGE
    assert drag.width * drag.height <= PREVIEW_MAX_EDGE * PREVIEW_MAX_EDGE
    assert not drag.full_resolution
    release = preview_size(width, height, released=True)
    assert (release.width, release.height, release.scale) == (width, height, 1.0)


def test_small_photos_are_never_upscaled_for_preview() -> None:
    small = preview_size(320, 480, released=False)
    assert (small.width, small.height, small.scale) == (320, 480, 1.0)


def test_one_megapixel_drag_preview_is_a_quarter_megapixel_at_most() -> None:
    drag = preview_size(1000, 1000, released=False)
    assert drag.width * drag.height == 512 * 512


def test_slider_drag_reuses_controls_and_bounds_plans() -> None:
    figure = front_figure(lean=4)
    cache = PostureCache()
    calls = 0

    def factory():  # type: ignore[no-untyped-def]
        nonlocal calls
        calls += 1
        return figure.controls

    for tick in range(10, 51):
        cache.plan(HASH, "lean", tick / 10, factory)
    assert calls == 1
    assert cache.plan_count <= 40


def test_plan_only_step_is_far_below_one_frame() -> None:
    figure = front_figure(lean=4)
    samples = []
    for _ in range(9):
        start = time.perf_counter()
        level_plan(figure.controls, "lean", 3.7)
        samples.append(time.perf_counter() - start)
    assert statistics.median(samples) < 0.016
