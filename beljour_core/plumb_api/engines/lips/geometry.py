'Lip geometry and conservative warps for R16B. Author: John Khan.'

from __future__ import annotations

import numpy as np

OUTER = (61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78)

INNER = (78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 402, 317, 14, 87, 178, 88)

CORNERS = (61, 291)

def polygon(points: np.ndarray, ids: tuple[int, ...]) -> np.ndarray:
    return points[np.asarray(ids, dtype=np.int64)]

def lip_bounds(points: np.ndarray) -> tuple[float, float, float, float]:
    p = polygon(points, OUTER)
    return (float(p[:, 0].min()), float(p[:, 1].min()), float(p[:, 0].max()), float(p[:, 1].max()))

def signed_distance_mask(h: int, w: int, poly: np.ndarray, feather: float=0.12) -> np.ndarray:
    xs = (np.arange(w) + 0.5) / w
    ys = (np.arange(h) + 0.5) / h
    x, y = np.meshgrid(xs, ys)
    inside = np.zeros((h, w), dtype=bool)
    dist = np.full((h, w), np.inf, dtype=np.float64)
    for a, b in zip(poly, np.roll(poly, -1, axis=0), strict=True):
        ax, ay = a
        bx, by = b
        cross = ((ay > y) != (by > y)) & (x < (bx - ax) * (y - ay) / (by - ay + 1e-12) + ax)
        inside ^= cross
        vx, vy = (bx - ax, by - ay)
        denom = vx * vx + vy * vy + 1e-12
        t = np.clip(((x - ax) * vx + (y - ay) * vy) / denom, 0, 1)
        d = np.sqrt((x - (ax + t * vx)) ** 2 + (y - (ay + t * vy)) ** 2)
        dist = np.minimum(dist, d)
    scale = max(1 / w, 1 / h) * (1 + 8 * feather)
    soft = np.clip(1 - dist / (scale + 1e-12), 0, 1)
    return np.where(inside, 1, np.where(soft > 0, soft * 0.65, 0)).astype(np.float32)

def lip_mask(h: int, w: int, points: np.ndarray, feather: float=0.12) -> np.ndarray:
    outer = signed_distance_mask(h, w, polygon(points, OUTER), feather)
    inner = signed_distance_mask(h, w, polygon(points, INNER), feather * 0.5)
    return np.clip(outer - inner * 0.92, 0, 1)

def edge_ring(mask: np.ndarray, width: int=2) -> np.ndarray:
    out = np.zeros_like(mask)
    for dy in range(-width, width + 1):
        for dx in range(-width, width + 1):
            out = np.maximum(out, np.roll(mask, (dy, dx), (0, 1)))
    inn = np.ones_like(mask)
    for dy in range(-width, width + 1):
        for dx in range(-width, width + 1):
            inn = np.minimum(inn, np.roll(mask, (dy, dx), (0, 1)))
    return np.clip(out - inn, 0, 1)

def warp_vertical(image: np.ndarray, points: np.ndarray, amount: float, upper: float=1, lower: float=1) -> np.ndarray:
    if amount <= 0:
        return image.copy()
    h, w = image.shape[:2]
    out = image.copy()
    x0, y0, x1, y1 = lip_bounds(points)
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    yy0 = max(0, int((y0 - 0.04) * h))
    yy1 = min(h, int((y1 + 0.04) * h) + 1)
    xx0 = max(0, int((x0 - 0.04) * w))
    xx1 = min(w, int((x1 + 0.04) * w) + 1)
    src = image[yy0:yy1, xx0:xx1]
    if src.size == 0:
        return out
    ys = np.arange(yy0, yy1)[:, None] / h
    xs = np.arange(xx0, xx1)[None, :] / w
    sigma_x = max((x1 - x0) * 0.55, 0.02)
    sigma_y = max((y1 - y0) * 0.9, 0.02)
    weight = np.exp(-((xs - cx) / sigma_x) ** 2 - ((ys - cy) / sigma_y) ** 2)
    side = np.where(ys < cy, upper, lower)
    displacement = (ys - cy) * amount * 0.24 * weight * side
    sy = np.clip(((ys - displacement) * h).astype(int), 0, h - 1)
    sx = np.broadcast_to(np.arange(xx0, xx1)[None, :], sy.shape)
    sampled = image[sy, sx]
    alpha = (weight * np.clip(amount * 2, 0, 1))[..., None]
    mixed = np.clip(src[..., :3] * (1 - alpha) + sampled[..., :3] * alpha, 0, 255).astype(np.uint8)
    out[yy0:yy1, xx0:xx1, :3] = mixed
    if image.shape[2] == 4:
        out[..., 3] = image[..., 3]
    return out

def overline_mask(h: int, w: int, points: np.ndarray, amount: float) -> np.ndarray:
    base = lip_mask(h, w, points, 0.08)
    ring = edge_ring(base, max(1, int(min(h, w) * 0.0025)))
    xs = np.arange(w)[None, :] / w
    p = polygon(points, OUTER)
    left, right = (float(p[:, 0].min()), float(p[:, 0].max()))
    span = max(right - left, 1e-06)
    t = (xs - left) / span
    safe = np.clip(np.sin(np.pi * np.clip(t, 0, 1)), 0, 1) ** 1.5
    return np.clip(ring * safe * amount, 0, 1)
