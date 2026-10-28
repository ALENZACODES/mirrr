"""Explicit-mask protected posture render: the marked head is restored byte for byte.

`render_protected` refuses to run without a valid caller-supplied head mask. It
copies the source, runs the existing default-on identity guard for face-adjacent
fixes, and then copies every head-mask pixel back from the source, even when the
user has lowered the similarity floor. The mask is the user's own marking; this
module does not detect heads or verify identity. Photo simulation only, not
medical advice. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .catalogue import SIMULATION_LABEL
from .fixes import PosturePlan
from .identity import DEFAULT_LOCK_LEVEL, FaceIdentityGuard, GuardedPostureResult, guarded_render
from .levels import DEFAULT_LEVEL, checked_level, level_plan
from .points import Controls

U8 = NDArray[np.uint8]
BoolMask = NDArray[np.bool_]
MAX_PIXELS = 12_000_000
# ASSUMED: a head marking above a quarter of the frame is not a head in a
# full-body photo, so it is refused rather than freezing most of the image.
MAX_HEAD_SHARE = 0.25
MASK_LEVEL = 0.5


class ProtectedRenderRefused(ValueError):
    """A refusal with a stable public code; no pixel data in the message."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class ProtectedPostureResult:
    image: U8
    guarded: GuardedPostureResult
    plan: PosturePlan
    level: float
    head_pixels: int
    head_pixels_restored: int
    label: str = SIMULATION_LABEL

    @property
    def lock_level(self) -> float:
        return self.guarded.lock_level


def checked_source(source: object) -> U8:
    if not isinstance(source, np.ndarray) or source.dtype != np.uint8 or source.ndim != 3:
        raise ProtectedRenderRefused("invalid_source_image")
    height, width, channels = source.shape
    if channels not in (3, 4) or not (8 <= width <= 16384 and 8 <= height <= 16384):
        raise ProtectedRenderRefused("invalid_source_image")
    if width * height > MAX_PIXELS:
        raise ProtectedRenderRefused("source_image_too_large")
    return source


def checked_head_mask(head: object, shape: tuple[int, int]) -> BoolMask:
    """A finite 0..1 mask of the photo's size, non-empty and not oversized."""
    if head is None:
        raise ProtectedRenderRefused("head_mask_required")
    if not isinstance(head, np.ndarray) or head.shape != shape:
        raise ProtectedRenderRefused("invalid_head_mask")
    values = head.astype(np.float32) if head.dtype == np.bool_ else head
    if not np.issubdtype(values.dtype, np.floating) or not np.all(np.isfinite(values)):
        raise ProtectedRenderRefused("invalid_head_mask")
    if values.min() < 0.0 or values.max() > 1.0:
        raise ProtectedRenderRefused("invalid_head_mask")
    covered = np.asarray(values >= MASK_LEVEL)
    count = int(covered.sum())
    if count == 0:
        raise ProtectedRenderRefused("empty_head_mask")
    if count > MAX_HEAD_SHARE * covered.size:
        raise ProtectedRenderRefused("oversized_head_mask")
    return covered


def render_protected(
    source: object,
    person_mask: NDArray[np.float32],
    head_mask: object,
    controls: Controls,
    fix: str,
    level: float = DEFAULT_LEVEL,
    *,
    guard: FaceIdentityGuard | None = None,
    lock_level: float = DEFAULT_LOCK_LEVEL,
) -> ProtectedPostureResult:
    """Render one fix and restore the marked head from an untouched source copy."""
    image = checked_source(source)
    original = image.copy()
    head = checked_head_mask(head_mask, (image.shape[0], image.shape[1]))
    value = checked_level(level)
    guarded = guarded_render(
        original.copy(), person_mask, controls, fix, value, guard=guard, lock_level=lock_level,
    )
    output = guarded.image.copy()
    differs = np.any(output[head] != original[head], axis=-1)
    output[head] = original[head]
    return ProtectedPostureResult(
        output, guarded, level_plan(controls, fix, value), value,
        int(head.sum()), int(differs.sum()),
    )
