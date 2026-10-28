"""Python progressive preview contract mirrors browser output planning."""

from __future__ import annotations

import pytest

from plumb_api.pro.preview import ProgressivePreview, plan_resolution


def test_preview_width_limit_and_release_full_resolution() -> None:
    assert plan_resolution(3000, 4000, "drag") == (384, 512)
    assert plan_resolution(3000, 4000, "release") == (3000, 4000)
    assert plan_resolution(40, 30, "drag") == (40, 30)
    with pytest.raises(ValueError):
        plan_resolution(5000, 4000, "release")


def test_stale_preview_and_per_photo_token_replacement() -> None:
    planner = ProgressivePreview()
    first = planner.request("a" * 64, 1280, 720, 2.0, "drag")
    second = planner.request("a" * 64, 1280, 720, 3.0, "drag")
    assert not planner.is_current(first)
    assert planner.is_current(second)
    release = planner.request("a" * 64, 1280, 720, 3.0, "release")
    assert release.full_resolution
    planner.cancel()
    assert not planner.is_current(release)
    different = planner.request("b" * 64, 1280, 720, 3.0, "drag")
    assert planner.is_current(different)
