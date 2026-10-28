"""Whole-image colour grades that never brighten a pixel.

A grade separates each pixel into luminance and chroma. Chroma is shifted
toward a shadow tint and a highlight tint (split toning) and can be muted;
luminance may only stay or go down (deeper shadows and an optional vignette).
A final step scales any pixel whose luminance rose through clipping back to
its target. So skin is never lightened, contrast is kept or raised, and edges
stay where they were: the grade changes colour, never geometry.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import numpy as np

from .model import Look, Palette
from .raster import FloatArray, ImageArray

LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


@dataclass(frozen=True)
class GradeSettings:
    """Resolved grade knobs, each already scaled by the strength amount."""

    shadow_tint: tuple[float, float, float]
    highlight_tint: tuple[float, float, float]
    tint: float
    desaturate: float
    shadow_depth: float
    vignette: float


def _chroma_direction(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    """Unit-length chroma of a colour (its offset from its own grey)."""
    values = np.array(rgb, dtype=np.float32) / 255.0
    chroma = values - float(values @ LUMA)
    norm = float(np.linalg.norm(chroma))
    if norm < 1e-6:
        return (0.0, 0.0, 0.0)
    unit = chroma / norm
    return (float(unit[0]), float(unit[1]), float(unit[2]))


def settings_for(look: Look, palette: Palette, amount: float) -> GradeSettings:
    """Read a grade look's parameters and scale them by amount (0..1)."""
    return GradeSettings(
        shadow_tint=_chroma_direction(palette.rgb(look.param_str("shadow_tint", "dark"))),
        highlight_tint=_chroma_direction(palette.rgb(look.param_str("highlight_tint", "light"))),
        tint=max(0.0, min(0.3, look.param_float("tint", 0.12))) * amount,
        desaturate=max(0.0, min(1.0, look.param_float("desaturate", 0.0))) * amount,
        shadow_depth=max(0.0, min(0.6, look.param_float("shadow_depth", 0.1))) * amount,
        vignette=max(0.0, min(0.6, look.param_float("vignette", 0.0))) * amount,
    )


@lru_cache(maxsize=8)
def _radius(height: int, width: int) -> FloatArray:
    """Squared, clipped distance from the centre, cached per picture size."""
    ys = np.linspace(-1.0, 1.0, height, dtype=np.float32)[:, None]
    xs = np.linspace(-1.0, 1.0, width, dtype=np.float32)[None, :]
    radius = np.clip((xs * xs + ys * ys) * np.float32(0.5), 0.0, 1.0)
    squared: FloatArray = radius * radius
    squared.setflags(write=False)
    return squared


def grade_array(image: ImageArray, settings: GradeSettings) -> ImageArray:
    """Apply resolved grade settings to an RGB uint8 image.

    Works in place on float32 buffers to keep a 1024 x 1024 grade fast.
    """
    rgb = image.astype(np.float32)
    rgb *= np.float32(1.0 / 255.0)
    lum: FloatArray = rgb @ LUMA
    chroma = rgb
    chroma -= lum[..., None]
    if settings.desaturate > 0:
        chroma *= np.float32(1.0 - settings.desaturate)
    if settings.tint > 0:
        shadow = np.array(settings.shadow_tint, dtype=np.float32)
        highlight = np.array(settings.highlight_tint, dtype=np.float32)
        # Tint is strongest in mid tones, so pure black and white stay neutral;
        # it moves from the shadow tint to the highlight tint as luminance rises.
        weight = np.float32(4.0 * settings.tint) * lum * (np.float32(1.0) - lum)
        chroma += weight[..., None] * shadow
        chroma += (weight * lum)[..., None] * (highlight - shadow)
    target = lum.copy()
    if settings.shadow_depth > 0:
        dark = np.float32(1.0) - lum
        dark *= dark
        dark *= np.float32(settings.shadow_depth)
        target *= np.float32(1.0) - dark
    if settings.vignette > 0:
        target *= np.float32(1.0) - np.float32(settings.vignette) * _radius(*image.shape[:2])
    graded = chroma
    graded += target[..., None]
    np.clip(graded, 0.0, 1.0, out=graded)
    actual: FloatArray = graded @ LUMA
    np.maximum(actual, np.float32(1e-6), out=actual)
    ratio = target / actual
    np.minimum(ratio, np.float32(1.0), out=ratio)
    graded *= ratio[..., None]
    graded *= np.float32(255.0)
    np.floor(graded, out=graded)
    np.clip(graded, 0.0, 255.0, out=graded)
    out: ImageArray = graded.astype(np.uint8)
    return never_brighter(image, out)


def never_brighter(before: ImageArray, after: ImageArray) -> ImageArray:
    """Step down any pixel whose integer luminance ended above the input's.

    Float rounding can leave a pixel a hair brighter; lowering every channel
    by one level lowers luminance by exactly one level, so a few passes settle
    every pixel. Luminance is compared in float64 on the integer values.
    """
    weights = LUMA.astype(np.float64)
    limit = before.astype(np.float64) @ weights
    for _ in range(4):
        brighter = after.astype(np.float64) @ weights > limit
        if not brighter.any():
            break
        lowered = after[brighter].astype(np.int16) - 1
        after[brighter] = np.clip(lowered, 0, 255).astype(np.uint8)
    return after


def apply_grade(image: ImageArray, look: Look, palette: Palette, amount: float) -> ImageArray:
    """Grade the whole image with a look's parameters at a given amount."""
    return grade_array(image, settings_for(look, palette, amount))
