"""Shared pieces of the local photo-fix tools.

The tools are red-eye removal (#54), glasses glare removal (#55), old-photo scratch and
dust repair (#51), object and photobomber removal (#59), the ID photo crop guide (#64) and
eye colour from the face mesh (#42). They share:

* one result record (edited image, per-pixel alpha of the change, status, reason code,
  label and a numbers-only report) with plain-language messages for every code,
* the same photo checks (RGB or RGBA uint8, at least 8 by 8, strength 0..100),
* the face-mesh refusals of engines/core/refusal.py (through skin/local_zones),
* a byte blend that rounds half up, so web/src/engines/local/photo-fix.ts gives the
  same bytes, and that never touches the alpha channel.

Everything runs on this device from the original photo; no model is used.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Literal

import numpy as np
from numpy.typing import NDArray

from ..core import refusal
from ..skin.local_zones import mesh_points, mesh_refusal

Floats = NDArray[np.float64]
Bools = NDArray[np.bool_]
Status = Literal["edited", "not_applicable", "refused"]

VERSION = "photo-fix/1"

MESSAGES: dict[str, str] = {
    **refusal.REASONS,
    "edited": "Local photo fix made.",
    "zero_strength": "Strength is zero, so the photo is unchanged.",
    "eyes_not_visible": "Neither eye is open and visible enough in this photo.",
    "no_red_eye": "No red pupil glow was found in the visible eyes.",
    "no_glare": "No glasses glare was found beside the eyes.",
    "no_scratches": "No scratches or dust specks were found, and the photo needed no tone or noise repair.",
    "nothing_marked": "Nothing is marked for removal.",
    "area_too_large": "The marked area is too large to fill from the rest of the photo.",
    "covers_face": "The marked area covers the face, so it was not removed.",
    "not_enough_margin": "The photo has too little space around the head for this crop.",
    "unknown_preset": "That crop size is not one of the offered guides.",
}

__all__ = ["MESSAGES", "VERSION", "FixResult", "blend_bytes", "check_photo", "half_up",
           "mesh_points", "mesh_refusal", "unchanged"]


@dataclass(frozen=True)
class FixResult:
    image: NDArray[np.uint8]
    alpha: Floats
    status: Status
    reason_code: str
    label: str
    report: dict[str, Any] = field(default_factory=dict)

    @property
    def message(self) -> str:
        return MESSAGES[self.reason_code]

    def to_json(self) -> dict[str, Any]:
        return {"version": VERSION, "status": self.status, "reason_code": self.reason_code,
                "message": self.message, "label": self.label, "report": self.report}


def check_photo(image: object, strength: float) -> NDArray[np.uint8]:
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4) or min(img.shape[:2]) < 8:
        raise ValueError("photo fix needs an RGB or RGBA uint8 photo at least 8 by 8")
    if isinstance(strength, bool) or not isinstance(strength, (int, float)) or not math.isfinite(strength):
        raise ValueError("strength must be a finite number")
    if not 0 <= strength <= 100:
        raise ValueError("strength must be 0..100")
    return img


def unchanged(image: NDArray[np.uint8], status: Status, code: str, label: str,
              report: dict[str, Any] | None = None) -> FixResult:
    return FixResult(image.copy(), np.zeros(image.shape[:2], dtype=np.float64), status, code, label,
                     dict(report or {}))


def half_up(values: Floats) -> Floats:
    """Round half up (Math.floor(x + 0.5) in the browser)."""
    out: Floats = np.floor(values + 0.5)
    return out


def blend_bytes(original: NDArray[np.uint8], edited: NDArray[np.uint8], weight: Floats) -> NDArray[np.uint8]:
    """original + weight * (edited - original) on the colour channels; alpha is kept."""
    out = original.copy()
    w = weight[..., None]
    a = original[..., :3].astype(np.float64)
    b = edited[..., :3].astype(np.float64)
    out[..., :3] = np.clip(half_up(a + w * (b - a)), 0, 255).astype(np.uint8)
    return out
