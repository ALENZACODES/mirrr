"""Boundaries and numerical contracts for the original artistic filter family.

The frame is an RGB/RGBA uint8 photo. Masks have one finite 0..1 value per pixel.
Normalized mesh coordinates use the existing MediaPipe topology; no new model,
weights, facial templates, external art, or network service is used here.
All byte conversion is round-half-up, deliberately specified for both ports.
No effect replaces alpha or reads another person's image. Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

Bytes = NDArray[np.uint8]
Plane = NDArray[np.float64]
MAX_PIXELS = 4_194_304
MAX_SIDE = 8192
VERSION = "artistic-local/1"


class EffectUnavailable(ValueError):
    """A required user-supplied observation is absent; do not substitute a guess."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class ArtisticResult:
    image: Bytes
    support: Plane
    metrics: dict[str, float | bool | str]
    warnings: tuple[str, ...]
    label: str
    effect_id: str
    version: str = VERSION
    geometry: dict[str, Any] = field(default_factory=dict)


def photo(value: np.ndarray, *, max_pixels: int = MAX_PIXELS) -> Bytes:
    arr = np.asarray(value)
    if arr.dtype != np.uint8 or arr.ndim != 3 or arr.shape[2] not in (3, 4):
        raise ValueError("photo must be a uint8 RGB or RGBA image")
    h, w = arr.shape[:2]
    if min(h, w) < 2 or max(h, w) > MAX_SIDE or h * w > max_pixels:
        raise ValueError(f"artistic working photo must be 2..{MAX_SIDE} per side and at most {max_pixels} pixels")
    return arr


def mask(value: Any, shape: tuple[int, int], name: str) -> Plane:
    if value is None:
        raise EffectUnavailable(f"missing_{name}", f"{name.replace('_', ' ')} is required; add an observed or manual mask")
    arr = np.asarray(value, dtype=np.float64)
    if arr.shape != shape or not np.all(np.isfinite(arr)) or np.any(arr < 0) or np.any(arr > 1):
        raise ValueError(f"{name} must match the photo and contain finite 0..1 values")
    return arr


def landmarks(value: Any, shape: tuple[int, int]) -> Plane:
    if value is None:
        raise EffectUnavailable("missing_landmarks", "a confirmed face mesh is required")
    arr = np.asarray(value, dtype=np.float64)
    if arr.ndim != 2 or arr.shape[0] != 478 or arr.shape[1] not in (2, 3):
        raise ValueError("landmarks must contain 478 normalized x,y points")
    if not np.all(np.isfinite(arr)) or np.any(arr[:, :2] < -0.5) or np.any(arr[:, :2] > 1.5):
        raise ValueError("landmarks must be finite normalized coordinates near the frame")
    h, w = shape
    pts = arr[:, :2] * np.array([w, h], dtype=np.float64)
    iod = float(np.linalg.norm(pts[468] - pts[473]))
    if iod < 4 or iod > max(w, h):
        raise EffectUnavailable("mesh_too_small", "the confirmed eye distance must be at least four pixels")
    return pts


def number(value: Any, name: str, low: float, high: float) -> float:
    if isinstance(value, (bool, str)) or not isinstance(value, (int, float, np.number)):
        raise ValueError(f"{name} must be a finite number in {low}..{high}")
    val = float(value)
    if not math.isfinite(val) or not low <= val <= high:
        raise ValueError(f"{name} must be a finite number in {low}..{high}")
    return val


def integer(value: Any, name: str, low: int, high: int) -> int:
    val = number(value, name, low, high)
    if val != math.floor(val):
        raise ValueError(f"{name} must be an integer")
    return int(val)


def parameters(value: Mapping[str, Any] | None, defaults: Mapping[str, Any]) -> dict[str, Any]:
    if value is None:
        return dict(defaults)
    if not isinstance(value, Mapping):
        raise ValueError("params must be a mapping")
    unknown = set(value) - set(defaults)
    if unknown:
        raise ValueError(f"unknown artistic parameters: {', '.join(sorted(map(str, unknown)))}")
    return {**defaults, **value}


