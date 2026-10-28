"""Mandatory, conservative identity boundary for local women's screen edits.

This is an ASSUMED Lane H adapter shape, not biometric recognition. The
identity engine is not yet on the integration base. Every edit invokes the
``IdentityGuard`` protocol even at strength 1.0; the local implementation
reduces large per-pixel changes without guessing who is in a photograph.
Integration should switch to Lane H's public guard after that contract lands.

Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol

import numpy as np
from numpy.typing import NDArray

from .strength import DEFAULT_LEVEL, checked_level, opacity_for_level

ByteFrame = NDArray[np.uint8]


@dataclass(frozen=True, slots=True)
class GuardDecision:
    pixels: ByteFrame
    similarity: float
    blended: bool
    source: str = "conservative-local-proxy"


class IdentityGuard(Protocol):
    def guard(self, before: ByteFrame, after: ByteFrame, lock_level: float) -> GuardDecision:
        """Return bounded pixels and a similarity proxy; never mutate inputs."""
        ...


class ConservativeGuard:
    """Default non-biometric pixel guard, fail-closed on malformed output.

    At lock 5.0, mean RGB change is limited to 9 levels; at lock 1.0,
    36 levels. These limits are ASSUMED engineering defaults, not evidence
    that a face's identity is preserved. Lower lock levels require an explicit
    caller choice. Geometry, masks, pixels outside supplied regions and alpha
    have separate invariant checks in ``guarded_edit``.
    """

    def guard(self, before: ByteFrame, after: ByteFrame, lock_level: float) -> GuardDecision:
        level = checked_level(lock_level)
        if before.dtype != np.uint8 or after.dtype != np.uint8 or before.shape != after.shape:
            raise ValueError("Identity guard needs equal uint8 frames")
        if before.ndim != 3 or before.shape[2] not in (3, 4):
            raise ValueError("Identity guard needs RGB or RGBA pixels")
        old = before[..., :3].astype(np.float64)
        desired = after[..., :3].astype(np.float64)
        difference = desired - old
        measured = float(np.mean(np.abs(difference)))
        allowance = 9.0 + (5.0 - level) * 6.75
        ratio = min(1.0, allowance / measured) if measured > 0 else 1.0
        pixels = before.copy()
        pixels[..., :3] = np.floor(np.clip(old + difference * ratio, 0, 255) + 0.5).astype(np.uint8)
        residual = float(np.mean(np.abs(pixels[..., :3].astype(np.float64) - old)))
        similarity = max(0.0, 1.0 - residual / 255.0)
        return GuardDecision(pixels, similarity, ratio < 1.0)


def _checked_frame_and_mask(frame: ByteFrame, mask: NDArray[np.uint8]) -> None:
    if not isinstance(frame, np.ndarray) or frame.ndim != 3 or frame.dtype != np.uint8:
        raise ValueError("Edit input must be an RGB or RGBA uint8 frame")
    if frame.shape[2] not in (3, 4) or not frame.size or max(frame.shape[:2]) > 8192:
        raise ValueError("Unsupported edit dimensions")
    if frame.shape[0] * frame.shape[1] > 16_000_000:
        raise ValueError("Edit pixel budget exceeded")
    if not isinstance(mask, np.ndarray) or mask.dtype != np.uint8 or mask.shape != frame.shape[:2]:
        raise ValueError("A same-size uint8 explicit mask is required")
    if not bool(np.any(mask)):
        raise ValueError("An empty mask cannot authorize a cosmetic edit")


@dataclass(frozen=True, slots=True)
class GuardedEditResult:
    pixels: ByteFrame
    similarity: float
    blended: bool
    level: float
    lock_level: float
    still_her_score: int
    disclosure: str = "Screen simulation, identity guard applied; not identity verification."


def guarded_edit(
    frame: ByteFrame,
    mask: NDArray[np.uint8],
    render: Callable[[ByteFrame, NDArray[np.uint8], float], ByteFrame],
    *,
    level: object = DEFAULT_LEVEL,
    lock_level: object = 5.0,
    guard: IdentityGuard | None = None,
) -> GuardedEditResult:
    """Require the guard on *every* call and reject unauthorized edits afterward.

    A weaker lock level is never inferred from the selected preview strength.
    The explicit caller can lower it from 5.0, independently of the effect.
    """
    _checked_frame_and_mask(frame, mask)
    selected = checked_level(level)
    lock = checked_level(lock_level)
    before = frame.copy()
    original_mask = mask.copy()
    candidate = render(before.copy(), mask.copy(), opacity_for_level(selected))
    if not isinstance(candidate, np.ndarray) or candidate.dtype != np.uint8 or candidate.shape != frame.shape:
        raise ValueError("Renderer returned an invalid pixel buffer")
    actual_guard = ConservativeGuard() if guard is None else guard
    decision = actual_guard.guard(before.copy(), candidate.copy(), lock)
    out = decision.pixels
    if not isinstance(out, np.ndarray) or out.dtype != np.uint8 or out.shape != frame.shape:
        raise ValueError("Identity guard returned an invalid buffer")
    if not 0 <= decision.similarity <= 1:
        raise ValueError("Identity guard similarity proxy must be in 0..1")
    if frame.shape[2] == 4 and bool(np.any(out[..., 3] != frame[..., 3])):
        raise ValueError("Identity guard must preserve alpha")
    if bool(np.any(out[mask == 0] != frame[mask == 0])):
        raise ValueError("Identity guard must not change outside the edit mask")
    if not np.array_equal(original_mask, mask) or not np.array_equal(before, frame):
        raise ValueError("An edit or guard mutated source data")
    preserved = int(np.count_nonzero(out[mask == 0] != frame[mask == 0])) == 0
    return GuardedEditResult(
        out.copy(), decision.similarity, decision.blended,
        selected, lock, 100 if preserved else 0,
    )
