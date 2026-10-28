'R17B local women hair renderer. Author: John Khan.'
from __future__ import annotations

from typing import Any

import numpy as np

from .colour import blend_grey, foil_pattern, recolour
from .contracts import HairRequest, HairResult, parse_geometry, parse_request, validate_mask, validate_photo
from .geometry import cut_recommendation, extension_mask, fringe_mask, topper_mask
from .masks import lower_hair, root_band, scalp_band, side_region
from .texture import define_curls
from .timeline import grey_transition, humidity_forecast, postpartum_regrowth


def _mask_for(feature: str, hair: np.ndarray, scalp: np.ndarray, request: HairRequest, geometry: Any) -> np.ndarray:
    if feature in {'W19', 'W20'}:
        return extension_mask(hair, geometry, request.length_ratio, request.volume)
    if feature in {'W21', 'W22'}:
        return topper_mask(hair, geometry, request.volume)
    if feature in {'W23', 'W32', 'W33'}:
        return np.maximum(root_band(hair, geometry), scalp * 0.35)
    if feature in {'W24', 'W25', 'W41', 'W42'}:
        return np.maximum(scalp_band(hair, 4), scalp)
    if feature == 'W29':
        return foil_pattern(hair, 4, 0.15)
    if feature == 'W30':
        return foil_pattern(hair, 13, 0.0)
    if feature == 'W31':
        return foil_pattern(hair, 6, 0.08)
    if feature == 'W34':
        return lower_hair(hair, geometry, 0.48)
    if feature == 'W35':
        return side_region(hair, 'left')
    if feature == 'W36':
        return lower_hair(side_region(hair, 'right'), geometry, 0.46)
    if feature == 'W37':
        return fringe_mask(hair, geometry, request.amount)
    return hair.copy()

def _copy_alpha(source: np.ndarray, result: np.ndarray) -> np.ndarray:
    if source.shape[2] == 4:
        result[..., 3] = source[..., 3]
    return result

def render(image: np.ndarray, hair_mask: np.ndarray, scalp_mask: np.ndarray, landmarks: dict[str, Any], value: dict[str, Any] | HairRequest) -> HairResult:
    source = validate_photo(image)
    request = parse_request(value)
    hair = validate_mask(hair_mask, source.shape[:2])
    scalp = validate_mask(scalp_mask, source.shape[:2], 'scalp_mask')
    geometry = parse_geometry(landmarks)
    if request.amount <= 0:
        return HairResult(source.copy(), np.zeros(source.shape[:2], dtype=np.float64), {'feature': request.feature, 'label': 'identity'})
    coverage = np.clip(_mask_for(request.feature, hair, scalp, request, geometry), 0, 1)
    feature = request.feature
    output = source.copy()
    report: dict[str, Any] = {'feature': feature, 'label': 'Local hair simulation. Estimate where stated.', 'provider': 'local', 'simulation': True}
    if feature in {'W19', 'W20', 'W21', 'W22', 'W37', 'W38'}:
        output = recolour(source, coverage, request.colour, request.amount * 0.45, 0.9)
        if feature == 'W38':
            report['cut'] = cut_recommendation(geometry)
        if feature in {'W19', 'W20'}:
            report['worn_length_ratio'] = request.length_ratio * (0.72 + 0.28 * request.curl_strength)
            report['stretched_length_ratio'] = request.length_ratio
    elif feature in {'W23', 'W24', 'W25'}:
        output = recolour(source, coverage, request.colour, request.amount * (0.35 if request.scalp_sensitivity else 0.55), 0.95)
        report['scalp_concealer'] = feature in {'W24', 'W25'}
    elif feature == 'W26':
        output = recolour(source, coverage, request.colour, request.amount * 0.65, 0.82)
    elif feature in {'W29', 'W30', 'W31', 'W34', 'W35', 'W36'}:
        output = recolour(source, coverage, request.accent, request.amount * 0.72, 0.86)
        report['placement_map'] = True
    elif feature in {'W32', 'W33'}:
        share = request.grey_share if feature == 'W32' else grey_transition(request.grey_share, 18)[min(request.month, 18)].natural_share
        output = blend_grey(source, coverage, share, request.amount)
        report['natural_grey_share'] = share
        if feature == 'W33':
            report['timeline'] = [point.__dict__ for point in grey_transition(request.grey_share, 18)]
    elif feature == 'W40':
        output = define_curls(source, coverage, request.amount)
        report['curl_pattern_preserved'] = True
    elif feature == 'W41':
        growth = postpartum_regrowth(request.month, request.amount)
        output = recolour(source, coverage * float(growth['relative_density']), request.colour, 0.35, 0.95)
        report['regrowth'] = growth
        report['medical_advice'] = False
    elif feature == 'W42':
        safe_amount = min(request.amount, 0.45)
        output = recolour(source, coverage * 0.55, request.colour, safe_amount * 0.3, 0.98)
        report['mode'] = 'calm_sensitive'
        report['copy'] = 'Optional gentle visual aid. Keeping your current look is always an equal option; no pressure to cover or change hair loss.'
        report['medical_advice'] = False
    elif feature == 'W43':
        output = define_curls(source, coverage, request.amount * (0.7 + 0.3 * request.heat_shape))
        report['heat_warning'] = 'preview only; heat protection and safe tool temperatures depend on hair condition'
    elif feature == 'W44':
        forecast = humidity_forecast(request.humidity, request.curl_strength)
        output = define_curls(source, coverage, request.amount * float(forecast['definition_retention']))
        report['forecast'] = forecast
    else:
        raise ValueError('unsupported women hair feature')
    output = _copy_alpha(source, output)
    return HairResult(output, coverage, report)
