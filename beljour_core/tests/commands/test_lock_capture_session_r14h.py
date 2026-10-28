"""Photo-scoped collection of executed lock evidence; synthetic only.

Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.lock_capture_session import TuesdayCaptureSession
from plumb_api.commands.observed_lock import LockCaptureOptions
from plumb_api.commands.quality_tiers import QualityTierRecipe, run_quality_tier
from plumb_api.commands.r2h_session import R2HSession
from plumb_api.commands.types import CommandName
from tests.commands.test_observed_lock_r9h import _photo, _results
from tests.commands.test_studio_pose_annex_r14h import StudioLevelEvidence, studio_audit
from tests.commands.tier_synthetic_benchmark_r13h import SyntheticGeometryEmbedder, _fast_reference


def capture() -> TuesdayCaptureSession:
    return TuesdayCaptureSession(
        run_id="real-run-unverified", renderer_build="local-engine",
        source=_photo(),
    )


def test_empty_session_is_an_unverified_complete_shape() -> None:
    session = capture()
    assert session.summary().command_slots == 0
    assert session.summary().tier_slots == 0
    assert "pixels" not in json.dumps(session.summary().public_metadata())
    report = session.package().validate()
    assert report.observed == 0
    assert len(report.scopes) == 7
    assert len(report.gaps) == 287
    assert report.status == "incomplete"


@pytest.mark.parametrize("command", tuple(name.value for name in CommandName))
def test_actual_guarded_commands_are_measured_not_asserted(command: str) -> None:
    source, preview, exported, session = _results(command)
    ledger = capture()
    observation = ledger.record_command(
        source, preview, exported,
        studio=session.studio_processor.last_report if command == "studioquality" else None,
        pose=session.pose_processor.last_report if command == "poseonly" else None,
        options=LockCaptureOptions(checked_protected_regions=True, neutral_upscale_detail=True),
    )
    assert observation.command.value == command
    assert observation.level_tenths == 30
    assert observation.preview_ms >= 0
    assert observation.export_ms >= 0
    assert observation.identity_applied
    assert observation.measured_device is False
    assert ledger.summary().command_slots == 1
    bundle = ledger.package()
    assert bundle.validate().observed == 1
    assert bundle.validate().status == "incomplete"
    assert "face_hash" not in bundle.manifest_json
    assert "pixels" not in bundle.manifest_json


def test_same_command_level_cannot_be_counted_twice() -> None:
    source, preview, exported, _ = _results("cleanup")
    ledger = capture()
    ledger.record_command(source, preview, exported)
    with pytest.raises(CommandValidationError) as exc:
        ledger.record_command(source, preview, exported)
    assert exc.value.code == "duplicate_lock_evidence"
    assert ledger.summary().command_slots == 1


def test_changed_original_photo_refused_before_capture() -> None:
    source, preview, exported, _ = _results("cleanup")
    bad_pixels = bytearray(source.pixels)
    bad_pixels[0] ^= 1
    changed = ImageFrame(source.width, source.height, source.channels, bytes(bad_pixels))
    ledger = capture()
    with pytest.raises(CommandValidationError) as exc:
        ledger.record_command(changed, preview, exported)
    assert exc.value.code == "capture_photo_changed"
    assert ledger.summary().command_slots == 0


def test_wrong_geometry_refused_before_capture() -> None:
    _, preview, exported, _ = _results("cleanup")
    ledger = capture()
    with pytest.raises(CommandValidationError):
        ledger.record_command(ImageFrame(1, 1, 3, b"\x00\x00\x00"), preview, exported)
    assert ledger.summary().command_slots == 0


def test_studio_diagnostic_cannot_attach_to_cleanup() -> None:
    source, preview, exported, _ = _results("cleanup")
    ledger = capture()
    with pytest.raises(CommandValidationError):
        ledger.record_command(
            source, preview, exported,
            studio_evidence=StudioLevelEvidence(30, studio_audit()),
        )
    assert ledger.summary().studio_diagnostics == 0
    assert ledger.summary().command_slots == 0


def test_studio_diagnostic_requires_exact_strength() -> None:
    source, preview, exported, _ = _results("studioquality")
    ledger = capture()
    with pytest.raises(CommandValidationError):
        ledger.record_command(
            source, preview, exported,
            studio_evidence=StudioLevelEvidence(31, studio_audit()),
        )
    assert ledger.summary().studio_diagnostics == 0


def test_nonmatching_preview_export_rejected_without_storage() -> None:
    source, preview, exported, _ = _results("cleanup")
    ledger = capture()
    swapped = replace(exported, plan=preview.plan.with_identity(
        preview.plan.identity.with_user_override(enabled=False),
    ))
    with pytest.raises(CommandValidationError):
        ledger.record_command(source, preview, swapped)
    assert ledger.summary().command_slots == 0


def test_session_close_revokes_old_evidence_and_private_digest() -> None:
    source, preview, exported, _ = _results("cleanup")
    ledger = capture()
    ledger.record_command(source, preview, exported)
    assert ledger.summary().command_slots == 1
    ledger.close()
    assert ledger.summary().command_slots == 0
    assert ledger.summary().tier_slots == 0
    with pytest.raises(CommandValidationError) as exc:
        ledger.package()
    assert exc.value.code == "capture_closed"
    with pytest.raises(CommandValidationError):
        ledger.record_command(source, preview, exported)


def test_capture_summary_does_not_expose_photo_digest() -> None:
    ledger = capture()
    text = repr(ledger.summary()) + repr(ledger.summary().public_metadata())
    assert "photo" not in text
    assert "sha256" not in text
    assert "pixels" not in text


def test_real_guarded_tier_capture_does_not_promote_test_identity_to_device() -> None:
    source = ImageFrame(960, 540, 3, bytes((126, 137, 148)) * (960 * 540))
    guard = IdentityGuard(
        SyntheticGeometryEmbedder(), allow_test_embedder=True,
        align_original=_fast_reference,
    )
    session = R2HSession(identity=guard, tile_size=256)
    session.open_photo(source)
    recipe = QualityTierRecipe("1080", DecimalLevel(10), DecimalLevel(10))
    preview = run_quality_tier(session, source, recipe, quality="preview")
    exported = run_quality_tier(session, source, recipe, quality="export")
    ledger = TuesdayCaptureSession(run_id="test-tier", renderer_build="test", source=source)
    receipt = ledger.record_tier(source, preview, exported, measured_device=True)
    assert receipt.tier == "1080"
    assert receipt.level_tenths == 10
    assert receipt.neutral_reference_exact
    assert receipt.guarded_preview_steps == 2
    assert receipt.guarded_export_steps == 2
    assert receipt.measured_device is False
    assert ledger.summary().tier_slots == 1
    assert ledger.package().validate().device_measured == 0
    with pytest.raises(CommandValidationError) as exc:
        ledger.record_tier(source, preview, exported)
    assert exc.value.code == "duplicate_lock_evidence"
    ledger.close()
    assert ledger.summary().tier_slots == 0


def test_invalid_capture_device_flag_refused() -> None:
    source = _photo()
    ledger = capture()
    with pytest.raises(CommandValidationError):
        ledger.record_tier(source, None, None, measured_device=1)
    assert ledger.summary().tier_slots == 0
