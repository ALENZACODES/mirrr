"""Local W28/W39 consultation previews from observed hair support.

The renderer never infers hair from complexion or facial landmarks. It requires a
caller-supplied hair mask and keeps photos and masks inside the session. The
identity interface is a pixel-change guard, not a biometric recognizer.
All appearance and treatment statements are simulations.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import math
from collections import OrderedDict
from dataclasses import dataclass
from typing import Literal, Protocol, cast

import numpy as np
from numpy.typing import NDArray

from .balayage import paint
from .recolour import recolour_hair

ByteFrame = NDArray[np.uint8]
FloatPlane = NDArray[np.float64]
Mode = Literal["W28", "W39"]
Shade = Literal["deep", "copper", "ash", "chestnut", "gold"]
History = Literal["virgin", "colour_treated", "box_dye"]
Toner = Literal["none", "pearl", "ash", "violet"]

SIMULATION_LABEL = "Local colour simulation. A strand test is needed for a physical result."
DEFAULT_LEVEL = 2.0
MAX_PIXELS = 16_777_216
MIN_HAIR_PIXELS = 16
CACHE_LIMIT = 4
# Illustration targets only, not product matches or predictions.
SHADE_LAB: dict[Shade, tuple[float, float, float]] = {
    "deep": (24.0, 5.0, 2.0),
    "copper": (53.0, 37.0, 34.0),
    "ash": (57.0, -4.0, 7.0),
    "chestnut": (42.0, 17.0, 19.0),
    "gold": (71.0, 10.0, 30.0),
}


def checked_level(value: object) -> float:
    """Accept only an exact tenth between 1.0 and 5.0, never a boolean."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("level must be a decimal from 1.0 to 5.0")
    level = float(value)
    if not math.isfinite(level) or not 1.0 <= level <= 5.0:
        raise ValueError("level must be within 1.0 to 5.0")
    if abs(level * 10.0 - round(level * 10.0)) > 1e-9:
        raise ValueError("level must use 0.1 steps")
    return round(level, 1)


def level_weight(value: object) -> float:
    """Map 1.0 to unchanged and 5.0 to the full selected simulation."""
    return (checked_level(value) - 1.0) / 4.0


def checked_lock(value: object) -> float:
    if isinstance(value, bool) or not isinstance(value, (float, int)):
        raise ValueError("lock level must be numeric")
    lock = float(value)
    if not math.isfinite(lock) or not 0.0 <= lock <= 1.0:
        raise ValueError("lock level must be within 0..1")
    return lock


@dataclass(frozen=True)
class Choice:
    """A recipe contains only cosmetic controls, not a photo or landmarks."""

    mode: Mode
    level: float = DEFAULT_LEVEL
    shade: Shade = "chestnut"
    target_level: int = 6
    base_level: int | None = None
    history: History = "virgin"
    toner: Toner = "none"
    softness: int = 3

    def __post_init__(self) -> None:
        checked_level(self.level)
        if self.mode not in ("W28", "W39"):
            raise ValueError("unsupported colour simulation")
        if self.shade not in SHADE_LAB:
            raise ValueError("unsupported illustrative shade")
        if isinstance(self.target_level, bool) or not 1 <= self.target_level <= 10:
            raise ValueError("target level must be an integer 1..10")
        if not isinstance(self.target_level, int):
            raise ValueError("target level must be an integer 1..10")
        if self.base_level is not None:
            if isinstance(self.base_level, bool) or not isinstance(self.base_level, int):
                raise ValueError("base level must be an integer 1..10")
            if not 1 <= self.base_level <= 10:
                raise ValueError("base level must be an integer 1..10")
        if self.history not in ("virgin", "colour_treated", "box_dye"):
            raise ValueError("unsupported colour history")
        if self.toner not in ("none", "pearl", "ash", "violet"):
            raise ValueError("unsupported toner")
        if isinstance(self.softness, bool) or not isinstance(self.softness, int):
            raise ValueError("softness must be an integer 0..16")
        if not 0 <= self.softness <= 16:
            raise ValueError("softness must be an integer 0..16")

    def safe_recipe(self) -> dict[str, str | int | float | None]:
        return {
            "format": "beljour-hair-consultation/1",
            "mode": self.mode,
            "level": checked_level(self.level),
            "shade": self.shade,
            "target_level": self.target_level,
            "base_level": self.base_level,
            "history": self.history,
            "toner": self.toner,
            "softness": self.softness,
            "simulation": "true",
        }


