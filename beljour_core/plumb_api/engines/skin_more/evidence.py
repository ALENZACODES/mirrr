'Evidence records for box-side R16B evaluations. Author: John Khan.'

from __future__ import annotations

import hashlib
import json
from collections.abc import Iterable, Mapping
from dataclasses import asdict, dataclass
from pathlib import Path

SCHEMA = 'beljour.r16b.evidence.v1'

@dataclass(frozen=True)
class EvidenceRecord:
    case_id: str
    feature: str
    image_sha256: str
    annotation_sha256: str
    runtime_id: str
    status: str
    metrics: tuple[tuple[str, float | int | bool | None], ...]
    group_labels: tuple[tuple[str, str], ...] = ()
    reason: str = ''

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def stable_json(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=True)

def annotation_hash(value: object) -> str:
    return sha256_bytes(stable_json(value).encode())

def make_record(case_id: str, feature: str, image_hash: str, annotations: object, runtime_id: str, status: str, metrics: Mapping[str, float | int | bool | None], group_labels: Mapping[str, str] | None=None, reason: str='') -> EvidenceRecord:
    if not case_id or '/' in case_id or '\\' in case_id:
        raise ValueError('case_id must be a simple non-empty id')
    if feature not in {f'W{i}' for i in range(45, 93)}:
        raise ValueError('feature outside R16B evidence range')
    if len(image_hash) != 64 or any(c not in '0123456789abcdef' for c in image_hash):
        raise ValueError('invalid image hash')
    if status not in {'passed', 'failed', 'not_tested'}:
        raise ValueError('invalid evidence status')
    if status == 'not_tested' and (not reason):
        raise ValueError('not_tested requires a reason')
    return EvidenceRecord(case_id, feature, image_hash, annotation_hash(annotations), runtime_id, status, tuple(sorted(metrics.items())), tuple(sorted((group_labels or {}).items())), reason)

def identity(record: EvidenceRecord) -> str:
    payload = {k: v for k, v in asdict(record).items() if k not in {'status', 'metrics', 'reason'}}
    return sha256_bytes(stable_json(payload).encode())

def compatible(previous: EvidenceRecord, current: EvidenceRecord) -> bool:
    return identity(previous) == identity(current)

def serialise(records: Iterable[EvidenceRecord], run_id: str) -> str:
    rows: list[dict[str, object]] = [asdict(record) for record in records]
    payload: dict[str, object] = {'schema': SCHEMA, 'run_id': run_id, 'records': rows}
    payload['counts'] = {'passed': sum(r['status'] == 'passed' for r in rows), 'failed': sum(r['status'] == 'failed' for r in rows), 'not_tested': sum(r['status'] == 'not_tested' for r in rows)}
    return json.dumps(payload, sort_keys=True, indent=2)

def parse(text: str) -> tuple[str, tuple[EvidenceRecord, ...]]:
    raw = json.loads(text)
    if raw.get('schema') != SCHEMA:
        raise ValueError('unsupported evidence schema')
    rows = []
    for item in raw.get('records', []):
        item = dict(item)
        item['metrics'] = tuple(tuple(v) for v in item.get('metrics', []))
        item['group_labels'] = tuple(tuple(v) for v in item.get('group_labels', []))
        rows.append(EvidenceRecord(**item))
    return (str(raw.get('run_id', '')), tuple(rows))

def counts(records: Iterable[EvidenceRecord]) -> dict[str, int]:
    out = {'passed': 0, 'failed': 0, 'not_tested': 0}
    for r in records:
        out[r.status] += 1
    return out

def fairness(records: Iterable[EvidenceRecord], label_key: str) -> dict[str, dict[str, float | int | None]]:
    buckets: dict[str, list[EvidenceRecord]] = {}
    for r in records:
        labels = dict(r.group_labels)
        label = labels.get(label_key, 'UNLABELLED')
        buckets.setdefault(label, []).append(r)
    out = {}
    for label, rows in sorted(buckets.items()):
        tested = [r for r in rows if r.status != 'not_tested']
        passed = sum(r.status == 'passed' for r in tested)
        out[label] = {'cases': len(rows), 'tested': len(tested), 'passed': passed, 'pass_rate': passed / len(tested) if tested else None}
    return out

def merge(previous: Iterable[EvidenceRecord], current: Iterable[EvidenceRecord]) -> tuple[EvidenceRecord, ...]:
    old = {identity(r): r for r in previous}
    new = list(current)
    seen = {identity(r) for r in new}
    return tuple([r for key, r in old.items() if key not in seen] + new)
