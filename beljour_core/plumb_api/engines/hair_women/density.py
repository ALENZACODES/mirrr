'Photo-based density estimates and procedural fibre planning. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .strands import Strand, generate_strands, rasterize_strands


@dataclass(frozen=True)
class DensityEvidence:
    visible_scalp_share: float
    hair_edge_energy: float
    local_contrast: float
    confidence: float
    label: str

def _grey(image: np.ndarray) -> np.ndarray:
    rgb = image[..., :3].astype(np.float64)
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]

def visible_scalp_share(image: np.ndarray, hair_mask: np.ndarray, scalp_mask: np.ndarray) -> float:
    hair = hair_mask > 0.25
    scalp = scalp_mask > 0.25
    area = hair | scalp
    if not np.any(area):
        return 0.0
    grey = _grey(image)
    local = grey[area]
    threshold = float(np.quantile(local, 0.7))
    visible = scalp & (grey >= threshold)
    return float(np.count_nonzero(visible)) / float(max(int(np.count_nonzero(area)), 1))

def hair_edge_energy(image: np.ndarray, mask: np.ndarray) -> float:
    grey = _grey(image)
    gx = np.zeros_like(grey)
    gy = np.zeros_like(grey)
    gx[:, 1:-1] = (grey[:, 2:] - grey[:, :-2]) * 0.5
    gy[1:-1] = (grey[2:] - grey[:-2]) * 0.5
    active = mask > 0.25
    if not np.any(active):
        return 0.0
    return float(np.mean(np.hypot(gx, gy)[active]))

def local_contrast(image: np.ndarray, mask: np.ndarray) -> float:
    grey = _grey(image)
    active = mask > 0.25
    if not np.any(active):
        return 0.0
    values = grey[active]
    low, high = np.quantile(values, (0.1, 0.9))
    return float(high - low)

def estimate(image: np.ndarray, hair_mask: np.ndarray, scalp_mask: np.ndarray) -> DensityEvidence:
    visible = visible_scalp_share(image, hair_mask, scalp_mask)
    edges = hair_edge_energy(image, hair_mask)
    contrast = local_contrast(image, np.maximum(hair_mask, scalp_mask))
    evidence_strength = min(1.0, contrast / 45.0) * min(1.0, edges / 18.0)
    confidence = max(0.0, min(1.0, evidence_strength * (1 - visible * 0.3)))
    return DensityEvidence(visible_scalp_share=visible, hair_edge_energy=edges, local_contrast=contrast, confidence=confidence, label='photo appearance estimate only; not a density diagnosis')

def fibre_plan(mask: np.ndarray, seed: int, amount: float, curl_strength: float) -> tuple[Strand, ...]:
    density = 0.15 + max(0.0, min(amount, 1.0)) * 0.75
    curvature = (max(0.0, min(curl_strength, 1.0)) - 0.5) * 1.2
    return generate_strands(mask, seed, density, curvature)

def fibre_coverage(mask: np.ndarray, seed: int, amount: float, curl_strength: float) -> np.ndarray:
    strands = fibre_plan(mask, seed, amount, curl_strength)
    coverage = rasterize_strands(mask.shape, strands)
    return np.minimum(coverage, np.clip(mask, 0, 1))

def conservative_opacity(evidence: DensityEvidence, requested: float, sensitive: bool) -> float:
    value = max(0.0, min(float(requested), 1.0))
    cap = 0.32 if sensitive else 0.58
    confidence_factor = 0.45 + 0.55 * evidence.confidence
    return min(cap, value * confidence_factor)

def report(evidence: DensityEvidence, opacity: float, strands: tuple[Strand, ...]) -> dict[str, float | int | str]:
    return {'visible_scalp_share': evidence.visible_scalp_share, 'hair_edge_energy': evidence.hair_edge_energy, 'local_contrast': evidence.local_contrast, 'photo_confidence': evidence.confidence, 'effective_opacity': opacity, 'procedural_strands': len(strands), 'label': evidence.label}
