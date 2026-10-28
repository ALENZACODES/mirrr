'User-supplied salon estimate arithmetic, no hidden market claims. Author: John Khan.'
from __future__ import annotations


def estimate(low: float, high: float, sessions: int, maintenance_weeks: int) -> dict[str, float | str]:
    if low < 0 or high < low:
        raise ValueError('price band must satisfy 0 <= low <= high')
    if sessions < 1:
        raise ValueError('sessions must be positive')
    visits = max(1, round(52 / max(maintenance_weeks, 1)))
    first_low = low * sessions
    first_high = high * sessions
    return {'initial_low': first_low, 'initial_high': first_high, 'year1_low': first_low + low * visits, 'year1_high': first_high + high * visits, 'maintenance_visits_estimate': float(visits), 'label': 'ESTIMATE from user-entered or sourced price band; no affiliate steering'}
