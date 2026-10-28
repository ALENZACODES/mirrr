"""Drawn test faces for the arena's own tests and the neutral-defaults check.

A face here is code-drawn: a skin-toned oval on the R5 symmetric landmark mesh, darker eyes,
brows and lips, seeded grain, and optional freckles and moles at known places. No photo,
no dataset and no model are involved, so these can live in the repo and run in CI.
Face-mapping inspiration: MediaPipe Face Landmarker (mesh topology, data) and Farkas anthropometry (face layout);
concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..engines.core import regions
from ..engines.proportions.synthetic import symmetric_face
from ..quality.harness import hash_noise

U8 = NDArray[np.uint8]
# Skin tones across the range the women-first brief asks to check, very dark included
# (sRGB, picked by hand; not taken from any dataset).
SKIN_TONES = {"very_light": (238, 208, 190), "light": (224, 182, 156), "medium": (190, 140, 105),
              "tan": (160, 110, 78), "dark": (112, 72, 50), "very_dark": (68, 44, 32)}


@dataclass(frozen=True)
class DrawnFace:
    image: U8
    points: NDArray[np.float64]
    marks: tuple[tuple[float, float, float], ...]  # (x, y, radius) of drawn freckles and moles
    tone: str


def drawn_face(tone: str = "medium", *, seed: int = 1, width: int = 200, height: int = 240,
               freckles: int = 10, grain: float = 5.0) -> DrawnFace:
    if tone not in SKIN_TONES:
        raise ValueError(f"tone must be one of {', '.join(SKIN_TONES)}")
    pts = symmetric_face(width, height, face_width=width * 0.55, face_length=height * 0.66)
    yy, xx = np.mgrid[0:height, 0:width]
    background = np.stack([70 + 0.25 * xx, 95 + 0.1 * yy, 120 + 0.05 * (xx + yy)], axis=-1)
    img = background.astype(np.float64)
    skin_rgb = np.array(SKIN_TONES[tone], dtype=np.float64)
    oval = regions.region_mask("face_oval", pts, height, width, normalized=False, supersample=2).astype(np.float64)
    shade = 1.0 - 0.10 * ((xx - width / 2) / (width * 0.3)) ** 2  # soft side falloff
    img = img * (1 - oval[..., None]) + (skin_rgb[None, None, :] * shade[..., None]) * oval[..., None]
    for name, factor in (("eyes", 0.35), ("brows", 0.55), ("lips", 0.78)):
        mask = regions.region_mask(name, pts, height, width, normalized=False, supersample=2).astype(np.float64)
        tint = skin_rgb * factor if name != "lips" else skin_rgb * np.array([0.85, 0.6, 0.62])
        img = img * (1 - mask[..., None]) + tint[None, None, :] * mask[..., None]
    noise = (hash_noise(seed, height, width) - 0.5) * 2 * grain
    img += noise[..., None]
    rng = np.random.default_rng(seed)
    placed: list[tuple[float, float, float]] = []
    iod = float(np.linalg.norm(pts[473] - pts[468]))
    spots = [(pts[33] + pts[61]) / 2, (pts[263] + pts[291]) / 2, pts[9] + (pts[9] - pts[168]) * 0.8,
             (pts[129] + pts[33]) / 2, (pts[358] + pts[263]) / 2]
    for i in range(freckles):
        centre = spots[i % len(spots)] + rng.normal(0, iod * 0.16, 2)
        radius = float(iod * (0.035 + 0.025 * rng.random()))
        depth = 0.62 if i % 5 else 0.45  # every fifth mark is a darker mole
        blob = np.exp(-((xx - centre[0]) ** 2 + (yy - centre[1]) ** 2) / (2 * radius * radius)) * oval
        img *= (1 - (1 - depth) * blob)[..., None]
        placed.append((float(centre[0]), float(centre[1]), radius))
    return DrawnFace(np.clip(np.rint(img), 0, 255).astype(np.uint8), pts, tuple(placed), tone)
