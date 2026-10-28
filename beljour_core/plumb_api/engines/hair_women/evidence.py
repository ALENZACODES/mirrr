'Evidence aggregation for R17B hair box evaluations. Author: John Khan.'
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from .benchmark import PASS_DEFINITIONS
from .evaluation import HairMetrics, passed


@dataclass(frozen=True)
class FeatureEvidence:
    feature: str
    group: str
    case_id: str
    metrics: HairMetrics | None
    passed: bool | None
    status: str
    pass_definition: str
    notes: tuple[str, ...]

def record(feature: str, case_id: str, metrics: HairMetrics | None, notes: tuple[str, ...]=()) -> FeatureEvidence:
    if feature not in PASS_DEFINITIONS:
        raise ValueError('unknown hair feature')
    if metrics is None:
        return FeatureEvidence(feature, 'hair_women', case_id, None, None, 'not_tested', PASS_DEFINITIONS[feature], notes)
    ok = passed(metrics, feature)
    return FeatureEvidence(feature, 'hair_women', case_id, metrics, ok, 'passed' if ok else 'failed', PASS_DEFINITIONS[feature], notes)

def to_json(value: FeatureEvidence) -> dict[str, Any]:
    data = asdict(value)
    if value.metrics is not None:
        data['metrics'] = asdict(value.metrics)
    return data

def summarize(rows: tuple[FeatureEvidence, ...]) -> dict[str, Any]:
    tested = [row for row in rows if row.passed is not None]
    failures = [row for row in tested if row.passed is False]
    return {'group': 'hair_women', 'cases': len(rows), 'tested': len(tested), 'passed': len(tested) - len(failures), 'failed': len(failures), 'not_tested': len(rows) - len(tested), 'release_ready': bool(tested) and (not failures) and (len(tested) == len(rows))}
