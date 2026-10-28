"""Local optical tooth-brightening, not dentistry. Author: John Khan.

The optical treatment operates only within a supplied, verified mouth interior
mask. It brightens adaptive enamel-like pixels without filling gaps, changing
gums, or using the unverified legacy provider endpoint.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np

from plumb_api.engines.shade.colourspace import lab_to_srgb, srgb_to_lab, to_bytes

from . import enamel

LABEL = "Teeth colour simulation, not dental treatment or a whitening prediction."
TeethStatus = Literal["edited", "not_applicable", "refused"]
ReasonCode = Literal["edited", "mouth_closed", "opening_not_observed", "no_teeth_visible"]


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    alpha: np.ndarray
    reason: str
    changed: int
    status: TeethStatus = "refused"
    reason_code: ReasonCode = "opening_not_observed"

    @property
    def not_applicable(self) -> bool:
        return self.status == "not_applicable"


def _unchanged(image: np.ndarray, status: TeethStatus, code: ReasonCode, reason: str) -> Result:
    return Result(image.copy(), np.zeros(image.shape[:2], dtype=np.float64),
                  reason, 0, status, code)


def _valid_photo(image: np.ndarray, strength: float) -> None:
    if (image.ndim != 3 or image.shape[2] != 3 or image.dtype != np.uint8
            or min(image.shape[:2]) < 8):
        raise ValueError("whiten requires an RGB uint8 image with dimensions >=8")
    if not np.isfinite(strength) or not 0 <= strength <= 100:
        raise ValueError("strength must be in [0,100]")


def _valid_opening(image: np.ndarray, opening: np.ndarray) -> None:
    if (opening.shape != image.shape[:2] or not np.issubdtype(opening.dtype, np.number)
            or not np.isfinite(opening).all() or np.any((opening < 0) | (opening > 1))):
        raise ValueError("mouth opening must be a finite 0..1 plane matching the photograph")


def whiten(image: np.ndarray, opening: np.ndarray, *, strength: float = 100.0,
           mouth_state: Literal["open", "closed"] | None = None) -> Result:
    """Locally brighten only verified enamel candidates; retain every other byte.

    A caller with mesh geometry may set ``mouth_state='closed'`` to return a
    typed NOT APPLICABLE without sampling or changing any RGB pixel. A claimed
    open mouth without enamel is a REFUSAL, not a fabricated success.
    """
    _valid_photo(image, strength)
    if mouth_state not in (None, "open", "closed"):
        raise ValueError("mouth_state must be open, closed or omitted")
    if mouth_state == "closed":
        return _unchanged(image, "not_applicable", "mouth_closed", "mouth closed or not observed")
    _valid_opening(image, opening)
    valid = opening >= 0.5
    if np.count_nonzero(valid) < 8 or strength == 0:
        return _unchanged(image, "refused", "opening_not_observed", "mouth closed or not observed")
    lab = srgb_to_lab(image)
    selected, _ = enamel.find_enamel(image, lab, opening)
    if not np.any(selected):
        return _unchanged(image, "refused", "no_teeth_visible",
                          "no enamel-like pixels inside opening")
    alpha = selected.astype(np.float64) * (strength / 100.0)
    revised = lab[selected].copy()
    revised[:, 0] += (strength / 100.0) * np.minimum(8.0, np.maximum(0, 95 - revised[:, 0]))
    revised[:, 2] += (strength / 100.0) * (6.0 - revised[:, 2])
    revised[:, 2] = np.maximum(8.0, revised[:, 2])
    rounded = to_bytes(lab_to_srgb(revised))
    # Quantisation and gamut mapping can undo a nominal Lab b* floor.
    for _ in range(3):
        measured = srgb_to_lab(rounded)
        cold = measured[:, 2] < 3.75
        if not np.any(cold):
            break
        revised[cold, 2] += 2.0
        rounded[cold] = to_bytes(lab_to_srgb(revised[cold]))
    # If no in-gamut edit can meet the measured floor, refuse those pixels.
    safe = srgb_to_lab(rounded)[:, 2] >= 3.75
    if not np.any(safe):
        return _unchanged(image, "refused", "no_teeth_visible",
                          "no enamel-like pixels inside opening")
    eligible = np.flatnonzero(selected)
    kept = eligible[safe]
    result = image.copy()
    result.reshape(-1, 3)[kept] = rounded[safe]
    alpha_flat = alpha.reshape(-1)
    alpha_flat[eligible[~safe]] = 0
    touched = int(np.count_nonzero(alpha_flat))
    return Result(result, alpha, "measured local edit", touched, "edited", "edited")
