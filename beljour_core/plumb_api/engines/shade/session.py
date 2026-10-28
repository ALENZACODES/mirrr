"""Session-scoped W6 shade reading, privacy-safe geometry memo and sample tint.

Only synthetic in-house reference swatches are applied. This is a photo-local
cosmetic consultation preview, not foundation VTO or physical product matching.
Identity guard is mandatory and defaults to a conservative pixel proxy until
Lane H supplies a public identity-lock interface. Readings go through the
checked cheek-first entry of skin_accuracy.py: the historical reading first,
then the two-cheek consensus only when that reading refuses. Author: John Khan.
"""
from __future__ import annotations

import hashlib
import io
from dataclasses import dataclass
from typing import Any

import numpy as np
from PIL import Image

from ...commerce.identity import GuardDecision, IdentityGuard, apply_guard
from ...commerce.preview_cache import EditKey, PhotoEditCache
from ...commerce.preview_levels import preview_resolution
from ...commerce.strength import DEFAULT_LOCK, level_ticks, to_legacy, validate_level
from . import colourspace as cs
from .finder import ShadeResult, zone_masks
from .measurement import background_from_face
from .reading import PatchAudit
from .skin_accuracy import assess_skin_zones

MAX_SESSION_PIXELS = 4_500_000


@dataclass(frozen=True)
class PreparedReading:
    photo_hash: str
    width: int
    height: int
    landmark_bytes: bytes
    evidence_hash: str
    cheek_left_bits: bytes
    cheek_right_bits: bytes
    reading: ShadeResult
    audit: PatchAudit
    source: str = "baseline"
    consensus: dict[str, Any] | None = None

    def cheek_mask(self) -> np.ndarray:
        left = np.unpackbits(np.frombuffer(self.cheek_left_bits, dtype=np.uint8), count=self.width * self.height)
        right = np.unpackbits(np.frombuffer(self.cheek_right_bits, dtype=np.uint8), count=self.width * self.height)
        return ((left | right) != 0).reshape(self.height, self.width)

    def public(self) -> dict[str, Any]:
        return {
            "photo_hash": self.photo_hash,
            "reading": self.reading.to_json(),
            "lighting_audit": self.audit.public(),
            "source": self.source,
            "consensus": self.consensus,
            "note": "Geometry cached in session memory, not uploaded or saved.",
        }


@dataclass(frozen=True)
class ShadeApply:
    image: bytes
    mime: str
    strength_level: float
    simulated: bool
    label: str
    identity_guard: GuardDecision
    mode: str
    reading_cached: bool

    def public(self) -> dict[str, Any]:
        return {
            "image_type": self.mime,
            "strength_level": self.strength_level,
            "simulated": self.simulated,
            "label": self.label,
            "identity_guard": {
                "applied": True,
                "lock_level": self.identity_guard.lock_level,
                "similarity": round(self.identity_guard.similarity, 6),
                "blended": self.identity_guard.blended,
                "engine": self.identity_guard.engine,
            },
            "mode": self.mode,
            "reading_cached": self.reading_cached,
            "provider_calls": 0,
            "tested_against_real_products": False,
        }


def _photo_input(image: object) -> np.ndarray:
    arr = np.asarray(image)
    if arr.dtype != np.uint8 or arr.ndim != 3 or arr.shape[2] not in (3, 4):
        raise ValueError("Shade session requires uint8 RGB or RGBA")
    h, w = arr.shape[:2]
    if min(h, w) < 16 or h * w > MAX_SESSION_PIXELS:
        raise ValueError("Unsupported shade photo dimensions")
    return arr


def _png(rgb: np.ndarray) -> bytes:
    output = io.BytesIO()
    Image.fromarray(rgb[..., :3], "RGB").save(output, format="PNG")
    return output.getvalue()


def _resize(rgb: np.ndarray, phase: str) -> np.ndarray:
    h, w = rgb.shape[:2]
    target_w, target_h = preview_resolution(w, h, phase)
    if (target_w, target_h) == (w, h):
        return rgb
    with Image.fromarray(rgb[..., :3], "RGB") as source:
        return np.asarray(source.resize((target_w, target_h), Image.Resampling.BILINEAR)).copy()


@dataclass(frozen=True)
class ShadePrimaryRefusal:
    code: str
    reason: str
    rendered: bool = False


