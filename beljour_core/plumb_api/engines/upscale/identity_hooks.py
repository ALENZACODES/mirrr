"""Additive, fail-closed hook for existing upscale face-detail renderers.

The R18B upscale implementation is independently owned and not modified here.
Clients must explicitly route face-detail results through this hook, which
requires a Lane H-compatible identity provider before it accepts an edit.
"""

from __future__ import annotations

from collections.abc import Callable

from plumb_api.pro import FaceIdentityGuard, GuardedEdit, guarded_rgba, legacy_amount, validate_level


# The requested 1..5 scale maps onto the renderer's original 0..100 amount.
# A numerical level never switches off identity protection.
def upscale_face_detail(
    before: bytes,
    width: int,
    height: int,
    face_mask: bytes,
    renderer: Callable[[bytes, float], bytes],
    guard: FaceIdentityGuard | None = None,
    detail_level: float = 3.0,
    lock_level: float = 5.0,
) -> GuardedEdit:
    checked_detail = validate_level(detail_level)
    if len(face_mask) != width * height:
        raise ValueError("face mask must match upscale input")
    # Refuse missing guards *before* the expensive renderer is called.
    if guard is None:
        raise ValueError("identity lock is required for upscale face detail")
    pixels = renderer(before, legacy_amount(checked_detail))
    return guarded_rgba(before, pixels, width, height, face_mask, guard, lock_level)
