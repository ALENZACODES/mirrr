'Local stubble/short-beard clean shave estimate. Author: John Khan.'
from __future__ import annotations

from typing import Any

import numpy as np


def _validate_mask(value: Any, shape: tuple[int, int]) -> np.ndarray:
    mask = np.asarray(value, dtype=np.float64)
    if mask.shape != shape or not np.all(np.isfinite(mask)) or np.any(mask < 0) or np.any(mask > 1):
        raise ValueError('beard mask invalid')
    return mask

def _blur(rgb: np.ndarray) -> np.ndarray:
    pad = np.pad(rgb, ((2, 2), (2, 2), (0, 0)), mode='edge')
    out = np.zeros_like(rgb, dtype=float)
    for dy in range(5):
        for dx in range(5):
            out += pad[dy:dy + rgb.shape[0], dx:dx + rgb.shape[1]]
    return out / 25

def render(image: np.ndarray, beard_mask: Any, cheek_mask: Any, amount: float=1.0) -> tuple[np.ndarray, dict[str, float | str | bool]]:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8 or image.ndim != 3 or (image.shape[2] not in (3, 4)):
        raise ValueError('image must be RGB/RGBA uint8')
    if not isinstance(amount, (int, float)) or isinstance(amount, bool) or (not 0 <= float(amount) <= 1):
        raise ValueError('amount must be 0..1')
    beard = _validate_mask(beard_mask, image.shape[:2])
    cheek = _validate_mask(cheek_mask, image.shape[:2])
    rgb = image[..., :3].astype(float)
    blur = _blur(rgb)
    active = cheek > 0.2
    cheek_colour = np.median(rgb[active], axis=0) if np.any(active) else np.median(rgb.reshape(-1, 3), axis=0)
    target = blur * 0.75 + cheek_colour * 0.25
    alpha = (beard * float(amount) * 0.82)[..., None]
    out = image.copy()
    out[..., :3] = np.clip(rgb * (1 - alpha) + target * alpha, 0, 255).astype(np.uint8)
    if image.shape[2] == 4:
        out[..., 3] = image[..., 3]
    delta = float(np.mean(np.linalg.norm(out[..., :3].astype(float)[active] - rgb[active], axis=1)) / 2.3) if np.any(active) else 0.0
    return (out, {'label': 'clean-shave visual estimate', 'simulation': True, 'cheek_delta_e_proxy': delta, 'suitable_scope': 'stubble and short beards only'})
