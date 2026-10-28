"""Skin guard: a colour look may restyle the photo but may not lighten her skin or turn its hue.

Women-first brief rule 8 and filters-plan.md §1.2. The guard runs after the look, inside the
skin mask (MediaPipe Multiclass Selfie Segmenter face and body skin, or the skin region of
the 478-point mesh), on CIELAB of the photo before and the look after:

1. Spread: the skin's L* spread (mask-weighted standard deviation) after the look is held to
   75-125% of the original, so very dark skin keeps its detail and no curve crushes it
   (A4 asks 70-130%; the guard keeps a margin).
2. Lift: L* may rise by at most the look's own rise on mid-grey at that pixel, plus 1, and
   never by more than 3 (ASSUMED limits, the arena owns the final values). When the look
   darkens mid-grey, skin may rise by less than 1, or must darken with it.
3. Chroma: C*ab may not fall below 85% of the original (skipped for mono looks).
4. Hue: h_ab may turn by at most 6 degrees (skipped for mono looks and near-grey pixels).

The guard keeps a small margin under each limit (0.1 L*, 3% chroma, 2 degrees) so byte
rounding can't push a pixel over, and a fully guarded pixel whose lightness it lowered is
rounded down when rounding to nearest would land above the limit. The result is blended back over the look by twice the
mask's alpha (capped at 1): every pixel at least half inside the skin is fully guarded, and
the soft edge fades out beyond it, in linear light. Pixels outside the mask are the look,
untouched. A neutral (grey) look pixel stays exactly neutral in lightness mode, so a mono
look stays black and white under the guard. Spread statistics can be passed in, so a tiled
render uses the whole photo's numbers (web/src/filters/masks/guard.ts does the same).
Face-mapping inspiration: MediaPipe Multiclass Selfie Segmenter (skin classes) and
face-parsing.PyTorch (region-masked edits); concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ...engines.core.masks import as_mask
from ..colour import space as S

Floats = NDArray[np.float64]
U8 = NDArray[np.uint8]

LIFT_OVER_GREY = 1.0
LIFT_MAX = 3.0
CHROMA_KEEP = 0.85
HUE_TURN_MAX = 6.0
MARGIN_L, MARGIN_CHROMA, MARGIN_HUE = 0.1, 0.03, 2.0
SPREAD_RANGE = (0.75, 1.25)
HUE_MIN_CHROMA = 2.0
DEEP_SKIN_MEAN_L = 45.0
DEEP_SKIN_LIFT_CAP = 2.1
DEEP_SKIN_HUE_MARGIN = 3.0
MODES = ("full", "lightness")


@dataclass(frozen=True)
class SpreadStats:
    """Mask-weighted sums of L* before and after, over the whole photo."""
    weight: float
    before_sum: float
    before_sq: float
    after_sum: float
    after_sq: float

    @property
    def ratio(self) -> float | None:
        if self.weight <= 0:
            return None
        mb = self.before_sum / self.weight
        ma = self.after_sum / self.weight
        vb = max(0.0, self.before_sq / self.weight - mb * mb)
        va = max(0.0, self.after_sq / self.weight - ma * ma)
        if vb <= 1e-9:
            return None
        return float(np.sqrt(va / vb))

    @property
    def after_mean(self) -> float:
        return self.after_sum / self.weight if self.weight > 0 else 0.0

    def plus(self, other: SpreadStats) -> SpreadStats:
        return SpreadStats(self.weight + other.weight, self.before_sum + other.before_sum,
                           self.before_sq + other.before_sq, self.after_sum + other.after_sum,
                           self.after_sq + other.after_sq)


@dataclass(frozen=True)
class OriginalGuard:
    """Immutable original Lab and skin-weighted values, valid for one photo and mask."""

    shape: tuple[int, int, int]
    image_digest: bytes
    mask_digest: bytes
    mask_dtype: str
    lab: Floats
    weight: Floats
    alpha: Floats
    before_weight: float
    before_sum: float
    before_sq: float
    frozen_photo: np.ndarray | None = None
    frozen_skin: np.ndarray | None = None


def _digest(array: np.ndarray) -> bytes:
    return hashlib.blake2b(np.ascontiguousarray(array).tobytes(), digest_size=16).digest()


def prepare_guard(before: np.ndarray, skin: np.ndarray, *,
                  lab: Floats | None = None) -> OriginalGuard:
    """Freeze the original-side spread and Lab values before iterating recipes."""
    photo = np.asarray(before)
    plane = np.asarray(skin)
    if photo.ndim != 3 or photo.shape[-1] != 3 or photo.dtype != np.uint8:
        raise ValueError("guard reference requires an RGB uint8 photo")
    w = as_mask(plane, photo.shape[:2]).astype(np.float64)
    if lab is None:
        lab = S.srgb_to_lab(S.bytes_to_unit(photo))
    elif lab.shape != photo.shape or lab.dtype != np.float64:
        raise ValueError("prepared original Lab requires matching shape and float64 pixels")
    light = lab[..., 0]
    alpha = np.minimum(1.0, 2.0 * w)
    for array in (lab, w, alpha):
        array.setflags(write=False)
    trusted_photo = photo if _frozen_owned(photo) else None
    trusted_skin = plane if _frozen_owned(plane) else None
    return OriginalGuard((int(photo.shape[0]), int(photo.shape[1]), 3), _digest(photo),
                         _digest(plane), str(plane.dtype), lab, w, alpha, float(w.sum()),
                         float((w * light).sum()), float((w * light * light).sum()),
                         trusted_photo, trusted_skin)


def _frozen_owned(array: np.ndarray) -> bool:
    return bool(array.flags.owndata and array.base is None and not array.flags.writeable)


def _validate_original(prepared: OriginalGuard, before: np.ndarray, skin: np.ndarray) -> None:
    """Reject stale references before any cached colour data are used."""
    photo = np.asarray(before)
    plane = np.asarray(skin)
    matched_photo = prepared.frozen_photo is photo and _frozen_owned(photo)
    matched_skin = prepared.frozen_skin is plane and _frozen_owned(plane)
    if (prepared.shape != photo.shape or prepared.mask_dtype != str(plane.dtype)
            or (not matched_photo and prepared.image_digest != _digest(photo))
            or (not matched_skin and prepared.mask_digest != _digest(plane))):
        raise ValueError("guard reference belongs to another photo or mask")


EMPTY = SpreadStats(0.0, 0.0, 0.0, 0.0, 0.0)


def spread_stats(before: np.ndarray, look: np.ndarray, skin: np.ndarray) -> SpreadStats:
    """Sums for the spread rule over one block (bytes in, mask alpha as weights)."""
    w = as_mask(skin, np.asarray(before).shape[:2]).astype(np.float64)
    if not w.any():
        return EMPTY
    lb = S.srgb_to_lab(S.bytes_to_unit(before))[..., 0]
    la = S.srgb_to_lab(S.bytes_to_unit(look))[..., 0]
    return SpreadStats(float(w.sum()), float((w * lb).sum()), float((w * lb * lb).sum()),
                       float((w * la).sum()), float((w * la * la).sum()))


def spread_scale(stats: SpreadStats) -> float:
    """Factor applied to deviations of L* from the skin mean (1.0 when inside the range)."""
    ratio = stats.ratio
    if ratio is None or ratio <= 0:
        return 1.0
    lo, hi = SPREAD_RANGE
    target = min(hi, max(lo, ratio))
    return target / ratio


def grey_rise(grey_look: np.ndarray) -> Floats:
    """How much the look lifts mid-grey L* at each pixel (the look applied to a mid-grey photo)."""
    grey = np.full(np.asarray(grey_look).shape[:2] + (3,), S.MID_GREY_BYTE / 255.0)
    return S.srgb_to_lab(S.bytes_to_unit(grey_look))[..., 0] - S.srgb_to_lab(grey)[..., 0]


def _guard_prepared(look: U8, alpha: Floats, rise: np.ndarray, mode: str,
                    original: OriginalGuard, stats: SpreadStats | None) -> U8:
    """Apply the identical guard equations only where a face mask has coverage.

    Original-side Lab is frozen; after-side spread still sums the full photo
    using the same reduction order as the ordinary renderer for exact parity.
    """
    lab_a = S.srgb_to_lab(S.bytes_to_unit(look))
    if stats is None:
        la = lab_a[..., 0]
        w = original.weight
        stats = SpreadStats(original.before_weight, original.before_sum, original.before_sq,
                            float((w * la).sum()), float((w * la * la).sum()))
    selected = alpha > 0
    lb = original.lab[selected]
    la = lab_a[selected]
    light = la[:, 0]
    k = spread_scale(stats)
    if k != 1.0:
        light = stats.after_mean + (light - stats.after_mean) * k
    allowed = np.minimum(np.asarray(rise, dtype=np.float64)[selected] + LIFT_OVER_GREY,
                         LIFT_MAX) - MARGIN_L
    deep = stats.weight > 0 and stats.before_sum / stats.weight < DEEP_SKIN_MEAN_L
    if deep:
        allowed = np.minimum(allowed, DEEP_SKIN_LIFT_CAP)
    light = np.minimum(light, lb[:, 0] + allowed)
    adjusted = np.stack([light, la[:, 1], la[:, 2]], axis=-1)
    if mode == "full":
        cb = np.hypot(lb[:, 1], lb[:, 2])
        ca = np.hypot(la[:, 1], la[:, 2])
        hb = np.degrees(np.arctan2(lb[:, 2], lb[:, 1]))
        ha = np.degrees(np.arctan2(la[:, 2], la[:, 1]))
        turn = S.wrap_degrees(ha - hb)
        cap = HUE_TURN_MAX - (DEEP_SKIN_HUE_MARGIN if deep else MARGIN_HUE)
        limited = np.where(cb >= HUE_MIN_CHROMA, np.clip(turn, -cap, cap), turn)
        hue = np.radians(hb + limited)
        chroma = np.maximum(ca, (CHROMA_KEEP + MARGIN_CHROMA) * cb)
        adjusted[:, 1] = chroma * np.cos(hue)
        adjusted[:, 2] = chroma * np.sin(hue)
    guarded = S.lab_to_srgb(adjusted)
    visible = look[selected]
    if mode == "lightness":
        grey = (visible[:, 0] == visible[:, 1]) & (visible[:, 1] == visible[:, 2])
        level = S.encode(S.luminance(S.decode(guarded)))
        guarded = np.where(grey[:, None], level[:, None], guarded)
    lin_look = S.decode(visible.astype(np.float64) / 255.0)
    lin_guard = S.decode(guarded)
    unit = S.clamp01(S.encode(lin_look +
                              (lin_guard - lin_look) * alpha[selected, None]))
    nearest = S.unit_to_bytes(unit)
    lowered = (alpha[selected] == 1.0) & (light < la[:, 0] - 1e-9)
    if np.any(lowered):
        over = S.srgb_to_lab(nearest.astype(np.float64) / 255.0)[:, 0] > light + 1e-9
        down = np.floor(unit * 255.0 + 1e-9).astype(np.uint8)
        nearest = np.where((lowered & over)[:, None], down, nearest)
    out = look.copy()
    out[selected] = nearest
    return out


def guard(before: np.ndarray, look: np.ndarray, skin: np.ndarray, rise: np.ndarray, *,
          mode: str = "full", stats: SpreadStats | None = None,
          original: OriginalGuard | None = None) -> U8:
    """The look with its skin pixels pulled back inside the limits; bytes in, bytes out."""
    if mode not in MODES:
        raise ValueError(f"guard mode must be one of {MODES}")
    b8, a8 = np.asarray(before), np.asarray(look)
    if b8.shape != a8.shape or b8.dtype != np.uint8 or a8.dtype != np.uint8:
        raise ValueError("guard needs two uint8 images of one size")
    if original is not None:
        _validate_original(original, b8, skin)
        if not original.alpha.any():
            return a8[..., :3].copy()
        return _guard_prepared(a8, original.alpha, rise, mode, original, stats)
    alpha = np.minimum(1.0, 2.0 * as_mask(skin, b8.shape[:2]).astype(np.float64))
    if not alpha.any():
        return a8[..., :3].copy()
    stats = stats if stats is not None else spread_stats(b8, a8, skin)
    lab_b = S.srgb_to_lab(S.bytes_to_unit(b8))
    lab_a = S.srgb_to_lab(S.bytes_to_unit(a8))
    light = lab_a[..., 0]
    k = spread_scale(stats)
    if k != 1.0:
        mean = stats.after_mean
        light = mean + (light - mean) * k
    allowed = np.minimum(np.asarray(rise, dtype=np.float64) + LIFT_OVER_GREY, LIFT_MAX) - MARGIN_L
    # On low-light/deep-skin inputs, keep an additional margin below the
    # arena's unrequested skin-lightening threshold. No demographic label is used.
    deep = stats.weight > 0 and stats.before_sum / stats.weight < DEEP_SKIN_MEAN_L
    if deep:
        allowed = np.minimum(allowed, DEEP_SKIN_LIFT_CAP)
    light = np.minimum(light, lab_b[..., 0] + allowed)
    out = np.stack([light, lab_a[..., 1], lab_a[..., 2]], axis=-1)
    if mode == "full":
        cb = np.hypot(lab_b[..., 1], lab_b[..., 2])
        ca = np.hypot(lab_a[..., 1], lab_a[..., 2])
        hb = np.degrees(np.arctan2(lab_b[..., 2], lab_b[..., 1]))
        ha = np.degrees(np.arctan2(lab_a[..., 2], lab_a[..., 1]))
        turn = S.wrap_degrees(ha - hb)
        cap = HUE_TURN_MAX - (DEEP_SKIN_HUE_MARGIN if deep else MARGIN_HUE)
        limited = np.where(cb >= HUE_MIN_CHROMA, np.clip(turn, -cap, cap), turn)
        hue = np.radians(hb + limited)
        chroma = np.maximum(ca, (CHROMA_KEEP + MARGIN_CHROMA) * cb)
        out[..., 1] = chroma * np.cos(hue)
        out[..., 2] = chroma * np.sin(hue)
    guarded = S.lab_to_srgb(out)
    if mode == "lightness":
        grey = (a8[..., 0] == a8[..., 1]) & (a8[..., 1] == a8[..., 2])
        level = S.encode(S.luminance(S.decode(guarded)))
        guarded = np.where(grey[..., None], level[..., None], guarded)
    lin_look = S.decode(S.bytes_to_unit(a8))
    lin_guard = S.decode(guarded)
    unit = S.clamp01(S.encode(lin_look + (lin_guard - lin_look) * alpha[..., None]))
    nearest = S.unit_to_bytes(unit)
    lowered = (alpha == 1.0) & (light < lab_a[..., 0] - 1e-9)
    if np.any(lowered):
        over = S.srgb_to_lab(S.bytes_to_unit(nearest))[..., 0] > light + 1e-9
        down = np.floor(unit * 255.0 + 1e-9).astype(np.uint8)
        nearest = np.where((lowered & over)[..., None], down, nearest)
    return nearest
