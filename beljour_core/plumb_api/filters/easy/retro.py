"""Original retro portrait photo treatment; no generated clothes. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .common import Image, Mask, deterministic_noise, restore, validate_image, validate_mask

LABEL = "Archive Flash — grain, falloff and muted print colour; clothing is unchanged."


@dataclass(frozen=True)
class RetroOptions:
    strength: float = 0.72
    grain: float = 0.35
    backdrop: float = 0.25
    seed: int = 19

    def __post_init__(self) -> None:
        for value in (self.strength, self.grain, self.backdrop):
            if not 0.0 <= value <= 1.0:
                raise ValueError("retro controls must be 0..1")


def render(
    image: Image,
    options: RetroOptions | None = None,
    *,
    protected: Mask | None = None,
    background: Mask | None = None,
    iris: Mask | None = None,
) -> Image:
    options = RetroOptions() if options is None else options
    height, width = validate_image(image)
    original = image.copy()
    rgb = image[..., :3].astype(np.float64)
    yy, xx = np.mgrid[0:height, 0:width]
    nx = (xx + 0.5 - width * 0.5) / max(width * 0.5, 1.0)
    ny = (yy + 0.5 - height * 0.46) / max(height * 0.54, 1.0)
    radius = np.sqrt(nx * nx + ny * ny)
    vignette = np.clip(1.0 - options.strength * 0.20 * np.clip(radius - 0.22, 0.0, 1.2), 0.72, 1.0)
    flash = 1.0 + options.strength * 0.10 * np.exp(-(nx * nx + ny * ny) / 0.16)
    grade = np.array([1.035, 0.995, 0.92], dtype=np.float64)
    out_rgb = rgb * vignette[..., None] * flash[..., None] * (1.0 + (grade - 1.0) * options.strength)
    out_rgb = (out_rgb - 128.0) * (1.0 - 0.08 * options.strength) + 128.0
    noise = deterministic_noise(height, width, options.seed).astype(np.float64)
    out_rgb += noise[..., None] * (options.grain * 7.0 / 128.0)
    if background is not None and options.backdrop > 0:
        bg = validate_mask(background, height, width, "background").astype(np.float64) / 255.0
        mottled = deterministic_noise(height, width, options.seed + 41).astype(np.float64) / 128.0
        target = np.stack(
            [142.0 + 8.0 * mottled, 146.0 + 6.0 * mottled, 151.0 + 5.0 * mottled],
            axis=-1,
        )
        alpha = bg * options.backdrop * 0.35
        out_rgb = out_rgb * (1.0 - alpha[..., None]) + target * alpha[..., None]
    out = original.copy()
    out[..., :3] = np.clip(np.floor(out_rgb + 0.5), 0, 255).astype(np.uint8)
    if iris is not None:
        out = restore(out, original, iris)
    return restore(out, original, protected)
