"""Memory-bounded computed-mask cache and slider preview orchestration.

Mask computation is photo-scoped, never level-scoped; changing one strength
reuses the one authorized mask. Render results are separately keyed by photo
SHA-256, edit, level and preview size. Photo bytes are never persisted.

Author: John Khan.
"""
from __future__ import annotations

import hashlib
from collections import OrderedDict
from collections.abc import Callable
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .identity import GuardedEditResult, IdentityGuard, guarded_edit
from .strength import StrengthMemory, checked_level

ByteFrame = NDArray[np.uint8]
MaskSupplier = Callable[[ByteFrame, str], NDArray[np.uint8]]
FrameRenderer = Callable[[ByteFrame, NDArray[np.uint8], float], ByteFrame]


@dataclass(frozen=True, slots=True)
class PreviewKey:
    photo_sha256: str
    edit: str
    level: float
    resolution: int
    lock_level: float


class WomenPreviewSession:
    """Per-photo ephemeral LRU: up to four masks and twelve guarded results."""

    def __init__(self, mask_supplier: MaskSupplier, *, guard: IdentityGuard | None = None) -> None:
        self._mask_supplier = mask_supplier
        self._guard = guard
        self._masks: OrderedDict[tuple[str, str], NDArray[np.uint8]] = OrderedDict()
        self._previews: OrderedDict[PreviewKey, GuardedEditResult] = OrderedDict()
        self.levels = StrengthMemory()
        self.mask_computations = 0

    @staticmethod
    def _photo_id(frame: ByteFrame) -> str:
        if frame.dtype != np.uint8 or frame.ndim != 3:
            raise ValueError("Preview requires an RGB or RGBA photo")
        shape = b"|".join(str(n).encode("ascii") for n in frame.shape)
        return hashlib.sha256(shape + b":" + frame.tobytes()).hexdigest()

    @staticmethod
    def _reduced(frame: ByteFrame, longest_side: int) -> ByteFrame:
        if longest_side <= 0 or longest_side > 8192:
            raise ValueError("Preview edge must be within 1..8192")
        h, w = frame.shape[:2]
        if max(h, w) <= longest_side:
            return frame.copy()
        scale = max(h, w) / longest_side
        rows = np.minimum(h - 1, np.floor(np.arange(max(1, round(h / scale))) * scale)).astype(np.intp)
        cols = np.minimum(w - 1, np.floor(np.arange(max(1, round(w / scale))) * scale)).astype(np.intp)
        return frame[np.ix_(rows, cols)].copy()

    def _mask(self, frame: ByteFrame, edit: str, digest: str) -> NDArray[np.uint8]:
        key = (digest, edit)
        if key in self._masks:
            self._masks.move_to_end(key)
            return self._masks[key].copy()
        value = self._mask_supplier(frame.copy(), edit)
        if not isinstance(value, np.ndarray) or value.dtype != np.uint8 or value.shape != frame.shape[:2]:
            raise ValueError("The mask supplier returned an invalid mask")
        self.mask_computations += 1
        self._masks[key] = value.copy()
        if len(self._masks) > 4:
            self._masks.popitem(last=False)
        return value.copy()

    def render(
        self,
        frame: ByteFrame,
        edit: str,
        renderer: FrameRenderer,
        *,
        level: object | None = None,
        lock_level: object = 5.0,
        preview_edge: int | None = 256,
    ) -> GuardedEditResult:
        if not edit or len(edit) > 64:
            raise ValueError("A named effect is required")
        selection = self.levels.select(edit, level)
        lock = checked_level(lock_level)
        source = frame.copy()
        digest = self._photo_id(source)
        resolution = 0 if preview_edge is None else preview_edge
        key = PreviewKey(digest, edit, selection.level, resolution, lock)
        if key in self._previews:
            self._previews.move_to_end(key)
            prior = self._previews[key]
            return GuardedEditResult(prior.pixels.copy(), prior.similarity, prior.blended,
                                     prior.level, prior.lock_level, prior.still_her_score)
        mask = self._mask(source, edit, digest)
        working = source if preview_edge is None else self._reduced(source, preview_edge)
        if preview_edge is None:
            region = mask
        else:
            # Reuse the exact same nearest-neighbour coordinate map for mask and image.
            region = self._reduced(mask[..., None], preview_edge)[..., 0]
        outcome = guarded_edit(working, region, renderer, level=selection.level,
                               lock_level=lock, guard=self._guard)
        self._previews[key] = outcome
        if len(self._previews) > 12:
            self._previews.popitem(last=False)
        return GuardedEditResult(outcome.pixels.copy(), outcome.similarity, outcome.blended,
                                 outcome.level, outcome.lock_level, outcome.still_her_score)

    def invalidate_mask(self, frame: ByteFrame, edit: str) -> None:
        """Discard an annotated region and all renders made with that region.

        Call after a brush correction, mask replacement, or segmentation update;
        unchanged photo bytes do not imply that the annotation is unchanged.
        Strength preferences are intentionally preserved.
        """
        if not edit or len(edit) > 64:
            raise ValueError("A named effect is required")
        digest = self._photo_id(frame)
        self._masks.pop((digest, edit), None)
        for key in tuple(self._previews):
            if key.photo_sha256 == digest and key.edit == edit:
                del self._previews[key]

    def invalidate_edit(self, edit: str) -> None:
        """Invalidate one edit after its render recipe or renderer changes.

        Other effects keep their masks and renders. The last strength remains
        selected, so a local preference is not lost when a recipe is updated.
        """
        if not edit or len(edit) > 64:
            raise ValueError("A named effect is required")
        for key in tuple(self._masks):
            if key[1] == edit:
                del self._masks[key]
        for preview_key in tuple(self._previews):
            if preview_key.edit == edit:
                del self._previews[preview_key]

    def invalidate_photo(self, frame: ByteFrame) -> None:
        """Drop all cached masks and previews for a replaced source photo.

        This only clears the specified photo; other photo sessions remain
        independent. Use ``release`` to erase the whole session, including
        the remembered strength preferences.
        """
        digest = self._photo_id(frame)
        for key in tuple(self._masks):
            if key[0] == digest:
                del self._masks[key]
        for preview_key in tuple(self._previews):
            if preview_key.photo_sha256 == digest:
                del self._previews[preview_key]

    def release(self) -> None:
        self._masks.clear()
        self._previews.clear()
        self.levels.clear()
