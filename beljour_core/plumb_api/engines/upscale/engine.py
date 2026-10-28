'Classical 2x/4x edge-directed upscale, no neural weights. Author: John Khan.'
from __future__ import annotations

from typing import Any

import numpy as np

from .edge import directional_restore
from .kernels import box_blur, cubic_resize


def validate(image: Any) -> np.ndarray:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8 or image.ndim != 3 or (image.shape[2] not in (3, 4)):
        raise ValueError('upscale expects RGB/RGBA uint8')
    if min(image.shape[:2]) < 8:
        raise ValueError('image too small')
    return image

def _channel(channel: np.ndarray, scale: int, detail: float) -> np.ndarray:
    enlarged = cubic_resize(channel, scale)
    restored = directional_restore(enlarged, 0.22 + 0.28 * detail)
    blur = box_blur(restored)
    sharpened = restored + (restored - blur) * (0.16 + 0.2 * detail)
    neighborhood = np.stack(
        [
            restored,
            np.roll(restored, 1, axis=0),
            np.roll(restored, -1, axis=0),
            np.roll(restored, 1, axis=1),
            np.roll(restored, -1, axis=1),
        ]
    )
    lo = np.min(neighborhood, axis=0) - 4
    hi = np.max(neighborhood, axis=0) + 4
    return np.clip(np.minimum(np.maximum(sharpened, lo), hi), 0, 255)

def upscale(image: np.ndarray, scale: int=2, detail: float=0.55) -> np.ndarray:
    src = validate(image)
    if scale not in (2, 4):
        raise ValueError('scale must be 2 or 4')
    if not isinstance(detail, (int, float)) or isinstance(detail, bool) or (not 0 <= float(detail) <= 1):
        raise ValueError('detail must be 0..1')
    out = np.empty((src.shape[0] * scale, src.shape[1] * scale, src.shape[2]), dtype=np.uint8)
    for c in range(3):
        out[..., c] = np.rint(_channel(src[..., c], scale, float(detail))).astype(np.uint8)
    if src.shape[2] == 4:
        out[..., 3] = np.rint(cubic_resize(src[..., 3], scale)).clip(0, 255).astype(np.uint8)
    return out
