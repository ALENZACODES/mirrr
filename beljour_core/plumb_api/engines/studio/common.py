"""Shared pieces of the local photo studio: photo and mask checks, coded refusals, the
seeded hash noise, mask-weighted blurs, the guided matte filter and the face box
(from her own face points only).

Everything is plain arithmetic on the photo she gave: no depth model, no generated pixels,
no downloaded asset. Box means come from engines/core/filters.py, bytes are rounded half to
even (engines/shade/colourspace.py), and web/src/engines/studio/common.ts mirrors this file
in the same operation order. Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

from plumb_api.engines.core.filters import MAX_RADIUS, box_mean
from plumb_api.engines.shade.colourspace import to_bytes

Floats = NDArray[np.float64]
MAX_PIXELS = 4096 * 4096
MIN_SIDE = 32


class StudioRefusal(ValueError):
    """A coded refusal: the studio returns no picture rather than a guessed one."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class StudioResult:
    image: np.ndarray                     # uint8, same height and width; RGBA only where alpha is the point
    label: str
    metrics: dict[str, float | int | str | bool] = field(default_factory=dict)
    crops: tuple[tuple[str, int, int, int, int], ...] = ()


def photo(image: Any) -> tuple[Floats, np.ndarray | None]:
    """RGB as float64 and the alpha channel (or None) of an RGB or RGBA uint8 photo."""
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError("photo must be RGB or RGBA uint8")
    h, w = image.shape[:2]
    if min(h, w) < MIN_SIDE or h * w > MAX_PIXELS:
        raise StudioRefusal("photo_size", f"photo must be at least {MIN_SIDE} px a side and at most {MAX_PIXELS} pixels")
    alpha = image[..., 3].copy() if image.shape[2] == 4 else None
    return image[..., :3].astype(np.float64), alpha


def person_mask(mask: Any, height: int, width: int) -> Floats:
    """Her person area, 0..1, from the segmenter or her own marking; never guessed here."""
    if mask is None:
        raise StudioRefusal("no_person_mask", "Mark the person area or run the person segmenter on this device first.")
    m = np.asarray(mask, dtype=np.float64)
    if m.shape != (height, width) or not np.all(np.isfinite(m)):
        raise ValueError("person mask must be a finite height x width plane")
    m = np.clip(m, 0, 1)
    share = float(m.mean())
    if share < 0.02 or share > 0.98:
        raise StudioRefusal("person_mask_unusable", "The person area covers almost none or almost all of the photo.")
    return m


def strength(value: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 100:
        raise ValueError("strength must be 0..100")
    return float(value) / 100


def hash_noise(width: int, height: int, seed: int) -> Floats:
    """Uniform 0..1 per pixel from a 32-bit integer hash of (x, y, seed)."""
    yy, xx = np.mgrid[:height, :width].astype(np.uint64)
    mask = np.uint64(0xFFFFFFFF)
    h = (xx * np.uint64(374761393) + yy * np.uint64(668265263) + np.uint64(seed % 2**32) * np.uint64(2246822519)) & mask
    h = ((h ^ (h >> np.uint64(13))) * np.uint64(1274126177)) & mask
    h = h ^ (h >> np.uint64(16))
    return h.astype(np.float64) / 4294967296.0


def radius_for(width: int, height: int, share: float) -> int:
    """A blur radius as a share of the photo's short side, within the core filter's limit."""
    return int(min(MAX_RADIUS, max(1, math.floor(min(width, height) * share + 0.5))))


def soft_blur(values: np.ndarray, radius: int) -> Floats:
    """Three box passes, close to a Gaussian of sigma about radius."""
    out = np.asarray(values, dtype=np.float64)
    for _ in range(3):
        out = box_mean(out, radius)
    return out


def weighted_blur(rgb: Floats, weight: Floats, radius: int) -> Floats:
    """Blur that only gathers colour where `weight` is set, so the person never bleeds into
    the background (and the background never into her)."""
    num = soft_blur(rgb * weight[..., None], radius)
    den = soft_blur(weight, radius)
    return num / np.maximum(den, 1e-6)[..., None]


def guided(guide: Floats, source: Floats, radius: int, eps: float) -> Floats:
    """Guided filter of `source` steered by the grey `guide`, written from the published
    equations (He, Sun and Tang, 2010) with box means."""
    mean_i = box_mean(guide, radius)
    mean_p = box_mean(source, radius)
    corr_ip = box_mean(guide * source, radius)
    var_i = box_mean(guide * guide, radius) - mean_i * mean_i
    a = (corr_ip - mean_i * mean_p) / (var_i + eps)
    b = mean_p - a * mean_i
    return box_mean(a, radius) * guide + box_mean(b, radius)


def grey(rgb: Floats) -> Floats:
    return (rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722) / 255


def face_box(points: Any) -> tuple[float, float, float, float]:
    """(left, top, right, bottom) of her 478 face points; refused without them, because a
    face is never guessed from the person area or from skin colour."""
    if points is None:
        raise StudioRefusal("no_face_points", "Read face points on this device first.")
    pts = np.asarray(points, dtype=np.float64)
    if pts.ndim != 2 or pts.shape[0] != 478 or pts.shape[1] < 2 or not np.all(np.isfinite(pts[:, :2])):
        raise ValueError("face points must be 478 finite (x, y) pairs")
    x0, y0 = pts[:, :2].min(axis=0)
    x1, y1 = pts[:, :2].max(axis=0)
    return float(x0), float(y0), float(x1), float(y1)


def half_up(value: float) -> int:
    """Round half up, the same in both ports (Python's round() is half to even)."""
    return int(math.floor(value + 0.5))


def face_rows_cols(box: tuple[float, float, float, float], height: int, width: int) -> tuple[slice, slice]:
    """Row and column slices of the face box, clipped to the photo."""
    x0, y0, x1, y1 = (half_up(v) for v in box)
    return slice(max(0, y0), min(height, y1 + 1)), slice(max(0, x0), min(width, x1 + 1))


def finish(rgb: Floats, alpha: np.ndarray | None) -> np.ndarray:
    out = to_bytes(rgb)
    if alpha is None:
        return out
    return np.dstack([out, alpha])


def changed_share(before: Floats, after: np.ndarray, where: Floats) -> float:
    moved = np.any(np.abs(to_bytes(before).astype(int) - after[..., :3].astype(int)) > 0, axis=2)
    total = float(where.sum())
    return float((moved * where).sum() / total) if total else 0.0
