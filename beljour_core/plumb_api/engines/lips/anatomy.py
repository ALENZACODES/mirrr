'Measured lip anatomy for zone-specific simulations.\n\nThe functions in this file are deterministic geometry utilities. They do not infer\nage, ethnicity, attractiveness, procedure suitability, or a desired facial ideal.\nThey operate only on the checked face landmarks supplied for the current photo.\nAuthor: John Khan.\n'

from __future__ import annotations

from dataclasses import dataclass
from typing import Final

import numpy as np

UPPER_CENTRE: Final = (13, 312, 311, 310, 415, 308, 78, 191, 80, 81, 82)

LOWER_CENTRE: Final = (14, 317, 402, 318, 324, 308, 78, 95, 88, 178, 87)

CUPID: Final = (13, 0, 267, 269, 270)

CORNERS: Final = (61, 291)

PHILTRUM: Final = (0, 164)

@dataclass(frozen=True)
class LipAnatomy:
    centre: tuple[float, float]
    width: float
    height: float
    upper_height: float
    lower_height: float
    upper_to_lower: float
    cupid_depth: float
    corner_tilt: float
    asymmetry: float
    mouth_opening: float

def _mean(points: np.ndarray, ids: tuple[int, ...]) -> np.ndarray:
    return np.mean(points[np.asarray(ids, dtype=np.int64)], axis=0)

def _span(points: np.ndarray, ids: tuple[int, ...], axis: int) -> float:
    values = points[np.asarray(ids, dtype=np.int64), axis]
    return float(np.max(values) - np.min(values))

def measure(points: np.ndarray) -> LipAnatomy:
    """Return normalized lip proportions from a checked 468/478 point mesh."""
    if points.shape not in ((468, 2), (478, 2)):
        raise ValueError('lip anatomy requires 468 or 478 checked points')
    if not np.all(np.isfinite(points)):
        raise ValueError('lip anatomy points must be finite')
    left = points[CORNERS[0]]
    right = points[CORNERS[1]]
    width = float(np.linalg.norm(right - left))
    if width < 0.015:
        raise ValueError('lip width is too small to measure reliably')
    upper = _mean(points, UPPER_CENTRE)
    lower = _mean(points, LOWER_CENTRE)
    centre = (left + right + upper + lower) / 4.0
    upper_height = abs(float(centre[1] - upper[1]))
    lower_height = abs(float(lower[1] - centre[1]))
    height = max(upper_height + lower_height, 1e-08)
    cupid_left = points[82]
    cupid_mid = points[13]
    cupid_right = points[312]
    cupid_line = (cupid_left[1] + cupid_right[1]) / 2.0
    cupid_depth = float((cupid_line - cupid_mid[1]) / width)
    corner_tilt = float((right[1] - left[1]) / width)
    vertical_mid = float((upper[1] + lower[1]) / 2.0)
    left_height = abs(float(points[61, 1] - vertical_mid))
    right_height = abs(float(points[291, 1] - vertical_mid))
    asymmetry = abs(left_height - right_height) / max(height, 1e-08)
    opening_top = points[13]
    opening_bottom = points[14]
    opening = max(0.0, float(opening_bottom[1] - opening_top[1]) / width)
    return LipAnatomy(centre=(float(centre[0]), float(centre[1])), width=width, height=height, upper_height=upper_height, lower_height=lower_height, upper_to_lower=upper_height / max(lower_height, 1e-08), cupid_depth=cupid_depth, corner_tilt=corner_tilt, asymmetry=asymmetry, mouth_opening=opening)

@dataclass(frozen=True)
class ZoneWeights:
    cupid: float
    upper_lateral: float
    lower_centre: float
    lower_lateral: float
    corners: float

def style_weights(style: str) -> ZoneWeights:
    """Map user-selected wording to a bounded, transparent geometry recipe."""
    table = {'natural_plump': ZoneWeights(0.85, 0.75, 0.95, 0.75, 0.05), 'cupid_focus': ZoneWeights(1.0, 0.42, 0.45, 0.32, 0.0), 'keyhole': ZoneWeights(0.82, 0.58, 1.0, 0.52, 0.0), 'vertical_lift': ZoneWeights(1.0, 0.5, 0.28, 0.22, 0.0)}
    try:
        return table[style]
    except KeyError as exc:
        raise ValueError('unknown lip shape style') from exc

def plausibility_cap(anatomy: LipAnatomy, style: str) -> float:
    """Return a conservative normalized intensity cap based on visible geometry.

    The cap is not a medical safety assessment. It only prevents the renderer from
    producing extreme geometry from a front photograph.
    """
    base = 0.7
    if anatomy.asymmetry > 0.18:
        base -= 0.1
    if anatomy.mouth_opening > 0.12:
        base -= 0.08
    if anatomy.upper_to_lower > 1.45 or anatomy.upper_to_lower < 0.45:
        base -= 0.06
    if style == 'vertical_lift':
        base = min(base, 0.54)
    if style == 'cupid_focus' and anatomy.cupid_depth > 0.08:
        base = min(base, 0.58)
    return float(np.clip(base, 0.32, 0.72))

def zone_profile(width: int, anatomy: LipAnatomy, weights: ZoneWeights) -> np.ndarray:
    """Return a horizontal influence profile across the measured lip width."""
    if width < 4:
        raise ValueError('profile width must be at least four samples')
    x = np.linspace(-1.0, 1.0, width)
    cupid = np.exp(-(x / 0.22) ** 2 * 2.2)
    upper_lateral = np.exp(-((np.abs(x) - 0.47) / 0.24) ** 2 * 2.0)
    lower_centre = np.exp(-(x / 0.45) ** 2 * 1.6)
    lower_lateral = np.exp(-((np.abs(x) - 0.52) / 0.28) ** 2 * 1.8)
    corner = np.clip((np.abs(x) - 0.72) / 0.28, 0.0, 1.0)
    profile = cupid * weights.cupid + upper_lateral * weights.upper_lateral + lower_centre * weights.lower_centre + lower_lateral * weights.lower_lateral + corner * weights.corners
    peak = float(np.max(profile))
    if peak <= 1e-12:
        return np.zeros(width, dtype=np.float64)
    return (profile / peak).astype(np.float64)

def describe(anatomy: LipAnatomy) -> dict[str, float | str]:
    """Machine-readable geometry report with neutral, non-aesthetic language."""
    return {'width': anatomy.width, 'height': anatomy.height, 'upper_to_lower': anatomy.upper_to_lower, 'cupid_depth': anatomy.cupid_depth, 'corner_tilt': anatomy.corner_tilt, 'asymmetry': anatomy.asymmetry, 'mouth_opening': anatomy.mouth_opening, 'interpretation': 'Measured geometry only. No attractiveness or procedure-suitability score.'}
