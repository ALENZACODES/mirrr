'Hair/scalp mask geometry for R17B. Author: John Khan.'
from __future__ import annotations

import numpy as np

from .contracts import HairGeometry


def feather(mask: np.ndarray, radius: int=2) -> np.ndarray:
    result = np.asarray(mask, dtype=np.float64).copy()
    for _ in range(max(0, radius)):
        padded = np.pad(result, 1, mode='edge')
        acc = np.zeros_like(result)
        for dy in range(3):
            for dx in range(3):
                acc += padded[dy:dy + result.shape[0], dx:dx + result.shape[1]]
        result = acc / 9.0
    return np.clip(result, 0, 1)

def boundary(mask: np.ndarray) -> np.ndarray:
    source = np.asarray(mask, dtype=np.float64)
    padded = np.pad(source, 1, mode='edge')
    eroded = np.ones_like(source)
    for dy in range(3):
        for dx in range(3):
            eroded = np.minimum(eroded, padded[dy:dy + source.shape[0], dx:dx + source.shape[1]])
    return np.clip(source - eroded, 0, 1)

def scalp_band(mask: np.ndarray, width: int=5) -> np.ndarray:
    edge = boundary(mask)
    result = edge.copy()
    for _ in range(max(0, width - 1)):
        padded = np.pad(result, 1, mode='constant')
        expanded = np.zeros_like(result)
        for dy in range(3):
            for dx in range(3):
                expanded = np.maximum(expanded, padded[dy:dy + result.shape[0], dx:dx + result.shape[1]])
        result = expanded
    return np.clip(result * (1 - np.asarray(mask, dtype=np.float64) * 0.35), 0, 1)

def root_band(mask: np.ndarray, geometry: HairGeometry, depth: float=0.12) -> np.ndarray:
    h, _ = mask.shape
    yy = np.arange(h, dtype=np.float64)[:, None] / max(h - 1, 1)
    crown_y = geometry.crown[1]
    bottom = crown_y + depth * geometry.face_height
    vertical = ((yy >= crown_y - 0.02) & (yy <= bottom)).astype(np.float64)
    return feather(mask * vertical, 1)

def lower_hair(mask: np.ndarray, geometry: HairGeometry, split: float=0.55) -> np.ndarray:
    h, _ = mask.shape
    yy = np.arange(h, dtype=np.float64)[:, None] / max(h - 1, 1)
    threshold = geometry.crown[1] + geometry.face_height * split
    return mask * (yy >= threshold)

def side_region(mask: np.ndarray, side: str, ratio: float=0.5) -> np.ndarray:
    _, w = mask.shape
    xx = np.arange(w, dtype=np.float64)[None, :] / max(w - 1, 1)
    gate = xx <= ratio if side == 'left' else xx >= ratio
    return mask * gate.astype(np.float64)
