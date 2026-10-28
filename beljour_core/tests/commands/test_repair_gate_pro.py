"""Face-fixer pass-definition hook: synthetic evidence never implies release.

Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.guarded import GuardedProExecutor
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.identity import IdentityDecision
from plumb_api.commands.pro_plan import parse_pro_commands
from plumb_api.commands.repair_gate import FaceFixerGate, FaceFixerLimits, RegionEvidence
from plumb_api.commands.types import CommandName, LockMode, LockStrength

ROOT = Path(__file__).resolve().parents[3]
DEFINITION = ROOT / "tests" / "realface" / "pass_definitions_r1h" / "face_fixer.json"


def drawn(value: int = 40, *, alpha: int = 255) -> ImageFrame:
    return ImageFrame(4, 4, 4, bytes([value, value, value, alpha]) * 16)


def identity() -> IdentityDecision:
    return IdentityDecision(
        "kept", LockMode.SOFTEN, LockStrength.NORMAL, 0.85, 99, 99,
        0.99, 0.99, 1.0, "synthetic-grid-test-only", True,
    )


def regions() -> RegionEvidence:
    return RegionEvidence(4, 4, skin=bytes([255]) * 16, protected=bytes([0]) * 16)


def test_pass_definition_was_written_before_external_quality_run() -> None:
    source = json.loads(DEFINITION.read_text(encoding="utf-8"))
    assert source["format"] == "beljour-pro-face-fixer/1"
    assert source["owner"] == "H"
    assert source["status"] == "not_tested"
    assert source["frozen_release_set"] == "frozen-100000"
    assert source["separate_evidence_required"]
    checks = {row["id"]: row for row in source["checks"]}
    assert checks["alpha_unchanged"]["threshold"] == 0
    assert checks["protected_area_unchanged"]["threshold"] == 0
    assert checks["no_unrequested_skin_lightening"]["threshold"] == 2.5
    assert all(row["missing"] == "unproven" for row in checks.values())


def test_unchanged_synthetic_image_is_not_marked_real_face_pass() -> None:
    result = FaceFixerGate(regions()).evaluate(drawn(), drawn(), identity())
    assert result.status == "unproven"
    assert result.modified_pixels == 0
    assert result.alpha_violations == 0
    assert result.protected_violations == 0
    assert not result.realface_qualified
    assert "realface_evidence_missing" in result.reasons
    assert result.public_metadata()["realface_qualified"] is False


def test_missing_masks_and_identity_remain_unproven() -> None:
    result = FaceFixerGate().evaluate(drawn(), drawn(40), None)
    assert result.status == "unproven"
    assert "skin_mask_missing" in result.reasons
    assert "protected_mask_missing" in result.reasons
    assert "identity_evidence_missing" in result.reasons
    assert result.maximum_lstar_rise is None


def test_changed_alpha_fails_gate_even_when_rgb_is_unchanged() -> None:
    result = FaceFixerGate(regions()).evaluate(drawn(), drawn(40, alpha=2), identity())
    assert result.status == "fail"
    assert result.alpha_violations == 16
    assert "alpha_changed" in result.reasons


def test_lightening_beyond_existing_cap_fails_gate() -> None:
    result = FaceFixerGate(regions()).evaluate(drawn(30), drawn(110), identity())
    assert result.status == "fail"
    assert result.skin_samples == 16
    assert result.maximum_lstar_rise is not None
    assert result.maximum_lstar_rise > 2.5
    assert "skin_lightness_exceeded" in result.reasons


def test_one_protected_pixel_edit_fails_even_with_good_average() -> None:
    protected = bytes([255]) + bytes([0]) * 15
    mask = replace(regions(), protected=protected)
    edited = bytearray(drawn().pixels)
    edited[0] += 5
    result = FaceFixerGate(mask).evaluate(drawn(), ImageFrame(4, 4, 4, bytes(edited)), identity())
    assert result.status == "fail"
    assert result.protected_violations == 1
    assert "protected_region_changed" in result.reasons


def test_safety_flags_are_not_dropped_by_real_evidence_provenance() -> None:
    region = replace(regions(), provenance="authorized_external")
    report = FaceFixerGate(region).evaluate(drawn(30), drawn(140), identity())
    assert report.status == "fail"
    assert "skin_lightness_exceeded" in report.reasons
    assert not report.realface_qualified


def test_warn_identity_cannot_certify_a_repair_gate() -> None:
    warned = replace(identity(), status="warned")
    result = FaceFixerGate(regions()).evaluate(drawn(), drawn(), warned)
    assert result.status == "fail"
    assert "identity_warned" in result.reasons


def test_bad_annotation_size_and_provenance_rejected() -> None:
    with pytest.raises(CommandValidationError):
        RegionEvidence(4, 4, skin=bytes(15))
    with pytest.raises(CommandValidationError):
        RegionEvidence(4, 4, protected=bytes(20))
    with pytest.raises(CommandValidationError):
        RegionEvidence(4, 4, provenance="guessed")
    with pytest.raises(CommandValidationError):
        FaceFixerGate(regions()).evaluate(drawn(), ImageFrame(2, 8, 4, drawn().pixels), identity())


def test_region_must_match_input_layout() -> None:
    wrong = RegionEvidence(8, 2, skin=bytes(16))
    with pytest.raises(CommandValidationError) as failure:
        FaceFixerGate(wrong).evaluate(drawn(), drawn(), identity())
    assert failure.value.code == "invalid_gate_mask"


def test_threshold_and_observation_buffer_are_bounded() -> None:
    with pytest.raises(CommandValidationError):
        FaceFixerLimits(max_lstar_rise=float("nan"))
    with pytest.raises(CommandValidationError):
        FaceFixerLimits(protected_tolerance=256)
    with pytest.raises(CommandValidationError):
        FaceFixerGate(max_reports=0)
    hook = FaceFixerGate(regions(), max_reports=2)
    for _ in range(5):
        hook.observe(drawn(), drawn(), CommandName.CLEANUP, identity())
    assert len(hook.reports) == 2
    hook.clear()
    assert not hook.reports


def test_other_commands_do_not_pollute_repair_history() -> None:
    hook = FaceFixerGate(regions())
    hook.observe(drawn(), drawn(), CommandName.POSEONLY, identity())
    assert hook.reports == ()
    plan = parse_pro_commands("/poseonly 3.0")
    assert plan.steps[0].name is CommandName.POSEONLY


def test_face_fixer_checks_export_only_so_preview_can_stay_responsive() -> None:
    def keep(frame: ImageFrame, step: object, quality: str) -> ImageFrame:
        return frame

    hook = FaceFixerGate(regions())
    executor = GuardedProExecutor(
        handlers={CommandName.CLEANUP: keep},
        identity=IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True),
        face_fixer=hook,
    )
    plan = parse_pro_commands("/cleanup 2.0")
    executor.run(plan, drawn(), quality="preview")
    assert not hook.reports
    executor.run(plan, drawn(), quality="export")
    assert len(hook.reports) == 1
