'W58 smile-in-motion from checked frame annotations only. Author: John Khan.'

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from ..contracts import SmileAnnotation
from ..motion import acceptance, metrics


@dataclass(frozen=True)
class Result:
    frames: int
    centre_travel_max: float
    width_change_max: float
    automatic_tracking: bool
    passed: bool
    evidence_hash: str
    failures: tuple[str, ...]

def assess(frames: Sequence[SmileAnnotation], adult_confirmed: bool=False) -> Result:
    if not adult_confirmed:
        raise PermissionError('18+ confirmation required for W58')
    row = metrics(frames)
    passed, failures = acceptance(row)
    return Result(row.frames, row.max_centre_jump, row.max_width_change, False, passed, row.evidence_hash, tuple(failures))

def pass_definition() -> str:
    return 'two+ time-ordered checked frames, bounded movement, no automatic tracking/model claim'
