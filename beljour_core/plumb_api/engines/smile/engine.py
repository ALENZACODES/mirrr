'Manual-annotation smile consultation engine. Author: John Khan.'

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

import numpy as np

from .contracts import (
    LABEL,
    VERSION,
    SmileRequest,
    SmileResult,
    parse_request,
    validate_photo,
)
from .geometry import midline_error, polygon_mask, split_teeth


def _shade(image: np.ndarray, mask: np.ndarray, colour: tuple[int, int, int], opacity: float) -> np.ndarray:
    out = image.copy()
    rgb = out[..., :3].astype(float)
    c = np.asarray(colour, float)
    lum = rgb.mean(axis=2, keepdims=True) / 255
    target = c * (0.82 + 0.18 * lum)
    a = (mask * opacity)[..., None]
    out[..., :3] = np.clip(rgb * (1 - a) + target * a, 0, 255).astype(np.uint8)
    return out

def render(image: np.ndarray, request: Mapping[str, Any] | SmileRequest) -> SmileResult:
    photo = validate_photo(image)
    req = parse_request(request)
    h, w = photo.shape[:2]
    if req.feature == 'W58':
        ann = req.frame_annotations[0]
    else:
        assert req.annotation is not None
        ann = req.annotation
    teeth = polygon_mask(h, w, ann.teeth)
    gum = polygon_mask(h, w, ann.gum)
    out = photo.copy()
    coverage = np.zeros((h, w), np.float32)
    notes = []
    if req.feature == 'W50':
        coverage = np.clip(teeth + gum, 0, 1)
        out = _shade(out, gum, req.gum_shade, 0.14 * req.amount)
        notes.append('Static visual comparison only; causes of gum show vary and need a dental professional.')
    elif req.feature == 'W51':
        coverage = teeth
        out = _shade(out, teeth, req.tooth_shade, 0.45 * req.amount)
        notes.append('Veneers can require irreversible enamel removal; this is a shape/shade consultation aid.')
    elif req.feature == 'W52':
        coverage = teeth
        if ann.midline_x is not None:
            x = int(ann.midline_x * w)
            band = max(1, int(w * 0.004 * (1 - req.amount)))
            m = np.zeros_like(teeth)
            m[:, max(0, x - band):min(w, x + band + 1)] = teeth[:, max(0, x - band):min(w, x + band + 1)]
            out = _shade(out, m, req.tooth_shade, 0.52 * req.amount)
        notes.append('Keep, partly close, or visually close the gap; no beauty score is used.')
    elif req.feature == 'W53':
        coverage = np.clip(teeth + gum, 0, 1)
        out = _shade(out, teeth, req.tooth_shade, 0.3 * req.amount)
        out = _shade(out, gum, req.gum_shade, 0.1 * req.amount)
        notes.append('Gum-line changes can be surgical. This preview is for discussion with a dentist only.')
    else:
        coverage = teeth
    if req.amount == 0:
        out = photo.copy()
        coverage *= 0
    report = {'feature': req.feature, 'label': LABEL, 'version': VERSION, 'notes': notes, 'annotation_source': 'user_checked', 'midline_error': midline_error(ann.teeth, ann.midline_x), 'tooth_sections': len(split_teeth(ann.teeth)), 'changed_fraction': float(np.mean(np.any(out[..., :3] != photo[..., :3], axis=2)))}
    return SmileResult(out, coverage, report)

def render_sequence(frames: Sequence[np.ndarray], request: Mapping[str, Any] | SmileRequest) -> tuple[list[np.ndarray], dict[str, Any]]:
    req = parse_request(request)
    if req.feature != 'W58':
        raise ValueError('sequence renderer only supports W58')
    if len(frames) != len(req.frame_annotations):
        raise ValueError('one checked annotation is required per frame')
    outputs = []
    centres = []
    for frame, ann in zip(frames, req.frame_annotations, strict=True):
        photo = validate_photo(frame)
        h, w = photo.shape[:2]
        m = polygon_mask(h, w, ann.teeth)
        outputs.append(_shade(photo, m, req.tooth_shade, 0.08 * req.amount))
        p = np.asarray(ann.teeth, float)
        centres.append((float(p[:, 0].mean()), float(p[:, 1].mean())))
    jumps = [float(np.linalg.norm(np.subtract(a, b))) for a, b in zip(centres, centres[1:], strict=False)]
    return (outputs, {'feature': 'W58', 'label': LABEL, 'frames': len(outputs), 'max_annotation_jump': max(jumps, default=0), 'temporal_status': 'check motion annotations; no automatic tracking or prediction is used'})