class ShadeSession:
    """One user's in-memory memo, invalidated when the current photo changes."""

    def __init__(self) -> None:
        self._readings = PhotoEditCache()
        self._frames = PhotoEditCache()
        self.reading_computes = 0
        self.render_computes = 0

    def prepare(
        self, image: object, points: object, *,
        neutral_mask: object | None = None, background_mask: object | None = None,
    ) -> PreparedReading:
        img = _photo_input(image)
        digest = hashlib.sha256(img.tobytes()).hexdigest()
        pts = np.asarray(points, dtype=np.float64)
        if pts.ndim != 2 or pts.shape[0] < 478 or not np.all(np.isfinite(pts)):
            raise ValueError("Supplied landmarks are invalid")
        evidence = hashlib.sha256(pts.tobytes())
        if neutral_mask is not None:
            evidence.update(np.asarray(neutral_mask).tobytes())
        if background_mask is None and neutral_mask is None:
            background_mask = background_from_face(img, pts).mask
        if background_mask is not None:
            evidence.update(np.asarray(background_mask).tobytes())
        evidence_hash = evidence.hexdigest()[:16]
        key = EditKey(digest, f"shade_sensing_{evidence_hash}", 30)

        def build() -> PreparedReading:
            self.reading_computes += 1
            # Bind supplied landmarks and neutral/reference masks to the memo key.
            masks = zone_masks(pts, img.shape[0], img.shape[1])
            found = assess_skin_zones(
                img, masks, neutral_mask=neutral_mask, background_mask=background_mask,
            )
            left = np.packbits(masks["cheek_left"].ravel()).tobytes()
            right = np.packbits(masks["cheek_right"].ravel()).tobytes()
            consensus = None if found.consensus is None else found.consensus.public()
            return PreparedReading(digest, img.shape[1], img.shape[0], pts.tobytes(),
                                   evidence_hash, left, right, found.reading, found.audit,
                                   found.source, consensus)

        return self._readings.get_or_compute(key, build)

    def apply(
        self, image: object, prepared: PreparedReading, level: float, *,
        lock_level: float = DEFAULT_LOCK, guard: IdentityGuard | None = None,
        phase: str = "release",
        primary_box: tuple[int, int, int, int] | None = None,
    ) -> ShadeApply:
        img = _photo_input(image)
        level = validate_level(level)
        if hashlib.sha256(img.tobytes()).hexdigest() != prepared.photo_hash:
            raise ValueError("Shade reading belongs to another photo")
        if img.shape[0] != prepared.height or img.shape[1] != prepared.width:
            raise ValueError("Shade reading dimensions changed")
        if prepared.reading.refused or prepared.reading.best is None or not prepared.audit.usable:
            raise ValueError("Cannot apply a shade when the reading is not reliable")
        if primary_box is not None and (len(primary_box) != 4 or
                any(type(v) is not int for v in primary_box) or
                not 0 <= primary_box[0] < primary_box[2] <= img.shape[1] or
                not 0 <= primary_box[1] < primary_box[3] <= img.shape[0]):
            raise ValueError("Invalid primary-face shade box")
        clipped_box = "all" if primary_box is None else "_".join(map(str, primary_box))
        cached_before = self._frames.hits
        key = EditKey(prepared.photo_hash,
                      f"shade_preview_{phase}_{prepared.evidence_hash}_{clipped_box}", level_ticks(level))

        def render() -> bytes:
            self.render_computes += 1
            mask = prepared.cheek_mask()
            if primary_box is not None:
                allowed = np.zeros(mask.shape, dtype=bool)
                x0, y0, x1, y1 = primary_box
                allowed[y0:y1, x0:x1] = True
                mask &= allowed
            best = prepared.reading.best
            if best is None:
                raise ValueError("Cannot apply a shade when the reading is not reliable")
            target = np.asarray(cs.lab_to_srgb(best["lab"]), dtype=np.float64)
            source = img[..., :3].astype(np.float64)
            # At 5.0 at most 25% visual tint, preserving local texture.
            opacity = (to_legacy(level) / 100.0) * 0.25
            result = source.copy()
            result[mask] = source[mask] * (1 - opacity) + target * opacity
            rgb = np.clip(np.rint(result), 0, 255).astype(np.uint8)
            return _png(_resize(rgb, phase))

        edited = self._frames.get_or_compute(key, render)
        before = _png(_resize(img[..., :3], phase))
        decision = apply_guard(before, edited, guard=guard, lock_level=lock_level)
        return ShadeApply(
            decision.image, "image/png", level, True,
            "In-house reference tint simulation; not tested against physical makeup.",
            decision, phase, cached_before < self._frames.hits,
        )

    def prepare_primary(self, image: object, landmarks: object | None, *,
                        primary_box: tuple[int, int, int, int] | None = None,
                        neutral_mask: object | None = None,
                        background_mask: object | None = None) -> PreparedReading | ShadePrimaryRefusal:
        """No guessed primary face: coded refusal instead of a landmark exception."""
        if landmarks is None:
            return ShadePrimaryRefusal("no_mesh", "No primary-face landmarks supplied")
        try:
            prepared = self.prepare(image, landmarks, neutral_mask=neutral_mask,
                                    background_mask=background_mask)
        except ValueError:
            return ShadePrimaryRefusal("invalid_landmarks", "Unable to read supplied face landmarks")
        if primary_box is not None:
            if (len(primary_box) != 4 or any(type(v) is not int for v in primary_box) or
                    not 0 <= primary_box[0] < primary_box[2] <= prepared.width or
                    not 0 <= primary_box[1] < primary_box[3] <= prepared.height):
                return ShadePrimaryRefusal("invalid_primary_face", "Invalid primary-face box")
            allowed = np.zeros((prepared.height, prepared.width), dtype=bool)
            x0, y0, x1, y1 = primary_box
            allowed[y0:y1, x0:x1] = True
            if not (prepared.cheek_mask() & allowed).any():
                return ShadePrimaryRefusal("invalid_primary_face", "No observed cheek inside selected face")
        return prepared

    def clear(self) -> None:
        self._readings.clear()
        self._frames.clear()
