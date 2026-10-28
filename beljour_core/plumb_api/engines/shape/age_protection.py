"""Protect a head covering and the face boundary in age-look compositing.

Masks are supplied explicitly or made from existing face-oval landmarks.
No cloth, complexion or identity category is guessed from source colours.
Face-mapping inspiration: face-parsing.PyTorch (concept of bounded face regions).
concept only, no code copied.
Author: John Khan.
"""

from __future__ import annotations

import math

import numpy as np
from numpy.typing import NDArray

from ..core import distance, regions

Pixels = NDArray[np.uint8]


def validated_protection(mask: np.ndarray | None, height: int, width: int) -> np.ndarray | None:
    """Validate explicit covering alpha in image coordinates without threshold drift."""
    if mask is None:
        return None
    array = np.asarray(mask)
    if array.shape != (height, width) or array.dtype.kind not in "fiu":
        raise ValueError("covering mask must be a numeric H x W array")
    if not np.isfinite(array).all() or np.any(array < 0) or np.any(array > 1):
        raise ValueError("covering mask must have finite alpha in 0..1")
    return array.astype(np.float64)


def interior_alpha(
    face: np.ndarray,
    height: int,
    width: int,
    *,
    iod: float,
    protected_mask: np.ndarray | None = None,
    hair_mask: np.ndarray | None = None,
) -> np.ndarray:
    """Construct a fade wholly inside the oval with a fixed outside rim.

    The outer Q4 contour band stays unchanged: photo-only details do not move
    colour or texture across the face/background border. Explicit covering pixels
    are restored exactly; a narrow outer feather avoids new cloth-edge seams.
    """
    if not math.isfinite(iod) or iod <= 0:
        raise ValueError("face scale must be positive")
    if height < 4 or width < 4:
        raise ValueError("age image is too small")
    outline = regions.region_mask(
        "face_oval", face, height, width, normalized=False, supersample=2
    )
    thickness = distance.distance_inside(outline)
    rim = max(3.0, 0.025 * iod)
    feather = max(3.0, 0.025 * iod)
    alpha = np.clip((thickness - rim) / feather, 0.0, 1.0) * outline
    if hair_mask is not None:
        hair = validated_protection(hair_mask, height, width)
        if hair is None:
            raise ValueError("hair mask missing")
        alpha = np.maximum(alpha, hair)
    covering = validated_protection(protected_mask, height, width)
    if covering is not None:
        # Full coverage remains untouched even if a mask spans the face oval.
        alpha *= 1.0 - covering
        # Feather only outside the supplied covering. Never touch marked pixels.
        covered = covering >= 0.5
        if covered.any():
            depth = distance.distance_to(covered.astype(np.float32))
            alpha *= np.clip(depth / max(3.0, 0.025 * iod), 0.0, 1.0)
            alpha[covered] = 0.0
    return alpha


def compose_protected(
    original: Pixels,
    edited: Pixels,
    face: np.ndarray,
    *,
    iod: float,
    protected_mask: np.ndarray | None = None,
    hair_mask: np.ndarray | None = None,
) -> Pixels:
    """Blend RGB with nearest-byte rounding; preserve source transparency."""
    if original.shape != edited.shape or original.ndim != 3:
        raise ValueError("age source/output shapes must match")
    if original.dtype != np.uint8 or edited.dtype != np.uint8 or original.shape[2] not in (3, 4):
        raise ValueError("age source/output must be uint8 RGB or RGBA")
    h, w = original.shape[:2]
    alpha = interior_alpha(
        face, h, w, iod=iod, protected_mask=protected_mask, hair_mask=hair_mask
    )
    result = original.copy()
    source_rgb = original[:, :, :3].astype(np.float64)
    edited_rgb = edited[:, :, :3].astype(np.float64)
    mixed = source_rgb + (edited_rgb - source_rgb) * alpha[:, :, None]
    result[:, :, :3] = np.uint8(np.rint(np.clip(mixed, 0, 255)))
    return result
