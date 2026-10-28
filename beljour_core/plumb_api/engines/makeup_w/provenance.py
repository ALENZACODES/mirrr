'Local provenance and checked-reference records for R17B makeup. Author: John Khan.'
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from typing import Any

SCHEMA = 'beljour.r17b.makeup.provenance.v1'
_ALLOWED = frozenset({'undertone_w6', 'checked_mask', 'manual', 'local_colour', 'user_entry'})

@dataclass(frozen=True)
class ColourObservation:
    region: str
    lab: tuple[float, float, float]
    source: str
    confidence: float | None = None

    def validate(self) -> None:
        if not self.region or len(self.region) > 64:
            raise ValueError('region is required')
        if self.source not in _ALLOWED:
            raise ValueError('unsupported colour observation source')
        lightness, a_axis, b_axis = self.lab
        if not 0 <= lightness <= 100:
            raise ValueError('Lab lightness must be within 0..100')
        if not -160 <= a_axis <= 160 or not -160 <= b_axis <= 160:
            raise ValueError('Lab chroma axes are out of range')
        if self.confidence is not None and (not 0 <= self.confidence <= 1):
            raise ValueError('confidence must be within 0..1')

@dataclass(frozen=True)
class MakeupEvidence:
    feature: str
    image_sha256: str
    observations: tuple[ColourObservation, ...]
    checked_reference_sha256: str | None
    engine_revision: str
    simulation: bool = True

    def validate(self) -> None:
        if not self.feature.startswith('W'):
            raise ValueError('feature must use a W id')
        _digest(self.image_sha256, 'image')
        if self.checked_reference_sha256 is not None:
            _digest(self.checked_reference_sha256, 'reference')
        if not self.engine_revision or len(self.engine_revision) > 80:
            raise ValueError('engine revision required')
        if not self.simulation:
            raise ValueError('preview must remain simulation-labelled')
        regions: set[str] = set()
        for item in self.observations:
            item.validate()
            if item.region in regions:
                raise ValueError('duplicate observed region')
            regions.add(item.region)
        if self.feature == 'W13' and self.checked_reference_sha256 is None:
            raise ValueError('W13 requires a checked reference fingerprint')

def _digest(value: str, label: str) -> None:
    if len(value) != 64:
        raise ValueError(f'{label} digest must be sha256 hex')
    try:
        int(value, 16)
    except ValueError as exc:
        raise ValueError(f'{label} digest must be sha256 hex') from exc

def canonical(record: MakeupEvidence) -> str:
    record.validate()
    return json.dumps(asdict(record), sort_keys=True, separators=(',', ':'), ensure_ascii=True)

def fingerprint(record: MakeupEvidence) -> str:
    return hashlib.sha256(canonical(record).encode('utf-8')).hexdigest()

def safe_summary(record: MakeupEvidence) -> dict[str, Any]:
    record.validate()
    confidences = [o.confidence for o in record.observations if o.confidence is not None]
    return {'schema': SCHEMA, 'feature': record.feature, 'simulation': True, 'regions': sorted(o.region for o in record.observations), 'sources': sorted({o.source for o in record.observations}), 'minimum_confidence': min(confidences) if confidences else None, 'checked_reference': record.checked_reference_sha256 is not None, 'fingerprint': fingerprint(record), 'contains_photo': False, 'network_required': False}

def replay_compatible(first: MakeupEvidence, second: MakeupEvidence) -> bool:
    first.validate()
    second.validate()
    return canonical(first) == canonical(second)
