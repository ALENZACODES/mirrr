'Grey transition, regrowth and maintenance timelines. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TimelinePoint:
    month: int
    natural_share: float
    coloured_share: float
    visible_regrowth_cm: float
    note: str

def grey_transition(start_share: float, months: int=18, growth_cm_month: float=1.1) -> tuple[TimelinePoint, ...]:
    months = max(1, min(months, 36))
    start = max(0.0, min(start_share, 1.0))
    points: list[TimelinePoint] = []
    for month in range(months + 1):
        progress = month / months
        natural = start + (1 - start) * progress
        points.append(TimelinePoint(month, natural, 1 - natural, month * growth_cm_month, 'estimate; actual growth varies'))
    return tuple(points)

def monotone(points: tuple[TimelinePoint, ...]) -> bool:
    return all(a.natural_share <= b.natural_share for a, b in zip(points, points[1:], strict=False))

def postpartum_regrowth(month: int, amount: float) -> dict[str, float | str]:
    m = max(0, min(int(month), 24))
    phase = min(m / 18.0, 1.0)
    density = amount * (0.15 + 0.85 * phase)
    length_cm = m * 1.0
    return {'month': float(m), 'relative_density': density, 'estimated_length_cm': length_cm, 'label': 'visual estimate only; not medical advice'}

def humidity_forecast(humidity: float, curl_strength: float) -> dict[str, float | str]:
    h = max(0.0, min(humidity, 100.0)) / 100.0
    c = max(0.0, min(curl_strength, 1.0))
    expansion = h * (0.35 + 0.65 * c)
    definition = max(0.0, 1.0 - h * (0.25 + 0.45 * c))
    return {'humidity': h * 100, 'frizz_risk': expansion, 'definition_retention': definition, 'label': 'estimate from user-entered humidity'}
