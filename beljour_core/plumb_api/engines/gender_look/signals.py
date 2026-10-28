'Signal measurement for full-look previews. Author: John Khan.'
from __future__ import annotations

import numpy as np


def darkness(image: np.ndarray, mask: np.ndarray) -> float:
    active = mask > 0.2
    if not np.any(active):
        return 0.0
    return float(255 - np.mean(image[..., :3].astype(float)[active])) / 255

def texture(image: np.ndarray, mask: np.ndarray) -> float:
    grey = np.mean(image[..., :3].astype(float), axis=2)
    gx = np.zeros_like(grey)
    gy = np.zeros_like(grey)
    gx[:, 1:-1] = (grey[:, 2:] - grey[:, :-2]) * 0.5
    gy[1:-1] = (grey[2:] - grey[:-2]) * 0.5
    active = mask > 0.2
    return float(np.mean(np.hypot(gx, gy)[active])) if np.any(active) else 0.0

def signal_report(before: np.ndarray, after: np.ndarray, masks: dict[str, np.ndarray]) -> dict[str, float]:
    return {'brow_darkness_before': darkness(before, masks['brow']), 'brow_darkness_after': darkness(after, masks['brow']), 'skin_texture_before': texture(before, masks['skin']), 'skin_texture_after': texture(after, masks['skin']), 'stubble_darkness_before': darkness(before, masks['stubble']), 'stubble_darkness_after': darkness(after, masks['stubble'])}
