"""Reel-frame face lock: identical semantics to a pro face-region pixel edit."""

from __future__ import annotations

from plumb_api.pro import FaceIdentityGuard, GuardedEdit, guarded_rgba


def protect_reel_frame(
    before: bytes,
    rendered: bytes,
    width: int,
    height: int,
    face_mask: bytes,
    guard: FaceIdentityGuard | None = None,
    lock_level: float = 5.0,
) -> GuardedEdit:
    """Never export a declared edited face without an identity provider."""
    return guarded_rgba(before, rendered, width, height, face_mask, guard, lock_level)
