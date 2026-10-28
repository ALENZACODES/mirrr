"""Local iris recolour that preserves pupil, limbal ring and highlights. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .common import RGB, Image, Mask, mask_subtract, restore, validate_image, validate_mask

LABEL = "Iris Tint — local colour shift with pupil, limbal ring and catchlight preserved."


@dataclass(frozen=True)
class EyeColourOptions:
    colour: RGB = (76, 117, 132)
    amount: float = 0.72

    def __post_init__(self) -> None:
        if not 0.0 <= self.amount <= 1.0:
            raise ValueError("amount must be 0..1")
        if any(channel < 0 or channel > 255 for channel in self.colour):
            raise ValueError("colour channels must be 0..255")


def render(
    image: Image,
    iris: Mask,
    pupil: Mask,
    highlight: Mask,
    options: EyeColourOptions | None = None,
    *,
    protected: Mask | None = None,
) -> Image:
    options = EyeColourOptions() if options is None else options
    height, width = validate_image(image)
    iris_mask = validate_mask(iris, height, width, "iris")
    pupil_mask = validate_mask(pupil, height, width, "pupil")
    highlight_mask = validate_mask(highlight, height, width, "highlight")
    editable = mask_subtract(mask_subtract(iris_mask, pupil_mask), highlight_mask)
    original = image.copy()
    rgb = image[..., :3].astype(np.float64)
    luminance = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    target = np.array(options.colour, dtype=np.float64)
    target_mean = max(float(np.mean(target)), 1.0)
    textured = np.clip(target[None, None, :] * (0.55 + 0.45 * luminance[..., None] / target_mean), 0.0, 255.0)
    alpha = editable.astype(np.float64) / 255.0 * options.amount
    mixed = rgb * (1.0 - alpha[..., None]) + textured * alpha[..., None]
    out = original.copy()
    out[..., :3] = np.clip(np.floor(mixed + 0.5), 0, 255).astype(np.uint8)
    out = restore(out, original, pupil_mask)
    out = restore(out, original, highlight_mask)
    return restore(out, original, protected)
