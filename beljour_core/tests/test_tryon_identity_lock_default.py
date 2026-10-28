"""Every local/provider commerce result passes a default identity guard.

Synthetic flat colour images only. The pixel guard is a conservative interim
proxy, not a biometric recognizer or an accuracy claim.
"""
from __future__ import annotations

import asyncio
import io
from types import SimpleNamespace
from unittest.mock import AsyncMock

import numpy as np
import pytest
from PIL import Image

from plumb_api.commerce.identity import GuardDecision, PixelGuard, apply_guard, guard_public_preview
from plumb_api.commerce.service import CommerceService
from plumb_api.commerce.strength import DEFAULT_LOCK


def image(rgb: tuple[int, int, int]) -> bytes:
    pixels = np.empty((64, 64, 3), dtype=np.uint8)
    pixels[:] = rgb
    output = io.BytesIO()
    Image.fromarray(pixels, "RGB").save(output, format="PNG")
    return output.getvalue()


class RecordingGuard:
    def __init__(self) -> None:
        self.calls: list[float] = []

    def guard(self, before: bytes, after: bytes, lock_level: float) -> GuardDecision:
        self.calls.append(lock_level)
        assert before and after
        return GuardDecision(after, 0.995, False, lock_level, "mock_guard", "kept")


def fake_state() -> SimpleNamespace:
    state = SimpleNamespace()
    state.settings = SimpleNamespace(live=False, youcam_styling=False, kill_switch=True, youcam_skin=False)
    state.gateway = SimpleNamespace(run=AsyncMock(side_effect=AssertionError("provider must remain off")))
    state.skin_match = None
    state.ref = lambda photo: photo
    return state


def test_default_tryon_always_invokes_typed_guard() -> None:
    asyncio.run(_default_tryon_always_invokes_typed_guard())


async def _default_tryon_always_invokes_typed_guard() -> None:
    state = fake_state()
    guard = RecordingGuard()
    photo = SimpleNamespace(data=image((100, 82, 70)), sha="a" * 64)
    result = await CommerceService(state).try_on(photo, "quiet-veil-09-warm", local_only=True,
                                                 strength=50, guard=guard)
    assert guard.calls == [DEFAULT_LOCK]
    assert result["identity_guard"]["applied"] is True
    assert result["identity_guard"]["engine"] == "mock_guard"
    assert result["source"] == "local"
    assert result["provider_calls"] == 0
    assert state.gateway.run.await_count == 0


def test_strict_pixel_guard_blends_when_threshold_is_exceeded() -> None:
    before = image((100, 100, 100))
    after = image((120, 120, 120))
    strict = PixelGuard().guard(before, after)
    lowered = PixelGuard().guard(before, after, 1.0)
    assert strict.lock_level == 5.0
    assert strict.similarity >= 0.985
    assert strict.blended
    assert lowered.blended is False
    assert lowered.image == after
    assert lowered.similarity < strict.similarity


def test_guard_never_silently_accepts_a_bad_verdict() -> None:
    before = image((100, 100, 100))
    with pytest.raises(ValueError, match="invalid similarity"):
        apply_guard(before, before, guard=BadGuard())
    with pytest.raises(ValueError, match="supported"):
        guard_public_preview(before, {"image": "https://example.invalid/x.png"})


class BadGuard:
    def guard(self, before: bytes, after: bytes, lock_level: float) -> GuardDecision:
        return GuardDecision(after, float("nan"), False, lock_level, "mock_guard", "kept")


def test_missing_guard_defaults_to_nontrivial_protection() -> None:
    before = image((100, 100, 100))
    after = image((245, 245, 245))
    receipt = apply_guard(before, after)
    assert receipt.engine == "pixel_proxy"
    assert receipt.blended is True
    assert receipt.similarity >= 0.985
    with Image.open(io.BytesIO(receipt.image)) as checked:
        assert checked.size == (64, 64)