@dataclass(frozen=True)
class GuardDecision:
    image: ByteFrame
    similarity: float
    limited: bool


class IdentityGuard(Protocol):
    """Typed replacement point for the approved public identity guard."""

    def guard(self, before: ByteFrame, candidate: ByteFrame, lock_level: float) -> GuardDecision:
        ...


class LocalChangeGuard:
    """Conservative pixel-change limiter, not an identity measurement."""

    def guard(self, before: ByteFrame, candidate: ByteFrame, lock_level: float) -> GuardDecision:
        lock = checked_lock(lock_level)
        change = float(np.mean(np.abs(before[..., :3].astype(float) - candidate[..., :3])))
        # Tight default, relaxed only when the user deliberately lowers the lock.
        budget = 9.0 + 65.0 * (1.0 - lock)
        ratio = min(1.0, budget / max(change, 1e-9))
        limited = ratio < 1.0
        output = before.copy()
        output[..., :3] = np.rint(
            before[..., :3] + ratio * (candidate[..., :3].astype(float) - before[..., :3])
        ).astype(np.uint8)
        return GuardDecision(output, max(0.0, 1.0 - change / 255.0), limited)


def _frame(image: object) -> ByteFrame:
    arr = np.asarray(image)
    if arr.dtype != np.uint8 or arr.ndim != 3 or arr.shape[-1] not in (3, 4):
        raise ValueError("source must be a uint8 RGB or RGBA frame")
    h, w, _ = arr.shape
    if min(h, w) < 2 or h * w > MAX_PIXELS:
        raise ValueError("source dimensions out of range")
    return arr.copy()


def _plane(values: object, shape: tuple[int, int], label: str) -> FloatPlane:
    plane = np.asarray(values, dtype=np.float64)
    if plane.shape != shape or not np.all(np.isfinite(plane)):
        raise ValueError(f"{label} must be a finite matching plane")
    if np.any((plane < 0.0) | (plane > 1.0)):
        raise ValueError(f"{label} must contain fractions in 0..1")
    return plane.copy()


def _digest(frame: ByteFrame) -> str:
    return hashlib.sha256(frame.tobytes()).hexdigest()


def _preview(frame: ByteFrame, max_edge: int | None) -> ByteFrame:
    if max_edge is None or max(frame.shape[:2]) <= max_edge:
        return frame.copy()
    if isinstance(max_edge, bool) or not isinstance(max_edge, int):
        raise ValueError("preview edge must be an integer")
    if not 32 <= max_edge <= 2048:
        raise ValueError("preview edge must be in 32..2048")
    h, w = frame.shape[:2]
    scale = max_edge / max(h, w)
    nh, nw = max(1, round(h * scale)), max(1, round(w * scale))
    yy = np.minimum(h - 1, np.floor((np.arange(nh) + 0.5) / scale).astype(int))
    xx = np.minimum(w - 1, np.floor((np.arange(nw) + 0.5) / scale).astype(int))
    return frame[np.ix_(yy, xx)].copy()


@dataclass(frozen=True)
class PreviewResult:
    image: ByteFrame
    mode: Mode
    level: float
    changed_share: float
    mean_delta: float
    similarity_proxy: float
    lock_applied: bool
    lock_limited: bool
    preview: bool
    label: str = SIMULATION_LABEL
    realface_status: str = "unproven"


