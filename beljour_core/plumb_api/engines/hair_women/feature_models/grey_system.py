'Grey-blending and transition planning with neutral choices. Author: John Khan.'
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class GreyChoice:
    id: str
    label: str
    colour_fraction: float
    natural_fraction: float
    maintenance_weeks: int | None

@dataclass(frozen=True)
class GreyMonth:
    month: int
    natural_fraction: float
    coloured_fraction: float
    regrowth_cm: float
    transition_stage: str

def choices(observed_grey: float) -> tuple[GreyChoice, ...]:
    share = min(1.0, max(0.0, observed_grey))
    return (GreyChoice('keep', 'Keep observed grey', 0.0, share, None), GreyChoice('blend', 'Blend with observed grey', 0.45, max(share, 0.35), 8), GreyChoice('cover', 'Colour coverage preview', 0.82, max(0.08, share * 0.2), 5), GreyChoice('grow_out', 'Grow-out transition', 0.0, share, 10))

def timeline(observed_grey: float, months: int=18, growth_cm: float=1.1) -> tuple[GreyMonth, ...]:
    if not math.isfinite(growth_cm) or growth_cm <= 0 or growth_cm > 2.5:
        raise ValueError('growth_cm outside supported range')
    start = min(1.0, max(0.0, observed_grey))
    count = max(1, min(int(months), 36))
    rows: list[GreyMonth] = []
    for month in range(count + 1):
        progress = month / count
        eased = 1.0 - (1.0 - progress) ** 1.35
        natural = start + (1.0 - start) * eased
        if progress < 0.25:
            stage = 'early contrast'
        elif progress < 0.65:
            stage = 'blended transition'
        else:
            stage = 'mostly natural'
        rows.append(GreyMonth(month, natural, 1.0 - natural, month * growth_cm, stage))
    return tuple(rows)

def monotone(rows: tuple[GreyMonth, ...]) -> bool:
    return all(b.natural_fraction + 1e-12 >= a.natural_fraction for a, b in zip(rows, rows[1:], strict=False))

def neutral_copy() -> tuple[str, ...]:
    return ('Keeping grey is an equal option.', 'Blending, coverage and grow-out are appearance choices, not age-correction scores.', 'Timeline values are estimates and actual growth varies.')
