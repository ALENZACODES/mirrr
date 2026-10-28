'Texture-preservation metrics for W77, W84 and W92. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .masking import binary, validate_mask


@dataclass(frozen=True)
class TextureMetrics:
    gradient_before: float
    gradient_after: float
    gradient_ratio: float
    variance_before: float
    variance_after: float
    variance_ratio: float
    edge_retention: float

def luminance(photo: np.ndarray) -> np.ndarray:
    rgb = np.asarray(photo)[..., :3].astype(np.float32)
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]

def gradients(gray: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    g = np.asarray(gray, dtype=np.float32)
    gx = np.zeros_like(g)
    gy = np.zeros_like(g)
    gx[:, 1:-1] = (g[:, 2:] - g[:, :-2]) * 0.5
    gy[1:-1, :] = (g[2:, :] - g[:-2, :]) * 0.5
    return (gx, gy)

def gradient_magnitude(photo: np.ndarray) -> np.ndarray:
    gx, gy = gradients(luminance(photo))
    return np.sqrt(gx * gx + gy * gy)

def local_variance(photo: np.ndarray, radius: int=1) -> np.ndarray:
    if radius < 1 or radius > 8:
        raise ValueError('radius must be 1..8')
    gray = luminance(photo)
    h, w = gray.shape
    out = np.zeros_like(gray)
    padded = np.pad(gray, radius, mode='reflect')
    size = 2 * radius + 1
    for y in range(h):
        for x in range(w):
            tile = padded[y:y + size, x:x + size]
            out[y, x] = float(np.var(tile))
    return out

def percentile_edges(photo: np.ndarray, mask: np.ndarray, percentile: float=75) -> np.ndarray:
    if not 0 < percentile < 100:
        raise ValueError('percentile must be between 0 and 100')
    mag = gradient_magnitude(photo)
    m = binary(mask)
    if not m.any():
        return np.zeros_like(m)
    threshold = float(np.percentile(mag[m], percentile))
    return m & (mag >= threshold)

def texture_metrics(before: np.ndarray, after: np.ndarray, mask: np.ndarray) -> TextureMetrics:
    m = binary(validate_mask(mask, before.shape[:2]))
    if not m.any():
        return TextureMetrics(0, 0, 1, 0, 0, 1, 1)
    gb = gradient_magnitude(before)
    ga = gradient_magnitude(after)
    vb = local_variance(before)
    va = local_variance(after)
    g0 = float(np.mean(gb[m]))
    g1 = float(np.mean(ga[m]))
    v0 = float(np.mean(vb[m]))
    v1 = float(np.mean(va[m]))
    eb = percentile_edges(before, m.astype(np.float32))
    ea = percentile_edges(after, m.astype(np.float32))
    denominator = int(eb.sum())
    ret = float((eb & ea).sum() / denominator) if denominator else 1.0
    return TextureMetrics(g0, g1, g1 / max(g0, 1e-06), v0, v1, v1 / max(v0, 1e-06), ret)

def preserve_score(metrics: TextureMetrics) -> float:
    gradient = min(metrics.gradient_ratio, 1 / metrics.gradient_ratio if metrics.gradient_ratio > 0 else 0)
    variance = min(metrics.variance_ratio, 1 / metrics.variance_ratio if metrics.variance_ratio > 0 else 0)
    return float(np.clip(0.4 * gradient + 0.3 * variance + 0.3 * metrics.edge_retention, 0, 1))

def texture_gate(before: np.ndarray, after: np.ndarray, mask: np.ndarray, minimum: float=0.72) -> dict[str, float | bool]:
    m = texture_metrics(before, after, mask)
    score = preserve_score(m)
    return {'score': score, 'gradient_ratio': m.gradient_ratio, 'variance_ratio': m.variance_ratio, 'edge_retention': m.edge_retention, 'minimum': minimum, 'pass': score >= minimum}

def bounded_microcontrast(photo: np.ndarray, mask: np.ndarray, amount: float) -> np.ndarray:
    if not 0 <= amount <= 1:
        raise ValueError('amount must be in [0,1]')
    image = np.asarray(photo)
    m = validate_mask(mask, image.shape[:2])[..., None]
    rgb = image[..., :3].astype(np.float32)
    h, w = rgb.shape[:2]
    blur = np.zeros_like(rgb)
    p = np.pad(rgb, ((1, 1), (1, 1), (0, 0)), mode='reflect')
    for y in range(h):
        for x in range(w):
            blur[y, x] = np.mean(p[y:y + 3, x:x + 3], axis=(0, 1))
    detail = rgb - blur
    scale = 1 + 0.1 * amount
    adjusted = np.clip(blur + detail * scale, 0, 255)
    out = image.copy()
    out[..., :3] = np.clip(rgb * (1 - m) + adjusted * m, 0, 255).astype(np.uint8)
    if image.shape[2] == 4:
        out[..., 3] = image[..., 3]
    return out

def pro_age_profile(style: str) -> dict[str, float | str]:
    profiles: dict[str, dict[str, float | str]] = {'texture_first': {'microcontrast': 0.06, 'colour_opacity': 0.04, 'line_blur': 0.0, 'copy': 'Texture stays visible.'}, 'hydrated_finish': {'microcontrast': 0.02, 'colour_opacity': 0.05, 'line_blur': 0.0, 'copy': 'Finish simulation only.'}, 'soft_colour': {'microcontrast': 0.04, 'colour_opacity': 0.06, 'line_blur': 0.0, 'copy': 'Colour shift without line removal.'}}
    if style not in profiles:
        raise ValueError('unsupported pro-age profile')
    return profiles[style]

def mature_skin_report(before: np.ndarray, after: np.ndarray, mask: np.ndarray, style: str) -> dict[str, object]:
    gate = texture_gate(before, after, mask)
    return {'style': style, 'anti_age_claim': False, 'texture_gate': gate, 'profile': pro_age_profile(style)}
