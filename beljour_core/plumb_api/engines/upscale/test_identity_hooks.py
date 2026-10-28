"""Upscale orchestration hook tests on drawn four-pixel buffers."""

from __future__ import annotations

import pytest

from plumb_api.engines.upscale.identity_hooks import upscale_face_detail
from plumb_api.pro import GuardDecision


class FakeIdentityGuard:
    def __init__(self) -> None:
        self.levels: list[float] = []

    def guard(self, before: bytes, after: bytes, lock_level: float) -> GuardDecision:
        self.levels.append(lock_level)
        return GuardDecision(after, 0.2)


def test_upscale_detail_keeps_lock_high_and_converts_scale() -> None:
    source = bytes([10, 20, 30, 255] * 4)
    face = bytes([255, 255, 0, 0])
    renderer_amounts: list[float] = []

    def render(data: bytes, amount: float) -> bytes:
        renderer_amounts.append(amount)
        return bytes([200, 220, 240, 255] * 4)

    double = FakeIdentityGuard()
    result = upscale_face_detail(source, 4, 1, face, render, double, detail_level=3.0)
    assert renderer_amounts == [0.5]
    assert double.levels == [5.0]
    assert result.pixels[0] < 200
    assert result.pixels[8:] == bytes([200, 220, 240, 255] * 2)


def test_upscale_missing_guard_fails_before_renderer_runs() -> None:
    called = False

    def render(data: bytes, amount: float) -> bytes:
        nonlocal called
        called = True
        return data

    source = bytes([0, 0, 0, 255])
    with pytest.raises(ValueError):
        upscale_face_detail(source, 1, 1, b"\xff", render)
    assert not called
