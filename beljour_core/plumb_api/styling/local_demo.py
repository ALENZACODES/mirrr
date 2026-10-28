"""Twelve offline hairstyle demonstrations from checked primary-face geometry.

These are deterministic tonal hairstyle illustrations, not hair generation or
predictions of a barber's result. All pixels outside the returned support mask
stay byte-for-byte unchanged and the provider is never called. Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, Literal

import numpy as np
from numpy.typing import NDArray

from ..commerce.strength import DEFAULT_LOCK, validate_level
from ..engines.concealer.cover import CoverDecision, CoverGuard, DefaultCoverGuard
from ..engines.core import regions
from ..engines.menshair.public_render import RenderRefusal, render_style_for_face
from ..engines.menshair.render import HairAnchors
from .catalogue import HairStyle, catalogue

U8 = NDArray[np.uint8]
BoolMask = NDArray[np.bool_]
FloatArray = NDArray[np.float64]
RefusalCode = Literal[
    "no_mesh", "invalid_mesh", "invalid_image", "invalid_primary_face", "no_hair_region",
    "unsupported_demo_style", "guard_rejected",
]
LABEL = "Local hairstyle illustration; a real haircut result is not predicted."

# Authored links to original local algorithms. These are not provider template IDs.
MENS_LOCAL_STYLES: dict[str, str] = {
    "tpl-low-fade": "local-low-fade",
    "tpl-mid-fade-crop": "local-mid-fade",
    "tpl-textured-crop": "local-crop-low",
    "tpl-buzz": "local-buzz-2",
    "tpl-undercut": "local-undercut",
    "tpl-side-part": "local-side-part-left",
}
LOCAL_VARIATIONS = frozenset({
    "tpl-long-layers", "tpl-bob", "tpl-pixie", "tpl-curtain", "tpl-shag", "tpl-waves",
})


@dataclass(frozen=True)
class DemoRefusal:
    code: RefusalCode
    reason: str
    rendered: bool = False

    def public(self) -> dict[str, Any]:
        return {"rendered": False, "code": self.code, "reason": self.reason}


@dataclass(frozen=True)
class DemoRender:
    image: U8
    support_mask: BoolMask
    style_id: str
    level: float
    changed_pixel_share: float
    changed_pixels: int
    affected_region_pixels: int
    identity_similarity: float
    identity_blended: bool
    rendered: bool
    simulated: bool = True
    provider_calls: int = 0
    label: str = LABEL

    def public(self) -> dict[str, Any]:
        return {
            "rendered": self.rendered,
            "style_id": self.style_id,
            "strength_level": self.level,
            "changed_pixel_share": self.changed_pixel_share,
            "changed_pixels": self.changed_pixels,
            "affected_region_pixels": self.affected_region_pixels,
            "identity_lock": {
                "applied": True,
                "similarity": self.identity_similarity,
                "blended": self.identity_blended,
            },
            "simulated": self.simulated,
            "provider_calls": self.provider_calls,
            "label": self.label,
        }


def demo_catalogue() -> tuple[HairStyle, ...]:
    """Only the twelve synthetic S1 entries; no invented verified live ID."""
    return tuple(style for style in catalogue() if style.can_render_demo)


def _valid_image(image: object) -> U8 | None:
    arr = np.asarray(image)
    if (arr.dtype != np.uint8 or arr.ndim != 3 or arr.shape[2] not in (3, 4)
            or min(arr.shape[:2]) < 32 or arr.shape[0] * arr.shape[1] > 4_500_000):
        return None
    return arr


def _pixel_mesh(mesh: object, width: int, height: int) -> FloatArray | None:
    """Accept explicit pixel or normalized coordinates, never create fake landmarks."""
    if mesh is None:
        return None
    try:
        arr = np.asarray(mesh, dtype=np.float64)
    except (ValueError, TypeError):
        return None
    if (arr.ndim != 2 or arr.shape[0] < 478 or arr.shape[1] < 2
            or not np.all(np.isfinite(arr[:, :2]))):
        return None
    pts = arr[:, :2].copy()
    if np.max(pts[:, 0]) <= 1.0 and np.max(pts[:, 1]) <= 1.0:
        pts *= np.array([width, height], dtype=np.float64)
    if (np.any(pts[:, 0] < 0) or np.any(pts[:, 0] > width)
            or np.any(pts[:, 1] < 0) or np.any(pts[:, 1] > height)):
        return None
    return pts


def _primary_bounds(
    box: tuple[int, int, int, int] | None,
    height: int,
    width: int,
) -> BoolMask | None:
    allowed = np.ones((height, width), dtype=np.bool_)
    if box is None:
        return allowed
    if (not isinstance(box, tuple) or len(box) != 4
            or any(type(value) is not int for value in box)):
        return None
    x0, y0, x1, y1 = box
    if not (0 <= x0 < x1 <= width and 0 <= y0 < y1 <= height):
        return None
    allowed[:] = False
    allowed[y0:y1, x0:x1] = True
    return allowed


def _head_geometry(mesh: FloatArray) -> tuple[float, float, float, float, float] | None:
    outline = mesh[list(regions.FACE_OVAL)]
    x0 = float(np.min(outline[:, 0]))
    x1 = float(np.max(outline[:, 0]))
    y0 = float(np.min(outline[:, 1]))
    y1 = float(np.max(outline[:, 1]))
    brow = mesh[list(regions.RIGHT_BROW + regions.LEFT_BROW)]
    by = float(np.median(brow[:, 1]))
    if x1 - x0 < 12 or y1 - y0 < 20 or not y0 < by < y1:
        return None
    return (0.5 * (x0 + x1), y0, y1, 0.5 * (x1 - x0), by)


def hair_and_forehead_mask(
    image: object,
    mesh: object,
    *,
    primary_box: tuple[int, int, int, int] | None = None,
) -> BoolMask | DemoRefusal:
    """A head-local edit region from supplied geometry, not skin-colour inference.

    A rounded upper head band extends above the observed face oval and spans the
    forehead. The lower face, neck, clothing and other people are excluded.
    """
    photo = _valid_image(image)
    if photo is None:
        return DemoRefusal("invalid_image", "A bounded RGB or RGBA photo is required")
    height, width = photo.shape[:2]
    points = _pixel_mesh(mesh, width, height)
    if points is None:
        return DemoRefusal("no_mesh", "No usable primary-face mesh was supplied")
    allowed = _primary_bounds(primary_box, height, width)
    if allowed is None:
        return DemoRefusal("invalid_primary_face", "Invalid primary-face boundary")
    geometry = _head_geometry(points)
    if geometry is None:
        return DemoRefusal("invalid_mesh", "Head contour and brows are not usable")
    cx, top, bottom, half_width, brow_y = geometry
    face_height = bottom - top
    crown = max(-0.10 * face_height, top - 0.39 * face_height)
    axis = max(1.0, (brow_y + 0.1 * face_height - crown) * 0.55)
    cy = crown + axis
    yy, xx = np.mgrid[:height, :width]
    horizontal = (xx + 0.5 - cx) / max(1.0, half_width * 1.16)
    vertical = (yy + 0.5 - cy) / axis
    scalp = horizontal**2 + vertical**2 <= 1.0
    scalp &= yy + 0.5 < brow_y + 0.12 * face_height
    mask = scalp & allowed
    if photo.shape[2] == 4:
        mask &= photo[..., 3] > 0
    if np.count_nonzero(mask) < 36:
        return DemoRefusal("no_hair_region", "No visible scalp/forehead region on selected face")
    return mask


def _hair_anchors(mesh: FloatArray, width: int, height: int) -> HairAnchors | None:
    geometry = _head_geometry(mesh)
    if geometry is None:
        return None
    cx, top, bottom, half_width, _ = geometry
    height_face = bottom - top
    left = max(0.01, (cx - 0.88 * half_width) / width)
    right = min(0.99, (cx + 0.88 * half_width) / width)
    crown_y = max(0.01, (top - 0.25 * height_face) / height)
    temple_y = min(0.77, (top + 0.33 * height_face) / height)
    ear_y = min(0.90, (top + 0.53 * height_face) / height)
    nape_y = min(0.99, (top + 0.92 * height_face) / height)
    if not crown_y + 0.05 < ear_y < nape_y:
        return None
    try:
        anchors = HairAnchors(
            left_temple=(left, temple_y),
            right_temple=(right, temple_y),
            crown=(cx / width, crown_y),
            left_ear=(max(0.0, left - 0.025), ear_y),
            right_ear=(min(1.0, right + 0.025), ear_y),
            nape=(cx / width, nape_y),
        )
        anchors.validate()
    except ValueError:
        return None
    return anchors


def _editorial_tonal_edit(
    image: U8,
    support: BoolMask,
    style_id: str,
    level: float,
) -> U8:
    """Six distinct original tone/part/texture variations on one checked region."""
    height, width = image.shape[:2]
    yy, xx = np.mgrid[:height, :width]
    x = (xx + 0.5) / width
    y = (yy + 0.5) / height
    strength = (level - 1.0) / 4.0
    variants: dict[str, tuple[float, float, float, float]] = {
        "tpl-long-layers": (0.50, 1.35, 0.40, 0.00),
        "tpl-bob": (0.64, 1.10, 0.16, 0.45),
        "tpl-pixie": (1.26, 2.65, 0.65, 0.32),
        "tpl-curtain": (0.60, 1.65, 1.15, 0.86),
        "tpl-shag": (0.92, 4.10, 1.25, 0.23),
        "tpl-waves": (0.54, 3.25, 1.50, 0.00),
    }
    amount, frequency, texture, part = variants[style_id]
    directional = np.sin((frequency * x + 0.33 * y) * math.tau)
    flow = np.cos((1.8 * x - frequency * y) * math.tau)
    centre = 1.0 - np.clip(np.abs(x - 0.5) * (3.0 + 2.0 * part), 0.0, 1.0)
    part_line = np.exp(-((x - (0.5 + 0.2 * part)) / 0.018)**2)
    relief = amount * (8.0 + 2.5 * directional + texture * flow + 3.0 * centre)
    relief += 5.0 * part * part_line
    result = image.copy()
    if strength <= 0:
        return result
    src = image[..., :3].astype(np.float64)
    # A local darkening of the checked region avoids automatic skin lightening.
    delta = np.maximum(0.0, relief) * strength
    adjusted = np.clip(np.rint(src - delta[..., None]), 0.0, 255.0).astype(np.uint8)
    result[..., :3][support] = adjusted[support]
    return result


def render_demo_style(
    image: object,
    mesh: object,
    style_id: str,
    level: float = 3.0,
    *,
    primary_box: tuple[int, int, int, int] | None = None,
    lock_level: float = DEFAULT_LOCK,
    guard: CoverGuard | None = None,
) -> DemoRender | DemoRefusal:
    """Render an actual masked preview for one of twelve local consultation looks.

    ``rendered`` is true only when pixels change. All edits use the default-on
    identity proxy; its similarity is not biometric identity verification.
    """
    level = validate_level(level)
    lock_level = validate_level(lock_level)
    catalogue_rows = {row.id: row for row in demo_catalogue()}
    if style_id not in catalogue_rows:
        return DemoRefusal("unsupported_demo_style", "Style has no offline renderer")
    photo = _valid_image(image)
    if photo is None:
        return DemoRefusal("invalid_image", "A bounded RGB or RGBA photo is required")
    height, width = photo.shape[:2]
    pixels = _pixel_mesh(mesh, width, height)
    if pixels is None:
        return DemoRefusal("no_mesh", "No usable primary-face mesh was supplied")
    mask = hair_and_forehead_mask(photo, pixels, primary_box=primary_box)
    if isinstance(mask, DemoRefusal):
        return mask
    if style_id in MENS_LOCAL_STYLES:
        anchors = _hair_anchors(pixels, width, height)
        if anchors is None:
            return DemoRefusal("invalid_mesh", "Unable to locate the observed head")
        local_id = MENS_LOCAL_STYLES[style_id]
        # Pass an explicit pass-through guard to the legacy renderer: the public
        # entry applies the same one identity decision to every style below.
        candidate = render_style_for_face(
            photo,
            mask.astype(np.uint8) * 255,
            anchors,
            local_id,
            level,
            guard=_RawCandidateGuard(),
        )
        if isinstance(candidate, RenderRefusal):
            return DemoRefusal("no_hair_region", candidate.reason)
        after = candidate.image
    else:
        if style_id not in LOCAL_VARIATIONS:
            return DemoRefusal("unsupported_demo_style", "No original local recipe")
        after = _editorial_tonal_edit(photo, mask, style_id, level)
    choice = DefaultCoverGuard() if guard is None else guard
    decision = choice.guard(photo.copy(), after.copy(), lock_level)
    valid = (decision.image.dtype == np.uint8 and decision.image.shape == photo.shape
             and math.isfinite(decision.similarity) and 0 <= decision.similarity <= 1)
    if not valid:
        return DemoRefusal("guard_rejected", "Identity check returned an invalid preview")
    result = photo.copy()
    result[..., :3][mask] = decision.image[..., :3][mask]
    changed = np.any(result[..., :3] != photo[..., :3], axis=2)
    count = int(np.count_nonzero(changed))
    return DemoRender(
        image=result,
        support_mask=mask.copy(),
        style_id=style_id,
        level=level,
        changed_pixel_share=count / (height * width),
        changed_pixels=count,
        affected_region_pixels=int(np.count_nonzero(mask)),
        identity_similarity=float(decision.similarity),
        identity_blended=bool(decision.blended),
        rendered=count > 0,
    )


class _RawCandidateGuard:
    """Avoid applying the default identity decision twice on men's local paths."""

    def guard(self, before: U8, after: U8, lock_level: float) -> CoverDecision:
        return CoverDecision(after.copy(), 1.0, False)
