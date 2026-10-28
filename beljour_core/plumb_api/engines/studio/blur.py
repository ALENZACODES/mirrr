"""Background blur from her person area: a portrait look without a depth model.

The refined matte (matte.refine) splits the photo. The background is blurred only from
background pixels (a mask-weighted blur), so her colours never smear into it and the area
behind her is filled from the wall around her rather than from her outline; she is then
laid back on top through the soft matte. Strength sets the blur radius, up to BLUR_MAX of
the short side. This is a lens-blur look, not a depth measurement: everything that is not
her is blurred equally. web/src/engines/studio/blur.ts mirrors this file. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

from .common import StudioResult, changed_share, finish, person_mask, photo, radius_for, strength, weighted_blur
from .matte import foreground, refine

BLUR_MAX = 1 / 20     # largest radius, share of the short side (ASSUMED: a strong but not smeared portrait look)
LABEL = "Background blurred from your person area (no depth measurement). You are unchanged."


def background_blur(image: Any, coarse: Any, amount: float = 60) -> StudioResult:
    rgb, alpha_in = photo(image)
    h, w = rgb.shape[:2]
    share = strength(amount)
    mask = person_mask(coarse, h, w)
    if share == 0:
        return StudioResult(image.copy(), LABEL, {"tool": "blur", "radius_px": 0, "no_op": True})
    alpha, metrics = refine(rgb, mask)
    radius = radius_for(w, h, BLUR_MAX * share)
    back = weighted_blur(rgb, 1 - alpha, radius)
    out = alpha[..., None] * foreground(rgb, alpha) + (1 - alpha[..., None]) * back
    image_out = finish(out, alpha_in)
    inside = (alpha >= 0.999).astype(float)
    return StudioResult(image_out, LABEL, {**metrics, "tool": "blur", "radius_px": radius,
                                           "person_changed_share": changed_share(rgb, image_out, inside)})
