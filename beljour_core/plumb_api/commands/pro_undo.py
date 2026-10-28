"""Transactional, size-limited undo for exact decimal Pro Command plans.

The plan fingerprint includes the selected tenth and identity override. A failed
or stale render cannot record history. No persistence or diagnostic image dumps.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from .errors import CommandValidationError
from .frames import ImageFrame
from .pro_plan import ProPlan
from .types import CommandName


@dataclass(frozen=True, slots=True, repr=False)
class ProUndoCheckpoint:
    fingerprint: str
    step_index: int
    command: CommandName
    before: ImageFrame
    after: ImageFrame

    @property
    def byte_footprint(self) -> int:
        return self.before.byte_size + self.after.byte_size

    def __repr__(self) -> str:
        return f"ProUndoCheckpoint(index={self.step_index}, command={self.command.value})"


class ProUndoHook(Protocol):
    def commit(self, plan: ProPlan, records: tuple[ProUndoCheckpoint, ...]) -> None: ...

    def abort(self, plan: ProPlan, step_index: int, reason_code: str) -> None: ...


class NullProUndoHook:
    def commit(self, plan: ProPlan, records: tuple[ProUndoCheckpoint, ...]) -> None:
        return None

    def abort(self, plan: ProPlan, step_index: int, reason_code: str) -> None:
        return None


class ProMemoryUndo:
    def __init__(self, *, max_bytes: int = 128 * 1024 * 1024, max_steps: int = 24) -> None:
        if type(max_bytes) is not int or not 1 <= max_bytes <= 512 * 1024 * 1024:
            raise CommandValidationError("invalid_history_budget", "Undo memory budget is invalid.")
        if type(max_steps) is not int or not 1 <= max_steps <= 200:
            raise CommandValidationError("invalid_history_budget", "Undo step count is invalid.")
        self._max_bytes = max_bytes
        self._max_steps = max_steps
        self._undo: list[ProUndoCheckpoint] = []
        self._redo: list[ProUndoCheckpoint] = []
        self._aborted: list[str] = []

    def commit(self, plan: ProPlan, records: tuple[ProUndoCheckpoint, ...]) -> None:
        fingerprint = plan.fingerprint()
        for position, record in enumerate(records):
            if record.fingerprint != fingerprint:
                raise CommandValidationError(
                    "history_plan_mismatch", "Undo fingerprint does not match plan.",
                )
            if not 0 <= record.step_index < len(plan.steps):
                raise CommandValidationError("history_index_mismatch", "Undo index is invalid.")
            if record.command is not plan.steps[record.step_index].name:
                raise CommandValidationError(
                    "history_command_mismatch", "Undo command differs from plan.",
                )
            if record.byte_footprint > self._max_bytes:
                raise CommandValidationError(
                    "history_capacity_exceeded", "Undo frame exceeds memory budget.",
                )
            if position > 0:
                previous = records[position - 1]
                if previous.step_index >= record.step_index:
                    raise CommandValidationError("history_order_mismatch", "Undo step order is invalid.")
                if not record.before.identical(previous.after):
                    raise CommandValidationError("history_frame_mismatch", "Undo frames have a gap.")
        updated = [*self._undo, *records]
        size = sum(item.byte_footprint for item in updated)
        while updated and (len(updated) > self._max_steps or size > self._max_bytes):
            removed = updated.pop(0)
            size -= removed.byte_footprint
        self._undo = updated
        if records:
            self._redo.clear()

    def abort(self, plan: ProPlan, step_index: int, reason_code: str) -> None:
        self._aborted.append(reason_code)
        if len(self._aborted) > 20:
            self._aborted.pop(0)

    def undo(self) -> ImageFrame | None:
        if not self._undo:
            return None
        record = self._undo.pop()
        self._redo.append(record)
        return record.before

    def redo(self) -> ImageFrame | None:
        if not self._redo:
            return None
        record = self._redo.pop()
        self._undo.append(record)
        return record.after

    def clear(self) -> None:
        self._undo.clear()
        self._redo.clear()
        self._aborted.clear()

    @property
    def undo_count(self) -> int:
        return len(self._undo)

    @property
    def redo_count(self) -> int:
        return len(self._redo)

    @property
    def retained_bytes(self) -> int:
        return sum(item.byte_footprint for item in (*self._undo, *self._redo))

    @property
    def abort_codes(self) -> tuple[str, ...]:
        return tuple(self._aborted)
