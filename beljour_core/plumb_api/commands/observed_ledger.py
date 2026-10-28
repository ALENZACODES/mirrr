"""Photo-scoped lock-evidence ledger for actual guarded preview/export runs.

All frame digests stay private to this in-memory session. The public report has
no image bytes, image digests, paths, embeddings or person identifiers.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

from .errors import CommandUnavailable, CommandValidationError
from .frames import ImageFrame
from .guarded import ProExecutionResult
from .lock_matrix import COMMANDS, LEVELS, LockMatrixReport, LockObservation, evaluate_command_locks
from .observed_lock import LockCaptureOptions, collect_guarded_observation
from .pose import PoseReport
from .studio import StudioReport
from .types import CommandName


@dataclass(frozen=True, slots=True)
class ObservationTicket:
    revision: int

    def __post_init__(self) -> None:
        if type(self.revision) is not int or self.revision < 1:
            raise CommandValidationError(
                "invalid_ticket", "Observation revision must be a positive integer.",
            )


@dataclass(frozen=True, slots=True)
class ObservationLedgerState:
    open: bool
    revision: int
    observed: int
    commands_observed: int
    levels_missing: int

    def public_metadata(self) -> dict[str, object]:
        return {
            "open": self.open,
            "revision": self.revision,
            "observed": self.observed,
            "commands_observed": self.commands_observed,
            "levels_missing": self.levels_missing,
            "release_qualified": False,
        }


class ObservedLockLedger:
    """Small bounded in-memory audit, not the external real-face release ledger.

    Records remain one-per-command-per-level. A stale callback or a second
    photograph cannot contaminate the current lock matrix. There is no disk
    serialization or hidden store of user photos.
    """

    def __init__(self) -> None:
        self._digest: bytes | None = None
        self._revision = 0
        self._rows: dict[tuple[CommandName, int], LockObservation] = {}

    @staticmethod
    def _digest_frame(source: ImageFrame) -> bytes:
        if not isinstance(source, ImageFrame):
            raise CommandValidationError("invalid_frame", "Observed lock needs a checked image.")
        digest = hashlib.sha256()
        digest.update(source.width.to_bytes(4, "big"))
        digest.update(source.height.to_bytes(4, "big"))
        digest.update(source.channels.to_bytes(1, "big"))
        digest.update(source.pixels)
        return digest.digest()

    def open_photo(self, source: ImageFrame) -> ObservationTicket:
        digest = self._digest_frame(source)
        self._digest = digest
        self._rows.clear()
        self._revision += 1
        return ObservationTicket(self._revision)

    def close_photo(self) -> None:
        self._digest = None
        self._rows.clear()
        self._revision += 1

    def ticket(self) -> ObservationTicket:
        if self._digest is None:
            raise CommandUnavailable("photo_missing", "Open a photo before collecting evidence.")
        return ObservationTicket(self._revision)

    def _check_ticket(self, ticket: ObservationTicket, source: ImageFrame) -> None:
        if not isinstance(ticket, ObservationTicket):
            raise CommandValidationError("invalid_ticket", "A versioned observation ticket is required.")
        if self._digest is None or ticket.revision != self._revision:
            raise CommandUnavailable(
                "stale_preview", "Photo changed before lock evidence could be recorded.",
            )
        if self._digest != self._digest_frame(source):
            raise CommandUnavailable("photo_mismatch", "Evidence belongs to a different photo.")

    def observe(
        self,
        ticket: ObservationTicket,
        source: ImageFrame,
        preview: ProExecutionResult,
        exported: ProExecutionResult,
        *,
        studio: StudioReport | None = None,
        pose: PoseReport | None = None,
        options: LockCaptureOptions | None = None,
    ) -> LockObservation:
        """Commit only a complete, checked pair; no partial observations persist."""
        self._check_ticket(ticket, source)
        observation = collect_guarded_observation(
            source, preview, exported, studio=studio, pose=pose, options=options,
        )
        key = (observation.command, observation.level_tenths)
        if key in self._rows:
            raise CommandValidationError(
                "duplicate_lock_evidence", "A command strength already has observed evidence.",
            )
        if len(self._rows) >= len(COMMANDS) * len(LEVELS):
            raise CommandValidationError("invalid_lock_matrix", "Lock matrix capacity exceeded.")
        self._check_ticket(ticket, source)
        self._rows[key] = observation
        return observation

    @property
    def state(self) -> ObservationLedgerState:
        commands = {command for command, _ in self._rows}
        return ObservationLedgerState(
            self._digest is not None,
            self._revision,
            len(self._rows),
            len(commands),
            len(COMMANDS) * len(LEVELS) - len(self._rows),
        )

    def snapshot(self) -> tuple[LockObservation, ...]:
        """Return photo-free evidence, ordered independent of command execution."""
        if self._digest is None:
            raise CommandUnavailable("photo_missing", "Lock observation session is closed.")
        return tuple(
            self._rows[key]
            for key in ((command, level) for command in COMMANDS for level in LEVELS)
            if key in self._rows
        )

    def report(self) -> LockMatrixReport:
        return evaluate_command_locks(self.snapshot())
