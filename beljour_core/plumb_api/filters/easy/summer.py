"""Skin-only warm summer treatment with optional deterministic faux freckles. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np

from .common import Image, Mask, deterministic_noise, restore, validate_image, validate_mask

LABEL = "Sunlit Skin — additive warm tone with optional faux freckles; never a tan-removal lightener."
Undertone = Literal["cool", "neutral", "warm", "olive"]
_TARGETS: dict[Undertone, tuple[int, int, int]] = {
    "cool": (126, 88, 73),
    "neutral": (132, 91, 68),
    "warm": (139, 94, 62),
    "olive": (131, 100, 61),
}


@dataclass(frozen=True)
class SummerOptions:
    undertone: Undertone = "neutral"
    amount: float = 0.30
    freckles: float = 0.0
    seed: int = 27

    def __post_init__(self) -> None:
        if not 0.0 <= self.amount <= 0.65 or not 0.0 <= self.freckles <= 1.0:
            raise ValueError("summer controls out of range")


def render(
    image: Image,
    skin: Mask,
    options: SummerOptions | None = None,
    *,
    cheek_nose: Mask | None = None,
    iris: Mask | None = None,
    protected: Mask | None = None,
) -> Image:
    options = SummerOptions() if options is None else options
    height, width = validate_image(image)
    skin_mask = validate_mask(skin, height, width, "skin").astype(np.float64) / 255.0
    original = image.copy()
    rgb = image[..., :3].astype(np.float64)
    target = np.array(_TARGETS[options.undertone], dtype=np.float64)
    alpha = skin_mask * options.amount
    tinted = rgb * (1.0 - alpha[..., None]) + target * alpha[..., None]
    before_mean = rgb.mean(axis=2)
    after_mean = tinted.mean(axis=2)
    too_light = after_mean > before_mean
    scale = np.ones_like(before_mean)
    scale[too_light] = before_mean[too_light] / np.maximum(after_mean[too_light], 1.0)
    tinted *= scale[..., None]
    out = original.copy()
    out[..., :3] = np.clip(np.floor(tinted + 0.5), 0, 255).astype(np.uint8)
    if options.freckles > 0.0:
        region = skin_mask
        if cheek_nose is not None:
            region *= validate_mask(cheek_nose, height, width, "cheek_nose").astype(np.float64) / 255.0
        noise = deterministic_noise(height, width, options.seed)
        threshold = int(127 - options.freckles * 14)
        dots = (noise > threshold) & (region > 0.45)
        freckle_alpha = min(0.55, 0.18 + options.freckles * 0.32)
        base = out[..., :3].astype(np.float64)
        dark = np.maximum(base * (1.0 - freckle_alpha), 0.0)
        base[dots] = dark[dots]
        out[..., :3] = np.clip(np.floor(base + 0.5), 0, 255).astype(np.uint8)
    if iris is not None:
        out = restore(out, original, iris)
    return restore(out, original, protected)
