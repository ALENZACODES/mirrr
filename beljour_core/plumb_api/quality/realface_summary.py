"""Aggregate-only, 95% Wilson evidence for frozen real-face engineering runs.

The R12 frozen acceptance definitions remain unchanged. This diagnostic layer
makes small and statistically ambiguous cohorts UNPROVEN, never an apparent
population PASS or FAIL. Each failed face contributes one reason per gate.
No image, filename, face identifier, landmark or prediction is exported.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections import Counter, defaultdict
from collections.abc import Mapping, Sequence
from typing import Any

VERSION = "beljour-realface-diagnostics/1"
MIN_GROUP = 20
Z95 = 1.959963984540054
REASONS = frozenset({
    "no_face", "multi_face", "low_confidence", "out_of_bounds",
    "side_profile", "head_covering", "invalid_mesh", "unreadable",
    "engine_error", "incomplete", "threshold_miss",
})
# Priority means a missing dependency is not incorrectly counted as a bad
# geometric result. Unknown textual errors never appear in this report.
PRIORITY = (
    "unreadable", "side_profile", "head_covering", "no_face",
    "multi_face", "low_confidence", "out_of_bounds", "invalid_mesh",
    "engine_error", "incomplete", "threshold_miss",
)
_RAW_REASONS = {
    "no_face": "no_face",
    "no_mesh": "no_face",
    "no_mesh_detected": "no_face",
    "side_profile_no_face": "side_profile",
    "profile_no_face": "side_profile",
    "head_covering_no_face": "head_covering",
    "hijab_no_face": "head_covering",
    "multi_face": "multi_face",
    "multi_face_ambiguous": "multi_face",
    "low_confidence": "low_confidence",
    "out_of_bounds": "out_of_bounds",
    "partial_face": "out_of_bounds",
    "invalid_mesh": "invalid_mesh",
    "image_unreadable": "unreadable",
    "detector_exception": "engine_error",
    "engine_error": "engine_error",
}


def _counts(passed: object, total: object) -> tuple[int, int]:
    if type(passed) is not int or type(total) is not int or not 0 <= passed <= total:
        raise ValueError("passed and total must be nonnegative integer counts")
    return passed, total


def wilson_interval(passed: int, total: int, *, z: float = Z95) -> tuple[float, float] | None:
    """Wilson interval at a supplied normal critical value (default: 95%)."""
    passed, total = _counts(passed, total)
    if not math.isfinite(z) or z <= 0:
        raise ValueError("critical value must be positive and finite")
    if total == 0:
        return None
    rate = passed / total
    z2 = z * z
    denom = 1.0 + z2 / total
    center = (rate + z2 / (2.0 * total)) / denom
    margin = z * math.sqrt(rate * (1.0 - rate) / total + z2 / (4.0 * total * total)) / denom
    return (0.0 if passed == 0 else max(0.0, center - margin),
            1.0 if passed == total else min(1.0, center + margin))


def classify(passed: int, total: int, threshold: float, *, minimum: int = MIN_GROUP) -> dict[str, Any]:
    """Treat small groups and intervals crossing the preregistered target as UNPROVEN.

    PASS is possible only if the entire 95% interval meets the fixed threshold.
    FAIL means its entire 95% interval falls below it. Observed rates do not
    get rounded before the decision. This is a diagnostic, not a release gate.
    """
    passed, total = _counts(passed, total)
    if isinstance(threshold, bool) or not isinstance(threshold, (int, float)):
        raise ValueError("threshold must be a finite fraction")
    if not math.isfinite(threshold) or not 0 < threshold <= 1:
        raise ValueError("threshold must be within (0, 1]")
    if type(minimum) is not int or minimum < MIN_GROUP:
        raise ValueError("minimum must be at least twenty")
    interval = wilson_interval(passed, total)
    if interval is None:
        status, reason = "UNPROVEN", "no_observations"
    elif total < minimum:
        status, reason = "UNPROVEN", "small_group"
    elif interval[0] >= threshold:
        status, reason = "PASS", "interval_meets_threshold"
    elif interval[1] < threshold:
        status, reason = "FAIL", "interval_below_threshold"
    else:
        status, reason = "UNPROVEN", "interval_crosses_threshold"
    return {"passed": passed, "total": total, "rate": passed / total if total else None,
            "ci95": list(interval) if interval is not None else None,
            "threshold": float(threshold), "status": status, "reason": reason}


def _row_reason(row: Mapping[str, Any]) -> str | None:
    code = row.get("reason_code")
    if isinstance(code, str) and code in _RAW_REASONS:
        return _RAW_REASONS[code]
    check = row.get("check")
    if check == "open":
        return "unreadable"
    if check == "exception":
        return "engine_error"
    if check == "dependency_missing":
        reason = row.get("reason")
        if isinstance(reason, str) and reason in _RAW_REASONS:
            return _RAW_REASONS[reason]
        return "no_face"
    if check == "refused":
        return "invalid_mesh"
    if check == "detect" and row.get("detected") is False:
        return "no_face"
    if check == "mesh_valid" and row.get("finite") is False:
        return "invalid_mesh"
    in_frame = row.get("in_frame_share")
    if check == "mesh_valid" and (isinstance(in_frame, bool) or not isinstance(in_frame, (int, float))
                                  or not math.isfinite(in_frame) or in_frame < 0.98):
        return "out_of_bounds"
    return None


def _failed_reason(observations: Sequence[Mapping[str, Any]], *, passed: bool) -> str | None:
    if passed:
        return None
    possible = {reason for row in observations if (reason := _row_reason(row)) is not None}
    if not observations:
        possible.add("incomplete")
    if not possible:
        possible.add("threshold_miss")
    return next(reason for reason in PRIORITY if reason in possible)


def _safe_category(value: str) -> str:
    """Keep legitimate composite cohort labels; reject paths and control text."""
    if not value or len(value) > 100 or any(c in value for c in ("\n", "\r", "<", ">", "\\", ":")):
        raise ValueError("invalid aggregate cohort label")
    if value.startswith("/") or ".." in value.split("/"):
        raise ValueError("paths are not cohort labels")
    if value.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tif", ".tiff", ".heic", ".avif")):
        raise ValueError("image file names cannot be cohort labels")
    return value


def _validate_faces(faces: Sequence[Mapping[str, Any]]) -> dict[str, dict[str, str]]:
    identities: dict[str, dict[str, str]] = {}
    for face in faces:
        identity = face.get("face_id")
        labels = face.get("labels")
        if not isinstance(identity, str) or not identity or identity in identities:
            raise ValueError("face IDs must be unique and nonempty")
        if not isinstance(labels, dict) or any(not isinstance(key, str) or not isinstance(value, str)
                                               for key, value in labels.items()):
            raise ValueError("frozen face labels must be text")
        for label in labels.values():
            _safe_category(label)
        identities[identity] = labels
    return identities


def aggregate(
    evidence: Mapping[str, Any],
    faces: Sequence[Mapping[str, Any]],
    rows: Sequence[Mapping[str, Any]],
) -> dict[str, Any]:
    """Build a de-identified per-gate histogram and Wilson intervals.

    R12 gate results already recheck frozen definitions. We additionally count
    failures across the *entire* frozen denominator, including no row at all.
    Exactly one primary reason is recorded for each failed face and gate.
    """
    identities = _validate_faces(faces)
    run_id = evidence.get("run_id")
    if not isinstance(run_id, str) or not run_id:
        raise ValueError("aggregate requires a frozen run ID")
    source: dict[tuple[str, str], list[Mapping[str, Any]]] = defaultdict(list)
    for row in rows:
        identity, module = row.get("face_id"), row.get("module")
        if not isinstance(identity, str) or identity not in identities:
            raise ValueError("observation is not in the frozen denominator")
        if not isinstance(module, str) or not module:
            raise ValueError("observation module is invalid")
        if row.get("run_id") != run_id:
            raise ValueError("observation is from a different frozen run")
        source[(module, identity)].append(row)
    result: list[dict[str, Any]] = []
    gates = evidence.get("gates")
    if not isinstance(gates, list):
        raise ValueError("expected a list of frozen gates")
    seen: set[str] = set()
    for gate in gates:
        if not isinstance(gate, dict) or not isinstance(gate.get("id"), str):
            raise ValueError("gate ID is missing")
        name = _safe_category(gate["id"])
        if name in seen:
            raise ValueError("duplicate gate ID")
        seen.add(name)
        threshold = gate.get("threshold")
        if not isinstance(threshold, dict):
            raise ValueError("gate threshold is missing")
        overall = gate.get("all_faces")
        if not isinstance(overall, dict):
            raise ValueError("gate counts are missing")
        _counts(overall.get("passed"), overall.get("total"))
        if overall["total"] != len(identities):
            raise ValueError("gate denominator does not match frozen faces")
        reasons: Counter[str] = Counter()
        for identity in identities:
            obs = source.get((name, identity), [])
            # The R12 per-face decision is expressed in overall counts and
            # cannot be faithfully recovered from `pass` booleans alone when
            # required named checks, hashes or measurements are missing.
            failed = not obs or any(row.get("metric_pass", row.get("pass")) is not True for row in obs)
            reason = _failed_reason(obs, passed=not failed)
            if reason is not None:
                reasons[reason] += 1
        # A damaged row count must not make the histogram claim fewer failures
        # than R12's verified per-face total. The missing balance is incomplete.
        verified_failures = len(identities) - overall["passed"]
        observed_failures = sum(reasons.values())
        if observed_failures > verified_failures:
            raise ValueError("observations contradict the verified gate count")
        if verified_failures > observed_failures:
            reasons["incomplete"] += verified_failures - observed_failures
        if set(reasons) - REASONS:
            raise ValueError("unknown internal reason code")
        slices = gate.get("slices", [])
        if not isinstance(slices, list) or not slices:
            raise ValueError("gate slice list is missing")
        # Reconcile each slice dimension to the frozen plan. A dropped or
        # relabelled group must not disappear just because its outcome is bad.
        frozen_labels: dict[str, Counter[str]] = defaultdict(Counter)
        dimensions: set[str] = set()
        for item in slices:
            if not isinstance(item, dict) or not isinstance(item.get("dimension"), str):
                raise ValueError("gate slice is malformed")
            dimensions.add(item["dimension"])
        for dimension in dimensions:
            frozen_labels[dimension].update(labels.get(dimension, "unknown") for labels in identities.values())
        recorded_labels: dict[str, Counter[str]] = defaultdict(Counter)
        recorded_passed: Counter[str] = Counter()
        groups: list[dict[str, Any]] = []
        for item in slices:
            if not isinstance(item, dict):
                raise ValueError("gate slice must be an object")
            slice_dimension = item.get("dimension")
            slice_value = item.get("value")
            if not isinstance(slice_dimension, str) or not isinstance(slice_value, str):
                raise ValueError("slice labels must be strings")
            _safe_category(slice_dimension)
            _safe_category(slice_value)
            slice_passed, slice_total = _counts(item.get("passed"), item.get("total"))
            rate = classify(slice_passed, slice_total, threshold["every_slice"])
            if slice_value in recorded_labels[slice_dimension]:
                raise ValueError("duplicate slice group")
            recorded_labels[slice_dimension][slice_value] = rate["total"]
            recorded_passed[slice_dimension] += rate["passed"]
            groups.append({"dimension": slice_dimension, "value": slice_value, **rate})
        if any(recorded_labels[dimension] != frozen_labels[dimension]
               or recorded_passed[dimension] != overall["passed"] for dimension in dimensions):
            raise ValueError("slice membership or passed counts disagree with frozen plan")
        groups.sort(key=lambda item: (item["dimension"], item["value"]))
        result.append({"gate": name, "written_gate_status": gate.get("status"),
                       "whole_set": classify(overall["passed"], overall["total"], threshold["overall"]),
                       "failure_reasons": dict(sorted(reasons.items())), "slices": groups})
    return {"format": VERSION, "confidence": 0.95, "minimum_slice_faces": MIN_GROUP,
            "face_count": len(identities), "gates": result,
            "meaning": "screening intervals; no change to frozen definitions or release verdict"}


def markdown(summary: Mapping[str, Any]) -> str:
    """Count-only Markdown appendix: no observations or raw identifiers."""
    lines = ["## Lane A diagnostic triage (95% Wilson)", "",
             "At least 20 observations are needed. A CI crossing the written threshold is UNPROVEN.",
             "The original frozen engineering/release decisions are not replaced by these intervals.", ""]
    for gate in summary["gates"]:
        whole = gate["whole_set"]
        lines.append(f"### {gate['gate']}: {whole['status']} ({whole['passed']}/{whole['total']})")
        lines.append("Reasons: " + (", ".join(f"{key} {n}" for key, n in gate["failure_reasons"].items()) or "none"))
        lines += ["", "| Slice | Passed / total | 95% CI | Diagnostic |",
                  "|---|---:|---|---|"]
        for item in gate["slices"]:
            ci = item["ci95"]
            interval = "unmeasured" if ci is None else f"{ci[0]:.3f}–{ci[1]:.3f}"
            lines.append(f"| {item['dimension']}={item['value']} | {item['passed']}/{item['total']} | "
                         f"{interval} | {item['status']} ({item['reason']}) |")
        lines.append("")
    return "\n".join(lines)
