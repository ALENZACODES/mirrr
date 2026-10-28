'Versioned Shade Passport validation, canonical export and migration. Author: John Khan.'
from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass
from typing import Any

SCHEMA = 'beljour.shade-passport.v1'

@dataclass(frozen=True)
class ShadePassport:
    depth: float
    undertone: str
    hair_base: str
    allergens: tuple[str, ...]
    measured_on: str
    notes: str = ''

def _depth(value: Any) -> float:
    if isinstance(value, bool):
        raise ValueError('depth must be numeric')
    number = float(value)
    if not 0 <= number <= 100:
        raise ValueError('depth must be 0..100')
    return number

def _undertone(value: Any) -> str:
    text = str(value)
    if text not in {'cool', 'neutral', 'warm', 'olive'}:
        raise ValueError('unsupported undertone')
    return text

def _allergens(value: Any) -> tuple[str, ...]:
    if not isinstance(value, Sequence) or isinstance(value, (str, bytes)):
        raise ValueError('allergens must be an array')
    rows = tuple(sorted({str(item).strip() for item in value if str(item).strip()}))
    if len(rows) > 50 or any(len(item) > 80 for item in rows):
        raise ValueError('allergen list outside supported bounds')
    return rows

def parse(value: Mapping[str, Any]) -> ShadePassport:
    unknown = set(value) - {'schema', 'depth', 'undertone', 'hair_base', 'allergens', 'measured_on', 'notes', 'privacy', 'sha256'}
    if unknown:
        raise ValueError(f'unknown passport fields: {sorted(unknown)}')
    if value.get('schema', SCHEMA) != SCHEMA:
        raise ValueError('unsupported Shade Passport schema')
    hair_base = str(value.get('hair_base', ''))
    measured_on = str(value.get('measured_on', ''))
    notes = str(value.get('notes', ''))
    if len(hair_base) > 80 or len(measured_on) > 32 or len(notes) > 1000:
        raise ValueError('passport text outside supported bounds')
    return ShadePassport(_depth(value.get('depth', 0)), _undertone(value.get('undertone', 'neutral')), hair_base, _allergens(value.get('allergens', [])), measured_on, notes)

def payload(passport: ShadePassport) -> dict[str, Any]:
    return {'schema': SCHEMA, **asdict(passport), 'privacy': 'local export; no network transmission'}

def canonical(passport: ShadePassport) -> str:
    return json.dumps(payload(passport), sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def fingerprint(passport: ShadePassport) -> str:
    return hashlib.sha256(canonical(passport).encode()).hexdigest()

def export(passport: ShadePassport) -> str:
    body = payload(passport)
    body['sha256'] = fingerprint(passport)
    return json.dumps(body, indent=2, sort_keys=True, ensure_ascii=False)

def import_export(text: str) -> ShadePassport:
    raw = json.loads(text)
    if not isinstance(raw, dict):
        raise ValueError('Shade Passport must be an object')
    expected = raw.get('sha256')
    if not isinstance(expected, str) or len(expected) != 64:
        raise ValueError('Shade Passport integrity fingerprint missing')
    passport = parse(raw)
    if fingerprint(passport) != expected:
        raise ValueError('Shade Passport integrity check failed')
    return passport

def redacted_summary(passport: ShadePassport) -> dict[str, Any]:
    return {'schema': SCHEMA, 'depth_band': int(passport.depth // 10) * 10, 'undertone': passport.undertone, 'allergen_count': len(passport.allergens), 'has_hair_base': bool(passport.hair_base), 'has_notes': bool(passport.notes), 'privacy': 'summary excludes free-text values'}
