"""Shared, cheek-audited W6 entry for both local application and quality gates.

Neutral reference wins; an eligible, sufficiently consistent background is a
labelled grey-world estimate, not a verified colour card. No shade threshold,
reference name, or brighter-shade constraint is changed. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..core import regions
from .finder import ShadeResult, find_reliable_shade
from .reading import PatchAudit

BoolMask = NDArray[np.bool_]


@dataclass(frozen=True)
class BackgroundEvidence:
    mask: BoolMask | None
    candidate_pixels: int
    usable_pixels: int
    reason: str
    estimated: bool

    def public(self) -> dict[str, Any]:
        return {
            "candidate_pixels": self.candidate_pixels,
            "usable_pixels": self.usable_pixels,
            "reason": self.reason,
            "estimated": self.estimated,
        }


def _image(image: object) -> NDArray[np.uint8]:
    arr = np.asarray(image)
    if arr.dtype != np.uint8 or arr.ndim != 3 or arr.shape[-1] not in (3, 4):
        raise ValueError("Shade measurement requires uint8 RGB or RGBA")
    if min(arr.shape[:2]) < 16 or arr.shape[0] * arr.shape[1] > 24_000_000:
        raise ValueError("Shade measurement dimensions are unsupported")
    return arr


def _mesh(points: object, height: int, width: int) -> NDArray[np.float64]:
    mesh = np.asarray(points, dtype=np.float64)
    if (mesh.ndim != 2 or mesh.shape[0] < 478 or mesh.shape[1] < 2
            or not np.all(np.isfinite(mesh[:, :2]))):
        raise ValueError("Shade measurement requires a finite 478-point mesh")
    xy = mesh[:, :2]
    if (np.any(xy[:, 0] < 0) or np.any(xy[:, 0] > width)
            or np.any(xy[:, 1] < 0) or np.any(xy[:, 1] > height)):
        raise ValueError("Shade mesh must use image pixel coordinates")
    return xy


def background_from_face(image: object, points: object) -> BackgroundEvidence:
    """Exclude the entire observed face, scalp, and hair band from WB candidates.

    The exclusion is deliberately conservative: an almost full-frame or cropped
    face produces no estimate. Background texture/colour variability is checked
    before the region can act as a surrogate neutral surface.
    """
    photo = _image(image)
    height, width = photo.shape[:2]
    mesh = _mesh(points, height, width)
    outline = mesh[list(regions.FACE_OVAL)]
    x0 = float(np.min(outline[:, 0]))
    x1 = float(np.max(outline[:, 0]))
    y0 = float(np.min(outline[:, 1]))
    y1 = float(np.max(outline[:, 1]))
    face_w = x1 - x0
    face_h = y1 - y0
    if face_w < 12 or face_h < 16:
        return BackgroundEvidence(None, 0, 0, "face_too_small", False)
    # The extra upper exclusion protects hair and the forehead above the oval.
    xlow = max(0, int(np.floor(x0 - 0.25 * face_w)))
    xhigh = min(width, int(np.ceil(x1 + 0.25 * face_w)))
    ylow = max(0, int(np.floor(y0 - 0.65 * face_h)))
    yhigh = min(height, int(np.ceil(y1 + 0.15 * face_h)))
    mask = np.ones((height, width), dtype=np.bool_)
    mask[ylow:yhigh, xlow:xhigh] = False
    if photo.shape[2] == 4:
        mask &= photo[..., 3] > 245
    rgb = photo[..., :3]
    mask &= np.all(rgb >= 8, axis=2) & np.all(rgb <= 247, axis=2)
    candidate_count = int(np.count_nonzero(mask))
    # Grey-world estimates require substantial independent image context.
    minimum = max(64, int(0.045 * height * width))
    if candidate_count < minimum:
        return BackgroundEvidence(None, candidate_count, 0, "background_not_visible", False)
    pixels = rgb[mask].astype(np.float64)
    median = np.median(pixels, axis=0)
    errors = np.max(np.abs(pixels - median), axis=1)
    coherent = errors <= 20.0
    # Uniform patches are trustworthy enough to estimate a colour cast, but a
    # colourful/variegated background cannot supply a confident white balance.
    count = int(np.count_nonzero(coherent))
    if count < minimum or count / candidate_count < 0.72:
        return BackgroundEvidence(None, candidate_count, count, "background_mixed", False)
    good = mask.copy()
    good[mask] = coherent
    return BackgroundEvidence(good, candidate_count, count, "grey_world_estimate", True)


def measure_shade_with_audit(
    image: object,
    points: object,
    *,
    neutral_mask: object | None = None,
    background_mask: object | None = None,
) -> tuple[ShadeResult, PatchAudit, BackgroundEvidence]:
    """One canonical source of cosmetic reading, including the refusal reason.

    This deliberately retains the audited cheek sampling, the extended in-house
    references, the committed maximum colour distance and the no-lightening rule.
    """
    photo = _image(image)
    mesh = _mesh(points, photo.shape[0], photo.shape[1])
    background = BackgroundEvidence(None, 0, 0, "explicit_background", False)
    chosen_background = background_mask
    if background_mask is None and neutral_mask is None:
        background = background_from_face(photo, mesh)
        chosen_background = background.mask
    reading, audit = find_reliable_shade(
        photo,
        mesh,
        neutral_mask=neutral_mask,
        background_mask=chosen_background,
    )
    return reading, audit, background


def measure_shade(
    image: object,
    points: object,
    *,
    neutral_mask: object | None = None,
    background_mask: object | None = None,
) -> ShadeResult:
    """Public W6 entry to be used by the application and real-face checker."""
    reading, _, _ = measure_shade_with_audit(
        image,
        points,
        neutral_mask=neutral_mask,
        background_mask=background_mask,
    )
    return reading
