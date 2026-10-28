'Deterministic grow-out and maintenance calendar. Author: John Khan.'
from __future__ import annotations

from datetime import date, timedelta


def schedule(start: date, interval_weeks: int, occurrences: int=8) -> tuple[dict[str, str | int], ...]:
    if not 1 <= interval_weeks <= 104:
        raise ValueError('maintenance interval outside range')
    count = max(1, min(occurrences, 24))
    rows: list[dict[str, str | int]] = []
    for index in range(count):
        when = start + timedelta(weeks=interval_weeks * index)
        rows.append({'index': index, 'date': when.isoformat(), 'label': 'estimated maintenance date'})
    return tuple(rows)
