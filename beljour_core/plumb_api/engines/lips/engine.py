'R16B local lips engine. Author: John Khan.'

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np

from .contracts import (
    LABEL,
    VERSION,
    LipRequest,
    LipResult,
    parse_request,
    validate_photo,
    validate_points,
)
from .geometry import lip_mask, overline_mask, warp_vertical
from .shaders import (
    add_gloss,
    blend_colour,
    matte,
    stain_asymmetry,
    wear_mask,
)


def _feature_warp(image: np.ndarray, points: np.ndarray, req: LipRequest) -> np.ndarray:
    a = req.amount
    if req.feature == 'W45':
        upper, lower = {'cupid_focus': (1.35, 0.55), 'keyhole': (1.1, 0.9), 'vertical_lift': (1.5, 0.45)}.get(req.style, (1, 1))
        return warp_vertical(image, points, min(a, 0.72), upper, lower)
    if req.feature == 'W48':
        return warp_vertical(image, points, min(a, 0.42), 1.45, 0.15)
    if req.feature == 'W49':
        cap = 0.36 if req.style == '0.5_ml_style' else 0.58
        return warp_vertical(image, points, min(a, cap), 1, 1)
    return image.copy()

def render(image: np.ndarray, landmarks: np.ndarray, request: Mapping[str, Any] | LipRequest) -> LipResult:
    photo = validate_photo(image)
    pts = validate_points(landmarks)
    req = parse_request(request)
    h, w = photo.shape[:2]
    base = _feature_warp(photo, pts, req)
    mask = lip_mask(h, w, pts, req.feather)
    out = base.copy()
    coverage = np.zeros((h, w), dtype=np.float32)
    notes = []
    if req.feature == 'W46':
        coverage = overline_mask(h, w, pts, min(req.amount, 0.72))
        out = blend_colour(out, coverage, req.liner_colour, 0.88, 1)
        notes.append('Corner overline is suppressed and the daylight check remains visible.')
    elif req.feature == 'W47':
        fade = {'fresh': 0.78, 'healed': 0.48, 'month_6': 0.38, 'month_12': 0.28, 'month_18': 0.18}.get(req.style, 0.48)
        coverage = mask
        out = blend_colour(out, coverage, req.colour, fade * req.amount, req.preserve_texture)
        notes.append('Fade states are illustrative, not pigment-retention predictions.')
    elif req.feature == 'W54':
        coverage = mask
        colour = {'blue_based': (138, 35, 71), 'neutral': req.colour, 'warm_based': (171, 69, 51)}.get(req.style, req.colour)
        out = blend_colour(out, coverage, colour, 0.72 * req.amount, req.preserve_texture)
        notes.append('Teeth pixels are never changed by this optical comparison.')
    elif req.feature == 'W55':
        coverage = mask
        out = blend_colour(out, coverage, req.colour, 0.72 * req.amount, req.preserve_texture)
        if req.style == 'matte':
            out = matte(out, coverage, 0.9)
        elif req.style == 'gloss':
            out = add_gloss(out, coverage, 0.9)
        elif req.style == 'satin':
            out = add_gloss(out, coverage, 0.3)
        elif req.style == 'stain':
            out = blend_colour(photo, stain_asymmetry(mask, req.two_tone_balance), req.colour, 0.55 * req.amount, 1)
    elif req.feature == 'W56':
        coverage = wear_mask(mask, req.style or 'two_hours', req.seed)
        out = blend_colour(out, coverage, req.colour, 0.78 * req.amount, 1)
        notes.append('Wear is a finish-class estimate, not a product promise.')
    elif req.feature == 'W57':
        coverage = stain_asymmetry(mask, req.two_tone_balance)
        op = {'sheer': 0.3, 'medium': 0.58, 'opaque': 0.82}.get(req.style, 0.58)
        out = blend_colour(out, coverage, req.colour, op * req.amount, 1)
    else:
        coverage = mask
    if req.feature in {'W45', 'W48', 'W49'}:
        notes.append('Geometry is capped and intended only for an adult consultation preview.')
    if req.amount == 0:
        out = photo.copy()
        coverage *= 0
    report = {'feature': req.feature, 'style': req.style, 'label': LABEL, 'version': VERSION, 'notes': notes, 'changed_fraction': float(np.mean(np.any(out[..., :3] != photo[..., :3], axis=2))), 'coverage_fraction': float(np.mean(coverage > 0.05)), 'texture_preserved': True, 'adult_confirmed': req.adult_confirmed}
    return LipResult(out, coverage, report)
