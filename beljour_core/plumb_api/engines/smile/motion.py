'W58 checked-frame temporal stability utilities. Author: John Khan.'

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np

from .annotations import centre, sequence_hash
from .contracts import SmileAnnotation


@dataclass(frozen=True)
class MotionMetrics:
    frames: int
    max_centre_jump: float
    mean_centre_jump: float
    max_width_change: float
    mean_width_change: float
    jitter_score: float
    evidence_hash: str
    automatic_tracking: bool

def _width(annotation: SmileAnnotation) -> float:
    p = np.asarray(annotation.teeth, dtype=np.float64)
    return float(np.max(p[:, 0])) - float(np.min(p[:, 0]))

def metrics(annotations: Sequence[SmileAnnotation]) -> MotionMetrics:
    if len(annotations) < 2:
        raise ValueError('at least two checked frame annotations are required')
    centres = [centre(item.teeth) for item in annotations]
    widths = [_width(item) for item in annotations]
    jumps = [float(np.linalg.norm(np.subtract(a, b))) for a, b in zip(centres, centres[1:], strict=False)]
    width_changes = [abs(a - b) for a, b in zip(widths, widths[1:], strict=False)]
    max_jump = max(jumps, default=0.0)
    max_width = max(width_changes, default=0.0)
    jitter = float(np.clip(max_jump / 0.03 + max_width / 0.05, 0.0, 2.0) / 2.0)
    return MotionMetrics(frames=len(annotations), max_centre_jump=max_jump, mean_centre_jump=float(np.mean(jumps)) if jumps else 0.0, max_width_change=max_width, mean_width_change=float(np.mean(width_changes)) if width_changes else 0.0, jitter_score=jitter, evidence_hash=sequence_hash(annotations), automatic_tracking=False)

def acceptance(row: MotionMetrics, max_jump: float=0.035, max_width_change: float=0.045) -> tuple[bool, list[str]]:
    failures: list[str] = []
    if row.frames < 2:
        failures.append('fewer than two checked frames')
    if row.max_centre_jump > max_jump:
        failures.append('checked-frame centre jump exceeds the stability threshold')
    if row.max_width_change > max_width_change:
        failures.append('checked-frame width change exceeds the stability threshold')
    if row.automatic_tracking:
        failures.append('unverified automatic tracking was used')
    return (not failures, failures)

def report(annotations: Sequence[SmileAnnotation]) -> dict[str, object]:
    row = metrics(annotations)
    passed, failures = acceptance(row)
    return {'frames': row.frames, 'max_centre_jump': row.max_centre_jump, 'mean_centre_jump': row.mean_centre_jump, 'max_width_change': row.max_width_change, 'mean_width_change': row.mean_width_change, 'jitter_score': row.jitter_score, 'evidence_hash': row.evidence_hash, 'automatic_tracking': row.automatic_tracking, 'passed': passed, 'failures': failures, 'label': 'Checked-frame stability diagnostic; real smile dynamics still need professional review.'}
