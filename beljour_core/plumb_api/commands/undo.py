"""Transactional, bounded undo-hook interface with in-memory reference stack.

No photos, tokens, embeddings or landmarks are written to storage or logs.
A plan emits checkpoints only after its full execution succeeds.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from .errors import CommandValidationError
from .frames import ImageFrame
from .types import CommandName, CommandPlan


@dataclass(frozen=True, slots=True, repr=False)
class UndoCheckpoint:
    plan_fingerprint: str
    command_index: int
    command: CommandName
    before: ImageFrame
    after: ImageFrame

    @property
    def byte_footprint(self) -> int:
        return self.before.byte_size + self.after.byte_size

    def __repr__(self) -> str:
        return f"UndoCheckpoint(command={self.command.value}, index={self.command_index})"


class UndoHook(Protocol):
    """Commit must be all-or-nothing. Abort is notification, not a partial commit."""

    def commit(self, plan: CommandPlan, checkpoints: tuple[UndoCheckpoint, ...]) -> None: ...

    def abort(self, plan: CommandPlan, command_index: int, reason_code: str) -> None: ...


class NullUndoHook:
    """No history retention; suitable for stateless API plans."""

    def commit(self, plan: CommandPlan, checkpoints: tuple[UndoCheckpoint, ...]) -> None:
        return None

    def abort(self, plan: CommandPlan, command_index: int, reason_code: str) -> None:
        return None


class MemoryUndoStack:
    """Bounded immutable images; last successful edit is first undone.

    A batch is validated before any stack mutation. Clearing a photo should
    call clear() and dispose of the owning session's stack object.
    """

    def __init__(self, *, max_bytes: int = 128 * 1024 * 1024, max_steps: int = 24) -> None:
        if type(max_bytes) is not int or max_bytes < 1:
            raise CommandValidationError(
                "invalid_history_budget",
                "Undo memory budget must be positive.",
            )
        if type(max_steps) is not int or max_steps < 1:
            raise CommandValidationError("invalid_history_steps", "Undo step limit must be positive.")
        self._max_bytes = max_bytes
        self._max_steps = max_steps
        self._back: list[UndoCheckpoint] = []
        self._forward: list[UndoCheckpoint] = []
        self._aborts: list[tuple[str, int, str]] = []

    def commit(self, plan: CommandPlan, checkpoints: tuple[UndoCheckpoint, ...]) -> None:
        if any(record.plan_fingerprint != plan.fingerprint() for record in checkpoints):
            raise CommandValidationError(
                "history_plan_mismatch",
                "Undo checkpoint does not match the plan.",
            )
        if any(
            record.command_index < 0 or record.command_index >= len(plan.steps)
            for record in checkpoints
        ):
            raise CommandValidationError("history_index_mismatch", "Undo checkpoint index is invalid.")
        if any(record.command != plan.steps[record.command_index].name for record in checkpoints):
            raise CommandValidationError(
                "history_command_mismatch",
                "Undo checkpoint has the wrong command.",
            )
        for position, record in enumerate(checkpoints):
            if position > 0:
                previous = checkpoints[position - 1]
                if record.command_index <= previous.command_index:
                    raise CommandValidationError(
                        "history_order_mismatch", "Undo checkpoint order is invalid.",
                    )
                if not record.before.identical(previous.after):
                    raise CommandValidationError(
                        "history_frame_mismatch", "Undo checkpoint continuity was broken.",
                    )
            if record.byte_footprint > self._max_bytes:
                raise CommandValidationError(
                    "history_capacity_exceeded",
                    "Undo capacity cannot hold this full-resolution edit.",
                )
        pending = self._back + list(checkpoints)
        while pending and (len(pending) > self._max_steps or self._size(pending) > self._max_bytes):
            pending.pop(0)
        self._back = pending
        if checkpoints:
            self._forward.clear()

    @staticmethod
    def _size(records: list[UndoCheckpoint]) -> int:
        return sum(record.byte_footprint for record in records)

    def abort(self, plan: CommandPlan, command_index: int, reason_code: str) -> None:
        self._aborts.append((plan.fingerprint(), command_index, reason_code))
        if len(self._aborts) > 20:
            self._aborts.pop(0)

    def undo(self) -> ImageFrame | None:
        if not self._back:
            return None
        item = self._back.pop()
        self._forward.append(item)
        return item.before

    def redo(self) -> ImageFrame | None:
        if not self._forward:
            return None
        item = self._forward.pop()
        self._back.append(item)
        return item.after

    def clear(self) -> None:
        self._back.clear()
        self._forward.clear()
        self._aborts.clear()

    @property
    def undo_count(self) -> int:
        return len(self._back)

    @property
    def redo_count(self) -> int:
        return len(self._forward)

    @property
    def retained_bytes(self) -> int:
        return self._size(self._back) + self._size(self._forward)

    @property
    def abort_codes(self) -> tuple[str, ...]:
        return tuple(item[2] for item in self._aborts)
