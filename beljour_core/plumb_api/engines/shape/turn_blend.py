"""R12 visible-face turn support, without colour or semantic skin thresholds.

A backward warp fades inside the visible oval, leaving an unchanged outer rim.
Optional occluder masks are geometric protection supplied by the caller: hair,
glasses, a hijab or a hand are all treated identically. No face pixels are generated.
The source sampling footprint is limited too, so a nearby protected pixel cannot
be dragged into the editable surface. A final full-resolution Jacobian check must
run after this weighting; a triangle check alone cannot prove this field safe.

Face-mapping inspiration: 3DDFA_V2 (visible projected surface), DECA (local head
pose), and face-parsing.PyTorch (separate occluder regions); concept only, no code
copied. MediaPipe supplies the existing landmark contour indices (Bucket A).
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from ..core.distance import distance_inside, distance_to
from ..core.masks import as_mask
from ..core.regions import region_mask
from ..warp import field as fields
from ..warp.falloff import curve
from .geometry import check_face, frame

PRESERVED_RIM_PX = 3.0
MIN_BLEND_PX = 4.0
BLEND_IOD_SHARE = 0.18
SOURCE_CLEARANCE_SHARE = 0.45


@dataclass(frozen=True)
class TurnSupport:
    oval: np.ndarray
    weights: np.ndarray
    protected: np.ndarray
    clearance: np.ndarray
    rim_px: float
    blend_px: float


def support(height: int, width: int, points: object, *, protected_mask: object | None = None,
            blend_px: float | None = None, rim_px: float = PRESERVED_RIM_PX) -> TurnSupport:
    """Support for a small turn, unchanged on the oval rim and protected objects.

    `blend_px` controls the inward transition width, never the permitted extent.
    The outer rim accounts for the bilinear sampler and the Q4 gradient stencil.
    At the image border, frame padding is explicitly outside: a cropped face must
    not be treated as infinitely far from its visible boundary.
    """
    face = check_face(points)
    if not isinstance(height, (int, np.integer)) or not isinstance(width, (int, np.integer)) or min(height, width) < 2:
        raise ValueError("turn support needs image dimensions at least 2")
    if not math.isfinite(rim_px) or rim_px < PRESERVED_RIM_PX:
        raise ValueError("turn rim must preserve at least 3 pixels")
    f = frame(face)
    ramp = max(MIN_BLEND_PX, BLEND_IOD_SHARE * f.iod) if blend_px is None else float(blend_px)
    if not math.isfinite(ramp) or ramp < MIN_BLEND_PX:
        raise ValueError("turn blend must be finite and at least 4 pixels")
    oval = region_mask("face_oval", face, height, width, normalized=False, supersample=2)
    inner = np.pad((oval >= 0.5).astype(np.float32), 1)
    depth = distance_inside(inner)[1:-1, 1:-1]
    protection = np.zeros((height, width), dtype=np.float32)
    if protected_mask is not None:
        protection = as_mask(np.asarray(protected_mask), (height, width)).copy()
    # Any nonzero protection alpha is protected: a partially covered frame edge
    # still belongs to the object, not to the face deformation beneath it.
    locked = (protection > 0).astype(np.float32)
    object_distance = distance_to(locked)
    clearance = np.minimum(depth, object_distance)
    # The no-occluder EDT has infinite distance. If the oval also fills the
    # crop, there is no measured safe interior: leave those pixels untouched.
    clearance = np.where(np.isfinite(clearance), clearance, 0.0)
    t = (clearance - rim_px) / ramp
    weights = np.asarray(curve(t), dtype=np.float64)
    weights[~np.isfinite(weights)] = 0.0
    weights[oval < 0.5] = 0
    weights[locked > 0] = 0
    return TurnSupport(oval, weights, protection, clearance, rim_px, ramp)


def with_blend(masks: TurnSupport, blend_px: float) -> TurnSupport:
    """The same support with another inward ramp, reusing the distance maps."""
    ramp = float(blend_px)
    if not math.isfinite(ramp) or ramp < MIN_BLEND_PX:
        raise ValueError("turn blend must be finite and at least 4 pixels")
    weights = np.asarray(curve((masks.clearance - masks.rim_px) / ramp), dtype=np.float64)
    weights[~np.isfinite(weights)] = 0.0
    weights[masks.oval < 0.5] = 0
    weights[masks.protected > 0] = 0
    return TurnSupport(masks.oval, weights, masks.protected, masks.clearance, masks.rim_px, ramp)


def protect_field(field: fields.Field, masks: TurnSupport) -> fields.Field:
    """Bound destination displacement and source footprint before the final guard."""
    if masks.weights.shape != field.map_x.shape:
        raise ValueError("turn support does not match the field")
    desired = fields.weighted(field, masks.weights)
    dx, dy = desired.displacement()
    distance = np.hypot(dx, dy)
    # Leave a full bilinear footprint between every sample and the nearest hard
    # boundary. Scaling the vector, rather than clamping X/Y separately, keeps
    # its direction and avoids a corner kink in the displacement field.
    limit = SOURCE_CLEARANCE_SHARE * np.maximum(masks.clearance - 2.0, 0.0)
    fraction = np.minimum(1.0, limit / np.maximum(distance, 1e-12))
    fraction[~np.isfinite(fraction)] = 1.0
    return fields.weighted(desired, fraction)


def applied_targets(before: np.ndarray, proposed: np.ndarray, masks: TurnSupport,
                    strength: float) -> np.ndarray:
    """Document the requested landmark motion after spatial and scalar attenuation.

    These are control estimates, not a re-detected mesh. The returned final field
    is authoritative for resampling and full-resolution Jacobian checks.
    """
    a, b = check_face(before), check_face(proposed)
    if not math.isfinite(strength) or not 0 <= strength <= 1:
        raise ValueError("turn strength must be finite and in [0, 1]")
    weights = fields.sample_plane(masks.weights, a[:, 0], a[:, 1])
    return a + (b - a) * weights[:, None] * strength
