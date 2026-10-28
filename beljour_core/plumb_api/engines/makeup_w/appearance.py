'Finish, texture and minimum-product appearance metrics. Author: John Khan.'
from __future__ import annotations

import numpy as np


def local_variance(image: np.ndarray, mask: np.ndarray) -> float:
    grey = np.mean(image[..., :3].astype(float), axis=2)
    pad = np.pad(grey, 1, mode='edge')
    mean = np.zeros_like(grey)
    sq = np.zeros_like(grey)
    for dy in range(3):
        for dx in range(3):
            tile = pad[dy:dy + grey.shape[0], dx:dx + grey.shape[1]]
            mean += tile
            sq += tile * tile
    mean /= 9
    variance = np.maximum(sq / 9 - mean * mean, 0)
    active = mask > 0.2
    return float(np.mean(variance[active])) if np.any(active) else 0.0

def highlight_share(image: np.ndarray, mask: np.ndarray) -> float:
    rgb = image[..., :3].astype(float)
    luma = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    active = mask > 0.2
    if not np.any(active):
        return 0.0
    threshold = float(np.quantile(luma[active], 0.82))
    return float(np.mean(luma[active] >= threshold))

def finish_metrics(before: np.ndarray, after: np.ndarray, mask: np.ndarray) -> dict[str, float]:
    base_var = local_variance(before, mask)
    out_var = local_variance(after, mask)
    return {'texture_variance_ratio': out_var / max(base_var, 1e-09), 'before_highlight_share': highlight_share(before, mask), 'after_highlight_share': highlight_share(after, mask)}

def product_budget(feature: str) -> tuple[str, ...]:
    if feature == 'W16':
        return ('skin tint or spot concealer', 'single cheek/lip colour', 'optional brow grooming')
    if feature in {'W7', 'W8'}:
        return ('one complexion product',)
    if feature in {'W11', 'W12'}:
        return ('one colour product', 'optional brush or fingers')
    return ()
