'Non-geometric full-look signals: brows, skin texture, imported stubble masks. Author: John Khan.'
from __future__ import annotations

from typing import Any

import numpy as np

from .contracts import GenderLookRequest, mask, parse


def _tint(image: np.ndarray, area: np.ndarray, colour: tuple[int, int, int], strength: float) -> np.ndarray:
    rgb = image[..., :3].astype(float)
    target = np.asarray(colour, float)
    alpha = np.clip(area * strength, 0, 1)[..., None]
    out = image.copy()
    out[..., :3] = np.clip(rgb * (1 - alpha) + target * alpha, 0, 255).astype(np.uint8)
    return out

def render(image: np.ndarray, masks: dict[str, Any], value: dict[str, Any] | GenderLookRequest) -> tuple[np.ndarray, dict[str, Any]]:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8 or image.ndim != 3 or (image.shape[2] not in (3, 4)):
        raise ValueError('image must be RGB/RGBA uint8')
    req = parse(value)
    brow = mask(masks.get('brow'), image.shape[:2], 'brow')
    skin = mask(masks.get('skin'), image.shape[:2], 'skin')
    stubble = mask(masks.get('stubble', np.zeros(image.shape[:2])), image.shape[:2], 'stubble')
    scale = {'normal': 0.45, 'extra': 0.72, 'hyper': 1.0}[req.level] * req.amount
    out = image.copy()
    if req.direction == 'feminine':
        out = _tint(out, brow, (72, 48, 42), scale * 0.35)
        out = _tint(out, stubble, (120, 92, 78), scale * 0.45)
    elif req.direction == 'masculine':
        out = _tint(out, brow, (52, 39, 34), scale * 0.45)
        out = _tint(out, stubble, (48, 41, 37), scale * 0.28)
    if req.direction != 'neutral':
        rgb = out[..., :3].astype(float)
        pad = np.pad(rgb, ((1, 1), (1, 1), (0, 0)), mode='edge')
        blur = sum(pad[dy:dy + rgb.shape[0], dx:dx + rgb.shape[1]] for dy in range(3) for dx in range(3)) / 9
        factor = (-0.1 if req.direction == 'feminine' else 0.1) * scale
        styled = rgb + (rgb - blur) * factor
        alpha = (skin * scale * 0.25)[..., None]
        out[..., :3] = np.clip(rgb * (1 - alpha) + styled * alpha, 0, 255).astype(np.uint8)
    if image.shape[2] == 4:
        out[..., 3] = image[..., 3]
    return (out, {'direction': req.direction, 'level': req.level, 'simulation': True, 'identity_geometry_changed': False, 'stubble_source': 'imported existing beard-region mask'})
