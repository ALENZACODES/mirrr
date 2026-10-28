"""Women-first presentation levels and guarded local preview. Author: John Khan.

ASSUMED anchors: 1.0 is neutral, 2.0 normal, 3.5 extra, 5.0 hyper.
These levels scale presentation signals; they do not estimate gender identity.
A lock checks pixel displacement, NOT biometric identity. Lane H may replace it.
"""

from __future__ import annotations

import hashlib
import math
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Literal, Protocol

import numpy as np
from numpy.typing import NDArray

from .engine import render as legacy_render
from .presets import PRESETS, SignalPreset

ByteImage = NDArray[np.uint8]
FloatMask = NDArray[np.float64]
Direction = Literal["feminine", "masculine"]

ANCHORS: tuple[tuple[float, str], ...] = ((1.0, "neutral"), (2.0, "normal"), (3.5, "extra"), (5.0, "hyper"))
DEFAULT_LOCK_LEVEL = 5.0


def checked_level(value: object) -> float:
    """Require exactly an integer number of tenths in the range [1.0, 5.0]."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("level must be a decimal number")
    number = float(value)
    if not math.isfinite(number) or number < 1.0 or number > 5.0:
        raise ValueError("level must be 1.0..5.0")
    tick = round(number * 10)
    if abs(number * 10 - tick) > 1e-8:
        raise ValueError("level must use 0.1 steps")
    return tick / 10


def checked_direction(value: object) -> Direction:
    if value == "feminine":
        return "feminine"
    if value == "masculine":
        return "masculine"
    raise ValueError("direction must be feminine or masculine")


def named_level(name: str) -> float:
    """Map historical presets without changing their original render contract."""
    anchors = {"normal": 2.0, "extra": 3.5, "hyper": 5.0}
    if name not in anchors:
        raise ValueError("unknown named level")
    return anchors[name]


def signal_at(level: float) -> SignalPreset:
    """Interpolate every SignalPreset field; geometry remains pinned at zero."""
    value = checked_level(level)
    zero = SignalPreset("neutral", 0.0, 0.0, 0.0, 0.0, 0.0)
    rows = ((1.0, zero), (2.0, PRESETS["normal"]), (3.5, PRESETS["extra"]), (5.0, PRESETS["hyper"]))
    for (left, first), (right, last) in zip(rows[:-1], rows[1:], strict=True):
        if left <= value <= right:
            weight = (value - left) / (right - left)
            return SignalPreset(
                level=first.level if value == left else last.level if value == right else f"{value:.1f}",
                brow_tint=first.brow_tint + (last.brow_tint - first.brow_tint) * weight,
                brow_density=first.brow_density + (last.brow_density - first.brow_density) * weight,
                skin_texture=first.skin_texture + (last.skin_texture - first.skin_texture) * weight,
                stubble_signal=first.stubble_signal + (last.stubble_signal - first.stubble_signal) * weight,
                geometry_change=0.0,
            )
    raise AssertionError("validated level outside anchors")


@dataclass(frozen=True)
class GuardDecision:
    image: ByteImage
    similarity: float
    blended_back: bool


class IdentityGuard(Protocol):
    def guard(self, before: ByteImage, after: ByteImage, lock_level: float) -> GuardDecision: ...


class MaskProvider(Protocol):
    def masks(self, photo_hash: str, photo: ByteImage) -> Mapping[str, FloatMask]: ...


class PixelChangeGuard:
    """Non-biometric fallback; constrains mean RGB change until Lane H lands."""

    def guard(self, before: ByteImage, after: ByteImage, lock_level: float) -> GuardDecision:
        strength = checked_level(lock_level)
        delta = float(np.mean(np.abs(before[..., :3].astype(np.float64) - after[..., :3].astype(np.float64))))
        similarity = 1.0 - delta / 255.0
        limit = 0.0015 + 0.0185 * (5.0 - strength) / 4.0
        if similarity >= 1.0 - limit or delta == 0.0:
            return GuardDecision(after.copy(), similarity, False)
        ratio = limit * 255.0 / delta
        blended = before.copy()
        diff = after[..., :3].astype(np.float64) - before[..., :3].astype(np.float64)
        blended[..., :3] = np.clip(np.trunc(before[..., :3] + diff * ratio), 0, 255).astype(np.uint8)
        return GuardDecision(blended, similarity, True)


@dataclass(frozen=True)
class GenderLevelResult:
    image: ByteImage
    direction: Direction
    level: float
    status: Literal["rendered", "no_mesh"]
    changed_share: float
    guard_called: bool
    similarity: float | None
    blended_back: bool
    simulation: bool = True


def _validated_box(box: tuple[float, float, float, float] | None) -> tuple[float, float, float, float] | None:
    if box is None:
        return None
    if len(box) != 4 or not all(isinstance(v, (int, float)) and math.isfinite(float(v)) for v in box):
        raise ValueError("primary face box must have four finite coordinates")
    left, top, right, bottom = (float(v) for v in box)
    if not (0 <= left < right <= 1 and 0 <= top < bottom <= 1):
        raise ValueError("invalid primary face box")
    return left, top, right, bottom


def _primary_mask(shape: tuple[int, int], box: tuple[float, float, float, float]) -> FloatMask:
    height, width = shape
    left, top, right, bottom = box
    yy, xx = np.ogrid[:height, :width]
    inside = (xx >= left * width) & (xx < right * width)
    inside = inside & (yy >= top * height) & (yy < bottom * height)
    return inside.astype(np.float64)


def _interpolate_bytes(before: ByteImage, after: ByteImage, weight: float) -> ByteImage:
    result = before.copy()
    rgb = before[..., :3].astype(np.float64)
    diff = after[..., :3].astype(np.float64) - rgb
    result[..., :3] = np.clip(np.trunc(rgb + diff * weight), 0, 255).astype(np.uint8)
    return result


class GenderLevelEngine:
    """Caches observed regions once per photo, raw level output per photo/direction/level."""

    def __init__(self, provider: MaskProvider, guard: IdentityGuard | None = None) -> None:
        self._provider = provider
        self._guard = guard if guard is not None else PixelChangeGuard()
        self._masks: dict[str, Mapping[str, FloatMask]] = {}
        self._candidates: dict[tuple[str, Direction, float, tuple[float, float, float, float]], ByteImage] = {}
        self.mask_computations = 0

    def invalidate(self, photo_hash: str | None = None) -> None:
        if photo_hash is None:
            self._masks.clear()
            self._candidates.clear()
            return
        self._masks.pop(photo_hash, None)
        self._candidates = {key: value for key, value in self._candidates.items() if key[0] != photo_hash}

    def _observed_masks(self, digest: str, image: ByteImage) -> Mapping[str, FloatMask]:
        existing = self._masks.get(digest)
        if existing is not None:
            return existing
        proposed = self._provider.masks(digest, image)
        required = ("brow", "skin")
        if any(name not in proposed for name in required):
            raise ValueError("required mask absent")
        masks: dict[str, FloatMask] = {}
        for name in ("brow", "skin", "stubble"):
            raw = proposed.get(name)
            if raw is None:
                raw = np.zeros(image.shape[:2], dtype=np.float64)
            mask = np.asarray(raw, dtype=np.float64)
            if mask.shape != image.shape[:2] or not np.all(np.isfinite(mask)) or np.any(mask < 0) or np.any(mask > 1):
                raise ValueError("mask must be finite and 0..1")
            masks[name] = mask.copy()
        self._masks[digest] = masks
        self.mask_computations += 1
        return masks

    def render(
        self,
        image: ByteImage,
        direction: Direction,
        level: float,
        *,
        primary_box: tuple[float, float, float, float] | None,
        lock_level: float = DEFAULT_LOCK_LEVEL,
        preview_edge: int | None = None,
    ) -> GenderLevelResult:
        direction = checked_direction(direction)
        value = checked_level(level)
        lock = checked_level(lock_level)
        if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] not in (3, 4):
            raise ValueError("RGB or RGBA uint8 required")
        box = _validated_box(primary_box)
        if box is None:
            return GenderLevelResult(image.copy(), direction, value, "no_mesh", 0.0, False, None, False)
        photo_hash = hashlib.sha256(np.ascontiguousarray(image).tobytes()).hexdigest()
        masks = self._observed_masks(photo_hash, image)
        scope = _primary_mask(image.shape[:2], box)
        selected = {key: value * scope for key, value in masks.items()}
        key = (photo_hash, direction, value, box)
        candidate = self._candidates.get(key)
        if candidate is None:
            rows = ((1.0, "neutral"), (2.0, "normal"), (3.5, "extra"), (5.0, "hyper"))
            for (low, first), (high, second) in zip(rows[:-1], rows[1:], strict=True):
                if low <= value <= high:
                    first_image = image if low == 1.0 else legacy_render(image, selected, {
                        "direction": direction, "level": first, "amount": 1.0,
                    })[0]
                    last_image = legacy_render(image, selected, {
                        "direction": direction, "level": second, "amount": 1.0,
                    })[0]
                    candidate = _interpolate_bytes(first_image, last_image, (value - low) / (high - low))
                    break
            if candidate is None:
                raise AssertionError("level interval missing")
            self._candidates[key] = candidate.copy()
        decision = self._guard.guard(image, candidate.copy(), lock)
        if decision.image.dtype != np.uint8 or decision.image.shape != image.shape:
            raise ValueError("identity guard returned incompatible pixel data")
        safe = decision.image.copy()
        safe[..., :3] = np.where(scope[..., None] > 0, safe[..., :3], image[..., :3])
        if image.shape[2] == 4:
            safe[..., 3] = image[..., 3]
        changed = float(np.count_nonzero(np.any(safe[..., :3] != image[..., :3], axis=2)))
        share = changed / float(image.shape[0] * image.shape[1])
        result = safe
        if preview_edge is not None:
            if preview_edge < 16:
                raise ValueError("preview edge must be >= 16")
            scale = min(1.0, preview_edge / max(image.shape[:2]))
            height = max(1, round(image.shape[0] * scale))
            width = max(1, round(image.shape[1] * scale))
            y_index = np.linspace(0, image.shape[0] - 1, height).astype(np.intp)
            x_index = np.linspace(0, image.shape[1] - 1, width).astype(np.intp)
            result = result[y_index[:, None], x_index[None, :]].copy()
        return GenderLevelResult(result, direction, value, "rendered", share, True, decision.similarity,
                                 decision.blended_back)