class HairColourSession:
    """Foreground-only local consultation; never persists frames or segmentation."""

    def __init__(
        self,
        image: object,
        hair_mask: object,
        *,
        primary_mask: object | None = None,
        max_effect_cache: int = CACHE_LIMIT,
    ) -> None:
        source = _frame(image)
        shape = source.shape[:2]
        hair = _plane(hair_mask, shape, "hair mask")
        self._primary: FloatPlane | None = None
        if primary_mask is not None:
            primary = _plane(primary_mask, shape, "primary face mask")
            self._primary = primary
            hair *= np.where(primary >= 0.5, primary, 0.0)
        if int(np.count_nonzero(hair >= 0.5)) < MIN_HAIR_PIXELS:
            raise ValueError("observed hair mask covers fewer than 16 pixels")
        if isinstance(max_effect_cache, bool) or not 1 <= max_effect_cache <= 8:
            raise ValueError("cache size must be 1..8")
        self._image = source
        self._hair = hair
        self._digest = _digest(source)
        self._cache: OrderedDict[tuple[object, ...], ByteFrame] = OrderedDict()
        self._capacity = max_effect_cache
        self._mask_computations = 1
        self._effect_computations = 0
        self._guard_calls = 0
        self._last_level: dict[Mode, float] = {}

    def original(self) -> ByteFrame:
        """A caller-owned copy for original-first comparison."""
        return self._image.copy()

    @property
    def photo_digest(self) -> str:
        return self._digest

    @property
    def operation_counts(self) -> dict[str, int]:
        return {
            "mask_computations": self._mask_computations,
            "effect_computations": self._effect_computations,
            "guard_calls": self._guard_calls,
            "cached_effects": len(self._cache),
        }

    def last_level(self, mode: Mode) -> float:
        return self._last_level.get(mode, DEFAULT_LEVEL)

    def replace_observed_mask(self, hair_mask: object) -> None:
        mask = _plane(hair_mask, self._image.shape[:2], "hair mask")
        if self._primary is not None:
            mask *= np.where(self._primary >= 0.5, self._primary, 0.0)
        if int(np.count_nonzero(mask >= 0.5)) < MIN_HAIR_PIXELS:
            raise ValueError("observed hair mask covers fewer than 16 pixels")
        self._hair = mask
        self._cache.clear()
        self._mask_computations += 1

    def _full(self, choice: Choice, strokes: object | None) -> ByteFrame:
        paint_key: str = ""
        stroke: FloatPlane | None = None
        if choice.mode == "W28":
            if strokes is None:
                raise ValueError("W28 needs painted hair placement")
            stroke = _plane(strokes, self._image.shape[:2], "placement")
            paint_key = hashlib.sha256(stroke.tobytes()).hexdigest()
        key: tuple[object, ...] = (
            choice.mode,
            choice.shade,
            choice.target_level,
            choice.base_level,
            choice.history,
            choice.toner,
            choice.softness,
            paint_key,
        )
        if key in self._cache:
            self._cache.move_to_end(key)
            return self._cache[key]
        if choice.mode == "W39":
            full = recolour_hair(self._image, self._hair, SHADE_LAB[choice.shade]).image
        else:
            assert stroke is not None
            full = paint(
                self._image,
                self._hair,
                stroke,
                target_level=choice.target_level,
                base_level=choice.base_level,
                history=choice.history,
                toner=choice.toner,
                softness_px=choice.softness,
            ).image
        full = full.copy()
        full.setflags(write=False)
        self._cache[key] = full
        self._effect_computations += 1
        if len(self._cache) > self._capacity:
            self._cache.popitem(last=False)
        return full

    def render(
        self,
        choice: Choice,
        *,
        strokes: object | None = None,
        guard: IdentityGuard | None = None,
        lock_level: float = 1.0,
        preview_edge: int | None = None,
    ) -> PreviewResult:
        level = checked_level(choice.level)
        checked_lock(lock_level)
        if preview_edge is not None:
            if isinstance(preview_edge, bool) or not isinstance(preview_edge, int):
                raise ValueError("preview edge must be an integer")
            if not 32 <= preview_edge <= 2048:
                raise ValueError("preview edge must be within 32..2048")
        if choice.mode == "W28" and strokes is None:
            raise ValueError("painted placement is required")
        self._last_level[choice.mode] = level
        source = self._image
        candidate = source.copy()
        if level > 1.0:
            full = self._full(choice, strokes)
            factor = level_weight(level)
            candidate[..., :3] = np.rint(
                source[..., :3].astype(float)
                + factor * (full[..., :3].astype(float) - source[..., :3])
            ).astype(np.uint8)
        # The guard is mandatory for every preview, including a neutral preview.
        protector = guard if guard is not None else LocalChangeGuard()
        decision = protector.guard(source.copy(), candidate.copy(), lock_level)
        self._guard_calls += 1
        checked = _frame(decision.image)
        if checked.shape != source.shape or not math.isfinite(decision.similarity):
            raise ValueError("identity guard returned invalid evidence")
        # A faulty or outdated external guard cannot alter other regions or alpha.
        support = self._hair >= 0.5
        safe = source.copy()
        safe[..., :3][support] = checked[..., :3][support]
        difference = np.abs(safe[..., :3].astype(int) - source[..., :3].astype(int))
        changed = np.any(difference > 0, axis=-1)
        return PreviewResult(
            image=_preview(safe, preview_edge),
            mode=choice.mode,
            level=level,
            changed_share=float(changed[support].mean()),
            mean_delta=float(difference[support].mean()),
            similarity_proxy=float(decision.similarity),
            lock_applied=True,
            lock_limited=bool(decision.limited),
            preview=preview_edge is not None and max(source.shape[:2]) > preview_edge,
        )

    def close(self) -> None:
        self._image.fill(0)
        self._hair.fill(0)
        if self._primary is not None:
            self._primary.fill(0)
        self._cache.clear()
        self._last_level.clear()


