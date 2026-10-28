"""33-point 3D LUT bake and tetrahedral apply (filters-plan.md §3.3, step 1 of the pipeline).

Every pointwise colour stage of a look is fused into one LUT at bake time: the lattice
point (i, j, k) holds the look applied to sRGB (i, j, k) / 32. Baking costs 35,937 colours,
so strength changes re-bake instead of cross-fading (plan M8). The LUT is stored flat,
index ((i * N + j) * N + k) * 3 + channel, red slowest, as Float64.

Apply uses tetrahedral interpolation (Kasson, Nin, Plouffe and Hafner, 1995: the cube
between eight lattice points is split into six tetrahedra along the black-white diagonal),
so lattice colours come back exactly and greys stay grey. The six cases are chosen with the
same comparisons in the TypeScript port (web/src/filters/colour/lut.ts), ties included:

    fr > fg:  fg > fb -> R G B;  fr > fb -> R B G;  else B R G
    else:     fb > fg -> B G R;  fb > fr -> G B R;  else G R B

Tetrahedral interpolation; concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Callable, Sequence

import numpy as np
from numpy.typing import NDArray

from . import space as S

Floats = NDArray[np.float64]
SIZE = 33


def lattice(size: int = SIZE) -> Floats:
    """Every lattice colour as an (size^3, 3) array, red slowest."""
    if not 2 <= size <= 65:
        raise ValueError("LUT size must be 2 to 65")
    v = np.arange(size, dtype=np.float64) / (size - 1)
    r, g, b = np.meshgrid(v, v, v, indexing="ij")
    return np.stack([r.ravel(), g.ravel(), b.ravel()], axis=-1)


def bake(transform: Callable[[Floats], Floats], size: int = SIZE) -> Floats:
    """Flat LUT of `transform` (an (N, 3) -> (N, 3) sRGB function) on the lattice."""
    out = S.clamp01(transform(lattice(size)))
    if out.shape != (size ** 3, 3) or not np.all(np.isfinite(out)):
        raise ValueError("a LUT transform must return finite (N, 3) colours")
    return out.reshape(-1).copy()


def identity(size: int = SIZE) -> Floats:
    return lattice(size).reshape(-1).copy()


def _split(values: Floats, size: int) -> tuple[NDArray[np.int64], Floats]:
    x = np.clip(values, 0.0, 1.0) * (size - 1)
    i = np.minimum(np.floor(x).astype(np.int64), size - 2)
    return i, x - i


def apply(lut: Sequence[float] | np.ndarray, rgb: np.ndarray, size: int = SIZE) -> Floats:
    """Tetrahedral interpolation of (..., 3) sRGB values in [0, 1] through a flat LUT."""
    table = np.asarray(lut, dtype=np.float64).reshape(size, size, size, 3)
    values = np.asarray(rgb, dtype=np.float64)
    shape = values.shape
    flat = values.reshape(-1, 3)
    (ir, fr), (ig, fg), (ib, fb) = (_split(flat[:, c], size) for c in range(3))
    fr, fg, fb = fr[:, None], fg[:, None], fb[:, None]

    def c(dr: int, dg: int, db: int) -> Floats:
        return table[ir + dr, ig + dg, ib + db]

    c000, c111 = c(0, 0, 0), c(1, 1, 1)
    c100, c010, c001 = c(1, 0, 0), c(0, 1, 0), c(0, 0, 1)
    c110, c101, c011 = c(1, 1, 0), c(1, 0, 1), c(0, 1, 1)
    rgb_ = c000 + fr * (c100 - c000) + fg * (c110 - c100) + fb * (c111 - c110)
    rbg = c000 + fr * (c100 - c000) + fb * (c101 - c100) + fg * (c111 - c101)
    brg = c000 + fb * (c001 - c000) + fr * (c101 - c001) + fg * (c111 - c101)
    bgr = c000 + fb * (c001 - c000) + fg * (c011 - c001) + fr * (c111 - c011)
    gbr = c000 + fg * (c010 - c000) + fb * (c011 - c010) + fr * (c111 - c011)
    grb = c000 + fg * (c010 - c000) + fr * (c110 - c010) + fb * (c111 - c110)
    r_gt_g, g_gt_b, r_gt_b = fr > fg, fg > fb, fr > fb
    b_gt_g, b_gt_r = fb > fg, fb > fr
    first = np.where(g_gt_b, rgb_, np.where(r_gt_b, rbg, brg))
    second = np.where(b_gt_g, bgr, np.where(b_gt_r, gbr, grb))
    return np.where(r_gt_g, first, second).reshape(shape)


def apply_bytes(lut: Sequence[float] | np.ndarray, image: np.ndarray, size: int = SIZE) -> Floats:
    """An H x W x 3 (or 4) uint8 image through the LUT; returns float sRGB in [0, 1]."""
    return apply(lut, S.bytes_to_unit(image), size)


def sample(lut: Sequence[float] | np.ndarray, points: np.ndarray, size: int = SIZE) -> Floats:
    """LUT values at integer lattice indices (n, 3); for parity vectors and tests."""
    table = np.asarray(lut, dtype=np.float64).reshape(size, size, size, 3)
    idx = np.asarray(points, dtype=np.int64)
    return table[idx[:, 0], idx[:, 1], idx[:, 2]]
