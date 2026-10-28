"""Drawn, non-person fixtures for brow algorithm and parity tests. Author: John Khan."""
from __future__ import annotations

import math

import numpy as np

from ..core.regions import LEFT_BROW, RIGHT_BROW
from ..proportions.synthetic import symmetric_face
from .contracts import BrowEvidence
from .geometry import brow_frames, union


def brow_fixture(size: int = 128, *, tone: int = 170, grey: bool = False,
                 sparse: bool = False, roll: float = 0, rgba: bool = False,
                 asymmetric: bool = False) -> tuple[np.ndarray, np.ndarray, BrowEvidence]:
    if not 64 <= size <= 512:
        raise ValueError("fixture size must be 64..512")
    channels = 4 if rgba else 3
    yy, xx = np.mgrid[:size, :size]
    texture = ((xx * 7 + yy * 11) % 13 - 6).astype(float)
    img = np.zeros((size, size, channels), np.uint8)
    for c, delta in enumerate((8, 0, -9)):
        img[..., c] = np.clip(tone + delta + texture, 0, 255).astype(np.uint8)
    if rgba:
        img[..., 3] = 255
        img[:4, :, 3] = 0
    points = symmetric_face(size, size, face_width=size * 0.82, face_length=size * 0.85)
    # Replace the synthetic arc with a non-degenerate brow outline. These are
    # fixture coordinates, not a second canonical region-index table.
    for side, indices in enumerate((RIGHT_BROW, LEFT_BROW)):
        cx = size * (0.33 if side == 0 else 0.67)
        cy = size * (0.31 if side == 0 or not asymmetric else 0.285)
        brow_width = size * (0.27 if side == 0 or not asymmetric else 0.23)
        brow_height = size * (0.065 if side == 0 or not asymmetric else 0.075)
        for k, index in enumerate(indices):
            angle = math.pi * 2 * k / len(indices)
            points[index] = [cx + math.cos(angle) * brow_width / 2,
                             cy + math.sin(angle) * brow_height / 2]
    if roll:
        radians = math.radians(roll)
        matrix = np.array([[math.cos(radians), -math.sin(radians)],
                           [math.sin(radians), math.cos(radians)]])
        points = (points - size / 2) @ matrix.T + size / 2
    normalized = points / size
    frames = brow_frames(normalized, size, size)
    region = union(frames)
    coverage = np.zeros((size, size), float)
    grey_mask = np.zeros_like(coverage)
    for frame in frames:
        # Deliberately separated visible fragments, not a biologically asserted count.
        for i, u in enumerate((0.24, 0.46, 0.68, 0.82)):
            if sparse and i > 0:
                continue
            px, py = frame.point(u, 0.01)
            for step in range(3):
                x = int(math.floor(px + frame.across[0] * step + 0.5))
                y = int(math.floor(py + frame.across[1] * step + 0.5))
                if not (0 <= x < size and 0 <= y < size and region[y, x] > 0):
                    continue
                coverage[y, x] = 1
                if grey and i % 2 == 0:
                    grey_mask[y, x] = 1
                    img[y, x, :3] = (188, 188, 188)
                else:
                    img[y, x, :3] = (38, 31, 25)
    evidence = BrowEvidence(coverage, grey_mask, "manual", 1.0, ("Drawn fixture observations.",))
    return img, normalized, evidence
