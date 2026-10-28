"""Illustration looks on her own photo: four procedural looks, labelled as illustration
filters (features 67, 83, 84). They are drawn from her photo's own pixels with the package's
existing kernels (the quadrant-variance paint of oil.py, the edge detector of ink.py, the
canvas weave of oil.py and the coordinate hash of types.py); no neural style
transfer, no 3D, no costume and no generated face. Pixels never move, so her face shape is
exactly her own.

    sancerre-cartoon    flat cartoon colour bands with ink outlines            feature 83
    fougeres-comic      comic bands, ink and halftone dots in the shadows      feature 67
    banyuls-wash        soft watercolour wash on grained paper                 feature 67
    chambord-portrait   painted portrait with warm varnish and a dark vignette feature 84

None of them lightens: the wash and portrait only multiply toward darker or warmer paper
and varnish, and the cartoon and comic bands are her shading relative to her own skin, so
flat skin keeps her own colour on every tone. Her own dark marks are
drawn back into the cartoon and comic bands, so freckles and moles stay on every tone.
web/src/engines/studio/illustration.ts mirrors this file. Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping
from typing import Any

import numpy as np

from ...engines.core.filters import box_mean
from .ink import sobel
from .oil import kuwahara, paint_texture
from .types import ArtisticResult, blend, grid, hash_noise, luma, number, parameters, photo, result, smooth01

LOOKS = {
    "sancerre-cartoon": {"name": "Sancerre cartoon", "row": 83},
    "fougeres-comic": {"name": "Fougères comic", "row": 67},
    "banyuls-wash": {"name": "Banyuls wash", "row": 67},
    "chambord-portrait": {"name": "Chambord portrait", "row": 84},
}
DEFAULTS = {"amount": 1.0}
LABEL = "Illustration filter on your own photo. Your face shape is unchanged; nothing is generated."
HALFTONE_PITCH = 5.0           # dot spacing in pixels (ASSUMED)
VARNISH = (1.0, 0.93, 0.80)    # warm varnish multiply (ASSUMED)
MARK_RADIUS = 4                # marks smaller than this are kept from her photo (ASSUMED)


def _cel(rgb: np.ndarray, source: np.ndarray, *, levels: int, ink: float, threshold: float) -> tuple[np.ndarray, np.ndarray]:
    """Cel bands of her shading relative to her own local brightness, ink on relative edges,
    then her own dark marks drawn back in. Bands are relative, not absolute brightness, so a
    deep skin tone keeps its own colour instead of falling into the black band. Returns the
    drawing and the band value (1 = her own tone, lower = shadow)."""
    h, w = rgb.shape[:2]
    lum = luma(rgb) + 1
    rel = lum / box_mean(lum, max(2, min(h, w) // 16))
    band = np.floor(np.clip(rel, 0, 1) * levels + 0.5) / levels   # never above her own tone
    edge = smooth01((sobel(rel / 2) - threshold) / 0.05)
    flat = rgb * (band / rel * (1 - ink * edge))[..., None]
    src = luma(source)
    marks = np.minimum(0.0, src - box_mean(src, MARK_RADIUS))
    return flat + marks[..., None], band


def _cartoon(rgb: np.ndarray) -> np.ndarray:
    painted, _ = kuwahara(rgb, 2)
    return _cel(painted, rgb, levels=3, ink=0.8, threshold=0.03)[0]


def _comic(rgb: np.ndarray) -> np.ndarray:
    flat, band = _cel(rgb, rgb, levels=2, ink=0.9, threshold=0.025)
    x, y = grid(rgb.shape[:2])
    c, s = math.cos(math.pi / 4), math.sin(math.pi / 4)
    u = (x * c + y * s) / HALFTONE_PITCH
    v = (-x * s + y * c) / HALFTONE_PITCH
    du, dv = u - np.floor(u) - 0.5, v - np.floor(v) - 0.5
    dist = np.sqrt(du * du + dv * dv)
    shadow = np.clip(1 - band, 0, 1)            # dots only where her own shading is darker
    dot = 1 - smooth01((dist - 0.5 * shadow) / 0.08)
    return flat * (1 - 0.35 * dot * (shadow > 0))[..., None]


def _wash(rgb: np.ndarray) -> np.ndarray:
    painted, _ = kuwahara(rgb, 2)
    grey = luma(painted)[..., None]
    soft = painted * 0.9 + grey * 0.1
    x, y = grid(rgb.shape[:2])
    paper = 1 - 0.06 * hash_noise(np.floor(x / 2), np.floor(y / 2), 41)
    edges = smooth01(sobel(luma(painted) / 255) / 0.12)
    return soft * (paper * (1 - 0.22 * edges))[..., None]


def _portrait(rgb: np.ndarray) -> np.ndarray:
    painted, _ = kuwahara(rgb, 4)
    h, w = rgb.shape[:2]
    x, y = grid((h, w))
    r = np.sqrt(((x - w / 2) / (0.75 * w)) ** 2 + ((y - h * 0.42) / (0.75 * h)) ** 2)
    vignette = 1 - 0.35 * np.clip(r, 0, 1) ** 2
    canvas = paint_texture((h, w), seed=29, brush_angle=-0.6, canvas_scale=1.2)
    headroom = np.minimum(painted, 255 - painted) / 127.5
    varnished = painted * np.array(VARNISH) * vignette[..., None]
    return np.clip(varnished + 0.5 * canvas[..., None] * headroom, 0, 255)


DRAW = {"sancerre-cartoon": _cartoon, "fougeres-comic": _comic, "banyuls-wash": _wash, "chambord-portrait": _portrait}


def illustrate(look: str, image: np.ndarray, params: Mapping[str, Any] | None = None) -> ArtisticResult:
    if look not in LOOKS:
        raise ValueError(f"look must be one of {', '.join(LOOKS)}")
    src = photo(image)
    amount = number(parameters(params, DEFAULTS)["amount"], "amount", 0, 1)
    drawn = np.clip(DRAW[look](src[..., :3].astype(np.float64)), 0, 255)
    support = np.full(src.shape[:2], amount, dtype=np.float64)
    out = blend(src, drawn, support)
    lightness = float(luma(out[..., :3]).mean() - luma(src[..., :3]).mean())
    return result(look, src, out, support, LABEL,
                  {"geometry_displacement": 0.0, "look": look, "mean_luma_change": lightness},
                  ("Illustration of your own photo; no costume, body, face or background is generated.",))
