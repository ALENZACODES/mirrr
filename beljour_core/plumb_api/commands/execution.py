"""Pure ordered command-plan runner; injected engines, no providers or I/O.

A failed plan leaves caller-held original bytes unchanged and commits no undo
steps. The hook's commit method must provide an atomic history transaction.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass

from .errors import CommandError, CommandExecutionError, CommandUnavailable, CommandValidationError
from .frames import MAX_IMAGE_PIXELS, ImageFrame
from .identity import IdentityDecision, IdentityGuard
from .types import CommandArgs, CommandName, CommandPlan, IdentityLockArgs, UpscaleArgs
from .undo import NullUndoHook, UndoCheckpoint, UndoHook

OperationHandler = Callable[[ImageFrame, CommandArgs], ImageFrame]


@dataclass(frozen=True, slots=True)
class StepReport:
    index: int
    command: CommandName
    modified: bool
    output_width: int
    output_height: int
    identity: IdentityDecision | None = None

    def public_metadata(self) -> dict[str, object]:
        return {
            "index": self.index,
            "command": self.command.value,
            "modified": self.modified,
            "output_width": self.output_width,
            "output_height": self.output_height,
            "identity": self.identity.public_metadata() if self.identity is not None else None,
        }


@dataclass(frozen=True, slots=True, repr=False)
class ExecutionResult:
    plan: CommandPlan
    image: ImageFrame
    steps: tuple[StepReport, ...]
    undo_steps: int

    def public_metadata(self) -> dict[str, object]:
        return {
            "plan_fingerprint": self.plan.fingerprint(),
            "steps": [step.public_metadata() for step in self.steps],
            "undo_steps": self.undo_steps,
        }

    def __repr__(self) -> str:
        return f"ExecutionResult(steps={len(self.steps)}, undo_steps={self.undo_steps})"


class CommandExecutor:
    """Engine adapters must be injected from supported package exports.

    /identitylock evaluates the ORIGINAL input against all edits made up to its
    exact position; later commands aren't retroactively protected. Call it
    last to cover a whole chain. No implicit provider or weight loading occurs.
    """

    def __init__(
        self,
        *,
        handlers: Mapping[CommandName, OperationHandler] | None = None,
        identity: IdentityGuard | None = None,
        undo: UndoHook | None = None,
    ) -> None:
        self._handlers = dict(handlers) if handlers is not None else {}
        if CommandName.IDENTITYLOCK in self._handlers:
            raise CommandValidationError(
                "identity_override",
                "Identity lock may not be overridden by an effect handler.",
            )
        self._identity = identity
        self._undo: UndoHook = undo if undo is not None else NullUndoHook()

    @staticmethod
    def _checked_output(
        before: ImageFrame, after: ImageFrame, name: CommandName, args: CommandArgs,
    ) -> None:
        if not isinstance(after, ImageFrame):
            raise CommandExecutionError("invalid_engine_output", "An effect returned an invalid image.")
        if after.channels != before.channels:
            raise CommandExecutionError(
                "channels_changed",
                "An effect changed the image channel format.",
            )
        if name is CommandName.UPSCALE:
            if not isinstance(args, UpscaleArgs):
                raise CommandValidationError("argument_mismatch", "Upscale requires scale settings.")
            expected = (before.width * args.scale, before.height * args.scale)
            if (after.width, after.height) != expected:
                raise CommandExecutionError(
                    "invalid_scale_output",
                    "Upscale output dimensions do not match the plan.",
                )
        elif not after.same_layout(before):
            raise CommandExecutionError(
                "unexpected_resize",
                "This command cannot change image dimensions.",
            )

    def _apply(
        self,
        original: ImageFrame,
        before: ImageFrame,
        name: CommandName,
        args: CommandArgs,
        index: int,
    ) -> tuple[ImageFrame, IdentityDecision | None]:
        if name is CommandName.IDENTITYLOCK:
            if self._identity is None:
                raise CommandUnavailable(
                    "identity_model_unavailable",
                    "Identity lock requires an approved face embedder.",
                    command_index=index,
                )
            if not isinstance(args, IdentityLockArgs):
                raise CommandValidationError("argument_mismatch", "Identity lock settings are invalid.")
            identity_outcome = self._identity.enforce(original, before, args, command_index=index)
            return identity_outcome.frame, identity_outcome.decision
        handler = self._handlers.get(name)
        if handler is None:
            raise CommandUnavailable(
                "command_engine_unavailable",
                f"/{name.value} has no approved engine installed. The original is unchanged.",
                command_index=index,
            )
        if name is CommandName.UPSCALE and isinstance(args, UpscaleArgs):
            if before.width * args.scale * before.height * args.scale > MAX_IMAGE_PIXELS:
                raise CommandValidationError("invalid_dimensions", "Upscale would exceed the 24 MP cap.")
        try:
            result = handler(before, args)
        except CommandError:
            raise
        except Exception:
            raise CommandExecutionError(
                "command_engine_failed",
                f"/{name.value} failed. The original is unchanged.",
                command_index=index,
            ) from None
        self._checked_output(before, result, name, args)
        return result, None

    def run(self, plan: CommandPlan, original: ImageFrame) -> ExecutionResult:
        if not isinstance(plan, CommandPlan) or not isinstance(original, ImageFrame):
            raise CommandValidationError(
                "invalid_execution_input",
                "A typed plan and RGB/RGBA image are required.",
            )
        current = original
        reports: list[StepReport] = []
        checkpoints: list[UndoCheckpoint] = []
        fingerprint = plan.fingerprint()
        index = 0
        try:
            for step in plan.steps:
                index = step.index
                before = current
                current, identity = self._apply(original, before, step.name, step.args, step.index)
                modified = not current.identical(before)
                reports.append(
                    StepReport(index, step.name, modified, current.width, current.height, identity),
                )
                if modified:
                    checkpoints.append(UndoCheckpoint(fingerprint, index, step.name, before, current))
            self._undo.commit(plan, tuple(checkpoints))
        except CommandError as error:
            try:
                self._undo.abort(plan, index, error.code)
            except Exception:
                pass  # An abort callback must never expose image bytes or mask the error.
            raise
        except Exception:
            try:
                self._undo.abort(plan, index, "undo_hook_failed")
            except Exception:
                pass  # Preserve fail-closed behaviour with a defective injected hook.
            raise CommandExecutionError(
                "undo_hook_failed",
                "Undo transaction failed. The edit was not committed.",
                command_index=index,
            ) from None
        return ExecutionResult(plan, current, tuple(reports), len(checkpoints))
