"""Full-frame pro and reel hooks agree, including no-guard refusal."""

from __future__ import annotations

import pytest

from plumb_api.pro import GuardDecision, IdentityLockUnavailable, guarded_rgba
from plumb_api.video import protect_reel_frame


class FakeGuard:
    def guard(self, before: bytes, after: bytes, lock_level: float) -> GuardDecision:
        return GuardDecision(after, 0.5)


def test_reel_frame_matches_pro_face_lock_reference() -> None:
    before = bytes([30, 20, 10, 250] * 8)
    after = bytes([180, 190, 200, 250] * 8)
    mask = bytes([0, 255, 128, 0, 255, 255, 0, 0])
    pro = guarded_rgba(before, after, 4, 2, mask, FakeGuard())
    reel = protect_reel_frame(before, after, 4, 2, mask, FakeGuard())
    assert reel == pro
    with pytest.raises(IdentityLockUnavailable):
        protect_reel_frame(before, after, 4, 2, mask)
