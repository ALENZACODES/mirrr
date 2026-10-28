'Privacy-safe local workflow audit records for R17B. Author: John Khan.'
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import Any

_ALLOWED_ACTIONS = frozenset({'passport_export', 'passport_import', 'calendar_build', 'price_estimate', 'recipe_export'})

@dataclass(frozen=True)
class AuditEvent:
    action: str
    feature: str
    status: str
    local_only: bool
    payload_bytes: int
    created_at: str

    def validate(self) -> None:
        if self.action not in _ALLOWED_ACTIONS:
            raise ValueError('unknown workflow action')
        if not self.feature.startswith('W'):
            raise ValueError('feature must use a W id')
        if self.status not in {'ok', 'rejected', 'not_tested'}:
            raise ValueError('unsupported status')
        if not self.local_only:
            raise ValueError('R17 workflow events must be local-only')
        if not 0 <= self.payload_bytes <= 2000000:
            raise ValueError('payload size is outside local workflow limit')
        try:
            datetime.fromisoformat(self.created_at.replace('Z', '+00:00'))
        except ValueError as exc:
            raise ValueError('created_at must be ISO-8601') from exc

def make_event(action: str, feature: str, status: str, payload_bytes: int, *, now: datetime | None=None) -> AuditEvent:
    stamp = (now or datetime.now(UTC)).astimezone(UTC).isoformat().replace('+00:00', 'Z')
    event = AuditEvent(action, feature, status, True, payload_bytes, stamp)
    event.validate()
    return event

def canonical(event: AuditEvent) -> str:
    event.validate()
    return json.dumps(asdict(event), sort_keys=True, separators=(',', ':'))

def fingerprint(event: AuditEvent) -> str:
    return hashlib.sha256(canonical(event).encode()).hexdigest()

def safe_event(event: AuditEvent) -> dict[str, Any]:
    event.validate()
    return {'action': event.action, 'feature': event.feature, 'status': event.status, 'local_only': True, 'payload_band': _payload_band(event.payload_bytes), 'created_at': event.created_at, 'event_fingerprint': fingerprint(event), 'contains_photo': False, 'contains_recipe': False}

def _payload_band(size: int) -> str:
    if size == 0:
        return 'empty'
    if size <= 4096:
        return 'small'
    if size <= 65536:
        return 'medium'
    return 'large'
