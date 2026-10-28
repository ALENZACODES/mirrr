'Reference resamplers used only for objective comparison. Author: John Khan.'
from __future__ import annotations

import numpy as np


def bilinear(channel: np.ndarray, scale: int) -> np.ndarray:
    src = np.asarray(channel, dtype=float)
    h, w = src.shape
    oh, ow = (h * scale, w * scale)
    out = np.empty((oh, ow), float)
    for y in range(oh):
        sy = (y + 0.5) / scale - 0.5
        y0 = int(np.floor(sy))
        y1 = y0 + 1
        fy = sy - y0
        y0 = min(max(y0, 0), h - 1)
        y1 = min(max(y1, 0), h - 1)
        for x in range(ow):
            sx = (x + 0.5) / scale - 0.5
            x0 = int(np.floor(sx))
            x1 = x0 + 1
            fx = sx - x0
            x0 = min(max(x0, 0), w - 1)
            x1 = min(max(x1, 0), w - 1)
            top = src[y0, x0] * (1 - fx) + src[y0, x1] * fx
            bottom = src[y1, x0] * (1 - fx) + src[y1, x1] * fx
            out[y, x] = top * (1 - fy) + bottom * fy
    return out

def resize_image(image: np.ndarray, scale: int) -> np.ndarray:
    out = np.empty((image.shape[0] * scale, image.shape[1] * scale, image.shape[2]), dtype=np.uint8)
    for c in range(image.shape[2]):
        out[..., c] = np.clip(np.rint(bilinear(image[..., c], scale)), 0, 255).astype(np.uint8)
    return out

def synthetic_detail(height: int=64, width: int=64) -> np.ndarray:
    yy, xx = np.mgrid[:height, :width]
    out = np.zeros((height, width, 3), dtype=np.uint8)
    checker = (xx // 4 + yy // 4) % 2 * 35
    diagonal = (xx > yy).astype(int) * 45
    ring = (np.abs(np.hypot(xx - width / 2, yy - height / 2) - height * 0.22) < 1.5) * 50
    out[..., 0] = np.clip(70 + checker + diagonal + ring, 0, 255)
    out[..., 1] = np.clip(62 + checker * 0.7 + ring, 0, 255)
    out[..., 2] = np.clip(58 + checker * 0.5 + diagonal * 0.4, 0, 255)
    return out

def downsample_box(image: np.ndarray, scale: int) -> np.ndarray:
    h = image.shape[0] // scale * scale
    w = image.shape[1] // scale * scale
    crop = image[:h, :w].astype(float)
    reshaped = crop.reshape(h // scale, scale, w // scale, scale, image.shape[2])
    return np.rint(np.mean(reshaped, axis=(1, 3))).astype(np.uint8)
