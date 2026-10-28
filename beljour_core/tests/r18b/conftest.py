"""Synthetic helpers for R18B Lane-B evidence tests. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest


@pytest.fixture
def rgba_image() -> np.ndarray:
    height, width = 48, 52
    yy, xx = np.mgrid[:height, :width]
    image = np.zeros((height, width, 4), dtype=np.uint8)
    image[..., 0] = np.clip(58 + xx * 2 + yy // 5, 0, 255)
    image[..., 1] = np.clip(45 + yy * 2 + xx // 7, 0, 255)
    image[..., 2] = np.clip(38 + (xx + yy) // 3, 0, 255)
    image[..., 3] = 255
    return image


@pytest.fixture
def center_mask() -> np.ndarray:
    mask = np.zeros((48, 52), dtype=np.float64)
    mask[10:38, 12:40] = 1.0
    return mask


def inset(mask: np.ndarray, amount: int = 4) -> np.ndarray:
    ys, xs = np.nonzero(mask > 0.5)
    result = np.zeros_like(mask)
    if not len(ys):
        return result
    y0, y1 = int(ys.min()) + amount, int(ys.max()) - amount + 1
    x0, x1 = int(xs.min()) + amount, int(xs.max()) - amount + 1
    if y1 > y0 and x1 > x0:
        result[y0:y1, x0:x1] = 1.0
    return result


def tint(image: np.ndarray, mask: np.ndarray, delta: tuple[int, int, int] = (4, 0, 0)) -> np.ndarray:
    result = image.copy()
    active = mask > 0.5
    rgb = result[..., :3].astype(np.int16)
    for channel, change in enumerate(delta):
        rgb[..., channel][active] = np.clip(rgb[..., channel][active] + change, 0, 255)
    result[..., :3] = rgb.astype(np.uint8)
    return result


def digest(seed: int) -> str:
    return f"{seed:064x}"[-64:]
