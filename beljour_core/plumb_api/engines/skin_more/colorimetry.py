"Colour science primitives for R16B cosmetic previews. Author: John Khan.\n\nThe functions intentionally operate on ordinary sRGB pixels and avoid demographic\nclassification. They exist to compare a user's own checked regions under one\nphoto, not to infer ethnicity, health, or a normative complexion.\n"

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

_EPS = 1e-08

_D65 = np.array([0.95047, 1.0, 1.08883], dtype=np.float64)

_RGB_TO_XYZ = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.072175], [0.0193339, 0.119192, 0.9503041]], dtype=np.float64)

@dataclass(frozen=True)
class RegionColour:
    rgb: tuple[float, float, float]
    lab: tuple[float, float, float]
    luma: float
    chroma: float
    warm_axis: float
    pixel_count: int

@dataclass(frozen=True)
class ColourDelta:
    delta_e76: float
    lightness: float
    red_green: float
    yellow_blue: float
    chroma: float

def _as_rgb(values: np.ndarray) -> np.ndarray:
    arr = np.asarray(values, dtype=np.float64)
    if arr.shape[-1] < 3:
        raise ValueError('RGB input needs at least three channels')
    return np.clip(arr[..., :3] / 255.0, 0.0, 1.0)

def srgb_to_linear(values: np.ndarray) -> np.ndarray:
    rgb = _as_rgb(values)
    return np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)

def linear_to_srgb(values: np.ndarray) -> np.ndarray:
    linear = np.clip(np.asarray(values, dtype=np.float64), 0.0, 1.0)
    rgb = np.where(linear <= 0.0031308, 12.92 * linear, 1.055 * linear ** (1 / 2.4) - 0.055)
    return np.clip(np.rint(rgb * 255.0), 0, 255).astype(np.uint8)

def rgb_to_xyz(values: np.ndarray) -> np.ndarray:
    linear = srgb_to_linear(values)
    return np.einsum('...c,dc->...d', linear, _RGB_TO_XYZ)

def _lab_f(t: np.ndarray) -> np.ndarray:
    delta = 6.0 / 29.0
    threshold = delta ** 3
    return np.where(t > threshold, np.cbrt(t), t / (3 * delta * delta) + 4.0 / 29.0)

def rgb_to_lab(values: np.ndarray) -> np.ndarray:
    xyz = rgb_to_xyz(values) / _D65
    f = _lab_f(xyz)
    L = 116.0 * f[..., 1] - 16.0
    a = 500.0 * (f[..., 0] - f[..., 1])
    b = 200.0 * (f[..., 1] - f[..., 2])
    return np.stack([L, a, b], axis=-1)

def delta_e76(a: np.ndarray | tuple[float, float, float], b: np.ndarray | tuple[float, float, float]) -> np.ndarray:
    aa = np.asarray(a, dtype=np.float64)
    bb = np.asarray(b, dtype=np.float64)
    return np.sqrt(np.sum((aa - bb) ** 2, axis=-1))

def chroma(lab: np.ndarray) -> np.ndarray:
    values = np.asarray(lab, dtype=np.float64)
    return np.sqrt(values[..., 1] ** 2 + values[..., 2] ** 2)

def hue_angle(lab: np.ndarray) -> np.ndarray:
    values = np.asarray(lab, dtype=np.float64)
    return (np.degrees(np.arctan2(values[..., 2], values[..., 1])) + 360.0) % 360.0

def relative_luminance(values: np.ndarray) -> np.ndarray:
    linear = srgb_to_linear(values)
    return 0.2126 * linear[..., 0] + 0.7152 * linear[..., 1] + 0.0722 * linear[..., 2]

def robust_region_colour(photo: np.ndarray, mask: np.ndarray, trim: float=0.1) -> RegionColour:
    if not 0 <= trim < 0.45:
        raise ValueError('trim must be in [0, 0.45)')
    pixels = np.asarray(photo)[np.asarray(mask) > 0.5, :3]
    if pixels.size == 0:
        raise ValueError('checked region contains no pixels')
    lab = rgb_to_lab(pixels)
    count = len(pixels)
    lo = int(math.floor(count * trim))
    hi = max(lo + 1, int(math.ceil(count * (1.0 - trim))))

    def trimmed_mean(col: np.ndarray) -> float:
        ordered = np.sort(col)
        return float(np.mean(ordered[lo:hi]))
    rgb_mean = tuple(trimmed_mean(pixels[:, i]) for i in range(3))
    lab_mean = tuple(trimmed_mean(lab[:, i]) for i in range(3))
    rgb_triplet = (rgb_mean[0], rgb_mean[1], rgb_mean[2])
    lab_triplet = (lab_mean[0], lab_mean[1], lab_mean[2])
    lum = float(np.median(relative_luminance(pixels)))
    c = float(math.hypot(lab_mean[1], lab_mean[2]))
    warm = float(lab_mean[2] - 0.35 * lab_mean[1])
    return RegionColour(rgb_triplet, lab_triplet, lum, c, warm, count)

