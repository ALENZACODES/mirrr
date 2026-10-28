'Procedural accessory fit for W85-W88. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .masking import (
    alpha_composite,
    feather,
    stats,
    subtract,
    validate_mask,
)


@dataclass(frozen=True)
class Box:
    x0: float
    y0: float
    x1: float
    y1: float

    @property
    def width(self) -> float:
        return max(0.0, self.x1 - self.x0)

    @property
    def height(self) -> float:
        return max(0.0, self.y1 - self.y0)

    @property
    def centre(self) -> tuple[float, float]:
        return ((self.x0 + self.x1) / 2, (self.y0 + self.y1) / 2)

@dataclass(frozen=True)
class FitReport:
    feature: str
    region_fraction: float
    symmetry: float
    scale_ratio: float
    outside_fraction: float
    warning: str

def mask_box(mask: np.ndarray) -> Box:
    m = validate_mask(mask)
    s = stats(m)
    h, w = m.shape
    if s.area == 0:
        raise ValueError('checked accessory region is empty')
    return Box(s.x0 / w, s.y0 / h, s.x1 / w, s.y1 / h)

def mirror_symmetry(mask: np.ndarray) -> float:
    m = validate_mask(mask) > 0.5
    flipped = np.fliplr(m)
    union = np.logical_or(m, flipped).sum()
    numerator = int(np.logical_and(m, flipped).sum())
    denominator = int(union)
    return float(numerator / denominator) if denominator else 1.0

def ellipse_mask(h: int, w: int, cx: float, cy: float, rx: float, ry: float, thickness: float=0.18) -> np.ndarray:
    yy, xx = np.mgrid[:h, :w]
    x = (xx / w - cx) / max(rx, 1e-05)
    y = (yy / h - cy) / max(ry, 1e-05)
    d = x * x + y * y
    inner = max(0.0, (1 - thickness) ** 2)
    return ((d <= 1) & (d >= inner)).astype(np.float32)

def jewellery_geometry(h: int, w: int, style: str, scale: float=1) -> np.ndarray:
    if not 0.5 <= scale <= 1.5:
        raise ValueError('scale must be .5..1.5')
    result = np.zeros((h, w), np.float32)
    if style in {'earrings', 'both'}:
        for cx in (0.3, 0.7):
            result = np.maximum(result, ellipse_mask(h, w, cx, 0.52, 0.025 * scale, 0.055 * scale, 0.28))
    if style in {'necklace', 'both'}:
        yy, xx = np.mgrid[:h, :w]
        x = (xx / w - 0.5) / (0.2 * scale)
        y = (yy / h - 0.72) / (0.1 * scale)
        d = x * x + y * y
        result = np.maximum(result, ((d <= 1) & (d >= 0.72)).astype(np.float32))
    return result

def glasses_geometry(h: int, w: int, style: str, scale: float=1) -> np.ndarray:
    if style not in {'soft_round', 'rectangular', 'cat_eye', 'wire'}:
        raise ValueError('unsupported frame style')
    if not 0.7 <= scale <= 1.3:
        raise ValueError('scale must be .7..1.3')
    result = np.zeros((h, w), np.float32)
    th = 0.12 if style != 'wire' else 0.07
    for cx in (0.39, 0.61):
        rx = 0.095 * scale
        ry = (0.065 if style == 'rectangular' else 0.082) * scale
        result = np.maximum(result, ellipse_mask(h, w, cx, 0.41, rx, ry, th))
    y = int(0.41 * h)
    x0 = int(0.485 * w)
    x1 = int(0.515 * w)
    result[max(0, y - 1):min(h, y + 2), x0:x1] = 1
    if style == 'cat_eye':
        for x in (int(0.29 * w), int(0.71 * w)):
            result[max(0, y - int(0.06 * h)):y + 1, max(0, x - 2):min(w, x + 3)] = 1
    return result

def apply_checked_colour(photo: np.ndarray, checked: np.ndarray, colour: tuple[int, int, int], opacity: float, protected: np.ndarray | None=None) -> np.ndarray:
    mask = validate_mask(checked, photo.shape[:2])
    if protected is not None:
        mask = subtract(mask, protected)
    return alpha_composite(photo, colour, feather(mask, 1), opacity)

def nail_colour(photo: np.ndarray, nails: np.ndarray, colour: tuple[int, int, int], opacity: float) -> np.ndarray:
    if not 0 <= opacity <= 1:
        raise ValueError('opacity must be in [0,1]')
    return alpha_composite(photo, colour, validate_mask(nails, photo.shape[:2]), opacity)

def hijab_colour(photo: np.ndarray, scarf: np.ndarray, hair_protected: np.ndarray, colour: tuple[int, int, int], opacity: float) -> tuple[np.ndarray, dict[str, float | bool]]:
    scarf_mask = validate_mask(scarf, photo.shape[:2])
    hair = validate_mask(hair_protected, photo.shape[:2])
    safe = subtract(scarf_mask, hair)
    overlap = float(np.mean((scarf_mask > 0.5) & (hair > 0.5)))
    out = alpha_composite(photo, colour, feather(safe, 1), opacity)
    hair_changed = float(np.mean(np.any(out[..., :3] != photo[..., :3], axis=2)[hair > 0.5])) if np.any(hair > 0.5) else 0.0
    return (out, {'checked_overlap': overlap, 'hair_changed_fraction': hair_changed, 'hair_reveal': False, 'cultural_review_required': True})

def fit_report(feature: str, mask: np.ndarray, reference_width: float, outside_fraction: float=0) -> FitReport:
    b = mask_box(mask)
    sym = mirror_symmetry(mask)
    ratio = b.width / max(reference_width, 1e-05)
    warning = 'Scale is a visual guide, not a physical fit or weight guarantee.'
    if feature == 'W88':
        warning = 'Scarf colour only; hair stays protected and cultural co-design is required.'
    if feature == 'W87':
        warning = 'Nail colour only; shape and length are unchanged.'
    return FitReport(feature, stats(mask).fraction, sym, ratio, outside_fraction, warning)

def millimetre_claim_allowed(calibrated: bool) -> bool:
    return bool(calibrated)

def display_scale(value: float, calibrated: bool) -> str:
    if calibrated:
        return f'{value:.1f} mm'
    return f'{value:.2f}× image-relative scale'
