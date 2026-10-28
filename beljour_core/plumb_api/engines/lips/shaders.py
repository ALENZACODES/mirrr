'Texture-preserving lip colour and finish shaders. Author: John Khan.'

from __future__ import annotations

import numpy as np


def blend_colour(image: np.ndarray, mask: np.ndarray, colour: tuple[int, int, int], opacity: float, preserve_texture: float=1.0) -> np.ndarray:
    rgb = image[..., :3].astype(np.float32)
    c = np.asarray(colour, dtype=np.float32)
    lum = (rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722)[..., None]
    target = c[None, None, :] * (0.62 + 0.38 * (lum / 255))
    target = target * preserve_texture + c * (1 - preserve_texture)
    a = (np.clip(mask, 0, 1) * opacity)[..., None]
    out = rgb * (1 - a) + target * a
    result = image.copy()
    result[..., :3] = np.clip(out, 0, 255).astype(np.uint8)
    return result

def add_gloss(image: np.ndarray, mask: np.ndarray, shine: float) -> np.ndarray:
    if shine <= 0:
        return image.copy()
    h, w = image.shape[:2]
    yy, xx = np.mgrid[:h, :w]
    cx = w * 0.5
    cy = h * 0.59
    spot = np.exp(-(((xx - cx) / (w * 0.12 + 1)) ** 2 + ((yy - cy) / (h * 0.025 + 1)) ** 2) * 3)
    a = (mask * spot * shine * 0.65)[..., None]
    out = image.copy()
    rgb = out[..., :3].astype(np.float32)
    out[..., :3] = np.clip(rgb * (1 - a) + 255 * a, 0, 255).astype(np.uint8)
    return out

def matte(image: np.ndarray, mask: np.ndarray, amount: float) -> np.ndarray:
    rgb = image[..., :3].astype(np.float32)
    local = (np.roll(rgb, 1, 0) + np.roll(rgb, -1, 0) + np.roll(rgb, 1, 1) + np.roll(rgb, -1, 1)) / 4
    high = np.maximum(rgb - local, 0)
    a = (mask * amount * 0.55)[..., None]
    out = image.copy()
    out[..., :3] = np.clip(rgb - high * a, 0, 255).astype(np.uint8)
    return out

def stain_asymmetry(mask: np.ndarray, balance: float) -> np.ndarray:
    h, w = mask.shape
    x = np.linspace(-1, 1, w)[None, :]
    bias = 1 - (0.16 + (balance - 0.5) * 0.12) * np.maximum(x, 0) - (0.16 - (balance - 0.5) * 0.12) * np.maximum(-x, 0)
    return np.clip(mask * bias, 0, 1)

def wear_mask(mask: np.ndarray, mode: str, seed: int) -> np.ndarray:
    h, w = mask.shape
    yy, xx = np.mgrid[:h, :w]
    cx = w * 0.5
    cy = h * 0.59
    centre = np.exp(-(((xx - cx) / (w * 0.09 + 1)) ** 2 + ((yy - cy) / (h * 0.035 + 1)) ** 2) * 2)
    if mode == 'coffee':
        loss = 0.46 * centre
    elif mode == 'meal':
        loss = 0.68 * centre + 0.12 * np.sin(xx * 0.13 + seed)
    else:
        loss = 0.25 * centre
    return np.clip(mask * (1 - loss), 0, 1)
