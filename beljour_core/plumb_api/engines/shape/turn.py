"""LS1 bounded 2.5D mesh rotation from already-recorded 478 XYZ landmarks.

This orthographic projection has no hidden-side texture and cannot synthesize ears,
hair or background. R12 fades the warp inside its visible oval and caller-protected objects.
No model download and no invented pose confidence. Roll correction is the fallback.
Face-mapping inspiration: 3DDFA_V2 (dense 3D alignment), DECA (pose separated from
shape) and FLAME (rigid head-space transform); concept only, no code copied.
Canonical landmark identity/layout: MediaPipe Face Landmarker (Bucket A runtime).
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from ..core.refusal import Refusal
from ..warp.field import Field
from .geometry import check_face, frame
from .turn_field import face_width, ramp_px, regularise_targets, relax_low_jacobian, silhouette_depth

YAW_LIMIT = 8.0
PITCH_LIMIT = 6.0
ROLL_LIMIT = 25.0
LABEL = "2.5D photo turn simulation; hidden parts of the head are not reconstructed."
VERSION = "turn-r13/1"
PIVOTS = ("nasion", "silhouette")


@dataclass(frozen=True)
class Projection:
    points: np.ndarray
    depth: np.ndarray
    yaw_degrees: float
    pitch_degrees: float
    roll_degrees: float


def check_xyz(points: object) -> np.ndarray:
    data = np.asarray(points, dtype=np.float64)
    if data.shape != (478, 3) or not np.all(np.isfinite(data)) or np.max(np.abs(data)) > 1e6:
        raise ValueError("need 478 finite [x,y,z] pixel-space points")
    check_face(data[:, :2])
    return data


def project(mesh: object, yaw: float = 0, pitch: float = 0, roll: float = 0, *,
            pivot: str = "nasion") -> Projection:
    """Orthographic small rotation. `pivot` sets the depth the head turns about.

    "nasion" (the R4-R12 default) rotates about the nose root. "silhouette" rotates
    about the median depth of the face-oval contour, as a head turning on its neck
    does; the outline then barely moves and the visible turn lives in the features.
    """
    if pivot not in PIVOTS:
        raise ValueError("pivot must be nasion or silhouette")
    src = check_xyz(mesh)
    if not all(math.isfinite(x) for x in (yaw, pitch, roll)) or abs(yaw) > YAW_LIMIT or abs(pitch) > PITCH_LIMIT or abs(roll) > ROLL_LIMIT:
        raise ValueError("LS1 supports yaw +/-8, pitch +/-6 and roll +/-25 degrees")
    f = frame(src[:, :2])
    cyaw, syaw = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    cpitch, spitch = math.cos(math.radians(pitch)), math.sin(math.radians(pitch))
    croll, sroll = math.cos(math.radians(roll)), math.sin(math.radians(roll))
    z0 = float(src[168, 2]) if pivot == "nasion" else silhouette_depth(src)
    xy = np.empty((478, 2), dtype=np.float64)
    depths = np.empty(478, dtype=np.float64)
    for i, (x, y, z) in enumerate(src):
        u = (x - f.centre[0]) * f.axis_across[0] + (y - f.centre[1]) * f.axis_across[1]
        v = (x - f.centre[0]) * f.axis_down[0] + (y - f.centre[1]) * f.axis_down[1]
        depth = max(-f.iod, min(f.iod, z - z0))
        rotated_u = u * cyaw + depth * syaw
        z_yaw = depth * cyaw - u * syaw
        rotated_v = v * cpitch - z_yaw * spitch
        z_final = v * spitch + z_yaw * cpitch
        rx, ry = rotated_u * croll - rotated_v * sroll, rotated_u * sroll + rotated_v * croll
        xy[i] = f.centre + rx * f.axis_across + ry * f.axis_down
        depths[i] = z_final + z0
    return Projection(xy, depths, yaw, pitch, roll)


def roll_from_eyes(mesh: object) -> float:
    src = check_xyz(mesh)
    eyes = src[473, :2] - src[468, :2]
    angle = math.degrees(math.atan2(float(eyes[1]), float(eyes[0])))
    return -max(-ROLL_LIMIT, min(ROLL_LIMIT, angle))


def normalized_xyz(points: object, width: int, height: int) -> np.ndarray:
    """Convert the R4 recorder's normalised x/y/z: MediaPipe z uses x-width units."""
    data = np.asarray(points, dtype=np.float64)
    if data.shape != (478, 3) or not np.all(np.isfinite(data)):
        raise ValueError("normalized face mesh needs 478 triples")
    if width < 2 or height < 2:
        raise ValueError("image size must be positive")
    out = data * np.array([width, height, width], dtype=np.float64)
    return check_xyz(out)


