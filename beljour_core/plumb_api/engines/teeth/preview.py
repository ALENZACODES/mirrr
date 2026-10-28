"""Conservative teeth preview beside the unchanged optical whitening renderer.

A verified mouth-opening observation is required. An unobserved, occluded,
closed or too-small opening refuses the operation before any pixel treatment.
The caller owns the photograph and opening mask; no automatic inference about
mouth posture is made from skin colour. Refusals return a fresh byte-identical
copy of the original, zero alpha and an explicit reason. No provider needed.

A preview is an optical colour illustration, never a dental outcome estimate.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from ...filters.strength import DEFAULT_LEVEL, checked_level, to_percent
from . import whiten

U8 = NDArray[np.uint8]
F64 = NDArray[np.float64]
MouthState = Literal["open", "closed", "unknown"]
PreviewState = Literal["preview", "refused"]
LABEL = whiten.LABEL
MIN_OPEN_PIXELS = 8


@dataclass(frozen=True)
class Preview:
    image: U8
    alpha: F64
    status: PreviewState
    reason: str
    changed: int
    level: float
    caption: str = LABEL

    @property
    def refused(self) -> bool:
        return self.status == "refused"


def _validate_image(image: np.ndarray) -> U8:
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] != 3 or min(img.shape[:2]) < 8:
        raise ValueError("teeth preview requires uint8 RGB at least 8x8")
    return img


def _validate_opening(opening: np.ndarray | None, shape: tuple[int, int]) -> F64 | None:
    if opening is None:
        return None
    try:
        plane = np.asarray(opening, dtype=np.float64)
    except (ValueError, TypeError, OverflowError) as exc:
        raise ValueError("mouth opening must be a finite numeric plane") from exc
    if plane.shape != shape or not np.isfinite(plane).all():
        raise ValueError("mouth opening must be a finite numeric plane matching the image")
    if np.any((plane < 0) | (plane > 1)):
        raise ValueError("mouth opening values must be 0..1")
    return plane


def _refusal(image: U8, level: float, reason: str) -> Preview:
    return Preview(image.copy(), np.zeros(image.shape[:2], dtype=np.float64), "refused", reason, 0, level)


def preview(image: np.ndarray, opening: np.ndarray | None, *,
            mouth_state: MouthState = "unknown", level: float = DEFAULT_LEVEL) -> Preview:
    """Optical preview only if positive, verified mouth-opening evidence exists.

    A caller must explicitly declare ``mouth_state='open'`` on the basis of a
    verified observation, and supply the corresponding opening mask. Zero masks,
    unknown states, and enamel-negative mouths refuse without pixel changes.
    Changes are confined to the original renderer's verified enamel candidate
    pixels; even the unchanged portions of the RGB frame are exact bytes.
    """
    img = _validate_image(image)
    step = checked_level(level)
    if mouth_state not in ("open", "closed", "unknown"):
        raise ValueError("mouth_state must be open, closed or unknown")
    # A closed/unobserved mouth is a refusal regardless of stale mask data.
    # Validate opening evidence only for a claimed open mouth.
    if mouth_state == "closed":
        return _refusal(img, step, "mouth closed: no teeth preview")
    if mouth_state == "unknown":
        return _refusal(img, step, "mouth opening not verified")
    plane = _validate_opening(opening, img.shape[:2])
    if plane is None:
        return _refusal(img, step, "no verified mouth-opening mask")
    if np.count_nonzero(plane >= 0.5) < MIN_OPEN_PIXELS:
        return _refusal(img, step, "no visible open mouth")
    result = whiten.whiten(img, plane, strength=to_percent(step))
    if result.changed == 0:
        return _refusal(img, step, "no enamel-like pixels inside the opening")
    return Preview(result.image, result.alpha, "preview", result.reason, result.changed, step)
