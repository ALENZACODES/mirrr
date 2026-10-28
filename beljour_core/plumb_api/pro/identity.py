"""Fail-closed face-edit identity hook, until Lane H exports its implementation.

The guard protocol is ASSUMED pending Lane H. Calling an edited-face entry
without a real guard raises; a pass-through double is ONLY for unit tests.
Never infer an identity similarity from photo colours, skin tone or pixels.
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Protocol

from .strength import DEFAULT_LOCK_LEVEL, validate_level

DEFAULT_SIMILARITY = 0.92  # ASSUMED; not a measured verification threshold.


class IdentityLockUnavailable(ValueError):
    """Do not produce an unguarded edit for a declared face region."""


@dataclass(frozen=True)
class GuardDecision:
    """Pixels recommended by the injected guard, plus its similarity reading."""

    pixels: bytes
    similarity: float


class FaceIdentityGuard(Protocol):
    def guard(self, before: bytes, after: bytes, lock_level: float) -> GuardDecision:
        ...


@dataclass(frozen=True)
class GuardedEdit:
    pixels: bytes
    similarity: float | None
    guarded: bool
    blended_back: bool
    lock_level: float


def _checked_image(image: bytes, width: int, height: int, label: str) -> None:
    if not isinstance(image, bytes) or len(image) != width * height * 4:
        raise ValueError(f"{label} must contain exactly RGBA pixels")
    if not 1 <= width <= 16_384 or not 1 <= height <= 16_384 or width * height > 12_000_000:
        raise ValueError("image exceeds local edit limits")


def guarded_rgba(
    before: bytes,
    after: bytes,
    width: int,
    height: int,
    face_region: Sequence[int] | None,
    guard: FaceIdentityGuard | None = None,
    lock_level: float = DEFAULT_LOCK_LEVEL,
    similarity_floor: float = DEFAULT_SIMILARITY,
) -> GuardedEdit:
    """Guard a face edit; unchanged non-face pixels and alpha are guaranteed.

    Without an explicit, *validated* face region this entry is not a face-edit
    verifier; non-face edits may return unguarded. For a declared face, no guard
    means refusal, never silently returning the altered image.
    """
    level = validate_level(lock_level)
    _checked_image(before, width, height, "before")
    _checked_image(after, width, height, "after")
    if face_region is None:
        return GuardedEdit(after, None, False, False, level)
    if len(face_region) != width * height:
        raise ValueError("face mask must have one coverage value per source pixel")
    if any(not isinstance(value, int) or not 0 <= value <= 255 for value in face_region):
        raise ValueError("face mask contains invalid coverage")
    if guard is None:
        raise IdentityLockUnavailable("identity lock is required for a face-region edit")
    if isinstance(similarity_floor, bool) or not isinstance(similarity_floor, (int, float)):
        raise ValueError("invalid identity threshold")
    if not math.isfinite(similarity_floor) or not 0 < similarity_floor <= 1:
        raise ValueError("identity threshold must be in (0, 1]")
    decision = guard.guard(before, after, level)
    _checked_image(decision.pixels, width, height, "identity guard output")
    if not isinstance(decision.similarity, (int, float)) or isinstance(decision.similarity, bool):
        raise ValueError("identity guard must return a real similarity")
    if not math.isfinite(decision.similarity) or not 0 <= decision.similarity <= 1:
        raise ValueError("identity guard similarity out of range")
    low_score = decision.similarity < similarity_floor
    # ASSUMED conservative fallback. At a strict level, 85% original is retained.
    # An explicitly lowered level gradually permits the provider's output.
    keep_edit = min(1.0, 0.15 + 0.85 * (5 - level) / 4) if low_score else 1.0
    chosen = decision.pixels
    result = bytearray(after)
    for pixel, coverage in enumerate(face_region):
        if coverage == 0:
            continue
        alpha = (coverage / 255) * keep_edit
        offset = pixel * 4
        if low_score:
            for channel in range(3):
                weighted = before[offset + channel] * (1 - alpha) + chosen[offset + channel] * alpha
                result[offset + channel] = round(weighted)
        else:
            for channel in range(3):
                result[offset + channel] = round(after[offset + channel] * (1 - coverage / 255)
                                                 + chosen[offset + channel] * (coverage / 255))
        result[offset + 3] = before[offset + 3]
    return GuardedEdit(bytes(result), float(decision.similarity), True, low_score, level)
