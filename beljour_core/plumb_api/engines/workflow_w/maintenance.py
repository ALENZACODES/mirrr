'Deterministic local maintenance calendar utilities for W99. Author: John Khan.'
from __future__ import annotations

import calendar
from dataclasses import asdict, dataclass
from datetime import date, timedelta


@dataclass(frozen=True)
class MaintenanceItem:
    index: int
    due: date
    earliest: date
    latest: date
    service: str
    estimate: bool
    completed: bool = False

def _date(value: str | date) -> date:
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError('date must be ISO YYYY-MM-DD') from exc

def schedule(start: str | date, service: str, interval_weeks: int, count: int=8, flexibility_days: int=7) -> tuple[MaintenanceItem, ...]:
    if not service or len(service) > 80:
        raise ValueError('service is required')
    if interval_weeks < 1 or interval_weeks > 104:
        raise ValueError('interval_weeks outside supported range')
    if count < 1 or count > 24:
        raise ValueError('count outside supported range')
    if flexibility_days < 0 or flexibility_days > 31:
        raise ValueError('flexibility_days outside supported range')
    base = _date(start)
    rows: list[MaintenanceItem] = []
    for index in range(count):
        due = base + timedelta(weeks=interval_weeks * index)
        rows.append(MaintenanceItem(index, due, due - timedelta(days=flexibility_days), due + timedelta(days=flexibility_days), service, True))
    return tuple(rows)

def mark_complete(rows: tuple[MaintenanceItem, ...], index: int) -> tuple[MaintenanceItem, ...]:
    if index < 0 or index >= len(rows):
        raise IndexError('maintenance index outside range')
    result: list[MaintenanceItem] = []
    for row in rows:
        result.append(MaintenanceItem(row.index, row.due, row.earliest, row.latest, row.service, row.estimate, row.completed or row.index == index))
    return tuple(result)

def upcoming(rows: tuple[MaintenanceItem, ...], today: str | date) -> MaintenanceItem | None:
    current = _date(today)
    candidates = [row for row in rows if not row.completed and row.latest >= current]
    if not candidates:
        return None
    return min(candidates, key=lambda row: row.due)

def month_view(rows: tuple[MaintenanceItem, ...], year: int, month: int) -> tuple[dict[str, object], ...]:
    if month < 1 or month > 12:
        raise ValueError('month must be 1..12')
    _, last_day = calendar.monthrange(year, month)
    first = date(year, month, 1)
    last = date(year, month, last_day)
    return tuple({**asdict(row), 'due': row.due.isoformat(), 'earliest': row.earliest.isoformat(), 'latest': row.latest.isoformat()} for row in rows if first <= row.due <= last)

def export(rows: tuple[MaintenanceItem, ...]) -> dict[str, object]:
    return {'schema': 'beljour.maintenance-calendar.v1', 'items': [{'index': row.index, 'due': row.due.isoformat(), 'earliest': row.earliest.isoformat(), 'latest': row.latest.isoformat(), 'service': row.service, 'estimate': row.estimate, 'completed': row.completed} for row in rows], 'network': False, 'label': 'estimated local maintenance calendar'}
