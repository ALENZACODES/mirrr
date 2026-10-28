"""R17B deterministic release-preflight checks. Author: John Khan."""
from __future__ import annotations

import hashlib
import json
import math
import re
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass

_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
_W_RE = re.compile(r"^W(?:[1-9]|[1-9][0-9]|100)$")
_ALLOWED_EVIDENCE = {"passed", "failed", "not_tested"}
_ALLOWED_FAMILIES = {"hair_women", "makeup_w", "workflow_w", "upscale", "gender_look", "shave"}


@dataclass(frozen=True)
class FeatureRecord:
    feature_id: str
    family: str
    status: str
    python_module: str
    web_module: str
    pass_definition: str


@dataclass(frozen=True)
class EvidenceRecord:
    feature_id: str
    group: str
    status: str
    cases: int
    passed: int
    failed: int
    definition_sha256: str
    evidence_sha256: str | None = None


@dataclass(frozen=True)
class AuditIssue:
    code: str
    feature_id: str | None
    detail: str


@dataclass(frozen=True)
class PreflightReport:
    features: int
    groups: int
    evidence_passed: int
    evidence_failed: int
    evidence_not_tested: int
    issues: tuple[AuditIssue, ...]
    manifest_sha256: str

    @property
    def ok(self) -> bool:
        return not self.issues


def _clean_text(value: object, name: str) -> str:
    if not isinstance(value, str):
        raise ValueError(f"{name} must be a string")
    text = value.strip()
    if not text:
        raise ValueError(f"{name} cannot be blank")
    return text


def _sha256(value: object, name: str) -> str:
    text = _clean_text(value, name).lower()
    if not _SHA256_RE.fullmatch(text):
        raise ValueError(f"{name} must be lowercase SHA-256")
    return text


def _path(value: object, name: str) -> str:
    text = _clean_text(value, name).replace("\\", "/")
    if text.startswith("/") or ".." in text.split("/"):
        raise ValueError(f"{name} must be repo-relative")
    return text


def parse_feature(value: Mapping[str, object]) -> FeatureRecord:
    feature_id = _clean_text(value.get("feature_id"), "feature_id")
    if not (_W_RE.fullmatch(feature_id) or feature_id in {"UPSCALE2", "UPSCALE4", "GENDER", "SHAVE"}):
        raise ValueError("unsupported feature id")
    family = _clean_text(value.get("family"), "family")
    if family not in _ALLOWED_FAMILIES:
        raise ValueError("unsupported family")
    status = _clean_text(value.get("status"), "status")
    if status != "built":
        raise ValueError("R17B preflight accepts built features only")
    python_module = _path(value.get("python_module"), "python_module")
    web_module = _path(value.get("web_module"), "web_module")
    definition = _clean_text(value.get("pass_definition"), "pass_definition")
    if len(definition) < 20:
        raise ValueError("pass_definition is too short")
    return FeatureRecord(feature_id, family, status, python_module, web_module, definition)


def parse_evidence(value: Mapping[str, object]) -> EvidenceRecord:
    feature_id = _clean_text(value.get("feature_id"), "feature_id")
    group = _clean_text(value.get("group"), "group")
    status = _clean_text(value.get("status"), "status")
    if status not in _ALLOWED_EVIDENCE:
        raise ValueError("unsupported evidence status")
    cases = value.get("cases")
    passed = value.get("passed")
    failed = value.get("failed")
    if not all(isinstance(item, int) and not isinstance(item, bool) and item >= 0 for item in (cases, passed, failed)):
        raise ValueError("evidence counts must be non-negative integers")
    assert isinstance(cases, int)
    assert isinstance(passed, int)
    assert isinstance(failed, int)
    if passed + failed > cases:
        raise ValueError("passed + failed cannot exceed cases")
    if status == "passed" and (cases == 0 or failed != 0 or passed != cases):
        raise ValueError("passed evidence requires every case to pass")
    if status == "failed" and failed == 0:
        raise ValueError("failed evidence requires at least one failed case")
    if status == "not_tested" and any((cases, passed, failed)):
        raise ValueError("not-tested evidence cannot contain measured counts")
    definition_sha256 = _sha256(value.get("definition_sha256"), "definition_sha256")
    raw_evidence_hash = value.get("evidence_sha256")
    evidence_sha256 = None if raw_evidence_hash is None else _sha256(raw_evidence_hash, "evidence_sha256")
    if status != "not_tested" and evidence_sha256 is None:
        raise ValueError("measured evidence requires an evidence hash")
    return EvidenceRecord(
        feature_id,
        group,
        status,
        cases,
        passed,
        failed,
        definition_sha256,
        evidence_sha256,
    )


