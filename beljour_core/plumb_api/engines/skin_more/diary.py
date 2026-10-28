'On-device-only diary visualisation helpers. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DiaryPoint:
    index: int
    value: float
    baseline: float
    delta: float

def aligned_series(values: tuple[float, ...], window: int=5) -> list[DiaryPoint]:
    if not values:
        return []
    out = []
    for i, v in enumerate(values):
        lo = max(0, i - window // 2)
        hi = min(len(values), i + window // 2 + 1)
        base = sum(values[lo:hi]) / (hi - lo)
        out.append(DiaryPoint(i, v, base, v - base))
    return out

def pattern_summary(values: tuple[float, ...]) -> dict[str, float | int | str]:
    pts = aligned_series(values)
    if not pts:
        return {'samples': 0, 'range': 0.0, 'mean': 0.0, 'label': 'No health prediction is produced.'}
    mean = sum(p.value for p in pts) / len(pts)
    return {'samples': len(pts), 'range': max(values) - min(values), 'mean': mean, 'label': 'Your own local observations only; no fertility or medical prediction.'}

def export_rows(values: tuple[float, ...]) -> list[dict[str, float | int]]:
    return [{'index': p.index, 'value': p.value, 'local_baseline': p.baseline, 'delta': p.delta} for p in aligned_series(values)]
