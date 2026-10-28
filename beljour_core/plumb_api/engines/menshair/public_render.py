"""Strict, mask-limited public renderer for original short-sides concepts.

Not a haircut predictor. No YouCam call, new strands, or guessed face geometry.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Any, Literal

import numpy as np
from numpy.typing import NDArray

from ...commerce.strength import DEFAULT_LOCK, to_legacy, validate_level
from ..concealer.cover import CoverGuard, DefaultCoverGuard
from .render import HairAnchors, render_style, require_preset

U8 = NDArray[np.uint8]
RefusalCode = Literal["no_mesh", "invalid_image", "invalid_mask", "invalid_primary_face"]
LABEL = "Local short-sides tonal simulation. A haircut result is not predicted."


@dataclass(frozen=True)
class RenderRefusal:
    code: RefusalCode
    reason: str
    rendered: bool = False


@dataclass(frozen=True)
class StyleRender:
    image: U8
    style_id: str
    level: float
    changed_pixel_share: float
    side_reveal_share: float
    affected_pixels: int
    mask_pixels: int
    identity_similarity: float
    identity_blended: bool
    rendered: bool = True
    simulated: bool = True
    provider_calls: int = 0
    label: str = LABEL

    def public(self) -> dict[str, Any]:
        return {"rendered": True, "style_id": self.style_id, "level": self.level,
                "changed_pixel_share": self.changed_pixel_share, "side_reveal_share": self.side_reveal_share,
                "affected_pixels": self.affected_pixels, "mask_pixels": self.mask_pixels,
                "identity_guard": {"applied": True, "similarity": self.identity_similarity,
                                   "blended": self.identity_blended, "engine": "pixel_proxy"},
                "simulated": True, "provider_calls": 0, "label": self.label}


def _clipped_mask(mask: object, height: int, width: int,
                  box: tuple[int, int, int, int] | None) -> U8 | None:
    values = np.asarray(mask)
    if values.shape != (height, width) or values.dtype not in (np.bool_, np.uint8, np.float32, np.float64):
        return None
    if values.dtype == np.uint8:
        opacity = values.copy()
    else:
        if not np.all(np.isfinite(values)) or bool(np.any(values < 0)) or bool(np.any(values > 1)):
            return None
        opacity = np.floor(values.astype(np.float64) * 255.0 + 0.5).astype(np.uint8)
    if box is not None:
        x0, y0, x1, y1 = box
        allowed = np.zeros((height, width), dtype=bool)
        allowed[y0:y1, x0:x1] = True
        opacity[~allowed] = 0
    return opacity


def render_style_for_face(image: object, hair_mask: object, landmarks: HairAnchors | None,
                          style_id: str, level: object = 3.0, *,
                          primary_box: tuple[int, int, int, int] | None = None,
                          scalp_rgb: tuple[int, int, int] = (132, 99, 83),
                          guard: CoverGuard | None = None,
                          lock_level: object = DEFAULT_LOCK) -> StyleRender | RenderRefusal:
    """Return rendered pixels and evidence, or explicit no-mesh/invalid-region refusal.

    Strength 1.0 -> original, 5.0 -> existing maximum 100 legacy guide strength.
    A supplied primary face box clips independently provided hair evidence;
    other people in the image cannot be edited by this method.
    """
    amount = validate_level(level)
    locked = validate_level(lock_level)
    if not isinstance(landmarks, HairAnchors):
        return RenderRefusal("no_mesh", "No primary-face landmarks supplied")
    try:
        landmarks.validate()
    except ValueError:
        return RenderRefusal("no_mesh", "Invalid primary-face landmarks")
    image_data = np.asarray(image)
    if (image_data.ndim != 3 or image_data.dtype != np.uint8 or image_data.shape[2] not in (3, 4) or
            image_data.shape[0] < 8 or image_data.shape[1] < 8 or
            image_data.shape[0] * image_data.shape[1] > 4_500_000):
        return RenderRefusal("invalid_image", "Expected a bounded RGB or RGBA photo")
    height, width = image_data.shape[:2]
    if primary_box is not None and (len(primary_box) != 4 or
            any(type(c) is not int for c in primary_box) or
            not 0 <= primary_box[0] < primary_box[2] <= width or
            not 0 <= primary_box[1] < primary_box[3] <= height):
        return RenderRefusal("invalid_primary_face", "Invalid primary face box")
    clipped = _clipped_mask(hair_mask, height, width, primary_box)
    if clipped is None or not np.any(clipped):
        return RenderRefusal("invalid_mask", "No usable hair region on the primary face")
    # This lookup validates the ID and reuses the existing canonical, reviewed recipe.
    original_recipe = require_preset(style_id)
    updated_recipe = replace(original_recipe, strength=to_legacy(amount))
    render, _evidence = render_style(image_data, clipped, landmarks, updated_recipe, scalp_rgb=scalp_rgb)
    decision = (DefaultCoverGuard() if guard is None else guard).guard(image_data.copy(), render.copy(), locked)
    if (decision.image.dtype != np.uint8 or decision.image.shape != image_data.shape or
            not np.isfinite(decision.similarity) or not 0 <= decision.similarity <= 1):
        raise ValueError("Identity guard returned invalid image or similarity")
    # Hard spatial boundary survives even an injected guard that edits unrelated pixels.
    protected = image_data.copy()
    covered = clipped > 0
    protected[..., :3][covered] = decision.image[..., :3][covered]
    changed = np.any(protected[..., :3] != image_data[..., :3], axis=-1)
    count = int(changed.sum())
    nmask = int(covered.sum())
    return StyleRender(protected, style_id, amount, count / (height * width),
                       count / nmask, count, nmask, decision.similarity, decision.blended)
