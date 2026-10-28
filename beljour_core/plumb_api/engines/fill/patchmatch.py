"""E07 PatchMatch-lite: fill a hole by copying the best matching patches from the rest.

Concept: Barnes, Shechtman, Finkelstein and Goldman, "PatchMatch: a randomized
correspondence algorithm for structural image editing" (SIGGRAPH 2009); our own,
single-scale code, written from the paper.

1. Sources are patch centres whose whole (2r + 1)^2 patch is inside the image, holds no
   hole pixel and (optionally) lies in `source_mask`.
2. Targets are patch centres within r (Chebyshev) of a hole pixel, row-major.
3. The hole starts as an onion-peel fill: layer by layer, each hole pixel touching a known
   pixel takes the rounded mean of its known 8-neighbours.
4. Each target gets a random source (xorshift32, `seed`), then every iteration sweeps the
   targets (forward on even iterations, backward on odd ones): propagation tries the
   neighbour's match shifted by one pixel, random search tries points around the current
   match in windows halving from max(W, H) down to 1.
5. Voting: each hole pixel becomes the rounded mean of the source pixels that all
   covering target patches place on it.

Distances are integer sums of squared RGB differences over the target pixels inside the
image, and votes are integer means rounded half to even, so this module and
`web/src/engines/fill/patchmatch.ts` produce byte-identical results for the same seed.
Alpha (RGBA) is carried through unchanged.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..core.masks import as_mask

U8 = NDArray[np.uint8]
MASK32 = 0xFFFFFFFF
MAX_PATCH_RADIUS = 8
MAX_ITERATIONS = 32


class XorShift32:
    """Marsaglia xorshift32; the TypeScript port uses the same shifts on uint32."""

    def __init__(self, seed: int) -> None:
        if not isinstance(seed, int) or isinstance(seed, bool) or seed < 0:
            raise ValueError("seed must be a non-negative whole number")
        state = (seed ^ (seed >> 32) ^ 0x9E3779B9) & MASK32
        self.state = state or 0x6D2B79F5

    def next(self) -> int:
        x = self.state
        x ^= (x << 13) & MASK32
        x ^= x >> 17
        x ^= (x << 5) & MASK32
        self.state = x & MASK32
        return self.state

    def below(self, n: int) -> int:
        return self.next() % n


def round_div(total: int, count: int) -> int:
    """total / count rounded half to even, in integers (count > 0, total >= 0)."""
    q, r = divmod(total, count)
    if 2 * r > count or (2 * r == count and q % 2 == 1):
        q += 1
    return q


def onion_peel(image: np.ndarray, hole: np.ndarray) -> NDArray[np.int64]:
    """Integer RGB(A) copy with the hole filled inwards from its edge (8-neighbour means)."""
    work = np.asarray(image, dtype=np.int64).copy()
    h, w = hole.shape
    unknown = hole.copy()
    channels = work.shape[2]
    while unknown.any():
        known = ~unknown
        pad_known = np.pad(known, 1)
        pad_vals = np.pad(work * known[..., None], ((1, 1), (1, 1), (0, 0)))
        count = np.zeros((h, w), dtype=np.int64)
        sums = np.zeros((h, w, channels), dtype=np.int64)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                count += pad_known[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
                sums += pad_vals[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
        layer = unknown & (count > 0)
        if not layer.any():
            raise ValueError("the hole covers the whole image; nothing to fill from")
        for y, x in zip(*np.nonzero(layer), strict=True):
            for c in range(channels):
                work[y, x, c] = round_div(int(sums[y, x, c]), int(count[y, x]))
        unknown &= ~layer
    return work


@dataclass(frozen=True)
class PatchMatchResult:
    image: U8
    targets: NDArray[np.int64]           # (k, 2) target centres (x, y)
    matches: NDArray[np.int64]           # (k, 2) chosen source centres (x, y)
    mean_distance: tuple[float, ...]     # mean patch distance after each iteration's vote


def _box_any(hole: np.ndarray, r: int) -> NDArray[np.bool_]:
    """True where the (2r + 1)^2 box around a pixel touches the hole (zero padded)."""
    h, w = hole.shape
    pad = np.pad(hole.astype(np.int64), r)
    acc = np.zeros((h + 2 * r + 1, w + 2 * r + 1), dtype=np.int64)
    acc[1:, 1:] = pad.cumsum(0).cumsum(1)
    k = 2 * r + 1
    box = acc[k:k + h, k:k + w] - acc[0:h, k:k + w] - acc[k:k + h, 0:w] + acc[0:h, 0:w]
    out: NDArray[np.bool_] = box > 0
    return out


def patchmatch(image: np.ndarray, mask: np.ndarray, *, patch_radius: int = 3, iterations: int = 5,
               seed: int = 1, source_mask: np.ndarray | None = None) -> PatchMatchResult:
    """Fill `mask` >= 0.5 in a uint8 RGB or RGBA image by patch copying."""
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("patchmatch needs an RGB or RGBA uint8 image")
    h, w = img.shape[:2]
    r = patch_radius
    if not isinstance(r, int) or isinstance(r, bool) or not 1 <= r <= MAX_PATCH_RADIUS:
        raise ValueError(f"patch radius must be a whole number from 1 to {MAX_PATCH_RADIUS}")
    if not isinstance(iterations, int) or isinstance(iterations, bool) or not 1 <= iterations <= MAX_ITERATIONS:
        raise ValueError(f"iterations must be a whole number from 1 to {MAX_ITERATIONS}")
    hole = as_mask(mask, (h, w)) >= 0.5
    if not hole.any():
        return PatchMatchResult(img.copy(), np.zeros((0, 2), np.int64), np.zeros((0, 2), np.int64), ())
    near_hole = _box_any(hole, r)
    valid = ~near_hole
    valid[:r, :] = False
    valid[h - r:, :] = False
    valid[:, :r] = False
    valid[:, w - r:] = False
    if source_mask is not None:
        valid &= as_mask(source_mask, (h, w)) >= 0.5
    sources = np.argwhere(valid)[:, ::-1]            # (x, y), row-major order
    if len(sources) == 0:
        raise ValueError("no complete source patch outside the hole; use a smaller patch or a smaller hole")
    targets = np.argwhere(near_hole)[:, ::-1]
    target_index = np.full((h, w), -1, dtype=np.int64)
    target_index[targets[:, 1], targets[:, 0]] = np.arange(len(targets))
    rng = XorShift32(seed)
    work = onion_peel(img[..., :3], hole)
    original = img[..., :3].astype(np.int64)

    def distance(tx: int, ty: int, sx: int, sy: int) -> int:
        x0, x1 = max(0, tx - r), min(w - 1, tx + r)
        y0, y1 = max(0, ty - r), min(h - 1, ty + r)
        a = work[y0:y1 + 1, x0:x1 + 1]
        b = original[sy + (y0 - ty):sy + (y1 - ty) + 1, sx + (x0 - tx):sx + (x1 - tx) + 1]
        d = a - b
        return int((d * d).sum())

    matches = np.zeros_like(targets)
    for k in range(len(targets)):
        matches[k] = sources[rng.below(len(sources))]
    dist = np.array([distance(tx, ty, sx, sy) for (tx, ty), (sx, sy) in zip(targets, matches, strict=True)], dtype=np.int64)
    span = max(w, h)
    history: list[float] = []
    hole_y, hole_x = np.nonzero(hole)
    for it in range(iterations):
        forward = it % 2 == 0
        step = 1 if forward else -1
        order = range(len(targets)) if forward else range(len(targets) - 1, -1, -1)
        for k in order:
            tx, ty = int(targets[k, 0]), int(targets[k, 1])
            bx, by = int(matches[k, 0]), int(matches[k, 1])
            best = int(dist[k])
            for nx, ny in ((tx - step, ty), (tx, ty - step)):
                if not (0 <= nx < w and 0 <= ny < h):
                    continue
                n = target_index[ny, nx]
                if n < 0:
                    continue
                cx = int(matches[n, 0]) + (tx - nx)
                cy = int(matches[n, 1]) + (ty - ny)
                if 0 <= cx < w and 0 <= cy < h and valid[cy, cx] and (cx != bx or cy != by):
                    d = distance(tx, ty, cx, cy)
                    if d < best:
                        best, bx, by = d, cx, cy
            radius = span
            while radius >= 1:
                cx = bx + rng.below(2 * radius + 1) - radius
                cy = by + rng.below(2 * radius + 1) - radius
                if 0 <= cx < w and 0 <= cy < h and valid[cy, cx] and (cx != bx or cy != by):
                    d = distance(tx, ty, cx, cy)
                    if d < best:
                        best, bx, by = d, cx, cy
                radius //= 2
            matches[k] = (bx, by)
            dist[k] = best
        sums = np.zeros((h, w, 3), dtype=np.int64)
        counts = np.zeros((h, w), dtype=np.int64)
        for (tx, ty), (sx, sy) in zip(targets, matches, strict=True):
            x0, x1 = max(0, tx - r), min(w - 1, tx + r)
            y0, y1 = max(0, ty - r), min(h - 1, ty + r)
            sums[y0:y1 + 1, x0:x1 + 1] += original[sy + (y0 - ty):sy + (y1 - ty) + 1, sx + (x0 - tx):sx + (x1 - tx) + 1]
            counts[y0:y1 + 1, x0:x1 + 1] += 1
        for y, x in zip(hole_y.tolist(), hole_x.tolist(), strict=True):
            for c in range(3):
                work[y, x, c] = round_div(int(sums[y, x, c]), int(counts[y, x]))
        dist = np.array([distance(int(tx), int(ty), int(sx), int(sy)) for (tx, ty), (sx, sy) in zip(targets, matches, strict=True)],
                        dtype=np.int64)
        history.append(int(dist.sum()) / len(dist))
    out = img.copy()
    out[..., :3] = work.astype(np.uint8)
    return PatchMatchResult(out, targets.astype(np.int64), matches.astype(np.int64), tuple(history))
