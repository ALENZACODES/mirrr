"""Public export adapters for approved repair/upscale/studio/pose engines.

Other lanes own their engines. This module does not import implementation
submodules, invent missing capabilities or send user photos over the network.
The app supplies an exported implementation satisfying the typed port.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from .cache import CachedFaceEmbedder, FrameCache
from .embedders import FaceEmbedder
from .errors import CommandUnavailable, CommandValidationError
from .frames import ImageFrame
from .guarded import GuardedProExecutor, ProEffect
from .identity import IdentityGuard
from .performance import PerformanceBudget, PerformanceRecorder, RenderQuality
from .pro_plan import ProStep
from .pro_undo import ProUndoHook
from .repair_gate import FaceFixerGate
from .types import CommandName


class RepairPublicPort(Protocol):
    """Adapter to a checked public export from engines/repair."""

    def cleanup(self, frame: ImageFrame, *, dose: float, preview: bool) -> ImageFrame: ...


class UpscalePublicPort(Protocol):
    """A caller-supplied export whose 2x/4x output must pass output checks."""

    def upscale(self, frame: ImageFrame, *, scale: int, preview: bool) -> ImageFrame: ...


class StudioPublicPort(Protocol):
    def correct(self, frame: ImageFrame, *, dose: float, preview: bool) -> ImageFrame: ...


class PosePublicPort(Protocol):
    def pose(self, frame: ImageFrame, *, dose: float, preview: bool) -> ImageFrame: ...


@dataclass(frozen=True, slots=True)
class PortAvailability:
    identity_ready: bool
    repair_ready: bool
    upscale_ready: bool
    studio_ready: bool
    pose_ready: bool

    def public_metadata(self) -> dict[str, bool]:
        return {
            "identity_ready": self.identity_ready,
            "repair_ready": self.repair_ready,
            "upscale_ready": self.upscale_ready,
            "studio_ready": self.studio_ready,
            "pose_ready": self.pose_ready,
        }


@dataclass(frozen=True, slots=True)
class ProEngineBindings:
    """Explicit composition root; no default network, weights or provider work."""

    repair: RepairPublicPort | None = None
    upscale: UpscalePublicPort | None = None
    studio: StudioPublicPort | None = None
    pose: PosePublicPort | None = None
    identity_embedder: FaceEmbedder | None = None

    @property
    def availability(self) -> PortAvailability:
        model = self.identity_embedder
        available = False
        if model is not None:
            try:
                model.evidence.validate()
                available = True
            except CommandUnavailable:
                available = False
        return PortAvailability(
            available, self.repair is not None, self.upscale is not None,
            self.studio is not None, self.pose is not None,
        )

    @staticmethod
    def _dose(step: ProStep) -> float:
        """Map the active 1.0..5.0 scale to 20..100% effect dose.

        Level 1.0 is the mildest real edit. Full no-op is Undo/Reset, not a
        hidden slider stop that would violate the requested user control range.
        """
        return step.level.tenths / 50.0

    def handlers(self) -> dict[CommandName, ProEffect]:
        result: dict[CommandName, ProEffect] = {}
        if self.repair is not None:
            repair = self.repair

            def cleanup(frame: ImageFrame, step: ProStep, quality: RenderQuality) -> ImageFrame:
                if step.name is not CommandName.CLEANUP:
                    raise CommandValidationError("argument_mismatch", "Expected cleanup step.")
                return repair.cleanup(frame, dose=self._dose(step), preview=quality == "preview")

            result[CommandName.CLEANUP] = cleanup
        if self.upscale is not None:
            upscale = self.upscale

            def resize(frame: ImageFrame, step: ProStep, quality: RenderQuality) -> ImageFrame:
                if step.name is not CommandName.UPSCALE:
                    raise CommandValidationError("argument_mismatch", "Expected upscale step.")
                return upscale.upscale(frame, scale=step.scale, preview=quality == "preview")

            result[CommandName.UPSCALE] = resize
        if self.studio is not None:
            studio = self.studio

            def correct(frame: ImageFrame, step: ProStep, quality: RenderQuality) -> ImageFrame:
                if step.name is not CommandName.STUDIOQUALITY:
                    raise CommandValidationError("argument_mismatch", "Expected studio step.")
                return studio.correct(frame, dose=self._dose(step), preview=quality == "preview")

            result[CommandName.STUDIOQUALITY] = correct
        if self.pose is not None:
            pose = self.pose

            def pose_only(frame: ImageFrame, step: ProStep, quality: RenderQuality) -> ImageFrame:
                if step.name is not CommandName.POSEONLY:
                    raise CommandValidationError("argument_mismatch", "Expected pose step.")
                return pose.pose(frame, dose=self._dose(step), preview=quality == "preview")

            result[CommandName.POSEONLY] = pose_only
        return result

    def create_executor(
        self,
        *,
        allow_test_embedder: bool = False,
        cache: FrameCache | None = None,
        budget: PerformanceBudget | None = None,
        recorder: PerformanceRecorder | None = None,
        undo: ProUndoHook | None = None,
        face_fixer: FaceFixerGate | None = None,
    ) -> GuardedProExecutor:
        identity: IdentityGuard | None = None
        if self.identity_embedder is not None:
            model = CachedFaceEmbedder(self.identity_embedder, max_entries=8)
            identity = IdentityGuard(model, allow_test_embedder=allow_test_embedder)
        return GuardedProExecutor(
            handlers=self.handlers(), identity=identity, cache=cache,
            budget=budget, recorder=recorder, undo=undo, face_fixer=face_fixer,
        )
