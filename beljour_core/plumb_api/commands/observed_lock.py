"""Build lock-matrix observations from actual guarded Pro edit results.

This adapter cannot invent an identity decision, safety report, performance
measurement or independent device attestation. Only single-step plans can be
attributed to a specific command without timing ambiguity.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from .errors import CommandValidationError
from .frames import ImageFrame, resize_reference
from .guarded import ProExecutionResult
from .lock_matrix import LockObservation
from .pose import PoseReport
from .studio import StudioReport
from .types import CommandName


@dataclass(frozen=True, slots=True)
class LockCaptureOptions:
    checked_protected_regions: bool = False
    neutral_upscale_detail: bool | None = None
    observed_on_device: bool = False

    def __post_init__(self) -> None:
        if (
            type(self.checked_protected_regions) is not bool
            or type(self.observed_on_device) is not bool
            or (self.neutral_upscale_detail is not None
                and type(self.neutral_upscale_detail) is not bool)
        ):
            raise CommandValidationError("invalid_lock_capture", "Lock capture flags are invalid.")


def _check_single_step(preview: ProExecutionResult, exported: ProExecutionResult) -> None:
    if not isinstance(preview, ProExecutionResult) or not isinstance(exported, ProExecutionResult):
        raise CommandValidationError("invalid_lock_capture", "Guarded Pro results are required.")
    if (
        preview.timing.quality != "preview"
        or exported.timing.quality != "export"
        or preview.plan.fingerprint() != exported.plan.fingerprint()
        or len(preview.plan.steps) != 1
        or len(exported.plan.steps) != 1
        or len(preview.steps) != 1
        or len(exported.steps) != 1
        or preview.steps[0].command != exported.steps[0].command
        or preview.steps[0].index != 0
        or exported.steps[0].index != 0
        or preview.steps[0].command != preview.plan.steps[0].name
        or exported.steps[0].command != exported.plan.steps[0].name
        or preview.steps[0].level != exported.steps[0].level
        or preview.steps[0].level != preview.plan.steps[0].level.label
        or exported.steps[0].level != exported.plan.steps[0].level.label
    ):
        raise CommandValidationError(
            "invalid_lock_capture", "One matching preview/export command is required.",
        )
    if not preview.image.same_layout(exported.image):
        raise CommandValidationError("invalid_lock_capture", "Preview/export geometry does not match.")


def _identity_checked(report: ProExecutionResult) -> bool:
    if not report.plan.identity.enabled:
        return False
    if report.plan.identity.mode.value == "warn":
        return False
    decision = report.steps[0].identity
    if decision is None:
        return False
    if decision.status == "warned":
        return False
    return (
        math.isfinite(decision.final_cosine)
        and math.isfinite(decision.threshold)
        and decision.final_cosine + 1e-9 >= decision.threshold
        and 0 <= decision.identity_match <= 100
    )


def _alpha_preserved(original: ImageFrame, preview: ImageFrame, exported: ImageFrame) -> bool:
    if not original.same_layout(preview) or not original.same_layout(exported):
        return False
    if original.channels != 4:
        return True
    expected = original.pixels[3::4]
    return preview.pixels[3::4] == expected and exported.pixels[3::4] == expected


def collect_guarded_observation(
    source: ImageFrame,
    preview: ProExecutionResult,
    exported: ProExecutionResult,
    *,
    studio: StudioReport | None = None,
    pose: PoseReport | None = None,
    options: LockCaptureOptions | None = None,
) -> LockObservation:
    """Capture a single observed level, never a manually asserted PASS.

    Preview and export must refer to the same immutable plan, or the result is
    rejected. A missing independent safety measurement remains a failure in the
    downstream lock matrix rather than silently becoming satisfactory evidence.
    """
    _check_single_step(preview, exported)
    if not isinstance(source, ImageFrame):
        raise CommandValidationError("invalid_lock_capture", "An original checked frame is required.")
    rules = options if options is not None else LockCaptureOptions()
    if not isinstance(rules, LockCaptureOptions):
        raise CommandValidationError("invalid_lock_capture", "Capture options are invalid.")
    step = exported.plan.steps[0]
    expected_original = source
    if step.name is CommandName.UPSCALE:
        expected_original = resize_reference(source, exported.image.width, exported.image.height)
    if not expected_original.same_layout(exported.image):
        raise CommandValidationError("invalid_lock_capture", "Source geometry cannot be aligned.")
    command = step.name
    neutral = True
    if step.level.tenths == 10:
        if command is CommandName.UPSCALE:
            neutral = (
                rules.neutral_upscale_detail is True
                and expected_original.identical(preview.image)
                and expected_original.identical(exported.image)
            )
        else:
            neutral = (
                not preview.steps[0].modified
                and not exported.steps[0].modified
                and expected_original.identical(preview.image)
                and expected_original.identical(exported.image)
            )
    protected = rules.checked_protected_regions
    skin_lift: float | None = None
    pose_min: float | None = None
    pose_retention: float | None = None
    if command is CommandName.STUDIOQUALITY:
        if studio is not None and not isinstance(studio, StudioReport):
            raise CommandValidationError("invalid_lock_capture", "Studio report is malformed.")
        if studio is not None:
            if studio.level != step.level.label or studio.preview:
                raise CommandValidationError(
                    "invalid_lock_capture", "Studio report belongs to another render.",
                )
            protected = (
                studio.protected_unchanged
                and studio.alpha_unchanged
                and (studio.masks_evidence or (neutral and rules.checked_protected_regions))
            )
            skin_lift = studio.maximum_skin_lift_l
            if neutral and studio.level == "1.0" and skin_lift is None:
                skin_lift = 0.0
    elif command is CommandName.POSEONLY:
        if pose is not None and not isinstance(pose, PoseReport):
            raise CommandValidationError("invalid_lock_capture", "Pose report is malformed.")
        if pose is not None:
            if pose.level != step.level.label or pose.preview:
                raise CommandValidationError(
                    "invalid_lock_capture", "Pose report belongs to another render.",
                )
            protected = pose.protected_unchanged and pose.alpha_unchanged
            pose_min = pose.fold_minimum
            pose_retention = pose.fold_retention
            if neutral and pose.level == "1.0" and pose_min is None:
                pose_min = 1.0
                pose_retention = 1.0
    elif command is CommandName.IDENTITYLOCK:
        protected = expected_original.identical(exported.image)
    guard_good = _identity_checked(preview) and _identity_checked(exported)
    synthetic = any(
        row.identity is not None and row.identity.synthetic_evidence
        for row in (preview.steps[0], exported.steps[0])
    )
    return LockObservation(
        command=command,
        level_tenths=step.level.tenths,
        preview_ms=preview.timing.elapsed_ms,
        export_ms=exported.timing.elapsed_ms,
        identity_applied=guard_good,
        alpha_unchanged=_alpha_preserved(expected_original, preview.image, exported.image),
        protected_unchanged=protected,
        neutral_correct=neutral,
        skin_lift_l=skin_lift,
        pose_minimum_jacobian=pose_min,
        pose_retention=pose_retention,
        measured_device=rules.observed_on_device and guard_good and not synthetic,
    )
