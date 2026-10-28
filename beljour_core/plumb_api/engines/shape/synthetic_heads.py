"""Drawn 478-point heads with depth, for turn and warp tests (no person, no photo).

Every landmark lies on the drawn face: the layout comes from the symmetric test face
(proportions/synthetic.py) at a size where its filler points stay inside the oval.
Depth is an ellipsoidal head plus a nose ridge and brow and chin relief, scaled from
the face width, with small deterministic per-seed noise and optional roll. Images
have hard background edges (stripes and a dark backdrop step) so seam checks bite.
Coordinates are made up; nothing is measured from or compared with a real person.
Mesh index layout: MediaPipe Face Landmarker (runtime data); concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from ..core import regions
from ..proportions.synthetic import rolled, symmetric_face

Floats = NDArray[np.float64]
HEAD_COUNT = 12


def drawn_head(seed: int, *, width: int = 0, height: int = 0) -> tuple[Floats, NDArray[np.uint8]]:
    """(478 x 3 pixel-space XYZ mesh, H x W x 3 uint8 image) for seed 0..11."""
    if isinstance(seed, bool) or not isinstance(seed, int) or not 0 <= seed < HEAD_COUNT:
        raise ValueError(f"seed must be 0..{HEAD_COUNT - 1}")
    rng = np.random.default_rng(1000 + seed)
    w = width or (300 + 20 * (seed % 4))
    h = height or (340 + 16 * (seed % 3))
    face_w = w * (0.60 + 0.03 * (seed % 3))
    face_l = h * (0.66 + 0.02 * (seed % 4))
    pts = symmetric_face(w, h, face_width=face_w, face_length=face_l)
    shift = np.array([(seed % 5 - 2) * 0.03 * w, (seed % 3 - 1) * 0.02 * h])
    pts = pts + shift
    roll = (seed % 7 - 3) * 2.0
    if roll:
        pts = rolled(pts, roll)
    centre = pts[list(regions.FACE_OVAL)].mean(axis=0)
    x = (pts[:, 0] - centre[0]) / (face_w / 2)
    y = (pts[:, 1] - centre[1]) / (face_l / 2)
    depth_scale = face_w * (0.22 + 0.02 * (seed % 3))
    # Ellipsoid head: deepest (furthest back) at the sides, nearest at the centre.
    z = -depth_scale * np.sqrt(np.clip(1 - 0.55 * x * x - 0.35 * y * y, 0.05, None))
    nose = np.exp(-((x / 0.18) ** 2 + ((y - 0.05) / 0.35) ** 2))
    z -= face_w * (0.08 + 0.01 * (seed % 4)) * nose
    brow = np.exp(-(((y + 0.35) / 0.08) ** 2)) * np.exp(-((x / 0.7) ** 2))
    z -= face_w * 0.015 * brow
    z += rng.normal(0, face_w * 0.002, size=len(z))
    xyz = np.column_stack([pts, z])
    yy, xx = np.mgrid[0:h, 0:w]
    stripes = ((xx // (6 + seed % 4)) % 2) * 70
    backdrop = np.where(yy < h * 0.55, 200 - stripes, 30 + stripes // 2)
    oval = regions.region_mask("face_oval", pts, h, w, normalized=False, supersample=2) >= 0.5
    face = 150 + 25 * np.sin(xx / 9.0) + 15 * np.cos(yy / 7.0)
    lum = np.where(oval, face, backdrop)
    tint = np.array([1.0, 0.85 + 0.01 * seed, 0.7])
    image = np.clip(lum[..., None] * tint, 0, 255).astype(np.uint8)
    return xyz, image


def all_heads() -> list[tuple[Floats, NDArray[np.uint8]]]:
    return [drawn_head(seed) for seed in range(HEAD_COUNT)]
