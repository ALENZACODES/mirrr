'Checked-region mask operations for Skin & More. Author: John Khan.'

from __future__ import annotations

from collections import deque
from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class MaskStats:
    area: int
    fraction: float
    x0: int
    y0: int
    x1: int
    y1: int
    components: int
    edge_pixels: int

def validate_mask(mask: np.ndarray, shape: tuple[int, int] | None=None) -> np.ndarray:
    arr = np.asarray(mask, dtype=np.float32)
    if arr.ndim != 2:
        raise ValueError('mask must be two-dimensional')
    if shape is not None and arr.shape != shape:
        raise ValueError(f'mask shape {arr.shape} does not match {shape}')
    if not np.all(np.isfinite(arr)):
        raise ValueError('mask must be finite')
    return np.clip(arr, 0.0, 1.0)

def binary(mask: np.ndarray, threshold: float=0.5) -> np.ndarray:
    if not 0 <= threshold <= 1:
        raise ValueError('threshold must be in [0,1]')
    return validate_mask(mask) >= threshold

def dilate(mask: np.ndarray, radius: int=1) -> np.ndarray:
    if radius < 0 or radius > 32:
        raise ValueError('radius must be between 0 and 32')
    src = binary(mask)
    out = src.copy()
    for _ in range(radius):
        p = np.pad(out, 1, mode='constant')
        out = p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:] | p[:-2, :-2] | p[:-2, 2:] | p[2:, :-2] | p[2:, 2:]
    return out.astype(np.float32)

def erode(mask: np.ndarray, radius: int=1) -> np.ndarray:
    if radius < 0 or radius > 32:
        raise ValueError('radius must be between 0 and 32')
    src = binary(mask)
    out = src.copy()
    for _ in range(radius):
        p = np.pad(out, 1, mode='constant')
        out = p[1:-1, 1:-1] & p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:] & p[:-2, :-2] & p[:-2, 2:] & p[2:, :-2] & p[2:, 2:]
    return out.astype(np.float32)

def opening(mask: np.ndarray, radius: int=1) -> np.ndarray:
    return dilate(erode(mask, radius), radius)

def closing(mask: np.ndarray, radius: int=1) -> np.ndarray:
    return erode(dilate(mask, radius), radius)

def edge(mask: np.ndarray, radius: int=1) -> np.ndarray:
    src = binary(mask)
    inner = erode(src.astype(np.float32), radius) > 0.5
    return (src & ~inner).astype(np.float32)

def feather(mask: np.ndarray, radius: int=4) -> np.ndarray:
    """Small deterministic distance-like feather without SciPy dependency."""
    if radius < 0 or radius > 64:
        raise ValueError('radius must be between 0 and 64')
    src = validate_mask(mask)
    if radius == 0:
        return src
    inside = binary(src)
    result = inside.astype(np.float32)
    ring = inside.copy()
    for step in range(1, radius + 1):
        grown = dilate(ring.astype(np.float32), 1) > 0.5
        new = grown & ~ring
        result[new] = max(result[new].max(initial=0.0), 1.0 - step / (radius + 1.0))
        ring = grown
    return np.maximum(result, src)

def union(*masks: np.ndarray) -> np.ndarray:
    if not masks:
        raise ValueError('at least one mask is required')
    shape = np.asarray(masks[0]).shape
    out = np.zeros(shape, dtype=np.float32)
    for m in masks:
        out = np.maximum(out, validate_mask(m, shape))
    return out

def intersect(*masks: np.ndarray) -> np.ndarray:
    if not masks:
        raise ValueError('at least one mask is required')
    shape = np.asarray(masks[0]).shape
    out = np.ones(shape, dtype=np.float32)
    for m in masks:
        out = np.minimum(out, validate_mask(m, shape))
    return out

def subtract(mask: np.ndarray, exclusion: np.ndarray) -> np.ndarray:
    a = validate_mask(mask)
    b = validate_mask(exclusion, a.shape)
    return np.clip(a - b, 0.0, 1.0)

def connected_components(mask: np.ndarray) -> tuple[np.ndarray, int]:
    src = binary(mask)
    h, w = src.shape
    labels = np.zeros((h, w), dtype=np.int32)
    label = 0
    for y in range(h):
        for x in range(w):
            if not src[y, x] or labels[y, x]:
                continue
            label += 1
            q: deque[tuple[int, int]] = deque([(y, x)])
            labels[y, x] = label
            while q:
                yy, xx = q.popleft()
                for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    ny, nx = (yy + dy, xx + dx)
                    if 0 <= ny < h and 0 <= nx < w and src[ny, nx] and (not labels[ny, nx]):
                        labels[ny, nx] = label
                        q.append((ny, nx))
    return (labels, label)

def remove_small_components(mask: np.ndarray, minimum: int=4) -> np.ndarray:
    if minimum < 1:
        raise ValueError('minimum must be positive')
    labels, count = connected_components(mask)
    out = np.zeros(labels.shape, dtype=np.float32)
    for label in range(1, count + 1):
        points = labels == label
        if int(points.sum()) >= minimum:
            out[points] = 1.0
    return out

def stats(mask: np.ndarray) -> MaskStats:
    src = binary(mask)
    h, w = src.shape
    ys, xs = np.nonzero(src)
    _, components = connected_components(src.astype(np.float32))
    edge_pixels = int(edge(src.astype(np.float32)).sum())
    if not len(xs):
        return MaskStats(0, 0.0, 0, 0, 0, 0, components, edge_pixels)
    return MaskStats(int(len(xs)), float(len(xs) / (h * w)), int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1), components, edge_pixels)

def overlap(a: np.ndarray, b: np.ndarray) -> dict[str, float]:
    aa = binary(a)
    bb = binary(b)
    inter = int(np.logical_and(aa, bb).sum())
    union_area = int(np.logical_or(aa, bb).sum())
    a_area = int(aa.sum())
    b_area = int(bb.sum())
    return {'intersection': float(inter), 'iou': inter / union_area if union_area else 1.0, 'a_covered': inter / a_area if a_area else 1.0, 'b_covered': inter / b_area if b_area else 1.0}

def alpha_composite(original: np.ndarray, overlay_rgb: tuple[int, int, int], mask: np.ndarray, opacity: float) -> np.ndarray:
    if not 0 <= opacity <= 1:
        raise ValueError('opacity must be in [0,1]')
    image = np.asarray(original)
    if image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError('image must be RGB or RGBA')
    m = validate_mask(mask, image.shape[:2])[..., None] * opacity
    out = image.copy()
    rgb = image[..., :3].astype(np.float32)
    colour = np.asarray(overlay_rgb, dtype=np.float32)
    out[..., :3] = np.clip(rgb * (1 - m) + colour * m, 0, 255).astype(np.uint8)
    if image.shape[2] == 4:
        out[..., 3] = image[..., 3]
    return out

def protected_change_fraction(before: np.ndarray, after: np.ndarray, protected: np.ndarray) -> float:
    if before.shape != after.shape:
        raise ValueError('images must have the same shape')
    p = binary(protected)
    if not p.any():
        return 0.0
    changed = np.any(before[..., :3] != after[..., :3], axis=2)
    return float(changed[p].mean())

def outside_change_fraction(before: np.ndarray, after: np.ndarray, allowed: np.ndarray) -> float:
    a = binary(allowed)
    outside = ~a
    if not outside.any():
        return 0.0
    changed = np.any(before[..., :3] != after[..., :3], axis=2)
    return float(changed[outside].mean())
