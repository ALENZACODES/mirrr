"""Measure five Pro Commands using their actual guarded execution surface.

The synthetic sweep checks engineering contracts only. Actual real-face
acceptance and commercial-model qualification remain separate operations.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Literal

from .errors import CommandError, CommandValidationError
from .frames import ImageFrame
from .lock_matrix import COMMANDS, LEVELS, LockMatrixReport, LockObservation
from .observed_ledger import ObservedLockLedger
from .observed_lock import LockCaptureOptions
from .pro_plan import parse_pro_commands
from .r2h_session import R2HSession
from .types import CommandName


@dataclass(frozen=True, slots=True)
class SweepProblem:
    command: CommandName
    level_tenths: int
    error_code: str

    def public_metadata(self) -> dict[str, object]:
        return {"command": self.command.value, "level_tenths": self.level_tenths,
                "error_code": self.error_code}


@dataclass(frozen=True, slots=True)
class ObservedSweep:
    attempted: int
    captured: int
    cancelled: bool
    problems: tuple[SweepProblem, ...]
    report: LockMatrixReport
    source: Literal["actual_guarded_synthetic_or_local"] = "actual_guarded_synthetic_or_local"
    release_qualified: Literal[False] = False
    observations: tuple[LockObservation, ...] = ()

    def public_metadata(self) -> dict[str, object]:
        return {
            "source": self.source,
            "attempted": self.attempted,
            "captured": self.captured,
            "cancelled": self.cancelled,
            "problems": [entry.public_metadata() for entry in self.problems],
            "report": self.report.public_metadata(),
            "release_qualified": False,
        }


def run_observed_sweep(
    session: R2HSession,
    source: ImageFrame,
    *,
    commands: tuple[CommandName, ...] = COMMANDS,
    levels: tuple[int, ...] = LEVELS,
    current: Callable[[], bool] | None = None,
    checked_protected_regions: bool = False,
) -> ObservedSweep:
    """Never substitutes a synthetic proxy for an actual guarded frame result.

    Every pair is rendered separately through the same session and immutable
    recipe. Execution failures remain explicit misses in the resulting matrix.
    The caller must keep the session open on the supplied photo.
    """
    if not isinstance(session, R2HSession) or not isinstance(source, ImageFrame):
        raise CommandValidationError("invalid_sweep", "A local session and checked photo are required.")
    if (
        not isinstance(commands, tuple)
        or not commands
        or len(commands) > len(COMMANDS)
        or len(set(commands)) != len(commands)
        or any(not isinstance(entry, CommandName) for entry in commands)
        or not isinstance(levels, tuple)
        or not levels
        or len(levels) > len(LEVELS)
        or len(set(levels)) != len(levels)
        or any(type(level) is not int or level not in LEVELS for level in levels)
        or type(checked_protected_regions) is not bool
    ):
        raise CommandValidationError("invalid_sweep", "Sweep commands, levels or regions are invalid.")
    ledger = ObservedLockLedger()
    ledger.open_photo(source)
    attempted = 0
    missing: list[SweepProblem] = []
    cancelled = False
    for command in commands:
        if cancelled:
            break
        for level in levels:
            if current is not None and not current():
                cancelled = True
                break
            attempted += 1
            text = f"/{command.value} level={level / 10:.1f}"
            if command is CommandName.UPSCALE:
                text += " scale=2x"
            try:
                plan = parse_pro_commands(text)
                preview = session.run(plan, quality="preview", is_current=current)
                exported = session.run(plan, quality="export", is_current=current)
                studio = (
                    session.studio_processor.last_report
                    if command is CommandName.STUDIOQUALITY else None
                )
                pose = session.pose_processor.last_report if command is CommandName.POSEONLY else None
                ledger.observe(
                    ledger.ticket(), source, preview, exported, studio=studio, pose=pose,
                    options=LockCaptureOptions(
                        checked_protected_regions=checked_protected_regions,
                        neutral_upscale_detail=True,
                        observed_on_device=False,
                    ),
                )
            except CommandError as exc:
                missing.append(SweepProblem(command, level, exc.code))
                if exc.code == "stale_preview":
                    cancelled = True
                    break
            except Exception:
                missing.append(SweepProblem(command, level, "unexpected_failure"))
                cancelled = True
                break
    observed = ledger.snapshot()
    report = ledger.report()
    return ObservedSweep(attempted, len(observed), cancelled, tuple(missing), report,
                         observations=observed)
