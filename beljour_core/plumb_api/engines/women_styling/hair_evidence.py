"""Independent Lab-space hair-colour measurement for W28 and W39.

Separates apparent channel changes from measured CIELAB lightness and
chroma; never fabricates a physical dye result or a real-face pass. A mask
and both untouched/rendered frames must come from the authorized runner.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from plumb_api.engines.shade.colourspace import srgb_to_lab


@dataclass(frozen=True, slots=True)
class HairChangeEvidence:
    feature: Literal["W28", "W39"]
    hair_pixels: int
    changed_hair_pixels: int
    outside_mask_changed: int
    alpha_changed: int
    lightness_delta_lstar: float
    chroma_delta_de76: float
    mean_rgb_delta: tuple[float, float, float]
    maximum_channel_delta: int
    status: Literal["UNPROVEN"] = "UNPROVEN"


def measure_hair_change(
    before: NDArray[np.uint8],
    after: NDArray[np.uint8],
    mask: NDArray[np.uint8],
    feature: Literal["W28", "W39"],
) -> HairChangeEvidence:
    """Measure only authorized core hair pixels, never infer a hair mask."""
    if feature not in ("W28", "W39"):
        raise ValueError("Only two registered colour features can be measured")
    if before.dtype != np.uint8 or after.dtype != np.uint8 or before.shape != after.shape:
        raise ValueError("Before and after must be equal uint8 frames")
    if before.ndim != 3 or before.shape[2] not in (3, 4):
        raise ValueError("RGB or RGBA frames are required")
    if mask.dtype != np.uint8 or mask.shape != before.shape[:2]:
        raise ValueError("A validated same-sized uint8 hair mask is required")
    hair = mask >= 128
    if int(np.count_nonzero(hair)) < 16:
        raise ValueError("Insufficient positive hair pixels for a comparison")
    source_rgb = before[..., :3]
    output_rgb = after[..., :3]
    difference = output_rgb.astype(np.int16) - source_rgb.astype(np.int16)
    changed = np.any(difference != 0, axis=2)
    outside = int(np.count_nonzero(changed & (mask == 0)))
    alpha = int(np.count_nonzero(before[..., 3] != after[..., 3])) if before.shape[2] == 4 else 0
    initial_lab = srgb_to_lab(source_rgb[hair].astype(np.float64))
    edited_lab = srgb_to_lab(output_rgb[hair].astype(np.float64))
    lightness = float(np.mean(edited_lab[:, 0] - initial_lab[:, 0]))
    chroma_shift = np.sqrt(np.sum((edited_lab[:, 1:] - initial_lab[:, 1:]) ** 2, axis=1))
    colour_delta = float(np.mean(chroma_shift))
    rgb = np.mean(difference[hair].astype(np.float64), axis=0)
    return HairChangeEvidence(
        feature=feature,
        hair_pixels=int(np.count_nonzero(hair)),
        changed_hair_pixels=int(np.count_nonzero(changed & hair)),
        outside_mask_changed=outside,
        alpha_changed=alpha,
        lightness_delta_lstar=round(lightness, 5),
        chroma_delta_de76=round(colour_delta, 5),
        mean_rgb_delta=(round(float(rgb[0]), 5), round(float(rgb[1]), 5), round(float(rgb[2]), 5)),
        maximum_channel_delta=int(np.max(np.abs(difference))),
    )
