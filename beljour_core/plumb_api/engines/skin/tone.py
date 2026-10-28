"""Even tone and redness: pulls blotchy colour toward the skin's own typical colour.

Works on the a* (green-red) and b* (blue-yellow) planes only, and only on their smooth
part (a skin-only box mean about a sixth of the eye distance wide), so pores, grain,
freckles and moles keep their own colour against the skin around them. The reference
colour is the median of that smooth colour over the skin; patches redder than it get an
extra pull set by `redness`. L* is never raised: it is not edited, and the shared byte
guard (engines/skin/common.no_lighten) catches rounding. Cosmetic colour evening only;
it does not read or name any skin condition. web/src/engines/skin/tone.ts mirrors this file.
Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np

from plumb_api.engines.shade.colourspace import srgb_to_lab

from .common import NOTE, Floats, Frame, SkinResult, check_strength, encode, masked_lowpass, no_lighten, radius, rgb_of

TONE_RADIUS = 1 / 6     # IOD share of the colour-smoothing box; ASSUMED
EVEN_SHARE = 0.6        # share of each smooth colour deviation taken out at strength 100; ASSUMED
REDNESS_SHARE = 0.4     # extra share for redder-than-typical patches at redness 100; ASSUMED
MAX_SHIFT = 8.0         # largest a* or b* change at any pixel; ASSUMED
LABEL = "Even-tone simulation: colour evened, never lightened, marks kept. " + NOTE


def even_tone(image: np.ndarray, skin: Floats, face: Frame, *, strength: float = 30.0,
              redness: float = 50.0) -> SkinResult:
    rgb = rgb_of(image)
    amount = check_strength(strength)
    if not isinstance(redness, (int, float)) or not math.isfinite(redness) or not 0 <= redness <= 100:
        raise ValueError("redness must be 0..100")
    if amount == 0:
        return SkinResult(image.copy(), np.zeros(skin.shape), LABEL, {"unchanged": True})
    lab = srgb_to_lab(rgb)
    r = radius(face.iod, TONE_RADIUS, 2)
    inside = skin >= 0.5
    weight = np.where(skin > 0, skin, 0.0)
    references = []
    for c in (1, 2):
        smooth = masked_lowpass(lab[..., c], skin, r)
        reference = float(np.median(smooth[inside]))
        deviation = smooth - reference
        pull = EVEN_SHARE * deviation
        if c == 1:
            pull = pull + REDNESS_SHARE * (redness / 100) * np.maximum(deviation, 0.0)
        lab[..., c] -= np.clip(amount * pull, -MAX_SHIFT, MAX_SHIFT) * weight
        references.append(reference)
    out, guarded = no_lighten(image, encode(image, lab, weight), weight)
    return SkinResult(out, weight, LABEL, {"reference_a": round(references[0], 3), "reference_b": round(references[1], 3),
                                           "redness": float(redness), "guarded_pixels": guarded})
