"""E07 biharmonic fill: the smoothest surface that meets the hole's edge (value and slope).

The hole (mask >= 0.5) is solved inside a crop: its bounding box grown by 2 px (the
biharmonic stencil's reach), clipped to the image. L is the crop's 4-neighbour graph
Laplacian (each pixel minus its in-crop neighbours), and the hole values x minimise
|L u|^2 with the known pixels fixed, i.e. (L^2 restricted to the hole) x = -(L^2 known
part). That system is symmetric positive definite, so conjugate gradients solve it,
starting from an onion-peel average. Smooth polynomials up to cubic terms (with Delta^2
u = 0) are reproduced exactly when the hole is at least 2 px from the image border.

Concept: thin plate / biharmonic inpainting as in Damelin and Hoang, "On surface
completion and image inpainting by biharmonic functions" (2018); our own code.
Mirrored in `web/src/engines/fill/biharmonic.ts`.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .fmm import as_values, hole_of

Floats = NDArray[np.float64]
MAX_CG_ITERATIONS = 20000


@dataclass(frozen=True)
class BiharmonicResult:
    image: Floats
    iterations: tuple[int, ...]      # per channel
    residual: tuple[float, ...]      # final relative residual per channel
    box: tuple[int, int, int, int]   # crop left, top, right, bottom (inclusive)

    @property
    def converged(self) -> bool:
        return all(r <= 1e-6 for r in self.residual)


def crop_box(hole: np.ndarray, margin: int = 2) -> tuple[int, int, int, int]:
    ys, xs = np.nonzero(hole)
    h, w = hole.shape
    return (max(0, int(xs.min()) - margin), max(0, int(ys.min()) - margin),
            min(w - 1, int(xs.max()) + margin), min(h - 1, int(ys.max()) + margin))


def laplacian(u: np.ndarray) -> Floats:
    """Graph Laplacian on a plane: sum over in-plane 4-neighbours of (u - neighbour)."""
    out = np.zeros_like(u, dtype=np.float64)
    out[:, 1:] += u[:, 1:] - u[:, :-1]
    out[:, :-1] += u[:, :-1] - u[:, 1:]
    out[1:, :] += u[1:, :] - u[:-1, :]
    out[:-1, :] += u[:-1, :] - u[1:, :]
    return out


def onion_mean(plane: Floats, hole: NDArray[np.bool_]) -> Floats:
    """Float onion peel: each layer takes the mean of its known 8-neighbours."""
    out = plane.copy()
    unknown = hole.copy()
    h, w = hole.shape
    while unknown.any():
        known = ~unknown
        pad_k = np.pad(known.astype(np.float64), 1)
        pad_v = np.pad(np.where(known, out, 0.0), 1)
        count = np.zeros((h, w))
        total = np.zeros((h, w))
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx or dy:
                    count += pad_k[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
                    total += pad_v[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
        layer = unknown & (count > 0)
        if not layer.any():
            raise ValueError("the hole covers the whole image; nothing to fill from")
        out[layer] = total[layer] / count[layer]
        unknown &= ~layer
    return out


def biharmonic(values: np.ndarray, mask: np.ndarray, *, tolerance: float = 1e-10,
               max_iterations: int = 4000) -> BiharmonicResult:
    """Fill the hole in float values (H x W or H x W x C) with the biharmonic solution."""
    data, flat2d = as_values(values)
    h, w, channels = data.shape
    hole = hole_of(mask, (h, w))
    if not (np.isfinite(tolerance) and tolerance > 0):
        raise ValueError("tolerance must be positive")
    if not isinstance(max_iterations, int) or not 1 <= max_iterations <= MAX_CG_ITERATIONS:
        raise ValueError(f"max_iterations must be 1..{MAX_CG_ITERATIONS}")
    out = data.copy()
    if not hole.any():
        return BiharmonicResult(out[..., 0] if flat2d else out, (0,) * channels, (0.0,) * channels, (0, 0, 0, 0))
    left, top, right, bottom = crop_box(hole)
    sub_hole = hole[top:bottom + 1, left:right + 1]

    def operator(x: Floats) -> Floats:
        u = np.zeros(sub_hole.shape)
        u[sub_hole] = x
        result: Floats = laplacian(laplacian(u))[sub_hole]
        return result

    iterations, residuals = [], []
    for c in range(channels):
        crop = out[top:bottom + 1, left:right + 1, c]
        fixed = np.where(sub_hole, 0.0, crop)
        b = -laplacian(laplacian(fixed))[sub_hole]
        x = onion_mean(crop, sub_hole)[sub_hole]
        r = b - operator(x)
        p = r.copy()
        rs = float(r @ r)
        norm_b = max(1.0, float(np.sqrt(b @ b)))
        k = 0
        while k < max_iterations and np.sqrt(rs) > tolerance * norm_b:
            ap = operator(p)
            alpha = rs / float(p @ ap)
            x = x + alpha * p
            r = r - alpha * ap
            new_rs = float(r @ r)
            p = r + (new_rs / rs) * p
            rs = new_rs
            k += 1
        crop = crop.copy()
        crop[sub_hole] = x
        out[top:bottom + 1, left:right + 1, c] = crop
        iterations.append(k)
        residuals.append(float(np.sqrt(rs)) / norm_b)
    image = out[..., 0] if flat2d else out
    return BiharmonicResult(image, tuple(iterations), tuple(residuals), (left, top, right, bottom))