def compare_regions(photo: np.ndarray, mask_a: np.ndarray, mask_b: np.ndarray) -> ColourDelta:
    aa = robust_region_colour(photo, mask_a)
    bb = robust_region_colour(photo, mask_b)
    d = np.asarray(aa.lab) - np.asarray(bb.lab)
    return ColourDelta(float(np.linalg.norm(d)), float(abs(d[0])), float(abs(d[1])), float(abs(d[2])), float(abs(aa.chroma - bb.chroma)))

def neutral_direction(lab: tuple[float, float, float]) -> tuple[float, float]:
    """Return a bounded a*/b* correction direction toward neutral chroma."""
    _, a, b = lab
    length = math.hypot(a, b)
    if length < _EPS:
        return (0.0, 0.0)
    return (-a / length, -b / length)

def cosmetic_mix(base: tuple[int, int, int], target: tuple[int, int, int], opacity: float) -> tuple[int, int, int]:
    if not 0 <= opacity <= 1:
        raise ValueError('opacity must be in [0,1]')
    a = srgb_to_linear(np.array(base, dtype=np.uint8)[None, :])[0]
    b = srgb_to_linear(np.array(target, dtype=np.uint8)[None, :])[0]
    mixed = a * (1.0 - opacity) + b * opacity
    out = linear_to_srgb(mixed[None, :])[0]
    values = [int(v) for v in out]
    return (values[0], values[1], values[2])

def cast_score(photo: np.ndarray, mask: np.ndarray) -> float:
    """Generic visual cast score; deliberately not an SPF performance score."""
    region = robust_region_colour(photo, mask)
    L, a, b = region.lab
    pale = max(0.0, (L - 55.0) / 45.0)
    desaturation = max(0.0, 1.0 - min(region.chroma / 45.0, 1.0))
    cool = max(0.0, min((-b + 4.0) / 30.0, 1.0))
    return float(np.clip(0.5 * pale + 0.3 * desaturation + 0.2 * cool, 0.0, 1.0))

def colourfulness(photo: np.ndarray, mask: np.ndarray) -> float:
    pixels = np.asarray(photo)[np.asarray(mask) > 0.5, :3].astype(np.float64)
    if not len(pixels):
        return 0.0
    rg = pixels[:, 0] - pixels[:, 1]
    yb = 0.5 * (pixels[:, 0] + pixels[:, 1]) - pixels[:, 2]
    sigma = math.sqrt(float(np.var(rg) + np.var(yb)))
    mean = math.sqrt(float(np.mean(rg) ** 2 + np.mean(yb) ** 2))
    return sigma + 0.3 * mean

def preserve_lightness_target(source: tuple[int, int, int], target: tuple[int, int, int], strength: float) -> tuple[int, int, int]:
    """Blend colour while bounding the change in perceptual lightness."""
    mixed = cosmetic_mix(source, target, strength)
    src_lab = rgb_to_lab(np.array(source, dtype=np.uint8)[None, :])[0]
    mix_lab = rgb_to_lab(np.array(mixed, dtype=np.uint8)[None, :])[0]
    if abs(float(mix_lab[0] - src_lab[0])) <= 4.0:
        return mixed
    scale = min(1.0, 4.0 / (abs(float(mix_lab[0] - src_lab[0])) + _EPS))
    return cosmetic_mix(source, target, strength * scale)

def report(photo: np.ndarray, regions: dict[str, np.ndarray]) -> dict[str, object]:
    result: dict[str, object] = {'method': 'checked-region CIE Lab, D65', 'diagnostic': False}
    for name, mask in sorted(regions.items()):
        try:
            c = robust_region_colour(photo, mask)
        except ValueError:
            result[name] = {'available': False}
            continue
        result[name] = {'available': True, 'rgb': [round(v, 3) for v in c.rgb], 'lab': [round(v, 3) for v in c.lab], 'luma': round(c.luma, 6), 'chroma': round(c.chroma, 3), 'pixels': c.pixel_count}
    return result
