"""W39 Curl-pattern-respecting recolour (Top 5 #2): any hair colour on a 2A-4C pattern without
straightening it.

The geometry lock is built into the maths, not checked after the fact. Inside the hair mask
the new lightness is an increasing affine map of the old one:

    L_new = L_target + g * (L - L_mean),  g > 0

so every strand edge, coil highlight and shadow keeps its place and its order: the high-pass
structure is only scaled by g, never moved, blurred or replaced. Chroma follows the target
hue, shaded by the new lightness so dark strands carry less colour than highlights, as dyed
hair does. Pixels outside the mask are copied byte for byte; the mask itself (the curl
silhouette) is never edited. `geometry_checks` measures the lock on the result.

Lightening limits per session belong to W28 (balayage.py); this module renders the colour it
is given. Local code only; when YouCam hair colour renders a look, this is the local
fallback and the reference for the curl-preservation test. Mirrored in
web/src/engines/haircolour/recolour.ts (parity/haircolour-w39-w28.json). Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

import numpy as np

from ..shade import colourspace as cs

LABEL = "Hair colour simulation. Your curl pattern comes from your photo; nothing is straightened."
VERSION = "recolour-w39/1"
GAIN_LIMITS = (0.6, 1.6)
MIN_HAIR_PIXELS = 16


def _check(image: object, mask: object) -> tuple[np.ndarray, np.ndarray]:
    img = np.asarray(image)
    if (
        img.dtype != np.uint8
        or img.ndim != 3
        or img.shape[2] not in (3, 4)
        or min(img.shape[:2]) < 2
    ):
        raise ValueError("hair recolour needs a uint8 RGB or RGBA photo")
    m = np.asarray(mask, dtype=np.float64)
    if m.shape != img.shape[:2] or not np.all(np.isfinite(m)) or np.min(m) < 0 or np.max(m) > 1:
        raise ValueError("hair mask must match the photo and hold values in 0..1")
    return img, m


def texture_gain(source_lightness: float, target_lightness: float) -> float:
    """Contrast gain: lighter colours show more strand contrast, darker ones less (bounded)."""
    g = math.sqrt((target_lightness + 5.0) / (source_lightness + 5.0))
    return float(min(GAIN_LIMITS[1], max(GAIN_LIMITS[0], g)))


@dataclass(frozen=True)
class RecolourResult:
    image: np.ndarray
    alpha: np.ndarray
    gain: float
    source_lab: tuple[float, float, float]
    target_lab: tuple[float, float, float]
    checks: dict[str, Any]
    label: str = LABEL

    def to_json(self) -> dict[str, Any]:
        return {"format": "beljour-recolour-w39/1", "version": VERSION, "label": self.label,
                "gain": round(self.gain, 6), "source_lab": [round(v, 4) for v in self.source_lab],
                "target_lab": [round(v, 4) for v in self.target_lab], "checks": self.checks}


def recolour_lab(lab: np.ndarray, weights: np.ndarray, target: np.ndarray, *, mean_l: float,
                 gain: float) -> np.ndarray:
    """New Lab for every pixel (callers blend by their own alpha)."""
    lightness = np.clip(target[0] + gain * (lab[..., 0] - mean_l), 0.0, 100.0)
    shade = np.clip(lightness / max(float(target[0]), 1.0), 0.35, 1.25)
    out = np.empty_like(lab)
    out[..., 0] = lightness
    out[..., 1] = target[1] * shade
    out[..., 2] = target[2] * shade
    return out


def recolour_hair(image: object, hair_mask: object, target_lab: object, *, strength: float = 1.0,
                  alpha: object | None = None) -> RecolourResult:
    """Recolour hair toward `target_lab` (D65 CIELAB of the mid tone) inside `hair_mask`.

    `alpha` optionally limits where the colour goes inside the hair (a balayage lift map);
    it is multiplied by the hair mask, so colour never leaves the hair.
    """
    img, mask = _check(image, hair_mask)
    target = np.asarray(target_lab, dtype=np.float64)
    if target.shape != (3,) or not np.all(np.isfinite(target)) or not 0 <= target[0] <= 100:
        raise ValueError("target colour must be one finite Lab triple with L* in 0..100")
    if not math.isfinite(strength) or not 0 <= strength <= 1:
        raise ValueError("strength must be in 0..1")
    # The externally observed support uses alpha >= 0.5. Fractional values
    # below that boundary are outside and must remain byte-identical.
    weight = np.where(mask >= 0.5, mask, 0.0)
    if alpha is not None:
        extra = np.asarray(alpha, dtype=np.float64)
        if (
            extra.shape != mask.shape
            or not np.all(np.isfinite(extra))
            or np.min(extra) < 0
            or np.max(extra) > 1
        ):
            raise ValueError("colour alpha must match the photo and hold values in 0..1")
        weight = weight * extra
    weight *= strength
    hair = mask >= 0.5
    if int(hair.sum()) < MIN_HAIR_PIXELS:
        raise ValueError("not enough hair in the mask to recolour")
    rgb = img[..., :3].astype(np.float64)
    lab = cs.srgb_to_lab(rgb)
    mean_l = float(lab[..., 0][hair].mean())
    source = tuple(float(v) for v in lab[hair].mean(axis=0))
    gain = texture_gain(mean_l, float(target[0]))
    new = recolour_lab(lab, weight, target, mean_l=mean_l, gain=gain)
    blended = lab + (new - lab) * weight[..., None]
    out = img.copy()
    touched = weight > 0
    out[..., :3][touched] = cs.to_bytes(cs.lab_to_srgb(blended[touched]))
    checks = geometry_checks(img, out, mask)
    return RecolourResult(out, weight, gain, (source[0], source[1], source[2]),
                          (float(target[0]), float(target[1]), float(target[2])), checks)


def _lightness(image: np.ndarray) -> np.ndarray:
    return np.asarray(cs.srgb_to_lab(image[..., :3].astype(np.float64))[..., 0])


def box_blur(values: np.ndarray, radius: int) -> np.ndarray:
    """Separable mean filter with edge padding (numpy only)."""
    if radius <= 0:
        return values.astype(np.float64)
    k = 2 * radius + 1
    padded = np.pad(values.astype(np.float64), radius, mode="edge")
    c = np.cumsum(np.pad(padded, ((0, 0), (1, 0))), axis=1)
    rows = (c[:, k:] - c[:, :-k]) / k
    c = np.cumsum(np.pad(rows, ((1, 0), (0, 0))), axis=0)
    return (c[k:, :] - c[:-k, :]) / k


HIGH_PASS_RADIUS = 3


def high_pass(lightness: np.ndarray) -> np.ndarray:
    """Strand structure: lightness minus its local mean."""
    return lightness - box_blur(lightness, HIGH_PASS_RADIUS)


def edge_map(hp: np.ndarray, support: np.ndarray) -> np.ndarray:
    """Strand edges: zero crossings of the high-pass to the right or below, inside `support`."""
    edges = np.zeros(hp.shape, dtype=bool)
    edges[:, :-1] |= np.sign(hp[:, :-1]) != np.sign(hp[:, 1:])
    edges[:-1, :] |= np.sign(hp[:-1, :]) != np.sign(hp[1:, :])
    return edges & support


def _strong_steps(hp: np.ndarray, region: np.ndarray, contrast: float) -> np.ndarray:
    """Pixels whose step to the right or below crosses at least `contrast` L* of structure."""
    strong = np.zeros(hp.shape, dtype=bool)
    strong[:, :-1] |= np.abs(hp[:, :-1] - hp[:, 1:]) > contrast
    strong[:-1, :] |= np.abs(hp[:-1, :] - hp[1:, :]) > contrast
    return strong & region


def geometry_checks(before: np.ndarray, after: np.ndarray, hair_mask: np.ndarray) -> dict[str, Any]:
    """Curl silhouette, outside pixels and strand structure, measured on the result.

    Measured only on hair whose whole high-pass window lies inside the mask, so the
    unchanged background never enters the structure comparison. Edge maps compare the
    strand zero crossings at steps that were clearly visible before (> 3 L*).
    """
    if before.shape != after.shape or before.ndim != 3:
        raise ValueError("colour geometry check needs matching RGB/RGBA frames")
    if hair_mask.shape != before.shape[:2]:
        raise ValueError("colour geometry mask must match the source frame")
    if not np.all(np.isfinite(hair_mask)) or np.any((hair_mask < 0) | (hair_mask > 1)):
        raise ValueError("colour geometry mask must contain finite alpha in 0..1")
    region = hair_mask >= 0.5
    interior = region & (box_blur(region.astype(np.float64), HIGH_PASS_RADIUS + 1) >= 1.0 - 1e-9)
    outside = hair_mask < 0.5
    l0, l1 = _lightness(before), _lightness(after)
    hp0, hp1 = high_pass(l0), high_pass(l1)
    strong = interior & (np.abs(hp0) > 1.5)
    agree = float((np.sign(hp0[strong]) == np.sign(hp1[strong])).mean()) if strong.any() else 1.0
    steps = _strong_steps(hp0, interior, 3.0)
    e0, e1 = edge_map(hp0, steps), edge_map(hp1, steps)
    union = int((e0 | e1).sum())
    iou = float((e0 & e1).sum() / union) if union else 1.0
    if strong.sum() > 2:
        corr = float(np.corrcoef(hp0[strong], hp1[strong])[0, 1])
    else:
        corr = 1.0
    outside_same = bool(np.array_equal(before[outside], after[outside]))
    return {"silhouette_unchanged": outside_same, "outside_unchanged": outside_same,
            "structure_sign_agreement": round(agree, 6), "edge_map_iou": round(iou, 6),
            "structure_correlation": round(corr, 6),
            "geometry_lock": outside_same and agree >= 0.99 and iou >= 0.9}
