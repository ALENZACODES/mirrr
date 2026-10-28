"""Identity marks: freckles and moles found on the original, and whether an edit kept them.

The women-first brief makes pores, freckles and moles part of identity ("Texture is kept",
and the loser reason "Not Her / Erased Marks"). A mark here is a small, compact patch of skin
darker than its surroundings: local luma contrast above a threshold, area between
(IOD/40)^2 and (IOD/5)^2 pixels, at least 7% darker than the surround. This is a photometric heuristic, not a dermatology tool, and
it misses marks that are lighter than the skin or hidden in shadow (limits in
docs/QUALITY_ARENA.md). Face-mapping inspiration: MediaPipe Face Landmarker (mesh topology, data) and face-parsing.PyTorch (edit only the skin
region); concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..engines.core.filters import box_mean

Floats = NDArray[np.float64]
CONTRAST_MIN = 3.0     # luma units (0-255) darker than the local surround; ASSUMED
RELATIVE_MIN = 0.07    # and at least 7% darker than the surround, so dark and light skin are treated alike
KEPT_SHARE = 0.5       # a mark is kept if at least half its contrast is still there; ASSUMED
MAX_MARKS = 400


@dataclass(frozen=True)
class Mark:
    x: float
    y: float
    radius: float
    contrast: float
    area: int


def luma(image: np.ndarray) -> Floats:
    rgb = image[..., :3].astype(np.float64)
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def local_contrast(image: np.ndarray, iod: float, *, relative: bool = False) -> Floats:
    """How much darker each pixel (lightly smoothed against grain) is than the mean of a
    window about IOD/6 across; as a share of that mean when `relative`."""
    y = luma(image)
    radius = max(2, int(round(iod / 12)))
    surround = box_mean(y, radius)
    con = surround - box_mean(y, 1)
    return con / np.maximum(surround, 8.0) if relative else con


def _components(mask: NDArray[np.bool_], limit: int = 200_000) -> list[NDArray[np.int64]]:
    """4-connected components as arrays of flat indices (plain BFS; candidate masks are sparse)."""
    h, w = mask.shape
    flat = mask.ravel().copy()
    on = np.flatnonzero(flat)
    if on.size > limit:
        on = on[:limit]
    out: list[NDArray[np.int64]] = []
    for start in on:
        if not flat[start]:
            continue
        flat[start] = False
        stack = [int(start)]
        members = []
        while stack:
            p = stack.pop()
            members.append(p)
            r, c = divmod(p, w)
            for q, ok in ((p - w, r > 0), (p + w, r < h - 1), (p - 1, c > 0), (p + 1, c < w - 1)):
                if ok and flat[q]:
                    flat[q] = False
                    stack.append(q)
        out.append(np.asarray(members, dtype=np.int64))
    return out


def find_marks(image: np.ndarray, skin: np.ndarray, iod: float, *, contrast_min: float = CONTRAST_MIN) -> list[Mark]:
    """Freckle- and mole-like marks inside the skin mask, strongest first."""
    if iod <= 0:
        raise ValueError("inter-ocular distance must be positive")
    h, w = image.shape[:2]
    con = local_contrast(image, iod)
    rel = local_contrast(image, iod, relative=True)
    inside = np.asarray(skin, dtype=np.float64) >= 0.5
    candidates = (con >= contrast_min) & (rel >= RELATIVE_MIN) & inside
    lo, hi = (iod / 40.0) ** 2, (iod / 5.0) ** 2
    marks: list[Mark] = []
    for members in _components(candidates):
        area = members.size
        if not lo <= area <= hi:
            continue
        rows, cols = np.divmod(members, w)
        # compact blobs only: long thin dark runs are lines (wrinkles, hair, lashes), not marks
        span = max(np.max(rows) - np.min(rows) + 1, np.max(cols) - np.min(cols) + 1)
        if span * span > 4.0 * area:
            continue
        values = rel.ravel()[members]
        marks.append(Mark(float(cols.mean()), float(rows.mean()), float(np.sqrt(area / np.pi)),
                          float(values.mean()), int(area)))
    marks.sort(key=lambda m: -m.contrast)
    return marks[:MAX_MARKS]


def displaced(marks: list[Mark], before: np.ndarray | None, after: np.ndarray | None) -> list[Mark]:
    """Move marks with the face: each takes the inverse-distance mean displacement of its
    six nearest landmarks. Without landmarks the marks stay where they are."""
    if before is None or after is None or not marks:
        return list(marks)
    src = np.asarray(before, dtype=np.float64)[:, :2]
    dst = np.asarray(after, dtype=np.float64)[:, :2]
    if src.shape != dst.shape:
        raise ValueError("landmark sets must match")
    move = dst - src
    out = []
    for m in marks:
        d = np.hypot(src[:, 0] - m.x, src[:, 1] - m.y)
        near = np.argsort(d)[:6]
        weight = 1.0 / np.maximum(d[near], 1.0)
        shift = (move[near] * weight[:, None]).sum(axis=0) / weight.sum()
        out.append(Mark(m.x + float(shift[0]), m.y + float(shift[1]), m.radius, m.contrast, m.area))
    return out


@dataclass(frozen=True)
class Retention:
    found: int
    kept: int

    @property
    def share(self) -> float | None:
        return self.kept / self.found if self.found else None


def retention(original_marks: list[Mark], edited: np.ndarray, iod: float, *, kept_share: float = KEPT_SHARE) -> Retention:
    """How many of the original's marks still show at least `kept_share` of their contrast."""
    if not original_marks:
        return Retention(0, 0)
    con = local_contrast(edited, iod, relative=True)
    h, w = con.shape
    kept = 0
    for m in original_marks:
        r = max(1, int(round(m.radius)))
        x0, x1 = max(0, int(m.x) - r), min(w, int(m.x) + r + 1)
        y0, y1 = max(0, int(m.y) - r), min(h, int(m.y) + r + 1)
        if x0 >= x1 or y0 >= y1:
            continue
        if float(np.max(con[y0:y1, x0:x1])) >= kept_share * m.contrast:
            kept += 1
    return Retention(len(original_marks), kept)


def mark_mask(marks: list[Mark], shape: tuple[int, int], *, grow: float = 1.6) -> Floats:
    """Soft mask over the marks (for protecting them when grafting texture back)."""
    h, w = shape
    out = np.zeros((h, w), dtype=np.float64)
    for m in marks:
        r = max(1.5, m.radius * grow)
        x0, x1 = max(0, int(m.x - 2 * r)), min(w, int(m.x + 2 * r) + 1)
        y0, y1 = max(0, int(m.y - 2 * r)), min(h, int(m.y + 2 * r) + 1)
        if x0 >= x1 or y0 >= y1:
            continue
        yy, xx = np.mgrid[y0:y1, x0:x1]
        blob = np.exp(-((xx - m.x) ** 2 + (yy - m.y) ** 2) / (2 * r * r))
        out[y0:y1, x0:x1] = np.maximum(out[y0:y1, x0:x1], blob)
    return out
