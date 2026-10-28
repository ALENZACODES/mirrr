"""Required default face-lock regressions on generated RGBA rectangles."""

from __future__ import annotations

from dataclasses import dataclass

import pytest

from plumb_api.pro import GuardDecision, IdentityLockUnavailable, guarded_rgba
from plumb_api.video import protect_reel_frame


@dataclass
class FakeGuard:
    similarity: float = 0.2
    calls: int = 0
    levels: tuple[float, ...] = ()

    def guard(self, before: bytes, after: bytes, lock_level: float) -> GuardDecision:
        self.calls += 1
        self.levels += (lock_level,)
        return GuardDecision(after, self.similarity)


def _buffers() -> tuple[bytes, bytes, bytes]:
    before = bytes([20, 40, 60, 88] * 4)
    after = bytes([220, 240, 255, 88] * 4)
    region = bytes([255, 0, 255, 0])
    return before, after, region


def test_default_face_lock_never_skips_guard() -> None:
    before, after, region = _buffers()
    with pytest.raises(IdentityLockUnavailable):
        guarded_rgba(before, after, 4, 1, region)
    double = FakeGuard()
    result = guarded_rgba(before, after, 4, 1, region, double)
    assert double.calls == 1
    assert double.levels == (5.0,)
    assert result.guarded and result.blended_back
    assert result.similarity == 0.2
    assert before[0] < result.pixels[0] < after[0]
    assert result.pixels[4:8] == after[4:8]
    assert result.pixels[3::4] == before[3::4]


def test_explicit_lower_lock_changes_fallback_only_after_validation() -> None:
    before, after, region = _buffers()
    double = FakeGuard()
    strict = guarded_rgba(before, after, 4, 1, region, double)
    loosened = guarded_rgba(before, after, 4, 1, region, double, lock_level=1.0)
    assert loosened.pixels[0] == after[0]
    assert strict.pixels[0] < loosened.pixels[0]
    assert double.levels == (5.0, 1.0)
    with pytest.raises(ValueError):
        guarded_rgba(before, after, 4, 1, region, double, lock_level=5.05)
    assert double.calls == 2


def test_valid_guard_decision_uses_approved_frame_inside_region() -> None:
    before, after, region = _buffers()
    guard = FakeGuard(similarity=0.97)
    result = guarded_rgba(before, after, 4, 1, region, guard)
    assert result.pixels == after
    assert not result.blended_back


def test_bad_guard_result_rejected_without_emitting_image() -> None:
    before, after, region = _buffers()
    for similarity in (-1.0, float("nan"), 1.001, float("inf")):
        with pytest.raises(ValueError):
            guarded_rgba(before, after, 4, 1, region, FakeGuard(similarity=similarity))
    with pytest.raises(ValueError):
        guarded_rgba(before, after, 4, 1, region[:-1], FakeGuard())


def test_reel_frame_uses_same_default_and_rejects_missing_guard() -> None:
    before, after, region = _buffers()
    with pytest.raises(IdentityLockUnavailable):
        protect_reel_frame(before, after, 4, 1, region)
    double = FakeGuard()
    result = protect_reel_frame(before, after, 4, 1, region, double)
    assert double.levels == (5.0,)
    assert result.pixels[0] < after[0]
