"""Local ceremony makeup bundle plus daylight/venue/flash drift checks. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .common import Image, Mask, alpha_blend, restore, validate_image, validate_mask

LABEL = "Ceremony Light Check — restrained local look previewed under daylight, venue and camera flash."


@dataclass(frozen=True)
class BridalOptions:
    complexion: float = 0.14
    lip: float = 0.34
    eye: float = 0.24
    cheek: float = 0.16

    def __post_init__(self) -> None:
        if any(not 0.0 <= value <= 0.6 for value in (self.complexion, self.lip, self.eye, self.cheek)):
            raise ValueError("ceremony controls must be 0..0.6")


@dataclass(frozen=True)
class FlashReport:
    daylight_drift: float
    venue_drift: float
    flash_drift: float
    passed: bool


def _mean_rgb(image: Image, mask: Mask) -> np.ndarray:
    selected = image[..., :3][mask > 0]
    if selected.size == 0:
        return np.zeros(3, dtype=np.float64)
    return selected.astype(np.float64).mean(axis=0)


def _drift(reference: np.ndarray, observed: np.ndarray) -> float:
    return float(np.linalg.norm(reference - observed) / 255.0 * 100.0)


def render(
    image: Image,
    skin: Mask,
    lips: Mask,
    eyes: Mask,
    cheeks: Mask,
    options: BridalOptions | None = None,
    *,
    iris: Mask | None = None,
    protected: Mask | None = None,
) -> Image:
    options = BridalOptions() if options is None else options
    height, width = validate_image(image)
    skin_mask = validate_mask(skin, height, width, "skin")
    lip_mask = validate_mask(lips, height, width, "lips")
    eye_mask = validate_mask(eyes, height, width, "eyes")
    cheek_mask = validate_mask(cheeks, height, width, "cheeks")
    original = image.copy()
    out = alpha_blend(image, (164, 128, 111), skin_mask, int(options.complexion * 180))
    out = alpha_blend(out, (132, 66, 78), lip_mask, int(options.lip * 255))
    out = alpha_blend(out, (72, 60, 64), eye_mask, int(options.eye * 210))
    out = alpha_blend(out, (177, 100, 102), cheek_mask, int(options.cheek * 190))
    if iris is not None:
        out = restore(out, original, iris)
    return restore(out, original, protected)


def flash_check(image: Image, skin: Mask, lips: Mask) -> FlashReport:
    height, width = validate_image(image)
    skin_mask = validate_mask(skin, height, width, "skin")
    lip_mask = validate_mask(lips, height, width, "lips")
    skin_rgb = _mean_rgb(image, skin_mask)
    lip_rgb = _mean_rgb(image, lip_mask)
    daylight_skin = np.clip(skin_rgb * np.array([1.02, 1.01, 0.99]), 0, 255)
    venue_skin = np.clip(skin_rgb * np.array([1.00, 0.94, 0.88]), 0, 255)
    flash_skin = np.clip(skin_rgb * np.array([1.06, 1.06, 1.08]), 0, 255)
    daylight_lip = np.clip(lip_rgb * np.array([1.01, 1.00, 0.99]), 0, 255)
    venue_lip = np.clip(lip_rgb * np.array([1.00, 0.96, 0.91]), 0, 255)
    flash_lip = np.clip(lip_rgb * np.array([1.04, 1.03, 1.04]), 0, 255)
    daylight = max(_drift(skin_rgb, daylight_skin), _drift(lip_rgb, daylight_lip))
    venue = max(_drift(skin_rgb, venue_skin), _drift(lip_rgb, venue_lip))
    flash = max(_drift(skin_rgb, flash_skin), _drift(lip_rgb, flash_lip))
    return FlashReport(daylight, venue, flash, max(daylight, venue, flash) <= 8.0)
