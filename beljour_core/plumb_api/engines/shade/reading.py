"""Geometry-only cheek patch sampling and lighting consistency audit for W6.

No skin-colour segmentation and no inference of race or a Monk label. A mixed
lighting refusal is safer than naming a false cosmetic match. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

import numpy as np

from . import colourspace as cs


@dataclass(frozen=True)
class PatchAudit:
    usable: bool
    reason: str | None
    cheek_distance: float | None
    zone_sizes: Mapping[str, int]
    white_mode: str
    note: str

    def public(self) -> dict[str, Any]:
        return {
            "usable": self.usable,
            "reason": self.reason,
            "cheek_distance": None if self.cheek_distance is None else round(self.cheek_distance, 4),
            "zone_sizes": dict(self.zone_sizes),
            "white_mode": self.white_mode,
            "note": self.note,
        }


def _central_mask(mask: np.ndarray, minimum: int) -> np.ndarray:
    """Erode one pixel from the boundaries of a supplied landmark-defined cheek."""
    if mask.ndim != 2 or mask.dtype != np.bool_:
        raise ValueError("skin patch mask must be two-dimensional and boolean")
    interior = mask.copy()
    interior[1:, :] &= mask[:-1, :]
    interior[:-1, :] &= mask[1:, :]
    interior[:, 1:] &= mask[:, :-1]
    interior[:, :-1] &= mask[:, 1:]
    return interior if np.count_nonzero(interior) >= minimum else mask


def _patch_pixels(image: np.ndarray, mask: np.ndarray, minimum: int) -> np.ndarray:
    rgb = image[..., :3][mask].astype(np.float64)
    if not len(rgb):
        return rgb.reshape(0, 3)
    # Extreme black/clipped pixels have unreliable hue under either white estimate.
    use = (np.min(rgb, axis=1) > 4) & (np.max(rgb, axis=1) < 251)
    return rgb[use] if np.count_nonzero(use) >= minimum else rgb


def audit_patches(
    image: object,
    masks: Mapping[str, np.ndarray],
    gains: tuple[float, float, float],
    white_mode: str,
    *,
    minimum: int,
    cheek_limit: float,
) -> tuple[dict[str, np.ndarray], PatchAudit]:
    """Refuse if two checked cheeks differ beyond the existing zone limit.

    The user supplies both the geometry and optional neutral reference through
    the normal shade finder. No image data is retained after this call.
    """
    arr = np.asarray(image)
    if arr.dtype != np.uint8 or arr.ndim != 3 or arr.shape[2] not in (3, 4):
        raise ValueError("shade patches require uint8 RGB or RGBA")
    if not 1 <= minimum <= 100_000 or not 0 < cheek_limit <= 100:
        raise ValueError("invalid patch audit limits")
    samples: dict[str, np.ndarray] = {}
    for name in ("cheek_right", "cheek_left", "forehead"):
        mask = masks.get(name)
        if mask is None or mask.shape != arr.shape[:2]:
            raise ValueError("shade patch geometry missing or wrong size")
        samples[name] = _patch_pixels(arr, _central_mask(mask, minimum), minimum)
    counts = {name: len(pixels) for name, pixels in samples.items()}
    if min(counts["cheek_right"], counts["cheek_left"]) < minimum:
        return samples, PatchAudit(False, "insufficient_cheek_patches", None, counts, white_mode,
                                   "Not enough visible cheek pixels; no shade is suggested.")
    medians: list[np.ndarray] = []
    for name in ("cheek_right", "cheek_left"):
        corrected = np.clip(cs.decode(samples[name]) * np.asarray(gains), 0, 1)
        lab = cs.xyz_to_lab(cs.linear_to_xyz(corrected))
        medians.append(np.median(lab, axis=0))
    separation = cs.delta_e(medians[0], medians[1])
    if separation > cheek_limit:
        return samples, PatchAudit(False, "mixed_lighting", separation, counts, white_mode,
                                   "The cheeks have incompatible lighting; retake in even daylight.")
    note = (
        "Neutral reference correction applied."
        if white_mode == "neutral"
        else "Background correction is an estimate, not a neutral reference."
        if white_mode == "grey_world"
        else "No neutral reference was available; colour is uncorrected."
    )
    return samples, PatchAudit(True, None, separation, counts, white_mode, note)
