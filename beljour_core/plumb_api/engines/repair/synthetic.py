"""LS6 synthetic ground truth: a clean drawn scene, known degradations, and Q11 metrics.

The scene (no person, no photo) is a soft gradient with discs, rings and a diamond, so its
edges run in every direction (isotropic for the motion test) and its flat areas let the
wavelet noise estimate work. Degradations are exact and seeded by integer hashing:
Gaussian-like noise (sum of four uniform hash fields, sigma in 0..255 units), Gaussian
blur, horizontal or vertical motion blur (a box kernel), low light (linear scale), a
colour cast (linear gains) and JPEG-like 8 x 8 block offsets. Q11 = PSNR gain, the noise
estimate going down and Laplacian variance going up, with the plan's thresholds:
  M1 auto-enhance: noise sigma -30% on sigma 15, PSNR +2 dB (ASSUMED)
  M4 denoise: sigma -40% at sigma 20, PSNR +3 dB
  M2 deblur: PSNR >= +1.5 dB on synthetic motion blur
Mirrored in web/src/engines/local/enhance.ts. Author: John Khan.
"""
from __future__ import annotations

import math
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ...quality.harness import hash_noise
from ..core.composite import decode, encode
from ..core.filters import convolve
from .analyse import gaussian_kernel

U8 = NDArray[np.uint8]
Q11 = {
    "M1": {"noise_sigma": 15.0, "sigma_drop": 0.30, "psnr_gain": 2.0},
    "M4": {"noise_sigma": 20.0, "sigma_drop": 0.40, "psnr_gain": 3.0},
    "M2": {"motion_length": 7, "psnr_gain": 1.5},
}


def scene(width: int = 192, height: int = 160) -> U8:
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    px, py = xx + 0.5, yy + 0.5
    base = np.stack([70 + 60 * py / height, 90 + 40 * px / width, 120 + 30 * (px + py) / (width + height)], -1)

    def disc(cx: float, cy: float, r: float) -> np.ndarray:
        return np.clip(r + 0.5 - np.hypot(px - cx, py - cy), 0.0, 1.0)[..., None]

    def paint(img: np.ndarray, mask: np.ndarray, colour: tuple[float, float, float]) -> np.ndarray:
        return img * (1 - mask) + np.array(colour)[None, None, :] * mask

    s = min(width, height)
    img = paint(base, disc(0.27 * width, 0.35 * height, 0.18 * s), (205.0, 150.0, 110.0))
    ring = np.clip(disc(0.7 * width, 0.4 * height, 0.2 * s) - disc(0.7 * width, 0.4 * height, 0.12 * s), 0.0, 1.0)
    img = paint(img, ring, (45.0, 60.0, 95.0))
    img = paint(img, disc(0.7 * width, 0.4 * height, 0.06 * s), (210.0, 200.0, 70.0))
    diamond = np.clip(0.11 * s + 0.5 - (np.abs(px - 0.45 * width) + np.abs(py - 0.75 * height)), 0.0, 1.0)[..., None]
    img = paint(img, diamond, (60.0, 160.0, 90.0))
    img = paint(img, disc(0.85 * width, 0.8 * height, 0.08 * s), (190.0, 70.0, 80.0))
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)


def add_noise(image: np.ndarray, sigma: float, seed: int = 1) -> U8:
    """Independent noise per channel: sqrt(3) x sigma x (sum of four uniform [-0.5, 0.5))."""
    img = np.asarray(image)[..., :3].astype(np.float64)
    h, w = img.shape[:2]
    out = img.copy()
    for c in range(3):
        field = sum(hash_noise(seed * 16 + c * 4 + k, h, w) for k in range(4))
        out[..., c] += math.sqrt(3.0) * sigma * field
    return np.clip(np.rint(out), 0, 255).astype(np.uint8)


def blur(image: np.ndarray, sigma: float) -> U8:
    k = gaussian_kernel(sigma)
    img = np.asarray(image)[..., :3].astype(np.float64)
    out = np.stack([convolve(convolve(img[..., c], k, 0), k, 1) for c in range(3)], -1)
    return np.clip(np.rint(out), 0, 255).astype(np.uint8)


def motion_blur(image: np.ndarray, length: int, axis: int = 1) -> U8:
    if length < 3 or length % 2 == 0 or axis not in (0, 1):
        raise ValueError("motion length must be odd and >= 3; axis 0 or 1")
    k = np.full(length, 1.0 / length)
    img = np.asarray(image)[..., :3].astype(np.float64)
    out = np.stack([convolve(img[..., c], k, axis) for c in range(3)], -1)
    return np.clip(np.rint(out), 0, 255).astype(np.uint8)


def low_light(image: np.ndarray, factor: float) -> U8:
    return encode(np.clip(decode(image) * factor, 0.0, 1.0))


def cast(image: np.ndarray, gains: tuple[float, float, float]) -> U8:
    return encode(np.clip(decode(image) * np.array(gains)[None, None, :], 0.0, 1.0))


def blocking(image: np.ndarray, amplitude: float, seed: int = 5, block: int = 8) -> U8:
    """Add a constant offset in [-A, A] (same on all channels) to every block x block tile."""
    img = np.asarray(image)[..., :3].astype(np.float64)
    h, w = img.shape[:2]
    tiles = hash_noise(seed, (h + block - 1) // block, (w + block - 1) // block) * 2 * amplitude
    offset = np.repeat(np.repeat(tiles, block, axis=0), block, axis=1)[:h, :w]
    return np.clip(np.rint(img + offset[..., None]), 0, 255).astype(np.uint8)


def psnr(reference: np.ndarray, image: np.ndarray) -> float:
    a = np.asarray(reference)[..., :3].astype(np.float64)
    b = np.asarray(image)[..., :3].astype(np.float64)
    mse = float(((a - b) ** 2).mean())
    return math.inf if mse == 0 else 10 * math.log10(255.0 * 255.0 / mse)


def q11(row: str, *, psnr_before: float, psnr_after: float, sigma_before: float | None = None,
        sigma_after: float | None = None, lap_before: float | None = None, lap_after: float | None = None) -> dict[str, Any]:
    """The plan's Q11 rule for one row (M1, M2 or M4) with its measured numbers."""
    spec = Q11[row]
    gain = psnr_after - psnr_before
    checks = {"psnr_gain": gain >= spec["psnr_gain"]}
    measured: dict[str, Any] = {"psnr_before": round(psnr_before, 4), "psnr_after": round(psnr_after, 4),
                                "psnr_gain": round(gain, 4)}
    if "sigma_drop" in spec and sigma_before is not None and sigma_after is not None:
        drop = 1 - sigma_after / sigma_before if sigma_before > 0 else 0.0
        checks["sigma_drop"] = drop >= spec["sigma_drop"]
        measured.update({"sigma_before": round(sigma_before, 4), "sigma_after": round(sigma_after, 4),
                         "sigma_drop": round(drop, 4)})
    if lap_before is not None and lap_after is not None:
        checks["laplacian_up"] = lap_after > lap_before
        measured.update({"laplacian_before": round(lap_before, 4), "laplacian_after": round(lap_after, 4)})
    rule = f"{row}: PSNR +{spec['psnr_gain']:g} dB" + (f", noise sigma -{spec['sigma_drop'] * 100:g}%" if "sigma_drop" in spec else "")
    return {"check": "Q11", "row": row, "passed": all(checks.values()), "parts": checks, "measured": measured, "rule": rule}