def parse_recipe(raw: object) -> Choice:
    """Fail closed on photo-containing, unsupported or future recipe keys."""
    if not isinstance(raw, dict):
        raise ValueError("recipe must be an object")
    allowed = {
        "format", "mode", "level", "shade", "target_level", "base_level",
        "history", "toner", "softness", "simulation",
    }
    if set(raw) != allowed or raw.get("format") != "beljour-hair-consultation/1":
        raise ValueError("unsupported recipe schema")
    if raw.get("simulation") != "true":
        raise ValueError("simulation disclosure is required")
    mode = raw["mode"]
    if mode not in ("W28", "W39"):
        raise ValueError("unsupported mode")
    shade = raw["shade"]
    if shade not in SHADE_LAB:
        raise ValueError("unsupported shade")
    if not isinstance(raw["history"], str) or raw["history"] not in (
        "virgin", "colour_treated", "box_dye"
    ):
        raise ValueError("unsupported history")
    if not isinstance(raw["toner"], str) or raw["toner"] not in (
        "none", "neutral", "ash", "violet", "warm"
    ):
        raise ValueError("unsupported toner")
    if not isinstance(raw["level"], (int, float)):
        raise ValueError("unsupported level")
    if isinstance(raw["target_level"], bool) or not isinstance(raw["target_level"], int):
        raise ValueError("target level must be an integer")
    if raw["base_level"] is not None:
        if isinstance(raw["base_level"], bool) or not isinstance(raw["base_level"], int):
            raise ValueError("base level must be an integer")
    if isinstance(raw["softness"], bool) or not isinstance(raw["softness"], int):
        raise ValueError("softness must be an integer")
    return Choice(
        mode=mode,
        level=checked_level(raw["level"]),
        shade=shade,
        target_level=raw["target_level"],
        base_level=raw["base_level"],
        # Both were checked against the allowed literals above; mypy cannot narrow dict values.
        history=cast(History, raw["history"]),
        toner=cast(Toner, raw["toner"]),
        softness=raw["softness"],
    )
