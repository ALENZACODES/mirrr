"""Drawn textures and shared-mesh construction for artistic tests. Author: John Khan."""
from __future__ import annotations

import numpy as np

from plumb_api.engines.core import regions
from plumb_api.engines.proportions.synthetic import symmetric_face


def drawn(width: int = 80, height: int = 96, *, tone: int = 130,
          rgba: bool = False) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    yy, xx = np.mgrid[:height, :width]
    rgb = np.stack([(tone + xx * 2 + yy) % 256, (tone + yy * 3) % 256,
                    (tone + xx + (yy // 4 % 2) * 30) % 256], axis=2).astype(np.uint8)
    if rgba:
        alpha = np.where(xx < 3, 0, np.where(xx < 6, 117, 255)).astype(np.uint8)
        rgb = np.dstack((rgb, alpha))
    mesh = symmetric_face(400, 500, face_width=260, face_length=360) / np.array([400, 500])
    hair = ((yy < height * 0.14) | ((xx < width * 0.12) & (yy < height * 0.7))).astype(float)
    hair[int(height * 0.14), :] = 0.35
    eyes = regions.region_mask("eyes", mesh, height, width, supersample=2)
    return rgb, mesh, hair, eyes


def direct_quadrants(rgb: np.ndarray, radius: int) -> np.ndarray:
    """Independent O(radius²) oracle; never imports the production integral kernel."""
    h, w = rgb.shape[:2]
    out = np.zeros_like(rgb, dtype=float)
    for y in range(h):
        for x in range(w):
            means, scores = [], []
            for dy, dx in ((-1, -1), (-1, 1), (1, -1), (1, 1)):
                rows = range(max(0, y - radius), y + 1) if dy < 0 else range(y, min(h, y + radius + 1))
                cols = range(max(0, x - radius), x + 1) if dx < 0 else range(x, min(w, x + radius + 1))
                samples = np.array([rgb[j, i] for j in rows for i in cols], dtype=float)
                means.append(np.mean(samples, axis=0))
                scores.append(float(np.sum(np.var(samples, axis=0))))
            best = 0
            for k in range(1, 4):
                if scores[k] < scores[best] - 1e-8:
                    best = k
            out[y, x] = means[best]
    return out
