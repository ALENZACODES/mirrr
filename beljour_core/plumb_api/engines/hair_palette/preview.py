"""Mask-only local hair swatch preview with caller-supplied primary face evidence.

No guessed hair, lightening or physical dye predictions. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from ...commerce.strength import DEFAULT_LOCK, validate_level
from ..concealer.cover import CoverGuard, DefaultCoverGuard, HeadLandmarks
from ..core.colour import rgb_to_lab
from .catalogue import require_shade
from .matching import measured_level

U8 = NDArray[np.uint8]
Code = Literal["no_mesh", "invalid_image", "invalid_mask", "invalid_primary_face", "lightening_not_automatic"]


@dataclass(frozen=True)
class PaletteRefusal:
    code: Code
    reason: str
    rendered: bool = False


@dataclass(frozen=True)
class PalettePreview:
    image: U8
    shade_id: str
    level: float
    changed_pixels: int
    identity_similarity: float
    identity_blended: bool
    rendered: bool = True
    provider_calls: int = 0
    simulated: bool = True
    label: str = "In-house hair-colour simulation; not tested against real products."


def apply_shade(image: object, hair_mask: object, landmarks: object | None,
                shade_id: str, level: object = 3.0, *,
                primary_box: tuple[int, int, int, int] | None = None,
                allow_lightening: bool = False,
                guard: CoverGuard | None = None,
                lock_level: object = DEFAULT_LOCK) -> PalettePreview | PaletteRefusal:
    strength = validate_level(level)
    lock = validate_level(lock_level)
    if not isinstance(landmarks, HeadLandmarks):
        return PaletteRefusal("no_mesh", "No primary-face landmarks supplied")
    try:
        landmarks.validate()
    except ValueError:
        return PaletteRefusal("no_mesh", "Invalid primary-face landmarks")
    pixels = np.asarray(image)
    if (pixels.ndim != 3 or pixels.dtype != np.uint8 or pixels.shape[-1] not in (3, 4) or
            pixels.shape[0] < 8 or pixels.shape[1] < 8 or pixels.shape[0] * pixels.shape[1] > 4_500_000):
        return PaletteRefusal("invalid_image", "Expected a bounded RGB or RGBA photo")
    h, w = pixels.shape[:2]
    mask = np.asarray(hair_mask)
    if mask.shape != (h, w) or mask.dtype not in (np.uint8, np.float32, np.float64, np.bool_):
        return PaletteRefusal("invalid_mask", "Hair evidence must be an image-shaped mask")
    if mask.dtype == np.uint8:
        allow = mask >= 128
    else:
        if not np.all(np.isfinite(mask)) or bool(np.any(mask < 0)) or bool(np.any(mask > 1)):
            return PaletteRefusal("invalid_mask", "Hair region coverage is not valid")
        allow = mask >= 0.5
    if primary_box is not None:
        if (len(primary_box) != 4 or any(type(v) is not int for v in primary_box) or
                not 0 <= primary_box[0] < primary_box[2] <= w or
                not 0 <= primary_box[1] < primary_box[3] <= h):
            return PaletteRefusal("invalid_primary_face", "Invalid primary-face box")
        approved = np.zeros((h, w), dtype=bool)
        approved[primary_box[1]:primary_box[3], primary_box[0]:primary_box[2]] = True
        allow &= approved
    if not bool(allow.any()):
        return PaletteRefusal("invalid_mask", "No visible hair inside the selected face")
    shade = require_shade(shade_id)
    measured_rgb = np.median(pixels[..., :3][allow], axis=0)
    if not allow_lightening and shade.level > measured_level(rgb_to_lab(measured_rgb.tolist())):
        return PaletteRefusal("lightening_not_automatic", "A lighter colour needs explicit selection")
    opacity = (strength - 1) / 4 * 0.8
    target = np.asarray(shade.rgb, dtype=np.float64)
    output = pixels.copy()
    original = pixels[..., :3].astype(np.float64)
    changed = original[allow] * (1 - opacity) + target * opacity
    output[..., :3][allow] = np.floor(changed + 0.5).astype(np.uint8)
    decision = (DefaultCoverGuard() if guard is None else guard).guard(pixels.copy(), output.copy(), lock)
    if decision.image.shape != pixels.shape or decision.image.dtype != np.uint8:
        raise ValueError("Identity guard returned invalid image")
    protected = pixels.copy()
    protected[..., :3][allow] = decision.image[..., :3][allow]
    count = int(np.count_nonzero(np.any(protected[..., :3] != pixels[..., :3], axis=-1)))
    return PalettePreview(protected, shade_id, strength, count, decision.similarity, decision.blended)
