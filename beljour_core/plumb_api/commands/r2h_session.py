"""Photo-scoped Pro Commands composition root for CPU cleanup and upscale.

Public ports remain replaceable by validated engines from other lanes. The
session never executes an effect outside GuardedProExecutor, including poses,
and keeps mask readings only for the open photo. No network operations occur.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from .adapters import ProEngineBindings
from .cache import FrameCache
from .cleanup import CleanupProcessor
from .cleanup_detail import SpotHint
from .errors import CommandUnavailable, CommandValidationError
from .frames import ImageFrame
from .guarded import GuardedProExecutor, ProEffect, ProExecutionResult
from .identity import IdentityGuard
from .performance import PerformanceBudget, PerformanceRecorder, RenderQuality
from .pose import PoseOnlyProcessor
from .pose_geometry import PoseEvidence
from .pro_plan import ProPlan, ProStep
from .pro_undo import ProUndoHook
from .regions import FaceRegions, PhotoRegionCache
from .repair_gate import FaceFixerGate
from .studio import StudioQualityProcessor
from .studio_kernels import StudioSettings
from .types import CommandName
from .upscale import UpscaleProcessor

RegionSupplier = Callable[[ImageFrame], FaceRegions | None]


@dataclass(frozen=True, slots=True)
class SessionSummary:
    revision: int
    photo_open: bool
    region_reads: int
    region_hits: int
    render_cache_bytes: int
    last_plan: str | None

    def public_metadata(self) -> dict[str, object]:
        return {
            "revision": self.revision,
            "photo_open": self.photo_open,
            "region_reads": self.region_reads,
            "region_hits": self.region_hits,
            "render_cache_bytes": self.render_cache_bytes,
            "last_plan": self.last_plan,
        }


class R2HSession:
    """Conventional CPU default effects plus mandatory identity-gated runner."""

    def __init__(
        self,
        *,
        identity: IdentityGuard | None,
        public_engines: ProEngineBindings | None = None,
        undo: ProUndoHook | None = None,
        face_fixer: FaceFixerGate | None = None,
        budget: PerformanceBudget | None = None,
        tile_size: int = 192,
        studio_settings: StudioSettings | None = None,
    ) -> None:
        self._regions = PhotoRegionCache()
        self._cleanup = CleanupProcessor(self._regions)
        self._upscale = UpscaleProcessor(self._regions, tile_size=tile_size)
        self._studio = StudioQualityProcessor(self._regions, settings=studio_settings)
        self._pose = PoseOnlyProcessor(self._regions)
        self._render_cache = FrameCache()
        self._recorder = PerformanceRecorder()
        self._public = public_engines
        self._revision = 0
        self._original: ImageFrame | None = None
        self._last_fingerprint: str | None = None
        handlers: dict[CommandName, ProEffect] = {
            CommandName.CLEANUP: self._cleanup_port,
            CommandName.UPSCALE: self._upscale_port,
            CommandName.STUDIOQUALITY: self._studio_port,
            CommandName.POSEONLY: self._pose_port,
        }
        if public_engines is not None:
            for name, handler in public_engines.handlers().items():
                if name not in (
                    CommandName.CLEANUP, CommandName.UPSCALE,
                    CommandName.STUDIOQUALITY, CommandName.POSEONLY,
                ):
                    handlers[name] = handler
        self._executor = GuardedProExecutor(
            handlers=handlers,
            identity=identity,
            cache=self._render_cache,
            undo=undo,
            recorder=self._recorder,
            budget=budget,
            face_fixer=face_fixer,
        )

    def open_photo(
        self,
        source: ImageFrame,
        *,
        regions: FaceRegions | None = None,
        supplier: RegionSupplier | None = None,
        spots: tuple[SpotHint, ...] = (),
        pose: PoseEvidence | None = None,
    ) -> None:
        if not isinstance(source, ImageFrame):
            raise CommandValidationError("invalid_frame", "Session requires a valid photo.")
        if regions is not None and supplier is not None:
            raise CommandValidationError(
                "invalid_regions", "Provide static regions or a supplier, not both.",
            )
        if regions is not None:
            static_regions = regions

            def fixed_region_supplier(_frame: ImageFrame) -> FaceRegions:
                return static_regions

            supplier = fixed_region_supplier
        self._regions.open(source, supplier)
        self._pose.open_photo(source, pose)
        self._cleanup = CleanupProcessor(self._regions, spots=spots)
        self._original = source
        self._revision += 1
        self._executor.clear_photo()
        self._last_fingerprint = None

    def close_photo(self) -> None:
        self._original = None
        self._revision += 1
        self._last_fingerprint = None
        self._regions.close()
        self._pose.close_photo()
        self._executor.clear_photo()

    def _cleanup_port(self, frame: ImageFrame, step: ProStep, quality: RenderQuality) -> ImageFrame:
        if step.name is not CommandName.CLEANUP:
            raise CommandValidationError("command_mismatch", "Cleanup received a different Pro command.")
        if step.level.tenths == 10:
            return frame
        return self._cleanup.cleanup(
            frame, dose=step.level.fractional_strength, preview=quality == "preview",
        )

    def _upscale_port(self, frame: ImageFrame, step: ProStep, quality: RenderQuality) -> ImageFrame:
        if step.name is not CommandName.UPSCALE:
            raise CommandValidationError("command_mismatch", "Upscale received a different Pro command.")
        return self._upscale.render(
            frame, scale=step.scale, dose=step.level.fractional_strength, preview=quality == "preview",
            neutral_detail=step.level.tenths == 10,
        )

    def _studio_port(self, frame: ImageFrame, step: ProStep, quality: RenderQuality) -> ImageFrame:
        if step.name is not CommandName.STUDIOQUALITY:
            raise CommandValidationError("command_mismatch", "Studio received another Pro command.")
        return self._studio.render(frame, level=step.level, preview=quality == "preview")

    def _pose_port(self, frame: ImageFrame, step: ProStep, quality: RenderQuality) -> ImageFrame:
        if step.name is not CommandName.POSEONLY:
            raise CommandValidationError("command_mismatch", "Pose received another Pro command.")
        return self._pose.render(frame, level=step.level, preview=quality == "preview")

    def run(
        self,
        plan: ProPlan,
        *,
        quality: RenderQuality = "export",
        is_current: Callable[[], bool] | None = None,
        input_frame: ImageFrame | None = None,
    ) -> ProExecutionResult:
        original = self._original
        if original is None:
            raise CommandUnavailable("photo_missing", "Open a photo before running a Pro command.")
        if input_frame is not None and not isinstance(input_frame, ImageFrame):
            raise CommandValidationError("invalid_frame", "Preview input must be a valid frame.")
        actual = input_frame if input_frame is not None else original
        generation = self._revision

        def valid() -> bool:
            return generation == self._revision and (is_current is None or is_current())

        result = self._executor.run(plan, actual, quality=quality, is_current=valid)
        self._last_fingerprint = plan.fingerprint()
        return result

    @property
    def summary(self) -> SessionSummary:
        masks = self._regions.stats
        return SessionSummary(
            self._revision, self._original is not None, masks.reads, masks.hits,
            self._render_cache.stats.retained_bytes, self._last_fingerprint,
        )

    @property
    def cleanup_processor(self) -> CleanupProcessor:
        return self._cleanup

    @property
    def upscale_processor(self) -> UpscaleProcessor:
        return self._upscale

    @property
    def recorder(self) -> PerformanceRecorder:
        return self._recorder

    @property
    def studio_processor(self) -> StudioQualityProcessor:
        return self._studio

    @property
    def pose_processor(self) -> PoseOnlyProcessor:
        return self._pose
