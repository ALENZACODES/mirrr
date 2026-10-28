'Procedural highlight and colour-placement maps. Author: John Khan.'
from __future__ import annotations

import numpy as np


def _coords(shape: tuple[int, int]) -> tuple[np.ndarray, np.ndarray]:
    h, w = shape
    yy, xx = np.mgrid[:h, :w]
    return (xx / max(w - 1, 1), yy / max(h - 1, 1))

def money_piece(mask: np.ndarray, width: float=0.08) -> np.ndarray:
    x, y = _coords(mask.shape)
    left = np.exp(-((x - 0.36) / max(width, 0.001)) ** 2)
    right = np.exp(-((x - 0.64) / max(width, 0.001)) ** 2)
    vertical = np.clip((y - 0.18) / 0.18, 0, 1) * np.clip((0.82 - y) / 0.2, 0, 1)
    return np.clip(mask * np.maximum(left, right) * vertical, 0, 1)

def foil_map(mask: np.ndarray, density: float, diagonal: float=0.18) -> np.ndarray:
    x, y = _coords(mask.shape)
    d = max(0.05, min(float(density), 1.0))
    frequency = 6 + 18 * d
    phase = (x + diagonal * y) * np.pi * frequency
    bands = (np.cos(phase) > 0.25 - 0.35 * d).astype(float)
    taper = np.clip((y - 0.12) / 0.2, 0, 1)
    return mask * bands * taper

def chunky_map(mask: np.ndarray, chunkiness: float) -> np.ndarray:
    x, y = _coords(mask.shape)
    c = max(0.0, min(float(chunkiness), 1.0))
    frequency = 4.0 + 5.0 * (1 - c)
    bands = (np.sin((x * frequency + y * 0.28) * np.pi * 2) > -0.05).astype(float)
    depth = np.clip((y - 0.2) / 0.15, 0, 1)
    return mask * bands * depth

def lived_in_fade(mask: np.ndarray, root_y: float, softness: float) -> np.ndarray:
    _, y = _coords(mask.shape)
    s = max(0.02, min(float(softness), 0.35))
    fade = np.clip((y - root_y) / s, 0, 1)
    fade = fade * fade * (3 - 2 * fade)
    return mask * fade

def ombre(mask: np.ndarray, start_y: float, softness: float=0.18) -> np.ndarray:
    _, y = _coords(mask.shape)
    t = np.clip((y - start_y) / max(softness, 0.001), 0, 1)
    return mask * (t * t * (3 - 2 * t))

def split_dye(mask: np.ndarray, split: float=0.5, feather: float=0.01) -> tuple[np.ndarray, np.ndarray]:
    x, _ = _coords(mask.shape)
    f = max(feather, 0.0001)
    left = np.clip((split + f - x) / (2 * f), 0, 1)
    right = 1 - left
    return (mask * left, mask * right)

def peekaboo(mask: np.ndarray, side: str, depth_start: float=0.48) -> np.ndarray:
    x, y = _coords(mask.shape)
    side_gate = x >= 0.5 if side == 'right' else x <= 0.5
    depth_gate = np.clip((y - depth_start) / 0.16, 0, 1)
    return mask * side_gate * depth_gate

def placement_statistics(mask: np.ndarray) -> dict[str, float]:
    active = mask > 0.05
    if not np.any(active):
        return {'coverage': 0.0, 'centroid_x': 0.5, 'centroid_y': 0.5}
    yy, xx = np.mgrid[:mask.shape[0], :mask.shape[1]]
    weight = np.clip(mask, 0, 1)
    total = max(float(np.sum(weight)), 1e-09)
    return {'coverage': float(np.mean(active)), 'centroid_x': float(np.sum(xx * weight) / total / max(mask.shape[1] - 1, 1)), 'centroid_y': float(np.sum(yy * weight) / total / max(mask.shape[0] - 1, 1))}
