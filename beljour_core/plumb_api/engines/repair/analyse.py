"""LS6 step 1, analyse (plan §8.3): noise, blur amount and type, JPEG blocking, exposure, cast.

All on the photo itself, no model:
* Noise sigma (0..255 units): Donoho's wavelet MAD estimate on the finest diagonal Haar
  band of luma, sigma = median(|HH|) / 0.6745 (the median ignores edges).
* Blur: Laplacian variance (a sharpness number), a re-blur estimate of the Gaussian blur
  sigma (gradient energy of the photo vs the photo blurred again by a known sigma; for
  step edges the energy falls as 1/sigma, so the ratio R gives sigma = s R / sqrt(1 - R^2)),
  and the global structure tensor: a strongly one-sided tensor means motion blur along
  the direction with the weakest gradients.
* Blocking: mean absolute step across 8 x 8 block borders minus the mean step elsewhere
  (an amplitude estimate of JPEG-style block offsets, 0 when there are none).
* Exposure: mean linear luminance, its EV distance from 18% grey and clipped shares.
* Cast: grey-world gains (mean linear G over each channel's mean) and the Lab a*, b* of
  the mean colour.
The plan's check is "estimators within +/-15% on synthetic ground truth" (LS6 report).
Mirrored in web/src/engines/local/enhance.ts. Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import asdict, dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..core.colour import rgb_to_lab, srgb_encode
from ..core.composite import decode
from ..core.filters import convolve, gradient, quantile

Floats = NDArray[np.float64]
MAD_SCALE = 0.6745
REBLUR_SIGMA = 2.0
MOTION_COHERENCE = 0.25          # ASSUMED: tensor anisotropy above this reads as motion blur
BLOCK = 8
LUMA = (0.299, 0.587, 0.114)


def luma255(image: np.ndarray) -> Floats:
    """BT.601 luma of encoded sRGB, in 0..255."""
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("expected an RGB or RGBA uint8 photo")
    rgb = img[..., :3].astype(np.float64)
    out: Floats = LUMA[0] * rgb[..., 0] + LUMA[1] * rgb[..., 1] + LUMA[2] * rgb[..., 2]
    return out


def noise_sigma(plane: np.ndarray) -> float:
    """Wavelet MAD noise estimate of a 0..255 plane (finest diagonal Haar coefficients)."""
    p = np.asarray(plane, dtype=np.float64)
    h, w = (p.shape[0] // 2) * 2, (p.shape[1] // 2) * 2
    if h < 4 or w < 4:
        raise ValueError("the photo is too small to estimate noise")
    a, b = p[0:h:2, 0:w:2], p[0:h:2, 1:w:2]
    c, d = p[1:h:2, 0:w:2], p[1:h:2, 1:w:2]
    hh = (a - b - c + d) / 2
    return quantile(np.abs(hh), 0.5) / MAD_SCALE


def gaussian_kernel(sigma: float) -> Floats:
    if not (math.isfinite(sigma) and 0 < sigma <= 32):
        raise ValueError("sigma must be in (0, 32]")
    radius = max(1, int(math.ceil(3 * sigma)))
    x = np.arange(-radius, radius + 1, dtype=np.float64)
    k = np.exp(-(x * x) / (2 * sigma * sigma))
    out: Floats = k / k.sum()
    return out


def gaussian(plane: np.ndarray, sigma: float) -> Floats:
    k = gaussian_kernel(sigma)
    return convolve(convolve(plane, k, 0), k, 1)


def laplacian_variance(plane: np.ndarray) -> float:
    p = np.asarray(plane, dtype=np.float64)
    lap = p[1:-1, :-2] + p[1:-1, 2:] + p[:-2, 1:-1] + p[2:, 1:-1] - 4 * p[1:-1, 1:-1]
    return float(lap.var())


def gradient_energy(plane: np.ndarray) -> float:
    gx, gy = gradient(plane)
    return float((gx * gx + gy * gy).mean())


def blur_sigma(plane: np.ndarray, reblur: float = REBLUR_SIGMA) -> float:
    """Re-blur estimate of a Gaussian blur sigma (0 for a sharp photo)."""
    e0 = gradient_energy(plane)
    if e0 <= 1e-12:
        return 0.0
    ratio = min(gradient_energy(gaussian(plane, reblur)) / e0, 0.999999)
    return reblur * ratio / math.sqrt(1 - ratio * ratio)


def motion(plane: np.ndarray) -> tuple[float, float]:
    """(coherence, blur direction in degrees) from the global structure tensor."""
    gx, gy = gradient(plane)
    sxx, sxy, syy = float((gx * gx).sum()), float((gx * gy).sum()), float((gy * gy).sum())
    trace = sxx + syy
    if trace <= 1e-12:
        return 0.0, 0.0
    coherence = math.sqrt((sxx - syy) ** 2 + 4 * sxy * sxy) / trace
    strongest = 0.5 * math.atan2(2 * sxy, sxx - syy)          # dominant gradient direction
    blur = math.degrees(strongest + math.pi / 2)              # blur runs across it
    blur = (blur + 90.0) % 180.0 - 90.0
    return coherence, blur


def blockiness(plane: np.ndarray, block: int = BLOCK) -> float:
    """Mean |step| across block borders minus the mean |step| inside blocks (both axes)."""
    p = np.asarray(plane, dtype=np.float64)
    dx = np.abs(np.diff(p, axis=1))
    dy = np.abs(np.diff(p, axis=0))
    on_x = (np.arange(dx.shape[1]) % block) == block - 1
    on_y = (np.arange(dy.shape[0]) % block) == block - 1
    if not on_x.any() or not on_y.any() or on_x.all() or on_y.all():
        return 0.0
    border = (dx[:, on_x].sum() + dy[on_y, :].sum()) / (dx[:, on_x].size + dy[on_y, :].size)
    inner = (dx[:, ~on_x].sum() + dy[~on_y, :].sum()) / (dx[:, ~on_x].size + dy[~on_y, :].size)
    return max(0.0, float(border - inner))


@dataclass(frozen=True)
class Analysis:
    noise_sigma: float
    laplacian_variance: float
    blur_sigma: float
    motion_coherence: float
    motion_degrees: float
    blur_type: str
    blockiness: float
    mean_luminance: float
    ev_offset: float
    clipped_dark: float
    clipped_bright: float
    grey_gains: tuple[float, float, float]
    cast_ab: tuple[float, float]

    def to_json(self) -> dict[str, Any]:
        out = asdict(self)
        return {k: (round(v, 6) if isinstance(v, float) else [round(x, 6) for x in v] if isinstance(v, tuple) else v)
                for k, v in out.items()}


def analyse(image: np.ndarray) -> Analysis:
    img = np.asarray(image)
    y = luma255(img)
    lin = decode(img)
    lum = 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]
    mean_lum = float(lum.mean())
    means = [float(lin[..., c].mean()) for c in range(3)]
    gains = tuple(means[1] / m if m > 1e-9 else 1.0 for m in means)
    mean_rgb = [srgb_encode(m) * 255 for m in means]
    lab = rgb_to_lab(mean_rgb)
    sigma_blur = blur_sigma(y)
    coherence, direction = motion(y)
    kind = "none" if sigma_blur < 0.8 else ("motion" if coherence >= MOTION_COHERENCE else "defocus")
    return Analysis(noise_sigma(y), laplacian_variance(y), sigma_blur, coherence, direction, kind, blockiness(y),
                    mean_lum, math.log2(0.18 / max(mean_lum, 1e-6)), float((y <= 2).mean()), float((y >= 253).mean()),
                    (gains[0], gains[1], gains[2]), (lab[1], lab[2]))
