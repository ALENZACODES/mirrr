"""Count-only visibility and selection evidence for frozen real-face evaluations.

Face IDs and external paths may exist only in the in-memory lookup. The return
value holds small-category histograms and Wilson intervals, never a member row.
This report neither edits the R12 gate verdict nor reuses unprocessed bystanders
as successful faces. Author: John Khan.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from collections.abc import Mapping, Sequence
from typing import Any

from plumb_api.quality.realface_summary import classify

VERSION = "beljour-recovery-counts/1"
CATEGORIES = frozenset({"group_crop", "hijab", "side_profile", "all"})
REASONS = frozenset({
    "processed", "no_face", "ambiguous", "clipped", "threshold",
    "low_confidence", "invalid_mesh", "unreadable", "engine_error", "incomplete",
})
_REASON_TRANSLATION = {
    "single_face": "processed",
    "selected_primary": "processed",
    "selected_largest": "processed",
    "selected_centre_tiebreak": "processed",
    "selected_by_index": "processed",
    "group_primary": "processed",
    "no_face": "no_face",
    "side_profile_no_face": "no_face",
    "head_covering_no_face": "no_face",
    "multi_face_ambiguous": "ambiguous",
    "ambiguous": "ambiguous",
    "out_of_bounds": "clipped",
    "clipped": "clipped",
    "low_resolution": "clipped",
    "invalid_mesh": "invalid_mesh",
    "low_confidence": "low_confidence",
    "image_unreadable": "unreadable",
    "detector_exception": "engine_error",
    "threshold_miss": "threshold",
    "threshold": "threshold",
}


def _identity(face: Mapping[str, Any]) -> str:
    face_id = face.get("face_id")
    if not isinstance(face_id, str) or not face_id:
        raise ValueError("frozen face needs a nonempty opaque id")
    return face_id


def _category(face: Mapping[str, Any]) -> frozenset[str]:
    labels = face.get("labels")
    if not isinstance(labels, Mapping):
        raise ValueError("frozen face has no annotated labels")
    observed = {"all"}
    if str(labels.get("slice", "")).strip().casefold().replace(" ", "_") == "group_crop":
        observed.add("group_crop")
    occlusion = str(labels.get("occlusion", "")).strip().casefold().replace(" ", "_")
    if occlusion in {"hijab", "head_covering", "headscarf"}:
        observed.add("hijab")
    yaw = str(labels.get("yaw", "")).strip().casefold().replace(" ", "_")
    if yaw in {"side", "profile", "side_profile"}:
        observed.add("side_profile")
    return frozenset(observed)


def _code(row: Mapping[str, Any]) -> str:
    if row.get("check") == "open":
        return "unreadable"
    if row.get("check") != "detect":
        return "incomplete"
    code = row.get("reason_code")
    if not isinstance(code, str):
        return "incomplete"
    return _REASON_TRANSLATION.get(code, "incomplete")


def _integer(value: object, *, maximum: int | None = None) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0 or (
        maximum is not None and value > maximum
    ):
        raise ValueError("recovery tally must be a bounded nonnegative integer")
    return value


def _detector_rows(
    plan_faces: Sequence[Mapping[str, Any]], rows: Sequence[Mapping[str, Any]]
) -> dict[str, Mapping[str, Any]]:
    wanted = {_identity(face) for face in plan_faces}
    if len(wanted) != len(plan_faces):
        raise ValueError("duplicate frozen face")
    seen: dict[str, Mapping[str, Any]] = {}
    for row in rows:
        if row.get("module") != "landmarks" or row.get("check") not in {"detect", "open"}:
            continue
        face_id = row.get("face_id")
        if not isinstance(face_id, str) or face_id not in wanted:
            raise ValueError("unrecognized frozen face in recovery observations")
        if face_id in seen:
            raise ValueError("multiple detection observations for one frozen face")
        seen[face_id] = row
    return seen


def _verdict(
    counts: Mapping[str, int], *, minimum: int = 20, threshold: float = 0.95
) -> dict[str, Any]:
    total = sum(counts.values())
    passed = counts.get("processed", 0)
    outcome = classify(passed, total, threshold, minimum=minimum)
    outcome["reasons"] = {name: counts[name] for name in sorted(counts) if counts[name] > 0}
    return outcome


def _secondary_count(row: Mapping[str, Any]) -> int:
    candidate_count = _integer(row.get("faces", 0))
    num = _integer(row.get("other_faces_not_processed", 0), maximum=max(0, candidate_count - 1))
    if num and row.get("reason_code") not in {
        "group_primary", "selected_largest", "selected_centre_tiebreak", "selected_by_index",
    }:
        raise ValueError("secondary faces may be counted only under group primary policy")
    if num and not row.get("crop_applied"):
        raise ValueError("secondary faces require an applied crop")
    return num


def summarize(
    faces: Sequence[Mapping[str, Any]], rows: Sequence[Mapping[str, Any]], *,
    minimum_group: int = 20, threshold: float = 0.95
) -> dict[str, Any]:
    """Account for every original face and every excluded bystander once.

    Diagnostic intervals do not replace the frozen 95-98% gates. A cropped
    selected person consumes exactly one original photo's place in all counts.
    A group crop with a reported success but no applied ROI is incomplete.
    """
    if not faces:
        raise ValueError("cannot claim recovery metrics without frozen source faces")
    detections = _detector_rows(faces, rows)
    category_counts: dict[str, Counter[str]] = defaultdict(Counter)
    total_secondaries = 0
    primary_crops = 0
    for face in faces:
        face_id = _identity(face)
        row = detections.get(face_id)
        reason = _code(row) if row is not None else "incomplete"
        labels = _category(face)
        if reason == "processed" and "group_crop" in labels:
            if row is None or row.get("crop_applied") is not True:
                reason = "incomplete"
            else:
                primary_crops += 1
        elif row is not None and row.get("crop_applied"):
            raise ValueError("non-group crops must not change the frozen accounting policy")
        if row is not None:
            total_secondaries += _secondary_count(row)
        if reason not in REASONS:
            reason = "incomplete"
        for category in labels:
            category_counts[category][reason] += 1
    if sum(category_counts["all"].values()) != len(faces):
        raise ValueError("the frozen denominator has changed")
    return {
        "format": VERSION,
        "status": "DIAGNOSTIC_ONLY",
        "denominator": len(faces),
        "primary_group_crops": primary_crops,
        "other_faces_not_processed": total_secondaries,
        "frozen_gate_unchanged": True,
        "categories": {category: _verdict(category_counts[category], minimum=minimum_group,
                                  threshold=threshold)
                       for category in sorted(CATEGORIES) if category_counts[category]},
        "claim": "No real-face release verdict is derived from primary crop selection",
    }


def validate_count_only(result: Mapping[str, Any]) -> None:
    """Reject accidental exports of face IDs, source paths or per-person rows."""
    forbidden = {"face_id", "path", "file", "image", "pixels", "landmarks", "embedding", "bounds"}
    if result.get("format") != VERSION or result.get("status") != "DIAGNOSTIC_ONLY":
        raise ValueError("unknown recovery summary")

    def visit(node: Any) -> None:
        if isinstance(node, Mapping):
            if any(key in forbidden for key in node):
                raise ValueError("individual face details cannot appear in counts")
            for value in node.values():
                visit(value)
        elif isinstance(node, list):
            for item in node:
                visit(item)
        elif not isinstance(node, (int, float, bool, str, type(None))):
            raise ValueError("non-scalar evidence field")

    visit(result)
    categories = result.get("categories")
    if not isinstance(categories, dict) or "all" not in categories:
        raise ValueError("the original image denominator is missing")
    if not isinstance(categories["all"], Mapping):
        raise ValueError("the overall category must be an aggregate record")
    original = categories["all"].get("total")
    if type(original) is not int or original != result.get("denominator"):
        raise ValueError("category and frozen denominators disagree")
    allowed_root = {"format", "status", "denominator", "primary_group_crops",
                    "other_faces_not_processed", "frozen_gate_unchanged", "categories", "claim"}
    allowed_fields = {"passed", "total", "rate", "ci95", "threshold", "status", "reason", "reasons"}
    if set(result) != allowed_root or set(categories) - CATEGORIES:
        raise ValueError("unexpected recovery evidence fields")
    if result.get("frozen_gate_unchanged") is not True:
        raise ValueError("recovery report cannot change frozen gates")
    if result.get("claim") != "No real-face release verdict is derived from primary crop selection":
        raise ValueError("recovery claim must remain diagnostic")
    for row in categories.values():
        if not isinstance(row, Mapping) or set(row) != allowed_fields:
            raise ValueError("unexpected recovery category fields")
        passed = _integer(row.get("passed"))
        total = _integer(row.get("total"), maximum=original)
        checked = classify(passed, total, 0.95)
        if any(row.get(field) != expected for field, expected in checked.items()):
            raise ValueError("recovery interval or decision differs from observed counts")
        reasons = row.get("reasons")
        if not isinstance(reasons, Mapping) or set(reasons) - REASONS:
            raise ValueError("unknown recovery reason code")
        if any(type(n) is not int or n <= 0 for n in reasons.values()):
            raise ValueError("recovery reason counts must be positive integers")
        if sum(reasons.values()) != total or reasons.get("processed", 0) != passed:
            raise ValueError("recovery reasons do not reconcile to frozen counts")
    overall_reasons = categories["all"]["reasons"]
    for name, row in categories.items():
        if name == "all":
            continue
        for reason, count in row["reasons"].items():
            if count > overall_reasons.get(reason, 0):
                raise ValueError("slice reason exceeds the immutable overall cohort")
    primary = _integer(result.get("primary_group_crops"))
    secondary = _integer(result.get("other_faces_not_processed"))
    group = categories.get("group_crop", {})
    if primary != group.get("passed", 0) or (primary == 0 and secondary > 0):
        raise ValueError("group primary counts and secondary totals are inconsistent")
