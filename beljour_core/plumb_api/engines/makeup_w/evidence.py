'R17B makeup evidence records. Author: John Khan.'
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from .benchmark import PASS_DEFINITIONS
from .evaluation import MakeupMetrics, passed


@dataclass(frozen=True)
class MakeupEvidence:
    feature: str
    case_id: str
    metrics: MakeupMetrics | None
    passed: bool | None
    status: str
    pass_definition: str
    notes: tuple[str, ...]

def record(feature: str, case_id: str, value: MakeupMetrics | None, notes: tuple[str, ...]=()) -> MakeupEvidence:
    if feature not in PASS_DEFINITIONS:
        raise ValueError('unknown makeup feature')
    if value is None:
        return MakeupEvidence(feature, case_id, None, None, 'not_tested', PASS_DEFINITIONS[feature], notes)
    ok = passed(value)
    return MakeupEvidence(feature, case_id, value, ok, 'passed' if ok else 'failed', PASS_DEFINITIONS[feature], notes)

def to_json(value: MakeupEvidence) -> dict[str, Any]:
    data = asdict(value)
    if value.metrics is not None:
        data['metrics'] = asdict(value.metrics)
    return data

def summarize(rows: tuple[MakeupEvidence, ...]) -> dict[str, int | bool | str]:
    tested = [row for row in rows if row.passed is not None]
    failures = [row for row in tested if row.passed is False]
    return {'group': 'makeup_w', 'cases': len(rows), 'tested': len(tested), 'failed': len(failures), 'not_tested': len(rows) - len(tested), 'release_ready': bool(tested) and (not failures) and (len(tested) == len(rows))}
