"""Guarded pose identity, protected face bytes and alpha edge regressions.

All pixels are generated here. A synthetic identity match cannot be used to
qualify a production identity model or an external face gate.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace
from typing import cast

import numpy as np
import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.pose_face_audit import PoseFaceAudit, audit_pose_face
from plumb_api.commands.pose_geometry import PoseEvidence, PoseHandle
from plumb_api.commands.pro_plan import IdentityPolicy, parse_pro_commands
from plumb_api.commands.r2h_session import R2HSession
from plumb_api.commands.regions import FaceRegions


def frame(width: int = 63, height: int = 72, channels: int = 4) -> ImageFrame:
    yy, xx = np.indices((height, width))
    red = np.asarray((21 + xx * 9 + yy * 13) % 256, dtype=np.uint8)
    green = np.asarray((28 + xx * 23 + yy * 5) % 256, dtype=np.uint8)
    blue = np.asarray((19 + xx * 7 + yy * 17) % 256, dtype=np.uint8)
    stacked = np.stack((red, green, blue), axis=-1)
    if channels == 4:
        alpha = np.asarray((xx * 3 + yy * 11 + 37) % 256, dtype=np.uint8)
        stacked = np.dstack((stacked, alpha))
    return ImageFrame(width, height, channels, stacked.tobytes())


def face_mask(photo: ImageFrame) -> bytes:
    area = np.zeros((photo.height, photo.width), dtype=np.uint8)
    area[5:20, 15:49] = 255
    area[19:24, 24:38] = 1
    return area.tobytes()


def pose_evidence(photo: ImageFrame) -> PoseEvidence:
    person = np.zeros((photo.height, photo.width), dtype=np.uint8)
    person[18:-4, 6:-6] = 255
    return PoseEvidence(
        photo.width,
        photo.height,
        person.tobytes(),
        (
            PoseHandle("left_shoulder", 0.27, 0.39, -0.03, 0.005),
            PoseHandle("right_shoulder", 0.73, 0.39, 0.03, 0.005),
            PoseHandle("waist", 0.51, 0.72, 0, -0.02),
        ),
        evidence="synthetic_test",
    )


def session(
    image: ImageFrame,
    *,
    with_identity: bool = True,
    with_pose: bool = True,
) -> R2HSession:
    embedder = (
        IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True)
        if with_identity else None
    )
    runner = R2HSession(identity=embedder)
    regions = FaceRegions(
        image.width, image.height,
        skin=face_mask(image), protected=face_mask(image),
        evidence="synthetic_test",
    )
    runner.open_photo(image, regions=regions, pose=pose_evidence(image) if with_pose else None)
    return runner


@pytest.mark.parametrize("level", (10, 11, 20, 30, 40, 50))
@pytest.mark.parametrize("channels", (3, 4))
def test_actual_guarded_pose_preserves_checked_face_and_identity(
    level: int, channels: int,
) -> None:
    source = frame(channels=channels)
    runner = session(source)
    plan = parse_pro_commands(f"/poseonly level={level / 10:.1f}")
    assert plan.identity.enabled
    receipt = runner.run(plan, quality="export")
    audited = audit_pose_face(source, receipt, checked_face_mask=face_mask(source))
    assert isinstance(audited, PoseFaceAudit)
    assert audited.status == "protected"
    assert audited.changed_face_pixels == 0
    assert audited.mask_pixels > 0
    assert audited.alpha_unchanged
    assert audited.identity_enabled
    assert audited.identity_evidence_valid
    assert audited.identity_synthetic
    assert audited.realface_approved is False
    assert audited.reason_codes == ()
    assert audited.public_metadata()["realface_approved"] is False
    assert len(receipt.steps) == 1
    assert receipt.steps[0].identity is not None


def test_neutral_pose_requires_identity_even_without_body_controls() -> None:
    original = frame()
    runner = session(original, with_pose=False)
    plan = parse_pro_commands("/poseonly 1.0")
    receipt = runner.run(plan, quality="preview")
    audited = audit_pose_face(original, receipt, checked_face_mask=face_mask(original))
    assert audited.status == "protected"
    assert audited.changed_face_pixels == 0
    assert receipt.image.identical(original)
    assert receipt.steps[0].identity is not None


def test_missing_annotation_is_unproven_not_a_free_pass() -> None:
    original = frame()
    runner = session(original)
    receipt = runner.run(parse_pro_commands("/poseonly 3.0"))
    missing = audit_pose_face(original, receipt, checked_face_mask=None)
    assert missing.status == "unproven"
    assert missing.changed_face_pixels is None
    assert "face_annotation_missing" in missing.reason_codes
    empty = audit_pose_face(original, receipt, checked_face_mask=bytes(original.width * original.height))
    assert empty.status == "unproven"
    assert "face_annotation_empty" in empty.reason_codes


def test_explicit_lock_opt_out_does_not_meet_default_guard_requirement() -> None:
    original = frame()
    runner = session(original, with_identity=False)
    normal = parse_pro_commands("/poseonly 1.0")
    downgraded = normal.with_identity(IdentityPolicy(enabled=False, explicit_user_override=True))
    receipt = runner.run(downgraded)
    report = audit_pose_face(original, receipt, checked_face_mask=face_mask(original))
    assert not report.identity_enabled
    assert not report.identity_evidence_valid
    assert report.status == "blocked"
    assert report.reason_codes == ("identity_guard_missing",)


def test_one_modified_face_pixel_is_a_blocker_even_when_guard_receipt_exists() -> None:
    original = frame()
    receipt = session(original).run(parse_pro_commands("/poseonly 1.0"))
    pixels = bytearray(receipt.image.pixels)
    position = (10 * original.width + 22) * original.channels
    pixels[position] ^= 127
    edited = ImageFrame(original.width, original.height, original.channels, bytes(pixels))
    changed = replace(receipt, image=edited)
    report = audit_pose_face(original, changed, checked_face_mask=face_mask(original))
    assert report.changed_face_pixels == 1
    assert report.status == "blocked"
    assert "face_pixels_changed" in report.reason_codes
    assert report.identity_evidence_valid


def test_fractional_face_pixel_is_equally_protected() -> None:
    original = frame()
    receipt = session(original).run(parse_pro_commands("/poseonly 1.0"))
    pixels = bytearray(original.pixels)
    row, column = 39, 13
    mask = bytearray(original.width * original.height)
    mask[row * original.width + column] = 1
    pixels[(row * original.width + column) * original.channels] ^= 1
    changed = replace(receipt, image=ImageFrame(
        original.width, original.height, original.channels, bytes(pixels),
    ))
    audit = audit_pose_face(original, changed, checked_face_mask=bytes(mask))
    assert audit.mask_pixels == 1
    assert audit.changed_face_pixels == 1
    assert audit.status == "blocked"


def test_transparency_change_is_blocked_before_any_release_claim() -> None:
    original = frame()
    receipt = session(original).run(parse_pro_commands("/poseonly 1.0"))
    pixels = bytearray(receipt.image.pixels)
    pixels[3] ^= 2
    changed = replace(receipt, image=ImageFrame(
        original.width, original.height, original.channels, bytes(pixels),
    ))
    audit = audit_pose_face(original, changed, checked_face_mask=face_mask(original))
    assert audit.status == "blocked"
    assert not audit.alpha_unchanged
    assert "alpha_changed" in audit.reason_codes


def test_wrong_command_receipt_cannot_be_used_as_pose_proof() -> None:
    source = frame()
    receipt = session(source).run(parse_pro_commands("/cleanup 1.0"))
    with pytest.raises(CommandValidationError):
        audit_pose_face(source, receipt, checked_face_mask=face_mask(source))


@pytest.mark.parametrize("kind", ("short", "long", "text", "different_layout"))
def test_invalid_photo_or_annotation_is_refused(kind: str) -> None:
    source = frame()
    receipt = session(source).run(parse_pro_commands("/poseonly 1.0"))
    image = source
    mask: bytes | None = face_mask(source)
    if kind == "short":
        mask = mask[:-1] if mask is not None else None
    elif kind == "long":
        mask = mask + b"a" if mask is not None else None
    elif kind == "text":
        mask = cast(bytes, "a mask")
    else:
        image = frame(64, 72)
    with pytest.raises(CommandValidationError):
        audit_pose_face(image, receipt, checked_face_mask=mask)


def test_report_does_not_expose_pixels_or_annotation_bytes() -> None:
    original = frame()
    receipt = session(original).run(parse_pro_commands("/poseonly 1.0"))
    report = audit_pose_face(original, receipt, checked_face_mask=face_mask(original))
    fields = report.public_metadata()
    assert all("pixel_bytes" not in key and "landmarks" not in key for key in fields)
    assert fields["identity_synthetic"]
    assert fields["status"] == "protected"
    assert "realface_approved" in fields
    assert fields["realface_approved"] is False
