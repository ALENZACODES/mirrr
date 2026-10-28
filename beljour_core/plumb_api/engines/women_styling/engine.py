"""Local, masked display-colour engine shared by R20c women's features.

The engine never discovers a mask, never sends an image or requests a vendor
model, never edits alpha, and never modifies its caller-owned buffers. Each
output includes a bounded, reproducible evidence report. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .geometry import (
    ByteArray,
    FloatArray,
    authorized_support,
    checked_frame,
    checked_masks,
    local_mean,
    spatial_field,
)
from .operations import Layer, layers_for
from .requests import PreviewRequest
from .specs import FeatureSpec


@dataclass(frozen=True, slots=True)
class PreviewEvidence:
    feature_id: str
    mask_support_pixels: int
    changed_pixels: int
    outside_mask_changed: int
    changed_alpha_pixels: int
    largest_channel_delta: int
    provider_calls: int
    simulated: bool
    valid_mask: bool
    source_preserved: bool
    disclosure: str


@dataclass(frozen=True, slots=True)
class PreviewResult:
    pixels: ByteArray
    evidence: PreviewEvidence


def _layer_target(rgb: FloatArray, blur: FloatArray, layer: Layer, width: int, height: int, *, origin_y: int = 0) -> FloatArray:
    """All target operators are finite, deterministic, bounded before quantizing."""
    if layer.kind == "tint":
        target = np.empty_like(rgb)
        target[...] = layer.color
        return target
    if layer.kind == "blur":
        return blur
    if layer.kind == "light":
        return rgb + np.asarray(layer.color, dtype=np.float64)
    if layer.kind == "shadow":
        return rgb - np.asarray(layer.color, dtype=np.float64)
    if layer.kind == "cream":
        return rgb * 0.86 + blur * 0.14 + np.asarray((3, 2, 1), dtype=np.float64)
    if layer.kind == "powder":
        return rgb * 0.70 + blur * 0.30 - 3.0
    if layer.kind == "matte":
        return rgb * 0.75 + blur * 0.25 - 3.0
    if layer.kind == "dewy":
        return rgb + np.asarray((8, 7, 6), dtype=np.float64)
    if layer.kind == "colour_shift":
        return rgb - np.asarray(layer.color, dtype=np.float64)
    if layer.kind == "grain":
        yy, xx = np.mgrid[:height, :width]
        grain = ((xx * 17 + (yy + origin_y) * 29) % 7 - 3).astype(np.float64)
        return rgb + grain[..., None]
    if layer.kind == "strands":
        yy, xx = np.mgrid[:height, :width]
        stripe = ((xx * 13 + (yy + origin_y) * 3) % 17 < 4).astype(np.float64)
        accent = (stripe * 2.0 - 0.6)[..., None]
        return rgb * 0.87 + np.asarray(layer.color, dtype=np.float64) * 0.13 + accent * 5.0
    if layer.kind == "fibres":
        yy, xx = np.mgrid[:height, :width]
        seed = (xx * 47 + (yy + origin_y) * 89 + xx * (yy + origin_y) * 7) % 127
        fleck = np.where(seed < 29, 0.50, 0.06)[..., None]
        tone = np.asarray(layer.color, dtype=np.float64)
        return rgb + (tone - rgb) * fleck
    if layer.kind == "gloss":
        yy, xx = np.mgrid[:height, :width]
        shine = ((xx * 7 + (yy + origin_y) * 5) % 19 < 7).astype(np.float64)
        luminance = rgb / 255.0
        gain = shine[..., None] * (2.0 + 6.0 * (1.0 - luminance))
        return rgb + np.asarray(layer.color, dtype=np.float64) + gain
    raise ValueError(f"Unsupported layer operation {layer.kind!r}")


def apply_preview(
    image: NDArray[np.uint8],
    region_masks: Mapping[str, object],
    request: PreviewRequest,
    *, _origin_y: int = 0, _full_height: int | None = None,
) -> PreviewResult:
    """Render one explicitly masked local simulation, no network or persistence.

    ``request.strength=0`` is identity, but valid nonempty masks are still
    required to prevent upstream fallback to unrestricted whole-face edits.
    Mask values are 0..255 opacity; a zero-valued mask pixel has exactly zero
    impact on RGB or alpha. Clipping is relative to the original frame.
    """
    spec: FeatureSpec = request.validate()
    frame = checked_frame(image)
    masks = checked_masks(region_masks, frame, spec)
    support = authorized_support(masks, spec)
    height, width, channels = frame.shape
    original: FloatArray = frame[..., :3].astype(np.float64)
    values: FloatArray = original.copy()
    if request.strength != 0:
        blur = local_mean(frame)
        for layer in layers_for(request):
            mask = masks.get(layer.region)
            if mask is None or not np.any(mask):
                continue
            spatial = spatial_field(
                width, height, layer.placement,
                origin_y=_origin_y, full_height=_full_height,
            )
            strength = mask.astype(np.float64) / 255.0
            strength = strength * (request.strength / 100.0)
            strength = strength * (layer.opacity / 100.0)
            strength = strength * spatial
            strength = strength * (layer.scale / 100.0)
            if not np.any(strength):
                continue
            target = _layer_target(values, blur, layer, width, height, origin_y=_origin_y)
            values += (target - values) * strength[..., None]
    limit = float(spec.max_channel_delta)
    bounded = np.minimum(np.maximum(values, original - limit), original + limit)
    bounded = np.clip(bounded, 0.0, 255.0)
    result = frame.copy()
    result[..., :3] = np.floor(bounded + 0.5).astype(np.uint8)
    rgb_changed = np.any(result[..., :3] != frame[..., :3], axis=2)
    outside = int(np.count_nonzero(rgb_changed & ~support))
    changed_alpha = int(np.count_nonzero(result[..., 3] != frame[..., 3])) if channels == 4 else 0
    max_delta = int(np.max(np.abs(result[..., :3].astype(np.int16) - frame[..., :3].astype(np.int16))))
    return PreviewResult(
        pixels=result,
        evidence=PreviewEvidence(
            feature_id=spec.id,
            mask_support_pixels=int(np.count_nonzero(support)),
            changed_pixels=int(np.count_nonzero(rgb_changed)),
            outside_mask_changed=outside,
            changed_alpha_pixels=changed_alpha,
            largest_channel_delta=max_delta,
            provider_calls=0,
            simulated=True,
            valid_mask=True,
            source_preserved=not np.shares_memory(frame, result),
            disclosure="Screen-colour simulation only; not a product, treatment, or physical result prediction.",
        ),
    )
