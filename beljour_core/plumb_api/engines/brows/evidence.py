"""Conservative local brow pixel observations, not an automatic hair diagnosis.

Contrast observations are heuristic and explicitly identified. A manually checked
coverage mask may replace them without changing the rendering path. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from .contracts import BrowEvidence, photo, validate_evidence
from .geometry import brow_frames, union


def luminance(rgb: np.ndarray) -> np.ndarray:
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def observe_brows(image: Any, landmarks: Any) -> BrowEvidence:
    img = photo(image)
    height, width = img.shape[:2]
    frames = brow_frames(landmarks, height, width)
    region = union(frames)
    lum = luminance(img[..., :3].astype(np.float64))
    coverage = np.zeros((height, width), dtype=np.float64)
    grey = np.zeros_like(coverage)
    confidences = []
    for frame in frames:
        selected = frame.mask >= 0.5
        values = sorted(float(v) for v in lum[selected])
        if len(values) < 6:
            confidences.append(0.0)
            continue
        # A robust local light reference; indexing (not percentile interpolation)
        # is shared exactly with the browser implementation.
        low = values[int((len(values) - 1) * 0.15)]
        high = values[int((len(values) - 1) * 0.85)]
        spread = high - low
        if spread < 8:
            confidences.append(0.0)
            continue
        darkest = np.clip((high - lum - spread * 0.25) / max(12.0, spread * 0.5), 0, 1)
        # Bright, low-chroma narrow areas are only candidates for grey strands.
        # Their label remains heuristic until the coverage is checked manually.
        chroma = np.max(img[..., :3], axis=2).astype(float) - np.min(img[..., :3], axis=2)
        grey_candidates = (lum > high - spread * 0.10) & (chroma < 14) & (lum > 120)
        local_grey = np.where(grey_candidates, frame.mask * 0.45, 0)
        local = np.maximum(darkest * frame.mask, local_grey)
        coverage = np.maximum(coverage, local)
        grey = np.maximum(grey, local_grey)
        confidences.append(min(0.85, spread / 100))
    evidence = BrowEvidence(coverage, np.minimum(grey, coverage), "contrast",
                            min(confidences) if confidences else 0,
                            ("Hair coverage is a contrast estimate. Check sparse and grey areas manually.",))
    return validate_evidence(evidence, img, region)


def components(coverage: np.ndarray, *, threshold: float = 0.5, limit: int = 1024) -> list[list[tuple[int, int]]]:
    """4-connected observed pixel groups; deliberately not called hair counts."""
    height, width = coverage.shape
    occupied = coverage >= threshold
    seen = np.zeros_like(occupied)
    groups: list[list[tuple[int, int]]] = []
    for y in range(height):
        for x in range(width):
            if not occupied[y, x] or seen[y, x]:
                continue
            if len(groups) >= limit:
                raise ValueError("too many disconnected brow observations")
            stack = [(x, y)]
            seen[y, x] = True
            points = []
            while stack:
                cx, cy = stack.pop()
                points.append((cx, cy))
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < width and 0 <= ny < height and occupied[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((nx, ny))
            groups.append(points)
    return groups


def evidence_summary(evidence: BrowEvidence, region: np.ndarray) -> dict[str, Any]:
    total = float(np.sum(region))
    covered = float(np.sum(evidence.coverage))
    return {"evidence_origin": evidence.origin, "evidence_confidence": evidence.confidence,
            "observed_coverage_px": covered, "observed_coverage_fraction": covered / total if total else 0,
            "grey_coverage_px": float(np.sum(evidence.grey)),
            "biological_hair_count": None, "added_hairs": 0}
