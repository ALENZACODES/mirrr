"""Preflight an entire Pro chain before allocating image-processing buffers.

This is an advisory, photo-free capacity and readiness check. The guarded
executor remains the authoritative identity, alpha, undo and output validator.
Preflight cannot authorize production identity claims or real-face release.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from .errors import CommandValidationError
from .frames import MAX_IMAGE_PIXELS, ImageFrame
from .performance import RenderQuality
from .pro_plan import ProPlan, ProStep
from .types import CommandName

PreflightStatus = Literal["ready", "blocked"]
ReadinessCode = Literal[
    "identity_model_unavailable",
    "engine_unavailable",
    "pose_evidence_missing",
    "pixel_budget_exceeded",
    "working_memory_exceeded",
]
WarningCode = Literal["face_masks_unavailable", "identity_explicitly_disabled"]


@dataclass(frozen=True, slots=True)
class PreflightCapacity:
    """Configurable local capacity limit, never a relaxation of the 24 MP cap."""

    max_working_bytes: int = 512 * 1024 * 1024
    max_output_pixels: int = MAX_IMAGE_PIXELS

    def __post_init__(self) -> None:
        if (
            type(self.max_working_bytes) is not int
            or self.max_working_bytes < 1
            or type(self.max_output_pixels) is not int
            or not 1 <= self.max_output_pixels <= MAX_IMAGE_PIXELS
        ):
            raise CommandValidationError(
                "invalid_preflight_capacity", "Preflight memory or pixel capacity is invalid.",
            )


@dataclass(frozen=True, slots=True)
class PreflightCapabilities:
    """Only independently verified capabilities may be marked available."""

    identity_guard_available: bool = False
    enabled_effects: frozenset[CommandName] = field(default_factory=frozenset)
    checked_pose_available: bool = False
    checked_masks_available: bool = False

    def __post_init__(self) -> None:
        if (
            type(self.identity_guard_available) is not bool
            or type(self.checked_pose_available) is not bool
            or type(self.checked_masks_available) is not bool
            or not isinstance(self.enabled_effects, frozenset)
            or any(not isinstance(name, CommandName) for name in self.enabled_effects)
        ):
            raise CommandValidationError(
                "invalid_preflight_capability", "Preflight capabilities must be explicitly checked.",
            )
        if CommandName.IDENTITYLOCK in self.enabled_effects:
            raise CommandValidationError(
                "invalid_preflight_capability", "Identity protection is not an interchangeable effect.",
            )


@dataclass(frozen=True, slots=True)
class PreflightStep:
    index: int
    command: CommandName
    width: int
    height: int
    pixel_count: int
    projected_working_bytes: int
    errors: tuple[ReadinessCode, ...]
    warnings: tuple[WarningCode, ...]

    @property
    def ready(self) -> bool:
        return not self.errors

    def public_metadata(self) -> dict[str, object]:
        return {
            "index": self.index,
            "command": self.command.value,
            "width": self.width,
            "height": self.height,
            "pixel_count": self.pixel_count,
            "projected_working_bytes": self.projected_working_bytes,
            "ready": self.ready,
            "errors": list(self.errors),
            "warnings": list(self.warnings),
        }


@dataclass(frozen=True, slots=True)
class PreflightReport:
    status: PreflightStatus
    quality: RenderQuality
    plan_fingerprint: str
    identity_on: bool
    source_pixels: int
    result_pixels: int
    estimated_peak_bytes: int
    steps: tuple[PreflightStep, ...]
    warnings: tuple[WarningCode, ...]

    @property
    def issues(self) -> tuple[ReadinessCode, ...]:
        return tuple(dict.fromkeys(issue for step in self.steps for issue in step.errors))

    def public_metadata(self) -> dict[str, object]:
        """Contains no image, file path, biometric identifier or model secret."""
        return {
            "version": "beljour-pro-preflight/1",
            "status": self.status,
            "quality": self.quality,
            "plan_fingerprint": self.plan_fingerprint,
            "identity_on": self.identity_on,
            "source_pixels": self.source_pixels,
            "result_pixels": self.result_pixels,
            "estimated_peak_bytes": self.estimated_peak_bytes,
            "issues": list(self.issues),
            "warnings": list(self.warnings),
            "steps": [step.public_metadata() for step in self.steps],
            "release_qualified": False,
        }


_WORKING_BYTES_PER_PIXEL: dict[CommandName, int] = {
    CommandName.IDENTITYLOCK: 4,
    CommandName.CLEANUP: 36,
    CommandName.UPSCALE: 32,
    CommandName.STUDIOQUALITY: 32,
    CommandName.POSEONLY: 44,
}


def _step_dimensions(step: ProStep, width: int, height: int) -> tuple[int, int]:
    if step.name is CommandName.UPSCALE:
        return width * step.scale, height * step.scale
    return width, height


def _warnings_for_step(
    step: ProStep,
    plan: ProPlan,
    capabilities: PreflightCapabilities,
) -> tuple[WarningCode, ...]:
    warnings: list[WarningCode] = []
    if not plan.identity.enabled:
        warnings.append("identity_explicitly_disabled")
    if not capabilities.checked_masks_available and step.name in (
        CommandName.CLEANUP, CommandName.STUDIOQUALITY, CommandName.UPSCALE,
    ):
        warnings.append("face_masks_unavailable")
    return tuple(warnings)


def _errors_for_step(
    step: ProStep,
    plan: ProPlan,
    capabilities: PreflightCapabilities,
    capacity: PreflightCapacity,
    pixel_count: int,
    working_bytes: int,
) -> tuple[ReadinessCode, ...]:
    errors: list[ReadinessCode] = []
    if plan.identity.enabled and not capabilities.identity_guard_available:
        errors.append("identity_model_unavailable")
    if step.name is not CommandName.IDENTITYLOCK and step.name not in capabilities.enabled_effects:
        errors.append("engine_unavailable")
    if (
        step.name is CommandName.POSEONLY
        and step.level.tenths > 10
        and not capabilities.checked_pose_available
    ):
        errors.append("pose_evidence_missing")
    if pixel_count > capacity.max_output_pixels:
        errors.append("pixel_budget_exceeded")
    if working_bytes > capacity.max_working_bytes:
        errors.append("working_memory_exceeded")
    return tuple(errors)


def preflight_plan(
    plan: ProPlan,
    source: ImageFrame,
    capabilities: PreflightCapabilities,
    *,
    quality: RenderQuality = "preview",
    capacity: PreflightCapacity | None = None,
) -> PreflightReport:
    """Inspect all ordered commands, including scale growth, without reading pixels."""
    if not isinstance(plan, ProPlan) or not isinstance(source, ImageFrame):
        raise CommandValidationError("invalid_preflight", "Preflight requires a typed plan and photo.")
    if not isinstance(capabilities, PreflightCapabilities):
        raise CommandValidationError("invalid_preflight", "Checked capabilities are required.")
    if quality not in ("preview", "export"):
        raise CommandValidationError("invalid_quality", "Quality must be preview or export.")
    limits = capacity if capacity is not None else PreflightCapacity()
    if not isinstance(limits, PreflightCapacity):
        raise CommandValidationError("invalid_preflight", "Capacity must be typed.")
    width = source.width
    height = source.height
    peak = source.byte_size
    steps: list[PreflightStep] = []
    warnings: list[WarningCode] = []
    for step in plan.steps:
        width, height = _step_dimensions(step, width, height)
        pixel_count = width * height
        output_bytes = pixel_count * source.channels
        working_bytes = pixel_count * _WORKING_BYTES_PER_PIXEL[step.name] + output_bytes
        if step.name is CommandName.UPSCALE:
            working_bytes += source.width * source.height * source.channels
        peak = max(peak, working_bytes)
        step_warnings = _warnings_for_step(step, plan, capabilities)
        step_errors = _errors_for_step(
            step, plan, capabilities, limits, pixel_count, working_bytes,
        )
        steps.append(
            PreflightStep(
                step.index, step.name, width, height, pixel_count, working_bytes,
                step_errors, step_warnings,
            )
        )
        for warning in step_warnings:
            if warning not in warnings:
                warnings.append(warning)
    return PreflightReport(
        "blocked" if any(not step.ready for step in steps) else "ready",
        quality, plan.fingerprint(), plan.identity.enabled,
        source.width * source.height, width * height, peak, tuple(steps), tuple(warnings),
    )