def colour(value: Sequence[float], name: str = "colour") -> tuple[float, float, float]:
    if isinstance(value, (str, bytes)) or len(value) != 3:
        raise ValueError(f"{name} needs three byte components")
    return (number(value[0], name, 0, 255), number(value[1], name, 0, 255),
            number(value[2], name, 0, 255))


def byte_round(values: np.ndarray) -> Bytes:
    return np.floor(np.clip(values, 0, 255) + 0.5).astype(np.uint8)


def luma(rgb: np.ndarray) -> Plane:
    values = np.asarray(rgb, dtype=np.float64)
    return values[..., 0] * 0.2126 + values[..., 1] * 0.7152 + values[..., 2] * 0.0722


def smooth01(value: np.ndarray | float) -> Any:
    t = np.clip(value, 0, 1)
    return t * t * (3 - 2 * t)


def grid(shape: tuple[int, int]) -> tuple[Plane, Plane]:
    y, x = np.mgrid[0:shape[0], 0:shape[1]]
    return x.astype(np.float64) + 0.5, y.astype(np.float64) + 0.5


def blend(source: Bytes, rgb: np.ndarray, coverage: np.ndarray) -> Bytes:
    out = source.copy()
    alpha = np.clip(coverage, 0, 1)
    if source.shape[2] == 4:
        alpha = alpha * (source[..., 3] > 0)
    out[..., :3] = byte_round(source[..., :3] * (1 - alpha[..., None]) + rgb * alpha[..., None])
    return out


def evidence(before: Bytes, after: Bytes, support: Plane) -> dict[str, float | bool | str]:
    delta = np.abs(after[..., :3].astype(float) - before[..., :3].astype(float))
    outside = support <= 0
    transparent = before[..., 3] == 0 if before.shape[2] == 4 else np.zeros(before.shape[:2], dtype=bool)
    return {
        "finite": bool(np.all(np.isfinite(after))),
        "changed_pixels": float(np.count_nonzero(np.any(delta != 0, axis=2))),
        "mean_channel_change": float(np.mean(delta)),
        "outside_max_error": float(np.max(delta[outside], initial=0)),
        "alpha_unchanged": bool(before.shape[2] == 3 or np.array_equal(before[..., 3], after[..., 3])),
        "transparent_unchanged": bool(np.array_equal(before[transparent], after[transparent])),
    }


def result(effect_id: str, before: Bytes, after: Bytes, support: Plane, label: str,
           metrics: Mapping[str, float | bool | str] | None = None,
           warnings: Sequence[str] = (), geometry: Mapping[str, Any] | None = None) -> ArtisticResult:
    return ArtisticResult(after, np.asarray(support, dtype=np.float64),
                          {**evidence(before, after, support), **(metrics or {})},
                          tuple(warnings), label, effect_id, geometry=dict(geometry or {}))


def hash_noise(x: np.ndarray, y: np.ndarray, seed: int) -> Plane:
    """Coordinate-addressable integer hash, identical to the unsigned TS arithmetic."""
    a = np.asarray(x, dtype=np.uint64) * 374761393
    a += np.asarray(y, dtype=np.uint64) * 668265263
    a += np.uint64(seed) * 2246822519
    a &= np.uint64(0xFFFFFFFF)
    a = ((a ^ (a >> 13)) * 1274126177) & np.uint64(0xFFFFFFFF)
    a ^= a >> 16
    return a.astype(np.float64) / 4294967295.0


def bilinear(source: Bytes, x: Plane, y: Plane) -> Plane:
    """Sample at integer pixel indices, with clamped edges and RGB only."""
    h, w = source.shape[:2]
    px, py = np.clip(x, 0, w - 1), np.clip(y, 0, h - 1)
    ix, iy = np.floor(px).astype(int), np.floor(py).astype(int)
    jx, jy = np.minimum(ix + 1, w - 1), np.minimum(iy + 1, h - 1)
    fx, fy = (px - ix)[..., None], (py - iy)[..., None]
    top = source[iy, ix, :3] * (1 - fx) + source[iy, jx, :3] * fx
    bottom = source[jy, ix, :3] * (1 - fx) + source[jy, jx, :3] * fx
    return top * (1 - fy) + bottom * fy
