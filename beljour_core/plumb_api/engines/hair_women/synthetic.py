'Synthetic fixtures for R17B hair tests. Author: John Khan.'
from __future__ import annotations

import numpy as np


def photo(height: int=128, width: int=112) -> np.ndarray:
    yy, xx = np.mgrid[:height, :width]
    out = np.zeros((height, width, 4), dtype=np.uint8)
    out[..., 0] = np.clip(105 + xx * 0.35 + yy * 0.15, 0, 255).astype(np.uint8)
    out[..., 1] = np.clip(78 + xx * 0.18 + yy * 0.12, 0, 255).astype(np.uint8)
    out[..., 2] = np.clip(62 + xx * 0.12 + yy * 0.1, 0, 255).astype(np.uint8)
    out[..., 3] = 255
    return out

def masks(height: int=128, width: int=112) -> tuple[np.ndarray, np.ndarray]:
    yy, xx = np.mgrid[:height, :width]
    cx = width * 0.5
    hair = ((((xx - cx) / (width * 0.38)) ** 2 + ((yy - height * 0.34) / (height * 0.43)) ** 2 <= 1) & (yy < height * 0.79)).astype(np.float64)
    scalp = (((xx - cx) / (width * 0.21)) ** 2 + ((yy - height * 0.25) / (height * 0.1)) ** 2 <= 1).astype(np.float64)
    return (hair.astype(np.float64), scalp)

def landmarks() -> dict[str, tuple[float, float]]:
    return {'crown': (0.5, 0.08), 'left_temple': (0.28, 0.3), 'right_temple': (0.72, 0.3), 'chin': (0.5, 0.72)}
