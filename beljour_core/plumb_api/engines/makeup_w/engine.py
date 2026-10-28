'R17B local women makeup renderer and planning engine. Author: John Khan.'
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np

from .contracts import MakeupRequest, MakeupResult, parse_request, validate_image, validate_mask
from .finishes import apply_finish, apply_tint
from .maps import blush_map, concealer_map, contour_map, correction_map
from .oxidation import oxidation_curve, seasonal_mix
from .palette import custom_palette, extract_palette, outfit_harmony, recommend
from .reference import checked_reference, original_look


def _mask(masks: Mapping[str, np.ndarray], name: str, shape: tuple[int, int], fallback: np.ndarray | None=None) -> np.ndarray:
    if name in masks:
        return validate_mask(masks[name], shape, name)
    if fallback is not None:
        return fallback
    raise ValueError(f'{name} mask required')

def _rgb3(value: object, name: str='colour') -> tuple[int, int, int]:
    if not isinstance(value, (list, tuple)) or len(value) != 3:
        raise ValueError(f'{name} must be RGB')
    channels = []
    for channel in value:
        if not isinstance(channel, (int, float)) or isinstance(channel, bool):
            raise ValueError(f'{name} channels must be numeric')
        channels.append(int(max(0, min(255, round(float(channel))))))
    return (channels[0], channels[1], channels[2])

def _preserve_alpha(source: np.ndarray, out: np.ndarray) -> np.ndarray:
    if source.shape[2] == 4:
        out[..., 3] = source[..., 3]
    return out

def render(image: np.ndarray, masks: Mapping[str, np.ndarray], value: Mapping[str, Any] | MakeupRequest, reference: np.ndarray | None=None, reference_masks: Mapping[str, np.ndarray] | None=None) -> MakeupResult:
    source = validate_image(image)
    request = parse_request(value)
    if request.amount <= 0:
        return MakeupResult(source.copy(), np.zeros(source.shape[:2]), {'feature': request.feature, 'label': 'identity'})
    skin = _mask(masks, 'skin', source.shape[:2])
    feature = request.feature
    coverage = skin.copy()
    output = source.copy()
    report: dict[str, Any] = {'feature': feature, 'provider': 'local', 'simulation': True, 'label': 'Local makeup simulation; shades are visual estimates.'}
    if feature == 'W1':
        colours = [request.shade, request.accent]
        report['palette'] = [x.__dict__ for x in custom_palette(colours, request.undertone)]
        coverage = np.zeros_like(skin)
    elif feature == 'W2':
        palette_mask = masks.get('palette_region')
        report['palette'] = extract_palette(source, palette_mask, 6)
        coverage = np.zeros_like(skin)
    elif feature == 'W4':
        choices = (request.shade, request.accent, (96, 54, 82), (166, 95, 72), (115, 86, 54))
        report['recommendations'] = [x.__dict__ for x in recommend(choices, request.undertone)]
        coverage = np.zeros_like(skin)
    elif feature == 'W5':
        outfit = request.metadata.get('outfit_colour', request.accent)
        if not isinstance(outfit, (list, tuple)) or len(outfit) != 3:
            raise ValueError('outfit_colour must be RGB')
        rgb = _rgb3(outfit, 'outfit_colour')
        report['harmony'] = [x.__dict__ for x in outfit_harmony(rgb, request.undertone)]
        coverage = np.zeros_like(skin)
    elif feature == 'W7':
        coverage = concealer_map(source.shape[:2]) * skin
        output = apply_tint(source, coverage, request.shade, request.amount * 0.35)
        report['placement'] = 'under-eye and centre-face map'
    elif feature == 'W8':
        issue = str(request.metadata.get('issue', 'redness'))
        coverage = correction_map(source.shape[:2], issue) * skin
        correction = (108, 91, 70) if issue == 'under_eye' else (82, 104, 73)
        output = apply_tint(source, coverage, correction, request.amount * 0.22)
        report['correction_issue'] = issue
    elif feature == 'W9':
        coverage = skin
        output = apply_finish(source, skin, request.finish if request.finish in {'cream', 'powder'} else 'cream', request.amount)
    elif feature == 'W10':
        coverage = skin
        output = apply_finish(source, skin, request.finish if request.finish in {'dewy', 'matte', 'skin_tint'} else 'skin_tint', request.amount)
    elif feature == 'W11':
        coverage = blush_map(source.shape[:2], request.face_shape) * skin
        output = apply_tint(source, coverage, request.accent, request.amount * 0.42)
        report['face_shape'] = request.face_shape
    elif feature == 'W12':
        coverage = contour_map(source.shape[:2], request.face_shape) * skin
        darker = (max(0, int(request.shade[0] * 0.72)), max(0, int(request.shade[1] * 0.72)), max(0, int(request.shade[2] * 0.72)))
        output = apply_tint(source, coverage, darker, request.amount * 0.32)
        report['geometry_change'] = False
    elif feature == 'W13':
        if reference is None or reference_masks is None:
            raise ValueError('checked reference photo and masks required')
        reference_data = checked_reference(validate_image(reference), reference_masks)
        lip = _mask(masks, 'lip', source.shape[:2])
        cheek = _mask(masks, 'cheek', source.shape[:2])
        eye = _mask(masks, 'eye', source.shape[:2])
        coverage = np.maximum(np.maximum(lip, cheek), eye)
        lip_colour = _rgb3(reference_data['lip'][0], 'reference lip')
        cheek_colour = _rgb3(reference_data['cheek'][0], 'reference cheek')
        output = apply_tint(source, lip, lip_colour, request.amount * 0.55)
        output = apply_tint(output, cheek, cheek_colour, request.amount * 0.28)
        report['reference'] = reference_data
    elif feature == 'W14':
        look = original_look(request.look)
        lip = _mask(masks, 'lip', source.shape[:2])
        cheek = _mask(masks, 'cheek', source.shape[:2])
        eye = _mask(masks, 'eye', source.shape[:2])
        coverage = np.maximum(np.maximum(lip, cheek), eye)
        output = apply_tint(source, lip, _rgb3(look['lip'], 'look lip'), request.amount * 0.58)
        output = apply_tint(output, cheek, _rgb3(look['cheek'], 'look cheek'), request.amount * 0.3)
        output = apply_tint(output, eye, _rgb3(look['eye'], 'look eye'), request.amount * 0.4)
        report['look'] = request.look
        report['third_party_names'] = False
    elif feature == 'W16':
        coverage = np.maximum(concealer_map(source.shape[:2]) * skin, blush_map(source.shape[:2], request.face_shape) * skin)
        output = apply_finish(source, coverage, 'skin_tint', request.amount * 0.22)
        report['minimum_product'] = True
    elif feature == 'W17':
        coverage = skin
        delta = min(request.oxidation_delta, 0.0)
        factor = max(0.78, 1 + delta / 100.0)
        oxidized = (int(max(0, min(255, request.shade[0] * factor))), int(max(0, min(255, request.shade[1] * factor))), int(max(0, min(255, request.shade[2] * factor))))
        output = apply_tint(source, skin, oxidized, request.amount * 0.28)
        report['timeline'] = oxidation_curve(request.oxidation_delta)
    elif feature == 'W18':
        coverage = np.zeros_like(skin)
        report['mix'] = seasonal_mix(request.season_shift)
    else:
        raise ValueError('unsupported makeup feature')
    output = _preserve_alpha(source, output)
    return MakeupResult(output, np.clip(coverage, 0, 1), report)
