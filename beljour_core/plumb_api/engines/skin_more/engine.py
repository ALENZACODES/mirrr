'R16B Skin & More local renderer. Author: John Khan.'

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np

from .accessories import faux_freckles, glasses_mask, jewellery_mask
from .colour import cast, continuity_score, neutralise, recolour
from .contracts import (
    LABEL,
    VERSION,
    SkinMoreRequest,
    SkinMoreResult,
    parse_request,
    validate_photo,
)
from .diary import pattern_summary
from .raster import dry_zone, masks_by_name, union


def _face_ellipse(h: int, w: int) -> np.ndarray:
    yy, xx = np.mgrid[:h, :w]
    return (((xx - w * 0.5) / (w * 0.28 + 1)) ** 2 + ((yy - h * 0.43) / (h * 0.35 + 1)) ** 2 < 1).astype(np.float32)

def render(image: np.ndarray, request: Mapping[str, Any] | SkinMoreRequest) -> SkinMoreResult:
    photo = validate_photo(image)
    req = parse_request(request)
    h, w = photo.shape[:2]
    named = masks_by_name(h, w, req.masks)
    manual = union(named) if named else np.zeros((h, w), np.float32)
    face = _face_ellipse(h, w)
    out = photo.copy()
    coverage = np.zeros((h, w), np.float32)
    notes = []
    extra: dict[str, Any] = {}
    f = req.feature
    a = req.amount
    if f == 'W77':
        coverage = face
        op = {'sheer': 0.12, 'light': 0.2, 'medium': 0.3}.get(req.style, 0.18) * a
        out = recolour(out, coverage, req.colour, op, 1)
        notes.append('Sheer coverage is intentionally limited; undertone mismatch is not hidden by opacity.')
    elif f == 'W78':
        coverage = dry_zone(face)
        depth = {'light': 0.08, 'medium': 0.14, 'dark': 0.2, 'olive': 0.13}.get(req.style, 0.12)
        tan = (155, 103, 70) if req.style != 'olive' else (139, 111, 69)
        out = recolour(out, coverage, tan, depth * a, 1)
        notes.append('Cosmetic colour preview only. It does not describe tanning as healthy or safer.')
    elif f == 'W79':
        coverage = manual
        out = recolour(out, coverage, req.colour, 0.18 * a, 1)
        notes.append('Checked face/neck/chest/hand regions only; dry-area absorption warning is visual, not medical.')
    elif f == 'W80':
        coverage = manual
        op = {'mineral_cast': 0.28, 'tinted_cast': 0.1, 'clear_finish': 0.025}.get(req.style, 0.18) * a
        out = cast(out, coverage, op)
        notes.append('White-cast appearance only; no SPF efficacy or dosing claim.')
    elif f == 'W81':
        coverage = manual
        channel = 'orange' if req.style == 'orange_corrector' else 'grey'
        out = neutralise(out, coverage, channel, 0.55 * a)
        notes.append('Areas are user-marked deeper pigmentation, not a diagnosis.')
    elif f == 'W82':
        coverage = manual
        out = neutralise(out, coverage, 'red', 0.48 * a)
        notes.append('Persistent redness language only; diagnosis belongs to a clinician.')
    elif f == 'W83':
        coverage = np.zeros((h, w), np.float32)
        extra['diary'] = pattern_summary(req.diary_values)
        notes.append('Local, exportable observations only; no fertility or medical prediction.')
    elif f == 'W84':
        coverage = face
        op = 0.07 * a
        out = recolour(out, coverage, req.colour, op, 1)
        notes.append('Pro-age mode keeps visible texture and avoids erase/anti-ageing claims.')
    elif f == 'W85':
        coverage = np.maximum(manual, jewellery_mask(h, w, req.style or 'both', a))
        out = recolour(out, coverage, req.colour, 0.8 * a, 0.95)
        notes.append('Procedural scale guide only; no third-party jewellery asset or weight claim.')
    elif f == 'W86':
        coverage = np.maximum(manual, glasses_mask(h, w, req.style or 'soft_round', a))
        out = recolour(out, coverage, req.secondary_colour, 0.9 * a, 0.95)
        notes.append('Fit language only; no face-shape flaw scoring.')
    elif f == 'W87':
        coverage = manual
        out = recolour(out, coverage, req.colour, 0.75 * a, 1)
        notes.append('Colour only. Nail shape and length stay untouched; hand region is checked manually.')
    elif f == 'W88':
        coverage = manual
        out = recolour(out, coverage, req.colour, 0.55 * a, 1)
        notes.append('Checked scarf region only; no hair reveal/removal. Cultural co-design validation is still required before release.')
    elif f == 'W89':
        coverage = face
        op = {'interview': 0.08, 'date_night': 0.16, 'wedding_guest': 0.13}.get(req.style, 0.1) * a
        out = recolour(out, coverage, req.colour, op, 1)
        notes.append('Editable context bundle; interview mode does not equate more makeup with competence.')
    elif f == 'W90':
        coverage = manual
        if req.style == 'preserve':
            out = photo.copy()
        else:
            freckles = faux_freckles(h, w, coverage, 0.4 if req.style == 'faux_subtle' else 0.8, req.seed)
            coverage = freckles
            out = recolour(out, freckles, (96, 62, 45), 0.72 * a, 1)
        notes.append('Preservation is the default natural-mode behaviour; faux freckles are explicitly labelled.')
    elif f == 'W91':
        coverage = manual
        keys = list(named)
        extra['continuity_score'] = continuity_score(photo, named[keys[0]], named[keys[1]]) if len(keys) >= 2 else None
        out = recolour(out, coverage, req.colour, 0.12 * a, 1)
        notes.append('Colour continuity only; lighting and body shape are not scored.')
    elif f == 'W92':
        coverage = face
        out = recolour(out, coverage, req.colour, 0.06 * a, 1)
        notes.append('Texture-first mode intentionally retains lines, pores and changing lip/brow detail.')
    if a == 0:
        out = photo.copy()
        coverage *= 0
    report = {'feature': f, 'style': req.style, 'label': LABEL, 'version': VERSION, 'notes': notes, 'manual_regions': sorted(named), 'local_only': f == 'W83', 'changed_fraction': float(np.mean(np.any(out[..., :3] != photo[..., :3], axis=2))), 'texture_preserved': True, **extra}
    return SkinMoreResult(out, coverage, report)
