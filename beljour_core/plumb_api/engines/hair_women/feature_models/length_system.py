'Length, extension, topper, wig and fringe planning for R17B. Author: John Khan.'
from __future__ import annotations

import math
from dataclasses import dataclass

from ..contracts import HairGeometry, HairRequest


@dataclass(frozen=True)
class LengthPlan:
    attachment_y: float
    stretched_ratio: float
    worn_ratio: float
    blend_ratio: float
    volume_ratio: float
    warnings: tuple[str, ...]

def _clamp(value: float, low: float, high: float) -> float:
    if not math.isfinite(value):
        raise ValueError('value must be finite')
    return min(high, max(low, value))

def curl_shrinkage(curl_strength: float) -> float:
    """Return conservative visible-length shrinkage from curl strength."""
    c = _clamp(curl_strength, 0.0, 1.0)
    return 0.03 + 0.24 * c ** 1.35

def worn_length(stretched_ratio: float, curl_strength: float) -> float:
    stretched = _clamp(stretched_ratio, 0.8, 2.4)
    return stretched * (1.0 - curl_shrinkage(curl_strength))

def clip_in_plan(request: HairRequest, geometry: HairGeometry) -> LengthPlan:
    crown_y = _clamp(geometry.crown[1], 0.05, 0.7)
    attach = min(0.78, crown_y + 0.24)
    stretched = 1.0 + 1.2 * _clamp(request.length_ratio, 0.0, 1.0)
    worn = worn_length(stretched, request.curl_strength)
    blend = 1.0 - min(0.45, abs(stretched - 1.0) * 0.24 + request.volume * 0.05)
    warnings: list[str] = []
    if stretched > 1.75:
        warnings.append('Long extension previews need an in-person weight and attachment check.')
    if request.curl_strength > 0.7:
        warnings.append('Worn length is shown separately because curl shrinkage is substantial.')
    return LengthPlan(attach, stretched, worn, blend, _clamp(request.volume, 0.0, 1.5), tuple(warnings))

def integration_plan(request: HairRequest, geometry: HairGeometry, method: str) -> LengthPlan:
    if method not in {'tape', 'sew_in'}:
        raise ValueError('method must be tape or sew_in')
    base = clip_in_plan(request, geometry)
    attach_shift = 0.025 if method == 'tape' else 0.045
    warnings = list(base.warnings)
    warnings.append('Attachment placement is a visual guide, not a tension or scalp-safety assessment.')
    return LengthPlan(_clamp(base.attachment_y + attach_shift, 0.1, 0.82), base.stretched_ratio, base.worn_ratio, max(0.45, base.blend_ratio - (0.03 if method == 'sew_in' else 0.0)), base.volume_ratio, tuple(warnings))

def topper_plan(request: HairRequest, geometry: HairGeometry) -> dict[str, float | str]:
    crown_x, crown_y = geometry.crown
    radius_x = 0.14 + 0.05 * _clamp(request.volume, 0.0, 1.5)
    radius_y = 0.11 + 0.04 * _clamp(request.volume, 0.0, 1.5)
    return {'centre_x': _clamp(crown_x, 0.2, 0.8), 'centre_y': _clamp(crown_y, 0.08, 0.6), 'radius_x': radius_x, 'radius_y': radius_y, 'density_gain': 0.18 + 0.32 * request.amount, 'label': 'topper density simulation; fit and attachment require an in-person check'}

def wig_plan(request: HairRequest, geometry: HairGeometry) -> dict[str, float | str | bool]:
    temple_span = abs(geometry.right_temple[0] - geometry.left_temple[0])
    cap_width = _clamp(temple_span * 1.28, 0.32, 0.72)
    return {'cap_width_ratio': cap_width, 'crown_y': _clamp(geometry.crown[1], 0.05, 0.6), 'hairline_softness': 0.35 + request.amount * 0.45, 'volume': _clamp(request.volume, 0.0, 1.5), 'simulation': True, 'label': 'fashion wig appearance only; fit, ventilation and comfort are not measured'}

def fringe_plan(request: HairRequest, geometry: HairGeometry, style: str='soft') -> dict[str, float | str]:
    if style not in {'soft', 'curtain', 'full', 'side'}:
        raise ValueError('unsupported fringe style')
    left, right = (geometry.left_temple, geometry.right_temple)
    width = _clamp(abs(right[0] - left[0]) * (0.75 if style == 'side' else 0.94), 0.2, 0.72)
    drop = {'soft': 0.17, 'curtain': 0.2, 'full': 0.23, 'side': 0.18}[style]
    return {'centre_x': (left[0] + right[0]) / 2, 'start_y': min(left[1], right[1]) - 0.035, 'drop': drop * (0.7 + 0.3 * request.amount), 'width': width, 'style': style}
