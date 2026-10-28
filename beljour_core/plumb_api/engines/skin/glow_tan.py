"""Undertone-dependent optical tan with deterministic in-skin freckle detail.

No upward lightness shift, no ethnicity or race inference. The caller supplies a
skin-only mask and a consented undertone measurement. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from plumb_api.engines.shade.colourspace import lab_to_srgb, srgb_to_lab, to_bytes

SHIFTS = {"olive": (0.5, 4.2), "cool": (2.4, 2.0), "warm": (0.9, 4.4), "neutral": (1.5, 3.1)}
LABEL = "Summer colour simulation with optional synthetic freckles; not a UV exposure guide."


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    alpha: np.ndarray
    reason: str
    freckles_seeded: int


def _random_step(value: int) -> int:
    return (1664525 * value + 1013904223) & 0xffffffff


def glow_tan(image: np.ndarray, skin: np.ndarray, *, undertone: str = "neutral",
             strength: float = 55.0, freckles: bool = False, seed: int = 41) -> Result:
    if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] != 3 or min(image.shape[:2]) < 8:
        raise ValueError("tan requires an RGB uint8 photograph >=8px")
    if skin.shape != image.shape[:2] or not np.isfinite(skin).all() or np.any((skin < 0) | (skin > 1)):
        raise ValueError("skin mask must be a 0..1 plane")
    if undertone not in SHIFTS:
        raise ValueError("undertone must be olive, cool, warm or neutral")
    if not np.isfinite(strength) or not 0 <= strength <= 100:
        raise ValueError("strength must be 0..100")
    if not isinstance(seed, int) or seed < 0 or seed > 0xffffffff:
        raise ValueError("freckle seed must be unsigned 32-bit")
    alpha = np.where(skin >= 0.5, strength / 100.0, 0.0)
    if not np.any(alpha):
        return Result(image.copy(), alpha, "no observed skin or zero strength", 0)
    lab = srgb_to_lab(image)
    revised = lab.copy()
    revised[..., 0] -= 4 * alpha
    revised[..., 1] += alpha * SHIFTS[undertone][0]
    revised[..., 2] += alpha * SHIFTS[undertone][1]
    count = 0
    if freckles:
        state = seed
        h, w = skin.shape
        n = min(120, max(12, (w * h) // 400))
        radius_scale = max(0.75, min(w, h) / 100)
        for _ in range(n):
            state = _random_step(state)
            cx = (0.22 + 0.56 * (state / 4294967296)) * (w - 1)
            state = _random_step(state)
            cy = (0.25 + 0.40 * (state / 4294967296)) * (h - 1)
            state = _random_step(state)
            radius = radius_scale * (0.75 + 0.65 * (state / 4294967296))
            mx, my = round(cx), round(cy)
            if skin[my, mx] < 0.5:
                continue
            x0, x1 = max(0, int(cx - 3 * radius)), min(w, int(cx + 3 * radius) + 2)
            y0, y1 = max(0, int(cy - 3 * radius)), min(h, int(cy + 3 * radius) + 2)
            yy, xx = np.mgrid[y0:y1, x0:x1]
            dots = np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * radius ** 2))
            revised[y0:y1, x0:x1, 0] -= 5 * alpha[y0:y1, x0:x1] * dots
            count += 1
    # Explicit non-lightening even after gamut mapping and byte conversion:
    # output L* is checked after quantization against each input skin pixel.
    encoded = to_bytes(lab_to_srgb(revised))
    result = image.copy()
    valid = alpha > 0
    result[valid] = encoded[valid]
    # Converting back to sRGB at the gamut boundary may increase L* by one
    # channel step, so revert any pixel that violates the no-lightening rule.
    output_l = srgb_to_lab(result)[..., 0]
    wrong = valid & (output_l > lab[..., 0] + 1e-7)
    result[wrong] = image[wrong]
    return Result(result, alpha, "measured local colour edit", count)
