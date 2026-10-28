'Texture-preserving hair colour operations. Author: John Khan.'
from __future__ import annotations

import numpy as np


def luminance(rgb: np.ndarray) -> np.ndarray:
    data = np.asarray(rgb, dtype=np.float64)
    return 0.2126 * data[..., 0] + 0.7152 * data[..., 1] + 0.0722 * data[..., 2]

def recolour(image: np.ndarray, mask: np.ndarray, colour: tuple[int, int, int], amount: float, preserve_luma: float=0.75) -> np.ndarray:
    if amount <= 0:
        return image.copy()
    rgb = image[..., :3].astype(np.float64)
    target = np.asarray(colour, dtype=np.float64)
    src_luma = luminance(rgb)[..., None]
    target_luma = max(float(luminance(target)), 1.0)
    normalized = target[None, None, :] * (src_luma / target_luma)
    styled = preserve_luma * normalized + (1 - preserve_luma) * target
    alpha = np.clip(mask * amount, 0, 1)[..., None]
    out = image.copy()
    out[..., :3] = np.clip(rgb * (1 - alpha) + styled * alpha, 0, 255).astype(np.uint8)
    return out

def blend_grey(image: np.ndarray, mask: np.ndarray, share: float, amount: float) -> np.ndarray:
    rgb = image[..., :3].astype(np.float64)
    y = luminance(rgb)
    neutral = np.stack([y * 1.08 + 18, y * 1.07 + 17, y * 1.06 + 16], axis=-1)
    alpha = np.clip(mask * share * amount, 0, 1)[..., None]
    out = image.copy()
    out[..., :3] = np.clip(rgb * (1 - alpha) + neutral * alpha, 0, 255).astype(np.uint8)
    return out

def chroma_energy(image: np.ndarray, mask: np.ndarray) -> float:
    rgb = image[..., :3].astype(np.float64)
    maximum = np.max(rgb, axis=2)
    minimum = np.min(rgb, axis=2)
    active = mask > 0.2
    if not np.any(active):
        return 0.0
    return float(np.mean((maximum - minimum)[active]))

def foil_pattern(mask: np.ndarray, count: int, phase: float=0.0) -> np.ndarray:
    _, w = mask.shape
    xx = np.arange(w, dtype=np.float64)[None, :] / max(w - 1, 1)
    stripes = 0.5 + 0.5 * np.cos((xx + phase) * np.pi * max(count, 1))
    return mask * (stripes > 0.55)
