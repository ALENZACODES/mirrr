"""Reusable original-pixel tetrahedral LUT sampling coordinates.

Each source image defines its interpolation simplex and barycentric weights
independent of filter recipe. Reusing those original-only values removes
repeated coordinate calculation and unused-branch interpolation for 61 looks.
This stores a verified short digest and numeric sampling arrays, not a photo;
callers must keep it request-local and never serialize it to a report.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from . import lut as LUT
from . import space as S

I64 = NDArray[np.int64]
F64 = NDArray[np.float64]


@dataclass(frozen=True)
class Sampling:
    shape: tuple[int, int, int]
    digest: bytes
    start: I64
    first: I64
    second: I64
    last: I64
    one: F64
    two: F64
    three: F64
    # An owned, read-only frame prepared within one face-scoped batch may
    # skip repeated full-frame digests. Ordinary mutable callers still hash.
    frozen_source: np.ndarray | None = None


def _digest(source: np.ndarray) -> bytes:
    return hashlib.blake2b(np.ascontiguousarray(source).tobytes(), digest_size=16).digest()


def prepare(image: np.ndarray) -> Sampling:
    """Freeze original-only simplex vertices and ordered interpolation weights."""
    pixels = np.asarray(image)
    if pixels.dtype != np.uint8 or pixels.ndim != 3 or pixels.shape[-1] != 3:
        raise ValueError("sampling requires RGB uint8 input")
    flat = S.bytes_to_unit(pixels).reshape(-1, 3)
    size = LUT.SIZE
    # Identical split and tie choices to the ordinary tetrahedral renderer.
    (ir, fr), (ig, fg), (ib, fb) = (LUT._split(flat[:, c], size) for c in range(3))
    r_gt_g, g_gt_b, r_gt_b = fr > fg, fg > fb, fr > fb
    b_gt_g, b_gt_r = fb > fg, fb > fr
    offsets = (size * size, size, 1)
    axis_offsets = np.asarray(offsets, dtype=np.int64)
    axis_weights = np.stack([fr, fg, fb], axis=-1)
    # The same six cases are selected; first, second and last form a path
    # through the tetrahedron from (i,j,k) to (i+1,j+1,k+1).
    order = np.empty((len(flat), 3), dtype=np.int64)
    case = np.where(r_gt_g, np.where(g_gt_b, 0, np.where(r_gt_b, 1, 2)),
                    np.where(b_gt_g, 3, np.where(b_gt_r, 4, 5)))
    for code, sequence in enumerate(((0, 1, 2), (0, 2, 1), (2, 0, 1),
                                     (2, 1, 0), (1, 2, 0), (1, 0, 2))):
        active = case == code
        if np.any(active):
            order[active] = sequence
    jump = axis_offsets[order]
    ordered_weights = np.take_along_axis(axis_weights, order, axis=1)
    origin = (ir * size + ig) * size + ib
    first = origin + jump[:, 0]
    second = first + jump[:, 1]
    last = second + jump[:, 2]
    frozen = (origin, first, second, last, ordered_weights[:, 0],
              ordered_weights[:, 1], ordered_weights[:, 2])
    for array in frozen:
        array.setflags(write=False)
    shape = (int(pixels.shape[0]), int(pixels.shape[1]), 3)
    frozen_source = pixels if _is_frozen_owned(pixels) else None
    return Sampling(shape, _digest(pixels), *frozen, frozen_source)


def _is_frozen_owned(source: np.ndarray) -> bool:
    """Trust only a private, owning, read-only snapshot, not an aliased view."""
    return bool(source.flags.owndata and source.base is None and not source.flags.writeable)


def for_image(sampling: Sampling, image: np.ndarray) -> bool:
    """Refuse reuse across a crop, edit, new image or changed pixel content."""
    source = np.asarray(image)
    if source.shape != sampling.shape or source.dtype != np.uint8:
        return False
    if sampling.frozen_source is source and _is_frozen_owned(source):
        return True
    return bool(sampling.digest == _digest(source))


def apply(lut: NDArray[np.float64], sampling: Sampling) -> F64:
    """Same summation order as the existing six-branch tetrahedral interpolation."""
    table = np.asarray(lut, dtype=np.float64).reshape(-1, 3)
    if table.shape[0] != LUT.SIZE ** 3:
        raise ValueError("only the shipped LUT lattice is supported")
    start = table[sampling.start]
    first = table[sampling.first]
    second = table[sampling.second]
    last = table[sampling.last]
    mixed = (start + sampling.one[:, None] * (first - start)
             + sampling.two[:, None] * (second - first)
             + sampling.three[:, None] * (last - second))
    return mixed.reshape(sampling.shape)
