"""Protect skin, Background only, and where a filter's masks come from.

* Protect skin (toggle P): her skin keeps the original pixels; the look applies elsewhere.
* Background only (toggle BG): the whole person keeps the original pixels.

Both are one keep-mask (the larger of the two that are on), blended in linear light:
out = look + (original - look) * keep. With a hard mask the kept pixels are bit-identical,
so Protect skin holds ΔE2000 <= 2 inside the skin by construction (FX1 acceptance).

Mask sources, best first: the segmenter's skin and person classes (MediaPipe Multiclass
Selfie Segmenter, once its weights are pinned), then the 478-point mesh (skin region, and
the face oval standing in for the person, labelled), then none. With no skin mask the look
runs at a capped strength and without skin-hue ops (the engine's fallback, §2.1).
Face-mapping inspiration: MediaPipe Face Landmarker (mesh regions) and MediaPipe Multiclass
Selfie Segmenter (person and skin classes); concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ...engines.core import regions
from ...engines.core.masks import as_mask
from ..colour import space as S

Floats = NDArray[np.float64]
U8 = NDArray[np.uint8]
SOURCES = ("segmenter", "landmarks", "none")


@dataclass(frozen=True)
class FilterMasks:
    """Masks a filter may use; None means unknown for this photo."""
    skin: Floats | None = None
    person: Floats | None = None
    source: str = "none"
    note: str = ""

    def __post_init__(self) -> None:
        if self.source not in SOURCES:
            raise ValueError(f"mask source must be one of {SOURCES}")


NO_MASKS = FilterMasks()


def validate_filter_masks(masks: FilterMasks, shape: tuple[int, int]) -> None:
    """Validate both input masks before rendering, including a neutral look.

    Protection must fail closed for malformed externally supplied masks, even
    when the optional skin guard is off. Checking before the neutral fast path
    keeps Python and browser rendering behavior consistent. No alpha is altered.
    """
    height, width = shape
    if height <= 0 or width <= 0:
        raise ValueError("filters require positive image dimensions")
    for label, plane in (("skin", masks.skin), ("person", masks.person)):
        if plane is None:
            continue
        mask = np.asarray(plane)
        if mask.shape != shape or mask.dtype.kind not in "fibu":
            raise ValueError(f"filter {label} mask must match image and be numeric")
        if not np.isfinite(mask).all() or np.any(mask < 0) or np.any(mask > 1):
            raise ValueError(f"filter {label} mask alpha must be finite in 0..1")


def from_landmarks(points: np.ndarray, height: int, width: int) -> FilterMasks:
    """Skin from the mesh's skin region; the face oval stands in for the person (face only)."""
    pts = np.asarray(points, dtype=np.float64)[:, :2]
    skin = regions.region_mask("skin", pts, height, width, normalized=False, supersample=2)
    oval = regions.region_mask("face_oval", pts, height, width, normalized=False, supersample=2)
    return FilterMasks(skin.astype(np.float64), oval.astype(np.float64), "landmarks",
                       "Background only keeps the face as you see it; hair and body take the look (no person outline yet).")


def keep_mask(masks: FilterMasks, *, protect_skin: bool, background_only: bool,
              shape: tuple[int, int]) -> Floats | None:
    """Twice the mask alpha, capped at 1 (as the guard): a pixel at least half inside is kept
    whole, and the soft edge falls outside the mask."""
    keep: Floats | None = None
    if protect_skin and masks.skin is not None:
        keep = np.minimum(1.0, 2.0 * as_mask(masks.skin, shape).astype(np.float64))
    if background_only and masks.person is not None:
        person = np.minimum(1.0, 2.0 * as_mask(masks.person, shape).astype(np.float64))
        keep = person if keep is None else np.maximum(keep, person)
    return keep


def keep_original(original: np.ndarray, look: np.ndarray, keep: np.ndarray | None) -> U8:
    """look where keep = 0, the original where keep = 1, mixed in linear light between."""
    o8, l8 = np.asarray(original)[..., :3], np.asarray(look)[..., :3]
    if keep is None:
        return l8.copy()
    k = np.asarray(keep, dtype=np.float64)
    hard = (k == 1.0)[..., None]
    lo, ll = S.decode(S.bytes_to_unit(o8)), S.decode(S.bytes_to_unit(l8))
    mixed = S.unit_to_bytes(S.encode(ll + (lo - ll) * k[..., None]))
    return np.where(hard, o8, mixed).astype(np.uint8)
