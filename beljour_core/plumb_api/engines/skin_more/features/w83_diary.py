'W83 local skin-observation diary orchestration. Author: John Khan.'

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

from ..diary_secure import DiaryEntry, serialise, summary, trend


@dataclass(frozen=True)
class Result:
    entries: int
    predictive: bool
    diagnosis: bool
    trend_points: int
    trend_slope: float | None
    passed: bool
    copy: str

def assess(entries: Iterable[DiaryEntry], field: str='dryness') -> Result:
    rows = tuple(entries)
    s = summary(rows)
    t = trend(rows, field)
    copy = 'Local self-observation only. Patterns are descriptive and never fertility or medical predictions.'
    points = t['points']
    slope = t['slope']
    return Result(s.entries, False, False, int(points) if isinstance(points, (int, float)) else 0, float(slope) if isinstance(slope, (int, float)) else None, not s.predictive, copy)

def export(entries: Iterable[DiaryEntry], consent: bool) -> str:
    return serialise(entries, consent)

def pass_definition() -> str:
    return 'explicit consent for import/export, local-only descriptive data, no fertility or medical prediction'
