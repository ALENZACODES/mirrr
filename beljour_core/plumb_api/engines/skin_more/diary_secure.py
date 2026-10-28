'Local-only W83 observation diary validation and export. Author: John Khan.\n\nThis module stores no data by itself. Callers provide in-memory entries and may\nserialize them only after explicit user action. It intentionally refuses fields\nthat would turn a cosmetic observation diary into fertility prediction.\n'

from __future__ import annotations

import hashlib
import json
from collections.abc import Iterable, Mapping
from dataclasses import asdict, dataclass
from datetime import UTC, date, datetime

_ALLOWED_OBSERVATIONS = ('dryness', 'oiliness', 'sensitivity', 'redness_appearance', 'breakout_appearance', 'comfort')

_FORBIDDEN_KEYS = {'pregnancy', 'fertility', 'ovulation', 'diagnosis', 'medication', 'disease', 'condition', 'probability', 'risk_score'}

@dataclass(frozen=True)
class DiaryEntry:
    day: str
    observations: tuple[tuple[str, float], ...]
    note: str = ''
    cycle_day: int | None = None
    source: str = 'self_observation'

@dataclass(frozen=True)
class DiarySummary:
    entries: int
    first_day: str | None
    last_day: str | None
    means: tuple[tuple[str, float], ...]
    ranges: tuple[tuple[str, float, float], ...]
    cycle_day_entries: int
    predictive: bool = False

def _day(value: str) -> str:
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError('day must be ISO YYYY-MM-DD') from exc
    if parsed.year < 2000 or parsed.year > 2100:
        raise ValueError('day outside supported range')
    return parsed.isoformat()

def _value(value: object) -> float:
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise ValueError('observation values must be numeric')
    number = float(value)
    if not 0 <= number <= 1:
        raise ValueError('observation values must be in [0,1]')
    return number

def make_entry(day: str, observations: Mapping[str, float], note: str='', cycle_day: int | None=None) -> DiaryEntry:
    unknown = set(observations) - set(_ALLOWED_OBSERVATIONS)
    if unknown:
        raise ValueError(f'unsupported observation fields: {sorted(unknown)}')
    if not observations:
        raise ValueError('at least one observation is required')
    if cycle_day is not None and (not 1 <= int(cycle_day) <= 60):
        raise ValueError('cycle_day must be 1..60 when provided')
    clean_note = str(note).strip()
    if len(clean_note) > 500:
        raise ValueError('note exceeds 500 characters')
    lower = clean_note.lower()
    if any(key in lower for key in ('pregnan', 'ovulat', 'fertil', 'diagnos')):
        raise ValueError('notes cannot be used for fertility or diagnosis fields')
    pairs = tuple(sorted((str(k), _value(v)) for k, v in observations.items()))
    return DiaryEntry(_day(day), pairs, clean_note, int(cycle_day) if cycle_day is not None else None)

def validate_payload(payload: Mapping[str, object]) -> DiaryEntry:
    forbidden = _FORBIDDEN_KEYS.intersection(str(k).lower() for k in payload)
    if forbidden:
        raise ValueError(f'forbidden predictive/medical keys: {sorted(forbidden)}')
    observations = payload.get('observations')
    if not isinstance(observations, Mapping):
        raise ValueError('observations must be an object')
    raw_cycle_day = payload.get('cycle_day')
    if raw_cycle_day is not None and (not isinstance(raw_cycle_day, int) or isinstance(raw_cycle_day, bool)):
        raise ValueError('cycle_day must be an integer')
    numeric_observations: dict[str, float] = {}
    for key, value in observations.items():
        if not isinstance(key, str) or not isinstance(value, (int, float)) or isinstance(value, bool):
            raise ValueError('observations must map strings to numeric values')
        numeric_observations[key] = float(value)
    return make_entry(str(payload.get('day', '')), numeric_observations, str(payload.get('note', '')), raw_cycle_day)

def ordered(entries: Iterable[DiaryEntry]) -> tuple[DiaryEntry, ...]:
    rows = tuple(sorted(entries, key=lambda e: e.day))
    if len({e.day for e in rows}) != len(rows):
        raise ValueError('only one diary entry per day is supported')
    return rows

def summary(entries: Iterable[DiaryEntry]) -> DiarySummary:
    rows = ordered(entries)
    values: dict[str, list[float]] = {k: [] for k in _ALLOWED_OBSERVATIONS}
    for row in rows:
        for key, value in row.observations:
            values[key].append(value)
    means = tuple((k, sum(v) / len(v)) for k, v in values.items() if v)
    ranges = tuple((k, min(v), max(v)) for k, v in values.items() if v)
    return DiarySummary(len(rows), rows[0].day if rows else None, rows[-1].day if rows else None, means, ranges, sum(r.cycle_day is not None for r in rows))

def serialise(entries: Iterable[DiaryEntry], consent: bool) -> str:
    if not consent:
        raise PermissionError('explicit local health-data consent is required for diary export')
    rows = ordered(entries)
    payload = {'schema': 'beljour.r16b.skin-diary.v1', 'label': 'SELF-OBSERVATION · NOT MEDICAL ADVICE', 'predictive': False, 'entries': [asdict(e) for e in rows]}
    return json.dumps(payload, sort_keys=True, separators=(',', ':'))

def parse(text: str, consent: bool) -> tuple[DiaryEntry, ...]:
    if not consent:
        raise PermissionError('explicit local health-data consent is required for diary import')
    raw = json.loads(text)
    if raw.get('schema') != 'beljour.r16b.skin-diary.v1':
        raise ValueError('unsupported diary schema')
    if raw.get('predictive') is not False:
        raise ValueError('predictive diary payloads are refused')
    entries = []
    for item in raw.get('entries', []):
        observations = dict(item.get('observations', []))
        entries.append(make_entry(item['day'], observations, item.get('note', ''), item.get('cycle_day')))
    return ordered(entries)

def content_hash(entries: Iterable[DiaryEntry]) -> str:
    payload = json.dumps([asdict(e) for e in ordered(entries)], sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(payload.encode()).hexdigest()

def trend(entries: Iterable[DiaryEntry], field: str) -> dict[str, float | int | None]:
    if field not in _ALLOWED_OBSERVATIONS:
        raise ValueError('unsupported observation field')
    rows = []
    for i, e in enumerate(ordered(entries)):
        values = dict(e.observations)
        if field in values:
            rows.append((i, values[field]))
    if len(rows) < 2:
        return {'points': len(rows), 'slope': None, 'predictive': False}
    xs = [float(x) for x, _ in rows]
    ys = [float(y) for _, y in rows]
    xm = sum(xs) / len(xs)
    ym = sum(ys) / len(ys)
    denom = sum((x - xm) ** 2 for x in xs)
    slope = sum((x - xm) * (y - ym) for x, y in zip(xs, ys, strict=True)) / denom if denom else 0.0
    return {'points': len(rows), 'slope': slope, 'predictive': False}

def export_metadata(entries: Iterable[DiaryEntry]) -> dict[str, object]:
    rows = ordered(entries)
    s = summary(rows)
    return {'schema': 'beljour.r16b.skin-diary.v1', 'entry_count': s.entries, 'content_sha256': content_hash(rows), 'created_at': datetime.now(UTC).isoformat(), 'storage': 'caller-controlled local export', 'prediction': False, 'diagnosis': False}
