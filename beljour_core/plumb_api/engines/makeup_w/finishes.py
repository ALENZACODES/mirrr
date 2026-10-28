'Local finish shaders preserving skin depth. Author: John Khan.'
from __future__ import annotations

import numpy as np


def _blur(rgb: np.ndarray) -> np.ndarray:
    pad = np.pad(rgb, ((1, 1), (1, 1), (0, 0)), mode='edge')
    acc = np.zeros_like(rgb, dtype=np.float64)
    for dy in range(3):
        for dx in range(3):
            acc += pad[dy:dy + rgb.shape[0], dx:dx + rgb.shape[1]]
    return acc / 9.0

def apply_tint(image: np.ndarray, mask: np.ndarray, colour: tuple[int, int, int], amount: float, *, never_lighten: bool=True) -> np.ndarray:
    rgb = image[..., :3].astype(np.float64)
    target = np.asarray(colour, dtype=np.float64)
    if never_lighten:
        src_luma = np.mean(rgb, axis=2, keepdims=True)
        target_luma = max(float(np.mean(target)), 1.0)
        target = target[None, None, :] * np.minimum(src_luma / target_luma, 1.0)
    alpha = np.clip(mask * amount, 0, 1)[..., None]
    out = image.copy()
    out[..., :3] = np.clip(rgb * (1 - alpha) + target * alpha, 0, 255).astype(np.uint8)
    return out

def apply_finish(image: np.ndarray, mask: np.ndarray, finish: str, amount: float) -> np.ndarray:
    rgb = image[..., :3].astype(np.float64)
    blur = _blur(rgb)
    detail = rgb - blur
    if finish == 'matte':
        styled = blur + detail * 0.72
    elif finish == 'dewy':
        styled = rgb + np.maximum(detail, 0) * 0.35
    elif finish == 'skin_tint':
        styled = rgb * 0.96 + blur * 0.04
    elif finish == 'powder':
        styled = np.minimum(blur + detail * 0.4 - 1.5, rgb)
    elif finish == 'cream':
        styled = np.minimum(blur + detail * 1.1 - 0.25, rgb)
    else:
        styled = rgb
    alpha = np.clip(mask * amount, 0, 1)[..., None]
    out = image.copy()
    out[..., :3] = np.clip(rgb * (1 - alpha) + styled * alpha, 0, 255).astype(np.uint8)
    return out
