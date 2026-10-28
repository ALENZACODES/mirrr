'Local provenance records for R17B women hair simulations. Author: John Khan.'
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from typing import Any

SCHEMA = 'beljour.r17b.hair.provenance.v1'
_ALLOWED_SOURCES = frozenset({'manual', 'checked_mask', 'checked_landmarks', 'local_measurement', 'user_entry'})

@dataclass(frozen=True)
class Observation:
    name: str
    source: str
    value: float | int | str | bool
    unit: str = ''
    confidence: float | None = None

    def validate(self) -> None:
        if not self.name or len(self.name) > 80:
            raise ValueError('observation name must be 1..80 characters')
        if self.source not in _ALLOWED_SOURCES:
            raise ValueError('unsupported observation source')
        if len(self.unit) > 24:
            raise ValueError('unit is too long')
        if self.confidence is not None and (not 0 <= self.confidence <= 1):
            raise ValueError('confidence must be between zero and one')
        if isinstance(self.value, str) and len(self.value) > 160:
            raise ValueError('observation text is too long')

@dataclass(frozen=True)
class HairEvidence:
    feature: str
    image_sha256: str
    mask_sha256: str
    observations: tuple[Observation, ...]
    engine_revision: str
    simulation: bool = True

    def validate(self) -> None:
        if not self.feature.startswith('W'):
            raise ValueError('feature must use a W row id')
        _validate_digest(self.image_sha256, 'image')
        _validate_digest(self.mask_sha256, 'mask')
        if not self.engine_revision or len(self.engine_revision) > 80:
            raise ValueError('engine revision is required')
        if not self.simulation:
            raise ValueError('R17 hair evidence must remain simulation-labelled')
        names: set[str] = set()
        for observation in self.observations:
            observation.validate()
            if observation.name in names:
                raise ValueError('duplicate observation name')
            names.add(observation.name)

def _validate_digest(value: str, label: str) -> None:
    if len(value) != 64:
        raise ValueError(f'{label} digest must be sha256 hex')
    try:
        int(value, 16)
    except ValueError as exc:
        raise ValueError(f'{label} digest must be sha256 hex') from exc

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def canonical(record: HairEvidence) -> str:
    record.validate()
    payload = asdict(record)
    return json.dumps(payload, sort_keys=True, separators=(',', ':'), ensure_ascii=True)

def fingerprint(record: HairEvidence) -> str:
    return hashlib.sha256(canonical(record).encode('utf-8')).hexdigest()

def safe_summary(record: HairEvidence) -> dict[str, Any]:
    record.validate()
    sources = sorted({observation.source for observation in record.observations})
    confidences = [o.confidence for o in record.observations if o.confidence is not None]
    return {'schema': SCHEMA, 'feature': record.feature, 'simulation': True, 'observation_count': len(record.observations), 'sources': sources, 'minimum_confidence': min(confidences) if confidences else None, 'evidence_fingerprint': fingerprint(record), 'contains_photo': False, 'contains_mask': False, 'network_required': False}

def replay_compatible(first: HairEvidence, second: HairEvidence) -> bool:
    first.validate()
    second.validate()
    return first.feature == second.feature and first.image_sha256 == second.image_sha256 and (first.mask_sha256 == second.mask_sha256) and (first.engine_revision == second.engine_revision) and (first.observations == second.observations)
