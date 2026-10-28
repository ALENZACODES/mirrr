"""Exact sparse seam sampling for bounded gender-preview searches.

A seam score only depends on the contour band and each band's four gradient
neighbours. Rasterising the entire photograph for every bisection candidate does
not add information to that score. This module maps those exact integer pixels
with the canonical first-triangle ownership rule and samples them in linear
light with the canonical premultiplied-alpha arithmetic. The percentile, reference
edge gradient, and Q4 thresholds are unchanged. It is an optimisation of Q4,
not a replacement for the final full-resolution raster, triangle and Q3 checks.

No photo or mesh is retained across calls. Coordinates and pixels remain local.
Concept source: MediaPipe Face Landmarker mesh topology, consumed through the
existing MeshLayout; concept only, no code copied. The sparse evaluation and
per-render cache design are original and reuse our canonical sampler arithmetic.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ...quality.metrics import EDGE_GRADIENT_FLOOR, luma, mask_edge
from ..core.filters import gradient_magnitude, quantile
from ..core.resample import _LINEAR, _encode
from ..warp.mesh import MeshLayout
from ..warp.piecewise import DEGENERATE_AREA, EDGE_TOLERANCE

Floats = NDArray[np.float64]
Indices = NDArray[np.intp]


def one_pixel_band(edge: NDArray[np.bool_]) -> NDArray[np.bool_]:
    """Exact Euclidean-disc dilation at radius one, with clipped image borders."""
    band = edge.copy()
    band[1:] |= edge[:-1]
    band[:-1] |= edge[1:]
    band[:, 1:] |= edge[:, :-1]
    band[:, :-1] |= edge[:, 1:]
    return band


def _sample(image: NDArray[np.uint8], x: Floats, y: Floats) -> NDArray[np.uint8]:
    """Canonical edge-clamped remap on selected coordinates only.

    Each RGB tap is decoded through the same 256-value LUT as core.resample;
    decoding only the selected taps avoids rebuilding a full linear-light image
    for each candidate. Loop order, alpha division and encoding are identical.
    """
    height, width, channels = image.shape
    mx, my = np.clip(x, 0, width - 1), np.clip(y, 0, height - 1)
    x0, y0 = np.floor(mx).astype(np.intp), np.floor(my).astype(np.intp)
    fx, fy = (mx - x0)[:, None], (my - y0)[:, None]
    accumulator = np.zeros((len(x), 4), dtype=np.float64)
    for dy, wy in ((0, 1 - fy), (1, fy)):
        for dx, wx in ((0, 1 - fx), (1, fx)):
            xi, yi = np.minimum(x0 + dx, width - 1), np.minimum(y0 + dy, height - 1)
            taps = image[yi, xi]
            alpha = taps[:, 3] / 255.0 if channels == 4 else np.ones(len(x))
            work = np.concatenate([_LINEAR[taps[:, :3]] * alpha[:, None], alpha[:, None]], axis=1)
            accumulator = accumulator + work * (wx * wy)
    if channels == 4:
        alpha = accumulator[:, 3]
        with np.errstate(divide="ignore", invalid="ignore"):
            colour = np.where(alpha[:, None] > 0, accumulator[:, :3] / alpha[:, None], 0.0)
        return np.concatenate([_encode(colour), np.rint(np.clip(alpha, 0, 1) * 255).astype(np.uint8)[:, None]], axis=1)
    return _encode(accumulator[:, :3])


@dataclass(frozen=True)
class SparseSeam:
    """Per-render Q4 inputs; never a global cache of photographs or landmarks."""

    image: NDArray[np.uint8]
    x: Floats
    y: Floats
    left: Indices
    right: Indices
    above: Indices
    below: Indices
    x_divisor: Floats
    y_divisor: Floats
    before_gradient: Floats
    reference: float
    buckets: dict[tuple[int, int], Indices]
    bucket_prefix: NDArray[np.int64]
    bucket_size: int = 16

    @classmethod
    def prepare(cls, image: NDArray[np.uint8], mask: np.ndarray) -> SparseSeam:
        height, width = image.shape[:2]
        band = one_pixel_band(mask_edge(mask))
        rows, columns = np.nonzero(band)
        neighbours = np.stack([
            rows * width + np.maximum(columns - 1, 0),
            rows * width + np.minimum(columns + 1, width - 1),
            np.maximum(rows - 1, 0) * width + columns,
            np.minimum(rows + 1, height - 1) * width + columns,
        ])
        selected, inverse = np.unique(neighbours, return_inverse=True)
        positions = inverse.reshape(4, -1).astype(np.intp)
        sample_x = (selected % width).astype(np.float64)
        sample_y = (selected // width).astype(np.float64)
        before = gradient_magnitude(luma(image))
        edges = before[before >= EDGE_GRADIENT_FLOOR]
        reference = quantile(edges, 0.5) if edges.size else EDGE_GRADIENT_FLOOR
        buckets: dict[tuple[int, int], list[int]] = {}
        for index, (x, y) in enumerate(zip(sample_x.astype(np.intp), sample_y.astype(np.intp), strict=True)):
            buckets.setdefault((int(x) // 16, int(y) // 16), []).append(index)
        occupancy = np.zeros(((height + 15) // 16, (width + 15) // 16), dtype=np.int64)
        for bx, by in buckets:
            occupancy[by, bx] = 1
        prefix = np.pad(np.cumsum(np.cumsum(occupancy, axis=0), axis=1), ((1, 0), (1, 0)))
        return cls(image, sample_x, sample_y, positions[0], positions[1], positions[2], positions[3],
                   np.where((columns == 0) | (columns == width - 1), 1.0, 2.0),
                   np.where((rows == 0) | (rows == height - 1), 1.0, 2.0),
                   before[band], reference,
                   {key: np.asarray(value, dtype=np.intp) for key, value in buckets.items()}, prefix)

    @property
    def sample_count(self) -> int:
        return len(self.x)

    def maps(self, layout: MeshLayout, targets: np.ndarray) -> tuple[Floats, Floats]:
        """Same map as piecewise_affine at this seam's selected pixel centres."""
        source = layout.points
        destination = source.copy()
        destination[:layout.mesh_count] = targets
        mapped_x, mapped_y = self.x.copy(), self.y.copy()
        owned = np.zeros(len(self.x), dtype=bool)
        height, width = self.image.shape[:2]
        triangles = np.asarray(layout.triangles, dtype=np.intp)
        vertices = destination[triangles]
        x0s = np.maximum(0, np.ceil(vertices[:, :, 0].min(axis=1) - EDGE_TOLERANCE)).astype(np.intp)
        x1s = np.minimum(width - 1, np.floor(vertices[:, :, 0].max(axis=1) + EDGE_TOLERANCE)).astype(np.intp)
        y0s = np.maximum(0, np.ceil(vertices[:, :, 1].min(axis=1) - EDGE_TOLERANCE)).astype(np.intp)
        y1s = np.minimum(height - 1, np.floor(vertices[:, :, 1].max(axis=1) + EDGE_TOLERANCE)).astype(np.intp)
        valid = (x0s <= x1s) & (y0s <= y1s)
        candidates = np.flatnonzero(valid)
        bx0, bx1 = x0s[candidates] // self.bucket_size, x1s[candidates] // self.bucket_size + 1
        by0, by1 = y0s[candidates] // self.bucket_size, y1s[candidates] // self.bucket_size + 1
        occupied = (self.bucket_prefix[by1, bx1] - self.bucket_prefix[by0, bx1]
                    - self.bucket_prefix[by1, bx0] + self.bucket_prefix[by0, bx0])
        # Integral occupancy skips triangles that cannot own a sampled point;
        # it changes neither triangle order nor boundary ownership.
        for index in candidates[occupied > 0]:
            ia, ib, ic = triangles[index]
            a, b, c = destination[ia], destination[ib], destination[ic]
            # Use the canonical signed-area calculation for degenerate handling.
            area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
            if abs(area) <= DEGENERATE_AREA:
                continue
            x0, x1, y0, y1 = x0s[index], x1s[index], y0s[index], y1s[index]
            buckets = [self.buckets[bx, by]
                       for by in range(y0 // self.bucket_size, y1 // self.bucket_size + 1)
                       for bx in range(x0 // self.bucket_size, x1 // self.bucket_size + 1)
                       if (bx, by) in self.buckets]
            if not buckets:
                continue
            indices = np.concatenate(buckets)
            xx, yy = self.x[indices], self.y[indices]
            take = (~owned[indices]) & (xx >= x0) & (xx <= x1) & (yy >= y0) & (yy <= y1)
            indices = indices[take]
            if not len(indices):
                continue
            xx, yy = self.x[indices], self.y[indices]
            determinant = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
            first = ((b[1] - c[1]) * (xx - c[0]) + (c[0] - b[0]) * (yy - c[1])) / determinant
            second = ((c[1] - a[1]) * (xx - c[0]) + (a[0] - c[0]) * (yy - c[1])) / determinant
            third = 1.0 - first - second
            inside = (first >= -EDGE_TOLERANCE) & (second >= -EDGE_TOLERANCE) & (third >= -EDGE_TOLERANCE)
            selected = indices[inside]
            sa, sb, sc = source[ia], source[ib], source[ic]
            mapped_x[selected] = (first * sa[0] + second * sb[0] + third * sc[0])[inside]
            mapped_y[selected] = (first * sa[1] + second * sb[1] + third * sc[1])[inside]
            owned[selected] = True
        return mapped_x, mapped_y

    def ratio(self, layout: MeshLayout, targets: np.ndarray) -> float:
        if not self.sample_count:
            return 0.0
        mapped_x, mapped_y = self.maps(layout, targets)
        return self._ratio_from_rgb(_sample(self.image, mapped_x, mapped_y))

    def full_ratio(self, output: NDArray[np.uint8]) -> float:
        """Q4 on the final full raster using the same cached contour and baseline."""
        if output.shape != self.image.shape or output.dtype != np.uint8:
            raise ValueError("Q4 confirmation needs the full matching uint8 output")
        if not self.sample_count:
            return 0.0
        return self._ratio_from_rgb(output[self.y.astype(np.intp), self.x.astype(np.intp)])

    def _ratio_from_rgb(self, sampled: NDArray[np.uint8]) -> float:
        rgb = sampled[:, :3].astype(np.float64) / 255.0
        light = 0.2126 * rgb[:, 0] + 0.7152 * rgb[:, 1] + 0.0722 * rgb[:, 2]
        gx = (light[self.right] - light[self.left]) / self.x_divisor
        gy = (light[self.below] - light[self.above]) / self.y_divisor
        excess = np.maximum(0.0, np.sqrt(gx * gx + gy * gy) - self.before_gradient)
        return quantile(excess, 0.9) / self.reference
