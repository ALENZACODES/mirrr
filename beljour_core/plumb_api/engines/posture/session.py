"""Bounded photo-specific posture plan/band cache and preview sizing.

Images themselves are never persisted in the cache. The source hash is supplied
by the caller, never inferred from an approximate body mask.
Author: John Khan.
"""
from __future__ import annotations

import re
from collections import OrderedDict
from collections.abc import Callable
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .fixes import PosturePlan
from .levels import checked_level, level_plan
from .points import Controls
from .render import body_band

SHA256_RE = re.compile(r"[0-9a-f]{64}\Z")
MAX_PHOTOS = 4
MAX_PLANS = 40
PREVIEW_MAX_EDGE = 512
F32 = NDArray[np.float32]


@dataclass(frozen=True)
class PreviewSize:
    width: int
    height: int
    scale: float
    full_resolution: bool


def preview_size(width: int, height: int, *, released: bool) -> PreviewSize:
    if not (8 <= width <= 16384 and 8 <= height <= 16384):
        raise ValueError("invalid photo dimensions")
    scale = 1.0 if released else min(1.0, PREVIEW_MAX_EDGE / max(width, height))
    return PreviewSize(max(1, round(width * scale)), max(1, round(height * scale)), scale, released)


class PostureCache:
    """Caches confirmed keypoints and a band per photo, while varying the edit level.

    Plans are bounded by count; stored masks are arrays with an explicit byte cap.
    A cache does not authorize reusing points on an unrelated image.
    """

    def __init__(self, max_band_bytes: int = 32 * 1024 * 1024) -> None:
        if max_band_bytes < 1024:
            raise ValueError("cache budget is too small")
        self.max_band_bytes = max_band_bytes
        self._controls: OrderedDict[str, Controls] = OrderedDict()
        self._plans: OrderedDict[tuple[str, str, float], PosturePlan] = OrderedDict()
        self._bands: OrderedDict[tuple[str, str], F32] = OrderedDict()
        self._band_bytes = 0

    @staticmethod
    def _check_hash(photo_hash: str) -> None:
        if not SHA256_RE.fullmatch(photo_hash):
            raise ValueError("photo hash must be 64 lowercase hexadecimal characters")

    def controls(self, photo_hash: str, factory: Callable[[], Controls]) -> Controls:
        self._check_hash(photo_hash)
        found = self._controls.get(photo_hash)
        if found is not None:
            self._controls.move_to_end(photo_hash)
            return found
        new = factory()
        if not isinstance(new, Controls):
            raise ValueError("keypoint factory must return validated Controls")
        self._controls[photo_hash] = new
        if len(self._controls) > MAX_PHOTOS:
            evicted, _ = self._controls.popitem(last=False)
            self._drop_photo(evicted)
        return new

    def _drop_photo(self, photo_hash: str) -> None:
        for key in tuple(self._plans):
            if key[0] == photo_hash:
                del self._plans[key]
        for band_key in tuple(self._bands):
            if band_key[0] == photo_hash:
                self._band_bytes -= self._bands.pop(band_key).nbytes

    def plan(self, photo_hash: str, fix: str, level: float, factory: Callable[[], Controls]) -> PosturePlan:
        value = checked_level(level)
        controls = self.controls(photo_hash, factory)
        key = (photo_hash, fix, value)
        found = self._plans.get(key)
        if found is not None:
            self._plans.move_to_end(key)
            return found
        planned = level_plan(controls, fix, value)
        self._plans[key] = planned
        if len(self._plans) > MAX_PLANS:
            self._plans.popitem(last=False)
        return planned

    def band(self, photo_hash: str, fix: str, person_factory: Callable[[], F32]) -> F32:
        self._check_hash(photo_hash)
        key = (photo_hash, fix)
        stored = self._bands.get(key)
        if stored is not None:
            self._bands.move_to_end(key)
            return stored.copy()
        person = person_factory()
        generated, _ = body_band(person)
        generated = np.asarray(generated, dtype=np.float32)
        if generated.nbytes > self.max_band_bytes:
            raise ValueError("body band exceeds the memory budget")
        while self._band_bytes + generated.nbytes > self.max_band_bytes and self._bands:
            _, old = self._bands.popitem(last=False)
            self._band_bytes -= old.nbytes
        generated.setflags(write=False)
        self._bands[key] = generated
        self._band_bytes += generated.nbytes
        return generated.copy()

    def invalidate_photo(self, photo_hash: str) -> None:
        """Call after manual point edits, changed crops, or an explicit photo delete."""
        self._check_hash(photo_hash)
        self._controls.pop(photo_hash, None)
        self._drop_photo(photo_hash)

    def clear(self) -> None:
        self._controls.clear()
        self._plans.clear()
        self._bands.clear()
        self._band_bytes = 0

    @property
    def band_bytes(self) -> int:
        return self._band_bytes

    @property
    def plan_count(self) -> int:
        return len(self._plans)
