"""Ink Study: flat cel shading with explicit hair and eye colour locks.

The quantizer scales the original RGB triplet by a quantized luminance, keeping
its hue until channel clipping. A Sobel magnitude darkens ink contours. Every
pixel touched by either protection mask is copied exactly from the input; a
soft protection boundary is deliberately conservative, never a recolour halo.
The drawing changes tone only, with no coordinate transform. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np

from .types import ArtisticResult, Plane, blend, integer, luma, mask, number, parameters, photo, result, smooth01

DEFAULTS = {"amount": 0.75, "levels": 5, "ink": 0.65, "edge_threshold": 0.09,
            "edge_softness": 0.14, "shadow": 0.18}
LABEL = "Ink Study simulation. Hair and eye colours are copied from your photo."


def sobel(values: Plane) -> Plane:
    padded = np.pad(values, 1, mode="edge")
    tl, tc, tr = padded[:-2, :-2], padded[:-2, 1:-1], padded[:-2, 2:]
    ml, mr = padded[1:-1, :-2], padded[1:-1, 2:]
    bl, bc, br = padded[2:, :-2], padded[2:, 1:-1], padded[2:, 2:]
    dx = (tr + 2 * mr + br - tl - 2 * ml - bl) / 8
    dy = (bl + 2 * bc + br - tl - 2 * tc - tr) / 8
    return np.sqrt(dx * dx + dy * dy)


def cel_rgb(rgb: np.ndarray, *, levels: int, ink: float, edge_threshold: float,
            edge_softness: float, shadow: float) -> tuple[Plane, Plane]:
    lum = luma(rgb) / 255
    # A zero-luminance pixel has no chroma to scale; leave it black.
    band = np.floor(lum * (levels - 1) + 0.5) / (levels - 1)
    band = np.clip(band - shadow * (1 - smooth01((lum - 0.25) / 0.5)) * 0.12, 0, 1)
    scale = band / np.maximum(lum, 1 / 255)
    flat = np.clip(rgb * scale[..., None], 0, 255)
    edge = smooth01((sobel(lum) - edge_threshold) / edge_softness)
    return flat * (1 - ink * edge[..., None]), edge


def ink_study(image: np.ndarray, hair_mask: Any, eye_mask: Any,
              params: Mapping[str, Any] | None = None) -> ArtisticResult:
    src = photo(image)
    p = parameters(params, DEFAULTS)
    amount = number(p["amount"], "amount", 0, 1)
    levels = integer(p["levels"], "levels", 2, 12)
    ink = number(p["ink"], "ink", 0, 1)
    threshold = number(p["edge_threshold"], "edge_threshold", 0, 0.5)
    softness = number(p["edge_softness"], "edge_softness", 0.005, 0.5)
    shadow = number(p["shadow"], "shadow", 0, 1)
    hair = mask(hair_mask, src.shape[:2], "hair_mask")
    eyes = mask(eye_mask, src.shape[:2], "eye_mask")
    protected = (hair > 0) | (eyes > 0)
    support = (~protected).astype(np.float64) * amount
    flat, edge = cel_rgb(src[..., :3].astype(float), levels=levels, ink=ink,
                         edge_threshold=threshold, edge_softness=softness, shadow=shadow)
    out = blend(src, flat, support)
    error = np.abs(out[..., :3].astype(float) - src[..., :3].astype(float))
    return result("ink-study", src, out, support, LABEL,
                  {"hair_max_error": float(np.max(error[hair > 0], initial=0)),
                   "eye_max_error": float(np.max(error[eyes > 0], initial=0)),
                   "geometry_displacement": 0.0, "ink_coverage": float(np.mean(edge)),
                   "protection_pixels": float(np.count_nonzero(protected)),
                   "quantization_levels": float(levels)},
                  ("Procedural illustration; this does not generate a new face or hairstyle.",))
