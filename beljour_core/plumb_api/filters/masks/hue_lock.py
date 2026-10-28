"""Unconditional skin-hue rotation limit for local colour-filter output.

This narrow lock is not the user-facing lightness/chroma guard. It runs on
colour-filter renders with a known face/skin mask even if the user turns the
optional guard off. It changes the hue component only in CIELAB before gamut
mapping; no whitening, chroma minimum or added warmth is introduced. Neutral
monochrome output is left neutral because its hue is not defined.

The source image is never mutated. Soft mask edges are blended in linear sRGB.
The same limit and alpha contract are mirrored in the browser. Thresholds are
ASSUMED until the frozen real-face evaluation has completed.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ...engines.core.masks import as_mask
from ..colour import space as S
from .blend import FilterMasks

U8 = NDArray[np.uint8]
HUE_MAX = 6.0
HUE_MARGIN = 1.0
MIN_CHROMA = 2.0


@dataclass(frozen=True)
class HueSource:
    """Input-only hue signature, valid for precisely one original and one mask.

    Keeps no source photo. The two short digests guard against mixing cached
    measurements between face revisions, masks or users. Never store globally.
    """

    shape: tuple[int, int, int]
    image_digest: bytes
    mask_digest: bytes
    mask_dtype: str
    alpha: NDArray[np.float64]
    selected: NDArray[np.bool_]
    chroma: NDArray[np.float64]
    hue: NDArray[np.float64]
    frozen_photo: np.ndarray | None = None
    frozen_skin: np.ndarray | None = None


def _digest(array: np.ndarray) -> bytes:
    return hashlib.blake2b(np.ascontiguousarray(array).tobytes(), digest_size=16).digest()


def _rgb(image: np.ndarray) -> U8:
    arr = np.asarray(image)
    if arr.dtype != np.uint8 or arr.ndim != 3 or arr.shape[-1] != 3:
        raise ValueError("hue lock requires uint8 RGB frames")
    return arr


def prepare_hue(before: np.ndarray, skin: np.ndarray) -> HueSource:
    """Measure original mask pixels once for repeated filters on the same face.

    Cached values cannot cross image/mask changes: clamp_hue checks their full
    signatures before using them. Missing masks are never silently substituted.
    """
    source = _rgb(before)
    plane = np.asarray(skin)
    alpha = np.minimum(1.0, 2.0 * as_mask(plane, source.shape[:2]).astype(np.float64))
    selected = alpha > 0
    if selected.any():
        lab = S.srgb_to_lab(source[selected].astype(np.float64) / 255.0)
        chroma = np.hypot(lab[:, 1], lab[:, 2])
        hue = np.degrees(np.arctan2(lab[:, 2], lab[:, 1]))
    else:
        chroma = np.empty(0, dtype=np.float64)
        hue = np.empty(0, dtype=np.float64)
    # Immutable cached arrays prevent accidental cross-recipe state changes.
    for array in (alpha, selected, chroma, hue):
        array.setflags(write=False)
    source_shape = (int(source.shape[0]), int(source.shape[1]), int(source.shape[2]))
    trusted_photo = source if _frozen_owned(source) else None
    trusted_skin = plane if _frozen_owned(plane) else None
    return HueSource(source_shape, _digest(source), _digest(plane), str(plane.dtype),
                     alpha, selected, chroma, hue, trusted_photo, trusted_skin)


def _frozen_owned(array: np.ndarray) -> bool:
    return bool(array.flags.owndata and array.base is None and not array.flags.writeable)


def face_mask(masks: FilterMasks) -> np.ndarray | None:
    """Prefer verified skin; a landmark-derived oval is a face-only fallback."""
    if masks.skin is not None:
        return masks.skin
    if masks.source == "landmarks":
        return masks.person
    return None


def clamp_hue(before: np.ndarray, styled: np.ndarray, skin: np.ndarray | None,
              reference: HueSource | None = None) -> U8:
    """Limit CIELAB hue, optionally reusing verified input-only measurements.

    Output bytes outside the mask remain exactly styled, and neither input is
    mutated. The reference is rejected if its original pixels or mask differ.
    """
    source = _rgb(before)
    look = _rgb(styled)
    if source.shape != look.shape:
        raise ValueError("hue lock requires equal RGB frames")
    if skin is None:
        if reference is not None:
            raise ValueError("hue reference needs a face/skin mask")
        return look.copy()
    if reference is None:
        reference = prepare_hue(source, skin)
    else:
        plane = np.asarray(skin)
        matched_photo = (reference.frozen_photo is source and _frozen_owned(source))
        matched_skin = (reference.frozen_skin is plane and _frozen_owned(plane))
        if (reference.shape != source.shape or reference.mask_dtype != str(plane.dtype)
                or (not matched_photo and reference.image_digest != _digest(source))
                or (not matched_skin and reference.mask_digest != _digest(plane))):
            raise ValueError("hue reference is for a different photo or skin mask")
    alpha = reference.alpha
    selected = reference.selected
    if not selected.any():
        return look.copy()
    cb = reference.chroma
    hb = reference.hue
    lab_look = S.srgb_to_lab(look[selected].astype(np.float64) / 255.0)
    ca = np.hypot(lab_look[:, 1], lab_look[:, 2])
    ha = np.degrees(np.arctan2(lab_look[:, 2], lab_look[:, 1]))
    turn = S.wrap_degrees(ha - hb)
    cap = HUE_MAX - HUE_MARGIN
    active = (cb >= MIN_CHROMA) & (ca >= MIN_CHROMA) & (np.abs(turn) > cap)
    if not active.any():
        return look.copy()
    limited = lab_look[active].copy()
    angle = np.radians(hb[active] + np.clip(turn[active], -cap, cap))
    limited[:, 1] = ca[active] * np.cos(angle)
    limited[:, 2] = ca[active] * np.sin(angle)
    corrected = S.lab_to_srgb(limited)
    raw = look[selected][active].astype(np.float64) / 255.0
    mixed = S.encode(S.decode(raw) +
                     (S.decode(corrected) - S.decode(raw)) * alpha[selected][active, None])
    out = look.copy()
    pixels = out[selected].copy()
    pixels[active] = S.unit_to_bytes(mixed)
    out[selected] = pixels
    return out
