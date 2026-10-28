"""Tuesday per-level STUDIO and POSE diagnostic annex safeguards.

Only typed synthetic records are used. Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.pose_face_audit import PoseFaceAudit
from plumb_api.commands.studio import STUDIO_LIGHT_REFERENCE
from plumb_api.commands.studio_light_audit import StudioLightAudit
from plumb_api.commands.studio_pose_annex import (
    ANNEX_VERSION,
    PoseLevelEvidence,
    StudioLevelEvidence,
    build_studio_pose_annex,
    verify_studio_pose_annex,
)
from plumb_api.commands.types import CommandName
from tests.commands.test_joint_lock_readiness_r14h import command_row, packets


def studio_audit(*, neutral: bool = False) -> StudioLightAudit:
    return StudioLightAudit(
        reference=STUDIO_LIGHT_REFERENCE,
        mean_lift_l=0.4,
        peak_lift_l=1.3,
        mean_chromaticity_drift=0.01,
        texture_energy_ratio=1.01,
        sculpting_gradient_change=0.02,
        protected_changed_pixels=0,
        protected_evidence_present=True,
        alpha_unchanged=True,
        neutral_bytes_unchanged=neutral,
    )


def pose_audit(level: int) -> PoseFaceAudit:
    return PoseFaceAudit(
        status="protected",
        level=f"{level / 10:.1f}",
        mask_pixels=180,
        changed_face_pixels=0,
        changed_outside_face_pixels=13,
        alpha_unchanged=True,
        identity_enabled=True,
        identity_evidence_valid=True,
        identity_synthetic=True,
        reason_codes=(),
    )


def packet_for(command: CommandName, level: int) -> str:
    return packets((command_row(command, level),))[0]


def rehash(document: dict[str, object]) -> str:
    body = {key: value for key, value in document.items() if key != "sha256"}
    document["sha256"] = hashlib.sha256(json.dumps(
        body, sort_keys=True, allow_nan=False, ensure_ascii=True, separators=(",", ":"),
    ).encode("utf-8")).hexdigest()
    return json.dumps(document, sort_keys=True, separators=(",", ":"))


def test_annex_contains_all_82_missing_slots_and_not_approval() -> None:
    original = packets()[0]
    raw = build_studio_pose_annex(original)
    verified = verify_studio_pose_annex(raw, command_json=original)
    assert verified["version"] == ANNEX_VERSION
    assert verified["status"] == "incomplete"
    assert verified["slot_count"] == 82
    assert verified["diagnostic_count"] == 0
    assert len(verified["rows"]) == 82
    assert verified["rows"][0]["command"] == "studioquality"
    assert verified["rows"][41]["command"] == "poseonly"
    assert all(row["status"] == "missing" for row in verified["rows"])
    assert verified["device_approved"] is False
    assert verified["release_qualified"] is False
    assert verified["independent_realface_result"] == "NOT_RUN"


def test_checked_studio_diagnostic_is_not_release_evidence() -> None:
    command_json = packet_for(CommandName.STUDIOQUALITY, 20)
    annex = build_studio_pose_annex(
        command_json, studio=(StudioLevelEvidence(20, studio_audit()),),
    )
    report = verify_studio_pose_annex(annex, command_json=command_json)
    row = report["rows"][10]
    assert row["status"] == "diagnostic_received"
    assert row["reference"] == STUDIO_LIGHT_REFERENCE
    assert row["colour_drift"] == pytest.approx(0.01)
    assert row["texture_ratio"] == pytest.approx(1.01)
    assert row["protected_unchanged"] is True
    assert report["status"] == "incomplete"
    assert report["release_qualified"] is False


def test_checked_pose_diagnostic_needs_realface_review() -> None:
    command_json = packet_for(CommandName.POSEONLY, 31)
    annex = build_studio_pose_annex(
        command_json, pose=(PoseLevelEvidence(31, pose_audit(31)),),
    )
    result = verify_studio_pose_annex(annex, command_json=command_json)
    row = result["rows"][41 + 21]
    assert row["status"] == "diagnostic_received"
    assert row["face_mask_pixels"] == 180
    assert row["changed_face_pixels"] == 0
    assert row["identity_enabled"] is True
    assert row["identity_synthetic"] is True
    assert result["device_approved"] is False


@pytest.mark.parametrize("level", (10, 20, 30, 40, 50))
def test_studio_protection_failures_are_visible(level: int) -> None:
    original = packet_for(CommandName.STUDIOQUALITY, level)
    broken = replace(studio_audit(neutral=level == 10), protected_changed_pixels=1)
    annex = build_studio_pose_annex(
        original, studio=(StudioLevelEvidence(level, broken),),
    )
    result = verify_studio_pose_annex(annex, command_json=original)
    row = result["rows"][level - 10]
    assert row["status"] == "audit_failed"
    assert "protected_pixels_changed" in row["findings"]
    assert result["status"] == "blocked"


def test_neutral_studio_requires_exact_original_bytes() -> None:
    original = packet_for(CommandName.STUDIOQUALITY, 10)
    annex = build_studio_pose_annex(
        original, studio=(StudioLevelEvidence(10, studio_audit()),),
    )
    result = verify_studio_pose_annex(annex, command_json=original)
    assert result["rows"][0]["status"] == "audit_failed"
    assert "neutral_pixels_changed" in result["rows"][0]["findings"]


@pytest.mark.parametrize("level", (10, 15, 25, 35, 50))
def test_pose_face_changes_or_missing_identity_are_audit_failures(level: int) -> None:
    original = packet_for(CommandName.POSEONLY, level)
    broken = replace(pose_audit(level), changed_face_pixels=1)
    annex = build_studio_pose_annex(
        original, pose=(PoseLevelEvidence(level, broken),),
    )
    report = verify_studio_pose_annex(annex, command_json=original)
    assert report["rows"][41 + level - 10]["status"] == "audit_failed"
    assert "face_pixels_changed" in report["rows"][41 + level - 10]["findings"]
    disabled = replace(pose_audit(level), identity_enabled=False)
    annex_disabled = build_studio_pose_annex(
        original, pose=(PoseLevelEvidence(level, disabled),),
    )
    report_disabled = verify_studio_pose_annex(annex_disabled, command_json=original)
    assert report_disabled["rows"][41 + level - 10]["status"] == "audit_failed"


def test_annex_cannot_measure_an_unmeasured_command_row() -> None:
    original = packets()[0]
    with pytest.raises(CommandValidationError):
        build_studio_pose_annex(
            original, studio=(StudioLevelEvidence(23, studio_audit()),),
        )
    with pytest.raises(CommandValidationError):
        build_studio_pose_annex(
            original, pose=(PoseLevelEvidence(22, pose_audit(22)),),
        )


def test_wrong_pose_level_rejected() -> None:
    original = packet_for(CommandName.POSEONLY, 15)
    with pytest.raises(CommandValidationError):
        build_studio_pose_annex(
            original, pose=(PoseLevelEvidence(15, pose_audit(14)),),
        )


def test_duplicate_studio_or_pose_evidence_is_refused() -> None:
    original = packet_for(CommandName.STUDIOQUALITY, 11)
    item = StudioLevelEvidence(11, studio_audit())
    with pytest.raises(CommandValidationError):
        build_studio_pose_annex(original, studio=(item, item))


def test_forged_release_field_refused_even_after_rehash() -> None:
    original = packets()[0]
    raw = json.loads(build_studio_pose_annex(original))
    raw["release_qualified"] = True
    with pytest.raises(CommandValidationError):
        verify_studio_pose_annex(rehash(raw), command_json=original)


def test_rehash_cannot_turn_missing_row_into_diagnostic() -> None:
    original = packets()[0]
    raw = json.loads(build_studio_pose_annex(original))
    raw["rows"][0]["status"] = "diagnostic_received"
    with pytest.raises(CommandValidationError):
        verify_studio_pose_annex(rehash(raw), command_json=original)


def test_mismatched_packet_and_annex_rejected() -> None:
    original = packets()[0]
    annex = build_studio_pose_annex(original)
    other = packets((command_row(CommandName.CLEANUP, 10),))[0]
    with pytest.raises(CommandValidationError):
        verify_studio_pose_annex(annex, command_json=other)


def test_rehashed_unknown_schema_field_rejected() -> None:
    original = packets()[0]
    raw = json.loads(build_studio_pose_annex(original))
    raw["private_image"] = "not_allowed"
    with pytest.raises(CommandValidationError):
        verify_studio_pose_annex(rehash(raw), command_json=original)


def test_pose_reason_codes_cannot_carry_private_names() -> None:
    original = packet_for(CommandName.POSEONLY, 24)
    private = replace(
        pose_audit(24), reason_codes=("private/photo/location/subject-name",),
    )
    with pytest.raises(CommandValidationError):
        build_studio_pose_annex(
            original, pose=(PoseLevelEvidence(24, private),),
        )


def test_rehashed_unknown_reason_is_rejected() -> None:
    original = packet_for(CommandName.STUDIOQUALITY, 23)
    raw = json.loads(build_studio_pose_annex(
        original, studio=(StudioLevelEvidence(23, studio_audit()),),
    ))
    raw["rows"][13]["status"] = "audit_failed"
    raw["rows"][13]["findings"] = ["unknown-private-identifier"]
    raw["status"] = "blocked"
    with pytest.raises(CommandValidationError):
        verify_studio_pose_annex(rehash(raw), command_json=original)
