"""Photo-scoped capture of actual guarded Tuesday measurements.

Only numerical observations survive. A private, in-memory pixel fingerprint
prevents observations from different open photos from being merged. It is
never serialized. No synthetic observation can qualify real-person identity.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

from .errors import CommandValidationError
from .frames import ImageFrame, resize_reference
from .guarded import ProExecutionResult
from .lock_bundle import TuesdayLockBundle, prepare_tuesday_lock_bundle
from .lock_matrix import LockObservation
from .observed_lock import LockCaptureOptions, collect_guarded_observation
from .pose import PoseReport
from .quality_tier_matrix import TierLockObservation, build_tier_matrix, observation_from_runs
from .quality_tiers import QualityTierRun
from .studio import StudioReport
from .studio_pose_annex import (
    PoseLevelEvidence,
    StudioLevelEvidence,
    build_studio_pose_annex,
)
from .tuesday_lock import build_tuesday_lock_packet
from .types import CommandName


@dataclass(frozen=True, slots=True)
class CaptureCounts:
    command_slots: int
    tier_slots: int
    studio_diagnostics: int
    pose_diagnostics: int
    release_qualified: bool = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "command_slots": self.command_slots,
            "tier_slots": self.tier_slots,
            "studio_diagnostics": self.studio_diagnostics,
            "pose_diagnostics": self.pose_diagnostics,
            "release_qualified": False,
        }


class TuesdayCaptureSession:
    """Collect measured results without retaining images in public reports."""

    def __init__(self, *, run_id: str, renderer_build: str, source: ImageFrame) -> None:
        if not isinstance(source, ImageFrame):
            raise CommandValidationError("invalid_lock_capture", "A checked original frame is required.")
        build_tuesday_lock_packet((), run_id=run_id, renderer_build=renderer_build)
        self._run_id = run_id
        self._renderer_build = renderer_build
        self._private_digest: str | None = hashlib.sha256(source.pixels).hexdigest()
        self._shape = (source.width, source.height, source.channels)
        self._commands: dict[tuple[CommandName, int], LockObservation] = {}
        self._tiers: dict[tuple[str, int], TierLockObservation] = {}
        self._studio: dict[int, StudioLevelEvidence] = {}
        self._pose: dict[int, PoseLevelEvidence] = {}

    def _check_photo(self, source: ImageFrame) -> None:
        if self._private_digest is None:
            raise CommandValidationError("capture_closed", "This photo session has been revoked.")
        if not isinstance(source, ImageFrame) or (
            source.width, source.height, source.channels
        ) != self._shape or hashlib.sha256(source.pixels).hexdigest() != self._private_digest:
            raise CommandValidationError(
                "capture_photo_changed", "All observations must use the same original photo.",
            )

    def record_command(
        self,
        source: ImageFrame,
        preview: ProExecutionResult,
        exported: ProExecutionResult,
        *,
        studio: StudioReport | None = None,
        pose: PoseReport | None = None,
        options: LockCaptureOptions | None = None,
        studio_evidence: StudioLevelEvidence | None = None,
        pose_evidence: PoseLevelEvidence | None = None,
    ) -> LockObservation:
        """Consume actual paired guarded execution, never manually asserted PASS."""
        self._check_photo(source)
        observation = collect_guarded_observation(
            source, preview, exported, studio=studio, pose=pose, options=options,
        )
        key = (observation.command, observation.level_tenths)
        if key in self._commands:
            raise CommandValidationError("duplicate_lock_evidence", "Duplicate command-level capture.")
        if studio_evidence is not None and (
            not isinstance(studio_evidence, StudioLevelEvidence)
            or observation.command is not CommandName.STUDIOQUALITY
            or studio_evidence.level_tenths != observation.level_tenths
        ):
            raise CommandValidationError(
                "invalid_lock_capture", "Studio evidence belongs to another edit.",
            )
        if pose_evidence is not None and (
            not isinstance(pose_evidence, PoseLevelEvidence)
            or observation.command is not CommandName.POSEONLY
            or pose_evidence.level_tenths != observation.level_tenths
        ):
            raise CommandValidationError(
                "invalid_lock_capture", "Pose evidence belongs to another edit.",
            )
        self._commands[key] = observation
        if studio_evidence is not None:
            self._studio[observation.level_tenths] = studio_evidence
        if pose_evidence is not None:
            self._pose[observation.level_tenths] = pose_evidence
        return observation

    def record_tier(
        self,
        source: ImageFrame,
        preview: QualityTierRun,
        exported: QualityTierRun,
        *,
        measured_device: bool = False,
    ) -> TierLockObservation:
        """Derive neutral reference parity from actual pixels rather than a flag."""
        self._check_photo(source)
        if not isinstance(preview, QualityTierRun) or not isinstance(exported, QualityTierRun):
            raise CommandValidationError("invalid_lock_capture", "Two actual tier runs are required.")
        if (
            preview.plan.source_width != source.width
            or preview.plan.source_height != source.height
        ):
            raise CommandValidationError(
                "capture_photo_changed", "Tier runs use another original geometry.",
            )
        if (
            preview.quality != "preview"
            or exported.quality != "export"
            or preview.plan.pro_plan.fingerprint() != exported.plan.pro_plan.fingerprint()
        ):
            raise CommandValidationError(
                "invalid_lock_capture", "Tier preview and export must share one plan.",
            )
        if type(measured_device) is not bool:
            raise CommandValidationError(
                "invalid_lock_capture", "Device evidence flag must be boolean.",
            )
        has_synthetic_identity = any(
            step.identity is None or step.identity.synthetic_evidence
            for run in (preview, exported)
            for step in run.result.steps
        )
        level = preview.plan.recipe.upscale_level.tenths
        neutral = True
        if level == 10:
            aligned = resize_reference(
                source, exported.result.image.width, exported.result.image.height,
            )
            neutral = (
                aligned.identical(preview.result.image)
                and aligned.identical(exported.result.image)
            )
        observation = observation_from_runs(
            preview, exported,
            neutral_reference_exact=neutral,
            measured_device=measured_device and not has_synthetic_identity,
        )
        key = (observation.tier, observation.level_tenths)
        if key in self._tiers:
            raise CommandValidationError("duplicate_lock_evidence", "Duplicate tier-level capture.")
        self._tiers[key] = observation
        return observation

    def summary(self) -> CaptureCounts:
        return CaptureCounts(
            command_slots=len(self._commands),
            tier_slots=len(self._tiers),
            studio_diagnostics=len(self._studio),
            pose_diagnostics=len(self._pose),
        )

    def package(self) -> TuesdayLockBundle:
        if self._private_digest is None:
            raise CommandValidationError("capture_closed", "This photo session has been revoked.")
        command_json = build_tuesday_lock_packet(
            tuple(self._commands.values()),
            run_id=self._run_id,
            renderer_build=self._renderer_build,
        ).to_json()
        tier_json = build_tier_matrix(
            tuple(self._tiers.values()),
            original_tuesday_json=command_json,
            run_id=self._run_id,
            renderer_build=self._renderer_build,
        )
        annex = build_studio_pose_annex(
            command_json,
            studio=tuple(self._studio.values()),
            pose=tuple(self._pose.values()),
        )
        return prepare_tuesday_lock_bundle(
            command_json, tier_json, studio_pose_json=annex,
        )

    def close(self) -> None:
        self._private_digest = None
        self._commands.clear()
        self._tiers.clear()
        self._studio.clear()
        self._pose.clear()
