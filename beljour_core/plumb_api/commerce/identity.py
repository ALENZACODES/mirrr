"""Fail-closed identity-guard interface until Lane H ships its public engine.

This temporary guard measures mean pixel difference, not face recognition. A
pass-through test double is injectable; production always invokes a guard and
never claims biometric identity. Lane H replaces `PixelGuard` through its public
adapter when it lands. Author: John Khan.
"""
from __future__ import annotations

import base64
import binascii
import io
import math
from dataclasses import dataclass
from typing import Protocol

import numpy as np
from PIL import Image

from .strength import DEFAULT_LOCK, validate_level

MAX_GUARD_PIXELS = 4_500_000


@dataclass(frozen=True)
class GuardDecision:
    image: bytes
    similarity: float
    blended: bool
    lock_level: float
    engine: str
    decision: str


class IdentityGuard(Protocol):
    """ASSUMED Lane H public shape, for an externally supplied guard implementation."""

    def guard(self, before: bytes, after: bytes, lock_level: float) -> GuardDecision:
        ...


def _decode(data: bytes) -> np.ndarray:
    if not data or len(data) > 24_000_000:
        raise ValueError("Invalid bounded image for identity check")
    with Image.open(io.BytesIO(data)) as img:
        if img.width < 16 or img.height < 16 or img.width * img.height > MAX_GUARD_PIXELS:
            raise ValueError("Image dimensions not supported by identity check")
        if img.format not in ("JPEG", "PNG", "WEBP"):
            raise ValueError("Unsupported image encoding for identity check")
        return np.asarray(img.convert("RGB"), dtype=np.uint8)


def similarity(before: np.ndarray, after: np.ndarray) -> float:
    """Lightweight difference proxy only; cannot confirm human identity."""
    if before.shape != after.shape or before.ndim != 3 or before.shape[-1] != 3:
        raise ValueError("Before and after must have identical RGB geometry")
    if before.dtype != np.uint8 or after.dtype != np.uint8:
        raise ValueError("Expected 8-bit pixels")
    return 1.0 - float(np.abs(before.astype(np.float64) - after.astype(np.float64)).mean()) / 255.0


def lock_threshold(lock_level: object) -> float:
    """Stronger locks demand closer pixel similarity; threshold is ASSUMED."""
    ticks = round(validate_level(lock_level) * 10)
    return 0.90 + (ticks - 10) * 0.085 / 40.0


class PixelGuard:
    """Conservative temporary proxy; no silent bypass if Lane H is absent."""

    def guard(self, before: bytes, after: bytes, lock_level: float = DEFAULT_LOCK) -> GuardDecision:
        level = validate_level(lock_level)
        origin = _decode(before)
        changed = _decode(after)
        measured = similarity(origin, changed)
        if not math.isfinite(measured) or not 0 <= measured <= 1:
            raise ValueError("Identity proxy produced an invalid score")
        threshold = lock_threshold(level)
        if measured >= threshold:
            return GuardDecision(after, measured, False, level, "pixel_proxy", "kept")
        # A deterministic blend restores the original until the proxy threshold holds.
        # Preserve the untouched source JPEG if no safe blended image can be encoded.
        pixels = origin.astype(np.float64)
        candidate = changed.astype(np.float64)
        for index in range(16):
            fraction = 0.5 ** (index + 1)
            mixed = np.rint(pixels + (candidate - pixels) * fraction)
            out = np.clip(mixed, 0, 255).astype(np.uint8)
            new_similarity = similarity(origin, out)
            if new_similarity >= threshold:
                target = io.BytesIO()
                Image.fromarray(out, "RGB").save(target, format="PNG", optimize=False)
                return GuardDecision(target.getvalue(), new_similarity, True, level, "pixel_proxy", "blended")
        return GuardDecision(before, 1.0, True, level, "pixel_proxy", "original_kept")


def apply_guard(
    before: bytes,
    after: bytes,
    *,
    guard: IdentityGuard | None = None,
    lock_level: object = DEFAULT_LOCK,
) -> GuardDecision:
    """Always invoke a guard, including default calls with no injected implementation."""
    checked = validate_level(lock_level)
    engine: IdentityGuard = PixelGuard() if guard is None else guard
    verdict = engine.guard(before, after, checked)
    if not isinstance(verdict, GuardDecision) or not verdict.image:
        raise ValueError("Identity guard did not approve a usable image")
    if not 0 <= verdict.similarity <= 1 or not math.isfinite(verdict.similarity):
        raise ValueError("Identity guard returned an invalid similarity")
    return verdict


def guard_public_preview(
    before: bytes,
    payload: dict[str, object],
    *,
    guard: IdentityGuard | None = None,
    lock_level: object = DEFAULT_LOCK,
) -> dict[str, object]:
    """Apply identity guard to all local and provider preview responses.

    Malformed provider results fail closed, never returning an unguarded image.
    """
    raw = payload.get("image")
    if not isinstance(raw, str) or not raw.startswith(("data:image/jpeg;base64,", "data:image/png;base64,",
                                                        "data:image/webp;base64,")):
        raise ValueError("Preview image must be an embedded supported image")
    if len(raw) > 30_000_000:
        raise ValueError("Preview image exceeds the bounded guard input")
    try:
        after = base64.b64decode(raw.partition(",")[2], validate=True)
    except (ValueError, binascii.Error) as exc:
        raise ValueError("Preview image base64 is invalid") from exc
    verdict = apply_guard(before, after, guard=guard, lock_level=lock_level)
    with Image.open(io.BytesIO(verdict.image)) as opened:
        if opened.format not in ("JPEG", "PNG", "WEBP"):
            raise ValueError("Guard returned unsupported image")
        mime = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}[opened.format]
    result = dict(payload)
    result["image"] = f"data:{mime};base64,{base64.b64encode(verdict.image).decode('ascii')}"
    result["image_type"] = mime
    result["identity_guard"] = {
        "applied": True,
        "on_by_default": True,
        "lock_level": verdict.lock_level,
        "similarity": round(verdict.similarity, 6),
        "blended": verdict.blended,
        "decision": verdict.decision,
        "engine": verdict.engine,
        "note": "Pixel difference proxy only; Lane H biometric-quality guard pending.",
    }
    return result
