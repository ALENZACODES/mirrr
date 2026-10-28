"""Deterministic fine grain anchored to full-photo pixel coordinates.

The same seed, output dimensions and coordinates produce the same grain in a
preview, whole export and tiled export. No random generator or mutable state is
used. Grain changes the three display-encoded channels by the same small
amount, with headroom protection near black and white. Clean white references
stay clean, and no existing pixel is averaged with another skin pixel.

The original image is never retained. This kernel is suitable for browser-only
editing and carries no remote model or licensed image dependencies.
Created by John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..colour import ops as O
from ..colour import space as S
from ..frame import Frame

Floats = NDArray[np.float64]
U64 = NDArray[np.uint64]
WORD_MASK = np.uint64(0xFFFFFFFF)
DEFAULT_SEED = 104729
MAX_GRAIN = 0.032
EDGE_HEADROOM = 10.0


def _mix32(x: U64) -> U64:
    """32-bit avalanche with explicit wrapping, mirrored with Math.imul."""
    h = x & WORD_MASK
    h = ((h ^ (h >> np.uint64(16))) * np.uint64(0x7FEB352D)) & WORD_MASK
    h = ((h ^ (h >> np.uint64(15))) * np.uint64(0x846CA68B)) & WORD_MASK
    return (h ^ (h >> np.uint64(16))) & WORD_MASK


def noise(width: int, height: int, frame: Frame, seed: int = DEFAULT_SEED) -> Floats:
    """Zero-centred triangular grain field, independent of tile subdivision.

    Coordinates refer to absolute full-photo pixel centres, but use integer
    pixel indices so the field remains stable across repeated renders. Mixing
    only integer words prevents architecture-dependent trigonometric noise.
    """
    if width < 1 or height < 1:
        raise ValueError("grain needs a non-empty image")
    if isinstance(seed, bool) or not isinstance(seed, int) or not 0 <= seed <= 0xFFFFFFFF:
        raise ValueError("grain seed must be a 32-bit unsigned integer")
    ys = np.arange(height, dtype=np.uint64) + np.uint64(frame.y0)
    xs = np.arange(width, dtype=np.uint64) + np.uint64(frame.x0)
    grid_x, grid_y = np.meshgrid(xs, ys)
    h = np.full((height, width), seed, dtype=np.uint64)
    h ^= (grid_x * np.uint64(0x9E3779B1)) & WORD_MASK
    h ^= (grid_y * np.uint64(0x85EBCA77)) & WORD_MASK
    h ^= (np.uint64(frame.width) * np.uint64(0xC2B2AE3D)) & WORD_MASK
    h ^= (np.uint64(frame.height) * np.uint64(0x27D4EB2F)) & WORD_MASK
    mixed = _mix32(h)
    lo = mixed & np.uint64(0xFFFF)
    hi = mixed >> np.uint64(16)
    return (lo.astype(np.float64) + hi.astype(np.float64)) / 65535.0 - 1.0


def grain(rgb: Floats, params: Mapping[str, Any], frame: Frame) -> Floats:
    """Light, uncoloured grain with strict highlight and shadow headroom."""
    amount = float(params["amount"])
    if amount <= 0:
        return rgb.copy()
    h, w = rgb.shape[:2]
    if isinstance(params["seed"], bool):
        raise ValueError("grain seed must be an unsigned integer")
    seed_value = float(params["seed"])
    if not seed_value.is_integer() or not 0 <= seed_value <= 0xFFFFFFFF:
        raise ValueError("grain seed must be an unsigned integer")
    seed = int(seed_value)
    field = noise(w, h, frame, seed)
    room = np.minimum(rgb.min(axis=2), 1 - rgb.max(axis=2))
    headroom = np.clip(room * EDGE_HEADROOM, 0.0, 1.0)
    delta = field * (amount * MAX_GRAIN) * headroom
    return S.clamp01(rgb + delta[..., None])


O.register(O.Op(
    "spatial.grain", "spatial",
    {
        "amount": O.num(0, 0, 1, "fine original monochrome grain strength"),
        "seed": O.fixed(DEFAULT_SEED, 0, 0xFFFFFFFF, "fixed local coordinate seed"),
    },
    grain,
    help="Deterministic fine grain without whitening highlights or smearing texture",
))