@dataclass(frozen=True)
class TurnOutcome:
    image: np.ndarray
    field: Field
    edit_mask: np.ndarray
    target: np.ndarray
    metrics: dict[str, float | int | bool]
    checks: dict[str, object]
    label: str = LABEL


def render_turn(image: np.ndarray, mesh: object, *, yaw: float = 0, pitch: float = 0,
                roll: float = 0, protected_mask: object | None = None,
                blend_px: float | None = None) -> TurnOutcome:
    """Render the bounded LS1 simulation with protected silhouette and occluders.

    R13 makes the field safe at full strength (see turn_field.py): silhouette pivot,
    regularised landmark targets, a turn-scaled inward ramp and per-region bisection
    of low-Jacobian areas. The global Q3 guard (> 0.2, unchanged) still runs last.
    It never relaxes Q1/Q3/Q4, extends the face oval, reconstructs hidden skin or
    claims a zero effect is a successful nonzero turn. `protected_mask` accepts
    caller masks for hair, glasses or headwear. Occluder evidence is separate from
    geometric success: Q4 on a mask without an in-image boundary is not evidence.
    """
    from ...quality.metrics import q1_outside_mask, q4_seam
    from ..warp import field as fields
    from ..warp import fold
    from ..warp import mesh as warp_mesh
    from .turn_blend import applied_targets, protect_field, support, with_blend

    photo = np.asarray(image)
    if photo.dtype != np.uint8 or photo.ndim != 3 or photo.shape[2] not in (3, 4) or min(photo.shape[:2]) < 2:
        raise ValueError("turn image must be uint8 RGB or RGBA, at least 2 by 2")
    xyz = check_xyz(mesh)
    before = xyz[:, :2]
    proposed = project(xyz, yaw, pitch, roll, pivot="silhouette").points
    h, w = photo.shape[:2]
    f = frame(before)
    masks = support(h, w, before, protected_mask=protected_mask, blend_px=blend_px)
    from .turn_pyramid import valid_weights
    if not valid_weights(masks.weights, (h, w)):
        raise ValueError("turn weights must be finite and in [0, 1]")
    if blend_px is None:
        # The ramp grows with the turn but keeps a full-weight plateau in the
        # editable surface (clearance already accounts for protected objects).
        deepest = float(np.max(masks.clearance[masks.oval >= 0.5], initial=0.0))
        masks = with_blend(masks, ramp_px(face_width(before, f.axis_across), yaw, pitch,
                                          deepest, masks.rim_px))
    if not valid_weights(masks.weights, (h, w)):
        raise ValueError("turn weights must be finite and in [0, 1]")
    requested = max(abs(yaw), abs(pitch), abs(roll))
    regions_scaled = 0
    local_min_scale = 1.0
    target_retention = 1.0
    capped_vertices = 0
    if requested == 0:
        final = fields.identity(h, w)
        mesh_strength = field_strength = 1.0
        triangle_min = 1.0
        triangle_pass = True
        spatial_retention = 1.0
        safe_targets = proposed
    else:
        report = regularise_targets(before, proposed, f.iod)
        safe_targets = report.points
        target_retention = report.retention
        capped_vertices = report.capped_vertices
        mesh_warp = warp_mesh.mesh_warp(h, w, before, safe_targets)
        protected = protect_field(mesh_warp.result.field, masks)
        relaxed = relax_low_jacobian(protected, f.iod)
        candidate = relaxed.field
        regions_scaled, local_min_scale = relaxed.regions_scaled, relaxed.min_scale
        raw_move = float(np.max(mesh_warp.result.field.move()))
        spatial_retention = float(np.max(candidate.move())) / raw_move if raw_move > 1e-12 else 0.0
        guarded = fold.safe_strength(fold.scaled_builder(candidate))
        final = guarded.field
        mesh_strength, field_strength = mesh_warp.strength_used, guarded.strength
        triangle_min, triangle_pass = mesh_warp.flips.min_area_ratio, mesh_warp.flips.passed
    warped = fields.apply(photo, final)
    # Multi-scale colour detail retains low-frequency continuity across the
    # turn's inward fade while preserving the original at every hard boundary.
    # Q1/Q4 are recomputed on the composited pixels, never the intermediate warp.
    from .turn_pyramid import composite
    photo_out = composite(photo, warped, masks.weights) if requested else warped
    edit = (final.move() > 1e-6).astype(np.float32)
    q1 = q1_outside_mask(photo, photo_out, masks.oval)
    q3 = fold.fold_report(final)
    q4 = q4_seam(photo, photo_out, masks.oval)
    q4_occluder = q4_seam(photo, photo_out, masks.protected)
    protected_pixels = int(np.count_nonzero(masks.protected))
    occluder_band_pixels = int(q4_occluder.measured["band_pixels"])
    occluder_supplied = protected_mask is not None
    occluder_nonempty = protected_pixels > 0
    # Q4 legitimately returns a neutral result when no 0.5 contour exists. That
    # result cannot be reused as evidence of a measured hair/headwear seam.
    occluder_measured = occluder_supplied and occluder_nonempty and occluder_band_pixels > 0
    max_move = float(np.max(final.move()))
    requested_move = float(np.max(np.linalg.norm(proposed - before, axis=1)))
    # A total mask or unusable crop is a refusal, not an identity-output pass.
    effect_pass = requested == 0 or (requested_move > 1e-6 and max_move >= min(0.02, requested_move * 0.05))
    guard_strength = mesh_strength * field_strength
    # R12 product, times the share of the request the regulariser kept: never looser.
    strength = guard_strength * spatial_retention * target_retention
    target = applied_targets(before, safe_targets, masks, guard_strength)
    metrics = {
        "yaw_degrees": float(yaw), "pitch_degrees": float(pitch), "roll_degrees": float(roll),
        "strength_used": strength, "mesh_strength": mesh_strength, "field_strength": field_strength,
        "spatial_retention": spatial_retention, "guard_strength": guard_strength,
        "target_retention": target_retention, "capped_vertices": capped_vertices,
        "regions_scaled": regions_scaled, "local_min_scale": local_min_scale,
        "effective_yaw_degrees": yaw * strength, "effective_pitch_degrees": pitch * strength,
        "min_area_ratio": triangle_min, "min_det": q3.min_det, "max_move_px": max_move,
        "requested_move_px": requested_move, "rim_px": masks.rim_px, "blend_px": masks.blend_px,
        "occluder_mask_supplied": occluder_supplied,
        "occluder_mask_nonempty": occluder_nonempty,
        "protected_pixels": protected_pixels,
        "q4_occluder_band_pixels": occluder_band_pixels,
        "q4_occluder_ratio_p90": float(q4_occluder.measured["ratio"]),
        "q4_occluder_measured": occluder_measured,
        "editable_pixels": int(np.count_nonzero(masks.weights > 0)),
        "strip_pixels": 0, "refused": not effect_pass,
        "pyramid_levels": 4 if requested else 0,
    }
    checks = {
        "q1": q1.to_json(), "q3": q3.to_json(), "q4": q4.to_json(),
        "q4_occluder": q4_occluder.to_json(), "effect_pass": effect_pass,
        "q4_occluder_measured": occluder_measured,
        "q4_occluder_evidence_pass": occluder_measured and q4_occluder.passed,
        "triangle_guard_pass": triangle_pass, "triangle_min_area_ratio": triangle_min,
        "strength_used": strength, "jacobian_min": q3.min_det,
    }
    return TurnOutcome(photo_out, final, edit, target, metrics, checks)


def render_turn_checked(image: np.ndarray, mesh: object, *, yaw: float = 0,
                        pitch: float = 0, roll: float = 0,
                        protected_mask: object | None = None,
                        blend_px: float | None = None) -> TurnOutcome | Refusal:
    """Typed, photo-safe outcome for the runner and new UI.

    The historical render_turn continues to raise on programming-contract
    misuse. Callers that process arbitrary camera input use this wrapper.
    """
    try:
        return render_turn(image, mesh, yaw=yaw, pitch=pitch, roll=roll,
                           protected_mask=protected_mask, blend_px=blend_px)
    except (TypeError, ValueError, FloatingPointError) as exc:
        message = str(exc)[:120]
        code = "invalid_weights" if "weights" in message or "support" in message else (
            "no_face_length" if "no length" in message else "invalid_geometry"
        )
        return Refusal("warp_turn", code, message)
