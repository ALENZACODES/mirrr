"""Procedural studio backdrops: thirty named backdrops drawn by code at any size.

Each backdrop is a top and bottom colour (a vertical gradient), an optional soft light spot
behind the head, and an optional mottled-canvas texture from seeded noise. Nothing is a
photograph, a downloaded image or a generated location; photo locations would need licensed
images and stay out. Names are our own. web/src/engines/studio/backdrops.ts mirrors this.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .common import Floats, hash_noise, radius_for, soft_blur

SPOT_CENTRE = (0.5, 0.38)   # share of width and height: just behind a framed head (ASSUMED)


@dataclass(frozen=True)
class Backdrop:
    id: str
    name: str
    group: str
    top: tuple[int, int, int]
    bottom: tuple[int, int, int]
    spot: float = 0.0          # extra light at the spot centre, 0..0.3
    mottle: float = 0.0        # canvas texture depth, 0..0.15
    seed: int = 1


_ROWS: tuple[tuple[str, str, str, tuple[int, int, int], tuple[int, int, int], float, float], ...] = (
    ("chinon", "Chinon slate", "Classic", (74, 82, 92), (52, 58, 66), 0.12, 0.0),
    ("saumur", "Saumur stone", "Classic", (196, 190, 180), (168, 162, 152), 0.08, 0.0),
    ("angers", "Angers charcoal", "Classic", (58, 58, 60), (36, 36, 38), 0.14, 0.0),
    ("blois", "Blois dove grey", "Classic", (178, 180, 182), (150, 152, 155), 0.10, 0.0),
    ("bourges", "Bourges navy", "Classic", (40, 52, 78), (26, 34, 54), 0.12, 0.0),
    ("beaune", "Beaune wine", "Classic", (96, 44, 52), (66, 30, 36), 0.10, 0.0),
    ("chablis", "Chablis ivory", "Light", (236, 230, 216), (214, 206, 190), 0.06, 0.0),
    ("vitre", "Vitré chalk", "Light", (232, 233, 230), (208, 210, 207), 0.05, 0.0),
    ("dinan", "Dinan mist", "Light", (210, 218, 222), (184, 194, 200), 0.08, 0.0),
    ("pornic", "Pornic sand", "Light", (222, 206, 182), (196, 178, 152), 0.08, 0.0),
    ("evian", "Évian water", "Light", (200, 220, 226), (170, 194, 204), 0.08, 0.0),
    ("auray", "Auray blush", "Light", (232, 210, 204), (208, 182, 176), 0.06, 0.0),
    ("cahors", "Cahors canvas", "Painted", (104, 86, 70), (72, 58, 46), 0.10, 0.10),
    ("figeac", "Figeac umber", "Painted", (122, 96, 72), (84, 64, 48), 0.12, 0.12),
    ("moissac", "Moissac olive", "Painted", (96, 100, 76), (66, 70, 52), 0.10, 0.10),
    ("rodez", "Rodez storm", "Painted", (92, 98, 108), (60, 64, 72), 0.12, 0.12),
    ("millau", "Millau teal", "Painted", (58, 92, 96), (38, 62, 66), 0.12, 0.10),
    ("auch", "Auch ochre", "Painted", (168, 132, 84), (128, 98, 60), 0.08, 0.10),
    ("quimper", "Quimper blue", "Colour", (66, 98, 150), (44, 68, 108), 0.14, 0.0),
    ("morlaix", "Morlaix sage", "Colour", (148, 166, 146), (118, 136, 116), 0.10, 0.0),
    ("lannion", "Lannion coral", "Colour", (214, 128, 112), (182, 98, 84), 0.08, 0.0),
    ("paimpol", "Paimpol sea", "Colour", (70, 128, 138), (46, 96, 106), 0.12, 0.0),
    ("vannes", "Vannes lilac", "Colour", (170, 150, 186), (138, 118, 156), 0.08, 0.0),
    ("niort", "Niort moss", "Colour", (82, 108, 70), (56, 78, 46), 0.10, 0.0),
    ("loches", "Loches terracotta", "Colour", (170, 96, 70), (136, 70, 50), 0.10, 0.0),
    ("gien", "Gien mustard", "Colour", (200, 160, 70), (168, 128, 48), 0.08, 0.0),
    ("auxerre", "Auxerre dusk", "Evening", (62, 58, 84), (30, 28, 44), 0.18, 0.0),
    ("arbois", "Arbois ember", "Evening", (92, 52, 40), (40, 22, 18), 0.20, 0.0),
    ("briancon", "Briançon night", "Evening", (34, 44, 62), (14, 18, 28), 0.22, 0.0),
    ("chambery", "Chambéry smoke", "Evening", (70, 70, 74), (24, 24, 26), 0.20, 0.04),
)
BACKDROPS: dict[str, Backdrop] = {
    row[0]: Backdrop(row[0], row[1], row[2], row[3], row[4], row[5], row[6], seed=i + 11)
    for i, row in enumerate(_ROWS)
}


def render_backdrop(backdrop_id: str, width: int, height: int) -> Floats:
    """The backdrop as float RGB 0..255, height x width x 3."""
    if backdrop_id not in BACKDROPS:
        raise ValueError(f"unknown backdrop {backdrop_id}")
    if width < 1 or height < 1:
        raise ValueError("backdrop size must be positive")
    b = BACKDROPS[backdrop_id]
    yy, xx = np.mgrid[:height, :width].astype(np.float64)
    t = (yy / max(1, height - 1))[..., None]
    out = np.array(b.top, dtype=np.float64) * (1 - t) + np.array(b.bottom, dtype=np.float64) * t
    if b.spot:
        dx = (xx - SPOT_CENTRE[0] * (width - 1)) / max(width, height)
        dy = (yy - SPOT_CENTRE[1] * (height - 1)) / max(width, height)
        r = np.minimum(1.0, np.sqrt(dx * dx + dy * dy) / 0.75)
        fall = 1 - r * r * (3 - 2 * r)
        out = out * (1 + b.spot * fall)[..., None]
    if b.mottle:
        noise = soft_blur(hash_noise(width, height, b.seed), radius_for(width, height, 1 / 24))
        spread = noise - noise.mean()
        scale = float(np.max(np.abs(spread))) or 1.0
        out = out * (1 + b.mottle * spread / scale)[..., None]
    return np.clip(out, 0, 255)
