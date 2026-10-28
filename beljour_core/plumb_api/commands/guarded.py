"""Fail-closed, default-on identity guard for every Pro edit including poses.

This is the production-side public entry point; the legacy CommandExecutor is
retained for old saved plans and explicitly injected low-level tools. Every Pro
operation passes the guard after rendering and before the undo transaction.
No approved embedder means editing is unavailable, not silently unprotected.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import Protocol

from .cache import FrameCache
from .errors import CommandError, CommandExecutionError, CommandUnavailable, CommandValidationError
from .frames import MAX_IMAGE_PIXELS, ImageFrame, resize_reference
from .identity import IdentityDecision, IdentityGuard
from .performance import PerformanceBudget, PerformanceRecorder, RenderQuality, TimingObservation
from .pro_plan import ProPlan, ProStep
from .pro_undo import NullProUndoHook, ProUndoCheckpoint, ProUndoHook
from .types import CommandName, IdentityLockArgs

ProEffect = Callable[[ImageFrame, ProStep, RenderQuality], ImageFrame]
RevisionCheck = Callable[[], bool]


class FaceFixerObserver(Protocol):
    """Optional diagnostic hook; never replaces identity protection."""

    def observe(
        self,
        original: ImageFrame,
        output: ImageFrame,
        command: CommandName,
        identity: IdentityDecision | None,
    ) -> None: ...


@dataclass(frozen=True, slots=True)
class ProStepReport:
    index: int
    command: CommandName
    level: str
    modified: bool
    cache_hit: bool
    identity: IdentityDecision | None

    def public_metadata(self) -> dict[str, object]:
        return {
            "index": self.index,
            "command": self.command.value,
            "level": self.level,
            "modified": self.modified,
            "cache_hit": self.cache_hit,
            "identity": self.identity.public_metadata() if self.identity is not None else None,
        }


@dataclass(frozen=True, slots=True, repr=False)
class ProExecutionResult:
    plan: ProPlan
    image: ImageFrame
    steps: tuple[ProStepReport, ...]
    timing: TimingObservation
    undo_steps: int

    def __repr__(self) -> str:
        return f"ProExecutionResult(steps={len(self.steps)}, undo_steps={self.undo_steps})"

    def public_metadata(self) -> dict[str, object]:
        return {
            "plan_fingerprint": self.plan.fingerprint(),
            "steps": [item.public_metadata() for item in self.steps],
            "performance": self.timing.public_metadata(),
            "undo_steps": self.undo_steps,
        }


class GuardedProExecutor:
    """Atomic, identity-gated Pro execution with a guarded pose path.

    Handlers come from the owning engine package's public exports. The runner
    does not look up or download model files, load face pictures or call YouCam.
    """

    def __init__(
        self,
        *,
        handlers: Mapping[CommandName, ProEffect] | None = None,
        identity: IdentityGuard | None = None,
        undo: ProUndoHook | None = None,
        cache: FrameCache | None = None,
        budget: PerformanceBudget | None = None,
        recorder: PerformanceRecorder | None = None,
        face_fixer: FaceFixerObserver | None = None,
    ) -> None:
        self._handlers = dict(handlers) if handlers is not None else {}
        if CommandName.IDENTITYLOCK in self._handlers:
            raise CommandValidationError("identity_override", "Identity protection cannot be replaced.")
        self._identity = identity
        self._undo: ProUndoHook = undo if undo is not None else NullProUndoHook()
        self._cache = cache if cache is not None else FrameCache()
        self._budget = budget if budget is not None else PerformanceBudget()
        self._recorder = recorder if recorder is not None else PerformanceRecorder()
        self._face_fixer = face_fixer

    @property
    def cache(self) -> FrameCache:
        return self._cache

    @property
    def recorder(self) -> PerformanceRecorder:
        return self._recorder

    def clear_photo(self) -> None:
        self._cache.clear()

    @staticmethod
    def _check_frame(before: ImageFrame, after: ImageFrame, step: ProStep) -> None:
        if not isinstance(after, ImageFrame):
            raise CommandExecutionError("invalid_engine_output", "Effect returned an invalid frame.")
        if before.channels != after.channels:
            raise CommandExecutionError("channels_changed", "Effect changed the channel format.")
        if step.name is CommandName.UPSCALE:
            if before.width * step.scale * before.height * step.scale > MAX_IMAGE_PIXELS:
                raise CommandValidationError("invalid_dimensions", "Upscale exceeds the 24 MP limit.")
            if (after.width, after.height) != (before.width * step.scale, before.height * step.scale):
                raise CommandExecutionError("invalid_scale_output", "Upscale dimensions are incorrect.")
        elif not after.same_layout(before):
            raise CommandExecutionError("unexpected_resize", "Only upscale may change dimensions.")
        if before.channels == 4:
            reference = before
            if step.name is CommandName.UPSCALE:
                reference = resize_reference(before, after.width, after.height)
            if reference.pixels[3::4] != after.pixels[3::4]:
                raise CommandValidationError(
                    "alpha_changed", "Effect changed transparency outside its contract.",
                )

    def _identity_decision(
        self,
        original: ImageFrame,
        candidate: ImageFrame,
        plan: ProPlan,
        index: int,
    ) -> tuple[ImageFrame, IdentityDecision | None]:
        if not plan.identity.enabled:
            return candidate, None
        if self._identity is None:
            raise CommandUnavailable(
                "identity_model_unavailable", "Approved identity comparison is required before editing.",
                command_index=index,
            )
        settings = IdentityLockArgs(plan.identity.mode, plan.identity.strength)
        outcome = self._identity.enforce(original, candidate, settings, command_index=index)
        return outcome.frame, outcome.decision

    def run(
        self,
        plan: ProPlan,
        original: ImageFrame,
        *,
        quality: RenderQuality = "export",
        is_current: RevisionCheck | None = None,
    ) -> ProExecutionResult:
        if not isinstance(plan, ProPlan) or not isinstance(original, ImageFrame):
            raise CommandValidationError(
                "invalid_execution_input", "A Pro plan and valid frame are required.",
            )
        if quality not in ("preview", "export"):
            raise CommandValidationError("invalid_quality", "Render quality must be preview or export.")
        if plan.identity.enabled and self._identity is None:
            raise CommandUnavailable("identity_model_unavailable", "Identity protection is unavailable.")
        started = self._recorder.start()
        current = original
        reports: list[ProStepReport] = []
        checkpoints: list[ProUndoCheckpoint] = []
        pending_cache: list[tuple[str, ImageFrame]] = []
        fingerprint = plan.fingerprint()
        index = 0
        try:
            for step in plan.steps:
                index = step.index
                if is_current is not None and not is_current():
                    raise CommandUnavailable("stale_preview", "A newer preview superseded this edit.")
                before = current
                cached = False
                if step.name is CommandName.IDENTITYLOCK:
                    candidate = before
                else:
                    handler = self._handlers.get(step.name)
                    if handler is None:
                        raise CommandUnavailable(
                            "command_engine_unavailable", f"/{step.name.value} engine is unavailable.",
                            command_index=index,
                        )
                    if step.name is CommandName.UPSCALE:
                        output_pixels = before.width * step.scale * before.height * step.scale
                        if output_pixels > MAX_IMAGE_PIXELS:
                            raise CommandValidationError("invalid_dimensions", "Upscale exceeds 24 MP.")
                    if self._identity is not None:
                        evidence = self._identity.embedder_evidence
                        cache_key = FrameCache.make_key(
                            before, fingerprint + f":{index}", evidence, quality,
                        )
                        candidate_cached = self._cache.get(cache_key)
                    else:
                        cache_key = None
                        candidate_cached = None
                    if candidate_cached is not None:
                        cached = True
                        candidate = candidate_cached
                    else:
                        try:
                            candidate = handler(before, step, quality)
                        except CommandError:
                            raise
                        except Exception:
                            raise CommandExecutionError(
                                "command_engine_failed", f"/{step.name.value} engine failed.",
                                command_index=index,
                            ) from None
                        self._check_frame(before, candidate, step)
                        if cache_key is not None:
                            pending_cache.append((cache_key, candidate))
                self._check_frame(before, candidate, step)
                current, decision = self._identity_decision(original, candidate, plan, index)
                if (
                    self._face_fixer is not None
                    and step.name is CommandName.CLEANUP
                    and quality == "export"
                ):
                    self._face_fixer.observe(before, current, step.name, decision)
                modified = not before.identical(current)
                reports.append(
                    ProStepReport(index, step.name, step.level.label, modified, cached, decision),
                )
                if modified:
                    checkpoints.append(ProUndoCheckpoint(fingerprint, index, step.name, before, current))
            if is_current is not None and not is_current():
                raise CommandUnavailable("stale_preview", "The preview is no longer current.")
            observation = self._recorder.finish(
                started, quality, self._budget,
                cache_hit=bool(reports) and all(item.cache_hit for item in reports),
                work_steps=len(plan.steps),
            )
            self._undo.commit(plan, tuple(checkpoints))
            for cache_key, prepared_frame in pending_cache:
                self._cache.put(cache_key, prepared_frame)
        except CommandError as error:
            try:
                self._undo.abort(plan, index, error.code)
            except Exception:
                pass
            raise
        except Exception:
            try:
                self._undo.abort(plan, index, "execution_failed")
            except Exception:
                pass
            raise CommandExecutionError(
                "execution_failed", "The edit was not committed; the original is unchanged.",
                command_index=index,
            ) from None
        return ProExecutionResult(plan, current, tuple(reports), observation, len(checkpoints))
