'Texture-preserving colour transforms for Skin & More. Author: John Khan.'

from __future__ import annotations

import numpy as np


def recolour(image: np.ndarray, mask: np.ndarray, colour: tuple[int, int, int], amount: float, preserve_texture: float=1) -> np.ndarray:
    out = image.copy()
    rgb = out[..., :3].astype(float)
    c = np.asarray(colour, float)
    lum = rgb.mean(axis=2, keepdims=True)
    target = c * (0.64 + 0.36 * lum / 255)
    target = target * preserve_texture + c * (1 - preserve_texture)
    a = (np.clip(mask, 0, 1) * amount)[..., None]
    out[..., :3] = np.clip(rgb * (1 - a) + target * a, 0, 255).astype(np.uint8)
    return out

def cast(image: np.ndarray, mask: np.ndarray, amount: float, tint: tuple[int, int, int]=(235, 238, 235)) -> np.ndarray:
    return recolour(image, mask, tint, amount, 0.9)

def neutralise(image: np.ndarray, mask: np.ndarray, channel: str, amount: float) -> np.ndarray:
    rgb = image[..., :3].astype(float)
    out = image.copy()
    a = np.clip(mask * amount, 0, 1)
    target = rgb.copy()
    if channel == 'red':
        target[..., 0] = target[..., 0] * 0.82 + target[..., 1] * 0.18
    elif channel == 'orange':
        target[..., 0] *= 0.9
        target[..., 1] *= 1.04
    elif channel == 'grey':
        target[..., 0] *= 1.03
        target[..., 1] *= 1.02
        target[..., 2] *= 0.94
    out[..., :3] = np.clip(rgb * (1 - a[..., None]) + target * a[..., None], 0, 255).astype(np.uint8)
    return out

def continuity_score(image: np.ndarray, a: np.ndarray, b: np.ndarray) -> float:
    rgb = image[..., :3].astype(float)
    if np.count_nonzero(a) < 2 or np.count_nonzero(b) < 2:
        return 0
    ma = rgb[a > 0.5].mean(axis=0)
    mb = rgb[b > 0.5].mean(axis=0)
    return float(np.linalg.norm(ma - mb) / 441.673)
