"""Actual guarded /POSEONLY receipt and exact face-pixel preservation.

Identity locking remains mandatory even when no geometric warp is requested.
A checked face mask is required to measure 'no face change'; inferred or
missing regions cannot be silently treated as preserved. Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

import numpy as np

from .errors import CommandValidationError
from .frames import ImageFrame
from .guarded import ProExecutionResult
from .types import CommandName

PoseAuditStatus = Literal["protected", "blocked", "unproven"]


@dataclass(frozen=True, slots=True)
class PoseFaceAudit:
    status: PoseAuditStatus
    level: str
    mask_pixels: int
    changed_face_pixels: int | None
    changed_outside_face_pixels: int
    alpha_unchanged: bool
    identity_enabled: bool
    identity_evidence_valid: bool
    identity_synthetic: bool
    reason_codes: tuple[str, ...]
    realface_approved: bool = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": "beljour-pose-face-audit/1",
            "status": self.status,
            "level": self.level,
            "mask_pixels": self.mask_pixels,
            "changed_face_pixels": self.changed_face_pixels,
            "changed_outside_face_pixels": self.changed_outside_face_pixels,
            "alpha_unchanged": self.alpha_unchanged,
            "identity_enabled": self.identity_enabled,
            "identity_evidence_valid": self.identity_evidence_valid,
            "identity_synthetic": self.identity_synthetic,
            "reason_codes": list(self.reason_codes),
            "realface_approved": False,
        }


def audit_pose_face(
    source: ImageFrame,
    rendered: ProExecutionResult,
    *,
    checked_face_mask: bytes | None,
) -> PoseFaceAudit:
    """Verify executed identity protection and original face bytes.

    The requested mask is an externally checked positive-coverage region, not
    a colour threshold. Every fractional positive byte counts as protected.
    This is a quality diagnostic, not an independent real-face gate.
    """
    if not isinstance(source, ImageFrame) or not isinstance(rendered, ProExecutionResult):
        raise CommandValidationError("invalid_pose_audit", "A guarded edit and original are required.")
    if len(rendered.plan.steps) != 1 or rendered.plan.steps[0].name is not CommandName.POSEONLY:
        raise CommandValidationError("invalid_pose_audit", "Only a single pose edit may be audited.")
    if len(rendered.steps) != 1 or rendered.steps[0].command is not CommandName.POSEONLY:
        raise CommandValidationError("invalid_pose_audit", "Pose execution evidence is incomplete.")
    if not source.same_layout(rendered.image):
        raise CommandValidationError("invalid_pose_audit", "Pose cannot resize the image.")
    if checked_face_mask is not None and (
        not isinstance(checked_face_mask, bytes)
        or len(checked_face_mask) != source.width * source.height
    ):
        raise CommandValidationError("invalid_pose_audit", "Checked face mask dimensions are invalid.")
    decision = rendered.steps[0].identity
    identity_enabled = rendered.plan.identity.enabled
    identity_ok = (
        identity_enabled
        and decision is not None
        and decision.status != "warned"
        and math.isfinite(decision.final_cosine)
        and math.isfinite(decision.threshold)
        and decision.final_cosine + 1e-9 >= decision.threshold
    )
    before = np.frombuffer(source.pixels, dtype=np.uint8).reshape(
        source.height, source.width, source.channels,
    )
    after = np.frombuffer(rendered.image.pixels, dtype=np.uint8).reshape(
        source.height, source.width, source.channels,
    )
    changed_rgb = np.any(before[:, :, :3] != after[:, :, :3], axis=2)
    alpha_ok = source.channels == 3 or bool(np.array_equal(before[:, :, 3], after[:, :, 3]))
    reasons: list[str] = []
    if not identity_ok:
        reasons.append("identity_guard_missing")
    if not alpha_ok:
        reasons.append("alpha_changed")
    mask_count = 0
    face_changed: int | None = None
    outside = int(np.count_nonzero(changed_rgb))
    if checked_face_mask is None:
        reasons.append("face_annotation_missing")
    else:
        positive = np.frombuffer(checked_face_mask, dtype=np.uint8).reshape(
            source.height, source.width,
        ) > 0
        mask_count = int(np.count_nonzero(positive))
        if mask_count == 0:
            reasons.append("face_annotation_empty")
        else:
            face_changed = int(np.count_nonzero(changed_rgb & positive))
            outside = int(np.count_nonzero(changed_rgb & ~positive))
            if face_changed:
                reasons.append("face_pixels_changed")
    status: PoseAuditStatus = (
        "blocked" if not identity_ok or not alpha_ok or (face_changed or 0) > 0
        else "unproven" if face_changed is None
        else "protected"
    )
    return PoseFaceAudit(
        status, rendered.plan.steps[0].level.label, mask_count, face_changed,
        outside, alpha_ok, identity_enabled, identity_ok,
        bool(decision.synthetic_evidence) if decision is not None else False,
        tuple(reasons),
    )