def definition_hash(record: FeatureRecord) -> str:
    payload = {
        "family": record.family,
        "feature_id": record.feature_id,
        "pass_definition": record.pass_definition,
    }
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def manifest_hash(features: Sequence[FeatureRecord], evidence: Sequence[EvidenceRecord]) -> str:
    payload = {
        "features": [
            {
                "feature_id": row.feature_id,
                "family": row.family,
                "status": row.status,
                "python_module": row.python_module,
                "web_module": row.web_module,
                "definition_sha256": definition_hash(row),
            }
            for row in sorted(features, key=lambda item: item.feature_id)
        ],
        "evidence": [
            {
                "feature_id": row.feature_id,
                "group": row.group,
                "status": row.status,
                "cases": row.cases,
                "passed": row.passed,
                "failed": row.failed,
                "definition_sha256": row.definition_sha256,
                "evidence_sha256": row.evidence_sha256,
            }
            for row in sorted(evidence, key=lambda item: (item.feature_id, item.group))
        ],
    }
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _ownership_issues(features: Sequence[FeatureRecord], owned_modules: Iterable[str]) -> list[AuditIssue]:
    owned = {_path(value, "owned module") for value in owned_modules}
    issues: list[AuditIssue] = []
    for row in features:
        if row.python_module not in owned:
            issues.append(AuditIssue("python_module_unowned", row.feature_id, row.python_module))
        if row.web_module not in owned:
            issues.append(AuditIssue("web_module_unowned", row.feature_id, row.web_module))
    return issues


def _duplicate_issues(features: Sequence[FeatureRecord]) -> list[AuditIssue]:
    seen: set[str] = set()
    issues: list[AuditIssue] = []
    for row in features:
        if row.feature_id in seen:
            issues.append(AuditIssue("duplicate_feature", row.feature_id, "feature appears more than once"))
        seen.add(row.feature_id)
    return issues


def _definition_issues(features: Sequence[FeatureRecord], evidence: Sequence[EvidenceRecord]) -> list[AuditIssue]:
    expected = {row.feature_id: definition_hash(row) for row in features}
    issues: list[AuditIssue] = []
    for row in evidence:
        digest = expected.get(row.feature_id)
        if digest is None:
            issues.append(AuditIssue("evidence_for_unknown_feature", row.feature_id, row.group))
        elif row.definition_sha256 != digest:
            issues.append(AuditIssue("definition_hash_mismatch", row.feature_id, row.group))
    return issues


def _coverage_issues(features: Sequence[FeatureRecord], evidence: Sequence[EvidenceRecord]) -> list[AuditIssue]:
    covered = {row.feature_id for row in evidence}
    return [
        AuditIssue("missing_evidence_record", row.feature_id, "no evidence status was supplied")
        for row in features
        if row.feature_id not in covered
    ]


def _group_issues(evidence: Sequence[EvidenceRecord]) -> list[AuditIssue]:
    seen: set[tuple[str, str]] = set()
    issues: list[AuditIssue] = []
    for row in evidence:
        key = (row.feature_id, row.group)
        if key in seen:
            issues.append(AuditIssue("duplicate_evidence_group", row.feature_id, row.group))
        seen.add(key)
    return issues


def run_preflight(
    feature_rows: Iterable[Mapping[str, object]],
    evidence_rows: Iterable[Mapping[str, object]],
    owned_modules: Iterable[str],
) -> PreflightReport:
    features = tuple(parse_feature(row) for row in feature_rows)
    evidence = tuple(parse_evidence(row) for row in evidence_rows)
    issues = []
    issues.extend(_duplicate_issues(features))
    issues.extend(_ownership_issues(features, owned_modules))
    issues.extend(_definition_issues(features, evidence))
    issues.extend(_coverage_issues(features, evidence))
    issues.extend(_group_issues(evidence))
    passed = sum(row.status == "passed" for row in evidence)
    failed = sum(row.status == "failed" for row in evidence)
    not_tested = sum(row.status == "not_tested" for row in evidence)
    groups = len({row.group for row in evidence})
    return PreflightReport(
        features=len(features),
        groups=groups,
        evidence_passed=passed,
        evidence_failed=failed,
        evidence_not_tested=not_tested,
        issues=tuple(issues),
        manifest_sha256=manifest_hash(features, evidence),
    )


def release_candidate(report: PreflightReport, frozen_faces: int, required_faces: int = 100_000) -> bool:
    if not isinstance(frozen_faces, int) or isinstance(frozen_faces, bool) or frozen_faces < 0:
        raise ValueError("frozen_faces must be a non-negative integer")
    if not isinstance(required_faces, int) or isinstance(required_faces, bool) or required_faces <= 0:
        raise ValueError("required_faces must be a positive integer")
    return (
        report.ok
        and report.features > 0
        and report.evidence_failed == 0
        and report.evidence_not_tested == 0
        and frozen_faces >= required_faces
    )


def group_summary(evidence_rows: Iterable[Mapping[str, object]]) -> dict[str, dict[str, int]]:
    summary: dict[str, dict[str, int]] = {}
    for row in (parse_evidence(item) for item in evidence_rows):
        bucket = summary.setdefault(row.group, {"passed": 0, "failed": 0, "not_tested": 0, "cases": 0})
        bucket[row.status] += 1
        bucket["cases"] += row.cases
    return summary


def scorecard(report: PreflightReport) -> dict[str, int | bool | str]:
    return {
        "features": report.features,
        "groups": report.groups,
        "passed": report.evidence_passed,
        "failed": report.evidence_failed,
        "not_tested": report.evidence_not_tested,
        "issues": len(report.issues),
        "ok": report.ok,
        "manifest_sha256": report.manifest_sha256,
        "label": "R17B deterministic preflight; not real-face quality evidence",
    }


def finite_metric(value: object) -> float:
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise ValueError("metric must be numeric")
    result = float(value)
    if not math.isfinite(result):
        raise ValueError("metric must be finite")
    return result
