"""Per-strength STUDIO and POSE diagnostic annex for Tuesday lock review.

These diagnostics demand actual supplied masks and guarded outcomes. They
cannot establish independent identity or real-face qualification and do not
alter any existing numerical acceptance threshold.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import math
from dataclasses import dataclass
from typing import Literal, NoReturn, cast

from .errors import CommandValidationError
from .pose_face_audit import PoseFaceAudit
from .studio import STUDIO_LIGHT_REFERENCE
from .studio_light_audit import StudioLightAudit
from .tuesday_lock import verify_tuesday_lock_json

ANNEX_VERSION = "beljour-studio-pose-annex/1"
_STUDIO_FINDINGS = frozenset({
    "studio_reference_mismatch", "alpha_changed", "protected_mask_missing",
    "protected_pixels_changed", "neutral_pixels_changed", "texture_reference_missing",
})
_POSE_FINDINGS = frozenset({
    "identity_guard_missing", "alpha_changed", "face_annotation_missing",
    "face_annotation_empty", "face_pixels_changed", "face_mask_missing",
    "face_change_unmeasured", "pose_not_protected",
})
AnnexStatus = Literal["missing", "audit_failed", "diagnostic_received"]


def _fail(reason: str) -> NoReturn:
    raise CommandValidationError("invalid_studio_pose_annex", reason)


def _digest(payload: dict[str, object]) -> str:
    serialized = json.dumps(
        payload, sort_keys=True, allow_nan=False, ensure_ascii=True, separators=(",", ":"),
    )
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _numeric(value: float | int | None) -> float | None:
    if value is None:
        return None
    if not isinstance(value, (float, int)) or isinstance(value, bool):
        _fail("Diagnostic measurements must be finite numeric values.")
    if not math.isfinite(value):
        _fail("Diagnostic measurements must be finite numeric values.")
    return float(value)


@dataclass(frozen=True, slots=True)
class StudioLevelEvidence:
    level_tenths: int
    audit: StudioLightAudit

    def __post_init__(self) -> None:
        if type(self.level_tenths) is not int or not 10 <= self.level_tenths <= 50:
            _fail("Studio level must be 1.0–5.0 in decimal tenths.")
        if not isinstance(self.audit, StudioLightAudit):
            _fail("A measured Studio light audit is required.")


@dataclass(frozen=True, slots=True)
class PoseLevelEvidence:
    level_tenths: int
    audit: PoseFaceAudit

    def __post_init__(self) -> None:
        if type(self.level_tenths) is not int or not 10 <= self.level_tenths <= 50:
            _fail("Pose level must be 1.0–5.0 in decimal tenths.")
        if not isinstance(self.audit, PoseFaceAudit):
            _fail("An executed, checked-face pose audit is required.")


def _missing(command: str, level: int) -> dict[str, object]:
    return {
        "command": command,
        "level_tenths": level,
        "status": "missing",
        "reference": STUDIO_LIGHT_REFERENCE if command == "studioquality" else None,
        "alpha_unchanged": None,
        "protected_unchanged": None,
        "neutral_unchanged": None,
        "identity_enabled": None,
        "identity_synthetic": None,
        "face_mask_pixels": None,
        "changed_face_pixels": None,
        "colour_drift": None,
        "texture_ratio": None,
        "findings": ["diagnostic_missing"],
    }


def _studio_row(item: StudioLevelEvidence) -> dict[str, object]:
    audit = item.audit
    findings: list[str] = []
    if audit.reference != STUDIO_LIGHT_REFERENCE:
        findings.append("studio_reference_mismatch")
    if not audit.alpha_unchanged:
        findings.append("alpha_changed")
    if not audit.protected_evidence_present or audit.protected_changed_pixels is None:
        findings.append("protected_mask_missing")
    elif audit.protected_changed_pixels != 0:
        findings.append("protected_pixels_changed")
    if item.level_tenths == 10 and not audit.neutral_bytes_unchanged:
        findings.append("neutral_pixels_changed")
    for value in (
        audit.mean_lift_l, audit.peak_lift_l, audit.mean_chromaticity_drift,
        audit.texture_energy_ratio, audit.sculpting_gradient_change,
    ):
        if value is not None:
            _numeric(value)
    if audit.texture_energy_ratio is None:
        findings.append("texture_reference_missing")
    if audit.realface_approved:
        _fail("This diagnostic cannot authorize real-face approval.")
    return {
        "command": "studioquality",
        "level_tenths": item.level_tenths,
        "status": "audit_failed" if findings else "diagnostic_received",
        "reference": STUDIO_LIGHT_REFERENCE,
        "alpha_unchanged": audit.alpha_unchanged,
        "protected_unchanged": (
            audit.protected_evidence_present and audit.protected_changed_pixels == 0
        ),
        "neutral_unchanged": audit.neutral_bytes_unchanged,
        "identity_enabled": None,
        "identity_synthetic": None,
        "face_mask_pixels": None,
        "changed_face_pixels": audit.protected_changed_pixels,
        "colour_drift": _numeric(audit.mean_chromaticity_drift),
        "texture_ratio": _numeric(audit.texture_energy_ratio),
        "findings": findings,
    }


def _pose_row(item: PoseLevelEvidence) -> dict[str, object]:
    audit = item.audit
    if audit.level != f"{item.level_tenths / 10:.1f}":
        _fail("Pose audit was captured at another strength level.")
    if audit.realface_approved:
        _fail("This diagnostic cannot authorize real-face approval.")
    if (
        any(reason not in _POSE_FINDINGS for reason in audit.reason_codes)
        or type(audit.mask_pixels) is not int
        or type(audit.changed_outside_face_pixels) is not int
    ):
        _fail("Pose audit includes invalid or unsafe diagnostic values.")
    findings = list(audit.reason_codes)
    if audit.mask_pixels <= 0:
        findings.append("face_mask_missing")
    if audit.changed_face_pixels is None:
        findings.append("face_change_unmeasured")
    elif audit.changed_face_pixels != 0:
        findings.append("face_pixels_changed")
    if not audit.identity_enabled or not audit.identity_evidence_valid:
        findings.append("identity_guard_missing")
    if not audit.alpha_unchanged:
        findings.append("alpha_changed")
    if audit.status != "protected":
        findings.append("pose_not_protected")
    findings = list(dict.fromkeys(findings))
    return {
        "command": "poseonly",
        "level_tenths": item.level_tenths,
        "status": "audit_failed" if findings else "diagnostic_received",
        "reference": None,
        "alpha_unchanged": audit.alpha_unchanged,
        "protected_unchanged": audit.status == "protected" and not findings,
        "neutral_unchanged": None,
        "identity_enabled": audit.identity_enabled and audit.identity_evidence_valid,
        "identity_synthetic": audit.identity_synthetic,
        "face_mask_pixels": audit.mask_pixels,
        "changed_face_pixels": audit.changed_face_pixels,
        "colour_drift": None,
        "texture_ratio": None,
        "findings": findings,
    }


def _bind_lock_row(
    command_rows: dict[tuple[str, int], dict[str, object]],
    command: str,
    level: int,
) -> None:
    original = command_rows[(command, level)]
    if original["status"] == "missing":
        _fail("An independently measured command lock row is required before diagnostics.")


def build_studio_pose_annex(
    command_json: str,
    studio: tuple[StudioLevelEvidence, ...] = (),
    pose: tuple[PoseLevelEvidence, ...] = (),
) -> str:
    """Create all 82 diagnostic slots, retaining failures and missing levels."""
    verified = verify_tuesday_lock_json(command_json)
    original = json.loads(command_json)
    command_rows = {
        (cast(str, row["command"]), cast(int, row["level_tenths"])): row
        for row in cast(list[dict[str, object]], verified["rows"])
    }
    selected: dict[tuple[str, int], dict[str, object]] = {}
    for entry in studio:
        if not isinstance(entry, StudioLevelEvidence):
            _fail("Studio receipts must be typed measured results.")
        key = ("studioquality", entry.level_tenths)
        if key in selected:
            _fail("Duplicate Studio diagnostic levels are refused.")
        _bind_lock_row(command_rows, *key)
        selected[key] = _studio_row(entry)
    for pose_entry in pose:
        if not isinstance(pose_entry, PoseLevelEvidence):
            _fail("Pose receipts must be typed measured results.")
        key = ("poseonly", pose_entry.level_tenths)
        if key in selected:
            _fail("Duplicate Pose diagnostic levels are refused.")
        _bind_lock_row(command_rows, *key)
        selected[key] = _pose_row(pose_entry)
    rows: list[dict[str, object]] = []
    for command in ("studioquality", "poseonly"):
        for level in range(10, 51):
            rows.append(selected.get((command, level), _missing(command, level)))
    statuses = [str(row["status"]) for row in rows]
    status = (
        "blocked" if "audit_failed" in statuses
        else "incomplete" if "missing" in statuses else "awaiting_independent_review"
    )
    content: dict[str, object] = {
        "version": ANNEX_VERSION,
        "run_id": verified["run_id"],
        "renderer_build": verified["renderer_build"],
        "command_sha256": original["sha256"],
        "studio_reference": STUDIO_LIGHT_REFERENCE,
        "pose_face_zero_change_required": True,
        "slot_count": 82,
        "diagnostic_count": 82 - statuses.count("missing"),
        "status": status,
        "rows": rows,
        "device_approved": False,
        "independent_realface_result": "NOT_RUN",
        "release_qualified": False,
    }
    content["sha256"] = _digest(content)
    return json.dumps(
        content, sort_keys=True, allow_nan=False, ensure_ascii=True, separators=(",", ":"),
    )


def verify_studio_pose_annex(text: str, *, command_json: str) -> dict[str, object]:
    """Reject tampering and validate all 82 ordered diagnostic rows."""
    if not isinstance(text, str) or len(text) > 80_000:
        _fail("Studio/Pose annex is absent or too large.")
    try:
        document = json.loads(text)
    except (TypeError, ValueError):
        _fail("Studio/Pose annex is malformed.")
    if not isinstance(document, dict):
        _fail("Studio/Pose annex must be an object.")
    original = verify_tuesday_lock_json(command_json)
    canonical = build_studio_pose_annex(command_json)
    template = json.loads(canonical)
    expected_keys = set(template)
    if set(document) != expected_keys:
        _fail("Studio/Pose annex schema changed.")
    supplied_sha = document.pop("sha256")
    if supplied_sha != _digest(cast(dict[str, object], document)):
        _fail("Studio/Pose checksum mismatch.")
    if any(document.get(key) != template[key] for key in (
        "version", "run_id", "renderer_build", "command_sha256",
        "studio_reference", "pose_face_zero_change_required", "slot_count",
        "device_approved", "independent_realface_result", "release_qualified",
    )):
        _fail("Studio/Pose evidence cannot change the run or approve release.")
    if document["run_id"] != original["run_id"]:
        _fail("Studio/Pose evidence belongs to another run.")
    rows = document.get("rows")
    if not isinstance(rows, list) or len(rows) != 82:
        _fail("Every Studio and Pose diagnostic level must appear.")
    received = 0
    failed = 0
    for index, row in enumerate(rows):
        command = "studioquality" if index < 41 else "poseonly"
        level = 10 + index % 41
        if not isinstance(row, dict) or set(row) != set(_missing(command, level)):
            _fail("Studio/Pose row schema changed.")
        if row["command"] != command or row["level_tenths"] != level:
            _fail("Studio/Pose row ordering changed.")
        if row["status"] == "missing":
            if row != _missing(command, level):
                _fail("Missing diagnostics cannot contain measurements.")
            continue
        received += 1
        if row["status"] == "audit_failed":
            failed += 1
        elif row["status"] != "diagnostic_received":
            _fail("Unknown Studio/Pose audit status.")
        if (
            not isinstance(row["findings"], list)
            or any(
                not isinstance(reason, str)
                or reason not in (_STUDIO_FINDINGS if command == "studioquality" else _POSE_FINDINGS)
                for reason in row["findings"]
            )
        ):
            _fail("Studio/Pose findings must contain only approved reason codes.")
        if (row["status"] == "audit_failed") != bool(row["findings"]):
            _fail("Studio/Pose status contradicts findings.")
        base_rows = cast(list[dict[str, object]], original["rows"])
        source_row = next(
            source for source in base_rows
            if source["command"] == command and source["level_tenths"] == level
        )
        if source_row["status"] == "missing":
            _fail("Diagnostics cannot exist without the measured command row.")
        if command == "studioquality":
            if row["reference"] != STUDIO_LIGHT_REFERENCE:
                _fail("Studio reference was changed.")
            _numeric(cast(float | None, row["colour_drift"]))
            _numeric(cast(float | None, row["texture_ratio"]))
            if row["status"] == "diagnostic_received" and (
                row["protected_unchanged"] is not True
                or row["alpha_unchanged"] is not True
                or row["texture_ratio"] is None
                or (level == 10 and row["neutral_unchanged"] is not True)
            ):
                _fail("Studio diagnostic lacks measured protections.")
        elif row["status"] == "diagnostic_received" and (
            row["identity_enabled"] is not True
            or row["alpha_unchanged"] is not True
            or row["protected_unchanged"] is not True
            or type(row["face_mask_pixels"]) is not int
            or cast(int, row["face_mask_pixels"]) <= 0
            or row["changed_face_pixels"] != 0
        ):
            _fail("Pose diagnostic is incomplete.")
    computed = (
        "blocked" if failed else "incomplete" if received < 82
        else "awaiting_independent_review"
    )
    if document["diagnostic_count"] != received or document["status"] != computed:
        _fail("Studio/Pose aggregate status was forged.")
    document["sha256"] = supplied_sha
    return cast(dict[str, object], document)
