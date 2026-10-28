'Synthetic makeup fixtures. Author: John Khan.'
from __future__ import annotations

import numpy as np


def photo(height: int=112, width: int=96, dark: bool=True) -> np.ndarray:
    yy, xx = np.mgrid[:height, :width]
    base = 72 if dark else 152
    out = np.zeros((height, width, 4), dtype=np.uint8)
    out[..., 0] = np.clip(base + xx * 0.12 + yy * 0.08, 0, 255).astype(np.uint8)
    out[..., 1] = np.clip(base * 0.72 + xx * 0.1 + yy * 0.07, 0, 255).astype(np.uint8)
    out[..., 2] = np.clip(base * 0.62 + xx * 0.08 + yy * 0.05, 0, 255).astype(np.uint8)
    out[..., 3] = 255
    return out

def masks(height: int=112, width: int=96) -> dict[str, np.ndarray]:
    yy, xx = np.mgrid[:height, :width]
    x = xx / max(width - 1, 1)
    y = yy / max(height - 1, 1)
    skin = (((x - 0.5) / 0.32) ** 2 + ((y - 0.48) / 0.39) ** 2 <= 1).astype(float)
    lip = (((x - 0.5) / 0.12) ** 2 + ((y - 0.68) / 0.045) ** 2 <= 1).astype(float)
    cheek = ((((x - 0.34) / 0.1) ** 2 + ((y - 0.55) / 0.06) ** 2 <= 1) | (((x - 0.66) / 0.1) ** 2 + ((y - 0.55) / 0.06) ** 2 <= 1)).astype(float)
    eye = ((((x - 0.37) / 0.11) ** 2 + ((y - 0.4) / 0.045) ** 2 <= 1) | (((x - 0.63) / 0.11) ** 2 + ((y - 0.4) / 0.045) ** 2 <= 1)).astype(float)
    return {'skin': skin, 'lip': lip, 'cheek': cheek, 'eye': eye, 'palette_region': skin}
