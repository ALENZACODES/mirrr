"""Whole Pro chain identity invariants, atomic undo and checked pose evidence.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandUnavailable, CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.pose_geometry import PoseEvidence, PoseHandle
from plumb_api.commands.pro_plan import parse_pro_commands
from plumb_api.commands.pro_undo import ProMemoryUndo
from plumb_api.commands.r2h_session import R2HSession
from plumb_api.commands.regions import FaceRegions
from plumb_api.commands.types import CommandName


def frame(width: int = 42, height: int = 42) -> ImageFrame:
    yy, xx = np.indices((height, width))
    luminance = ((23 + xx * 6 + yy * 8) % 150).astype(np.uint8)
    rgb = np.stack((luminance, luminance + 30, luminance + 43), axis=-1)
    return ImageFrame(width, height, 3, rgb.tobytes())


def pose(source: ImageFrame) -> PoseEvidence:
    mask = np.zeros((source.height, source.width), dtype=np.uint8)
    mask[10:-4, 5:-5] = 255
    return PoseEvidence(source.width, source.height, mask.tobytes(), (
        PoseHandle("left", 0.3, 0.6, -0.034, 0.0),
        PoseHandle("right", 0.7, 0.6, 0.034, 0.0),
    ), "synthetic_test")


def regions(source: ImageFrame) -> FaceRegions:
    original = np.zeros((source.height, source.width), dtype=np.uint8)
    original[11:20, 14:26] = 255
    return FaceRegions(source.width, source.height, protected=original.tobytes())


def guard() -> IdentityGuard:
    return IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True)


@pytest.mark.parametrize(
    "command",
    ["cleanup", "upscale", "studioquality", "poseonly", "identitylock"],
)
def test_every_pro_command_is_covered_by_default_identity_policy(command: str) -> None:
    photo = frame()
    plan = parse_pro_commands(f"/{command} 2.3" if command != "upscale" else "/upscale 2x level=2.3")
    assert plan.identity.enabled
    session = R2HSession(identity=guard())
    session.open_photo(photo, regions=regions(photo), pose=pose(photo))
    result = session.run(plan, quality="preview")
    assert result.steps[0].identity is not None
    assert result.steps[0].command.value == command
    assert result.steps[0].identity.synthetic_evidence


def test_complete_five_command_chain_has_five_identity_decisions() -> None:
    photo = frame()
    initial = bytes(photo.pixels)
    history = ProMemoryUndo()
    session = R2HSession(identity=guard(), undo=history)
    session.open_photo(photo, regions=regions(photo), pose=pose(photo))
    plan = parse_pro_commands("/cleanup 2.0 /studioquality 3.0 /poseonly 3.5 /upscale 2x /identitylock")
    result = session.run(plan)
    assert [step.command for step in result.steps] == [
        CommandName.CLEANUP, CommandName.STUDIOQUALITY, CommandName.POSEONLY,
        CommandName.UPSCALE, CommandName.IDENTITYLOCK,
    ]
    assert all(step.identity is not None for step in result.steps)
    assert photo.pixels == initial
    assert result.image.width == photo.width * 2
    assert result.image.height == photo.height * 2
    assert result.undo_steps == history.undo_count


def test_no_model_fails_closed_before_studio_or_pose() -> None:
    photo = frame()
    session = R2HSession(identity=None)
    session.open_photo(photo, pose=pose(photo))
    for command in ("/studioquality 5.0", "/poseonly 5.0", "/identitylock"):
        with pytest.raises(CommandUnavailable) as error:
            session.run(parse_pro_commands(command))
        assert error.value.code == "identity_model_unavailable"
    assert session.summary.last_plan is None
    assert session.summary.render_cache_bytes == 0


def test_explicit_user_override_disables_guard_and_keeps_accountability() -> None:
    photo = frame()
    session = R2HSession(identity=None)
    session.open_photo(photo, pose=pose(photo))
    plan = parse_pro_commands("/studioquality 3.2 /poseonly 3.1")
    overridden = plan.with_identity(plan.identity.with_user_override(enabled=False))
    result = session.run(overridden)
    assert all(step.identity is None for step in result.steps)
    assert overridden.identity.explicit_user_override
    assert overridden.fingerprint() != plan.fingerprint()


def test_pose_without_checked_evidence_does_not_commit_partial_chain() -> None:
    photo = frame()
    undo = ProMemoryUndo()
    session = R2HSession(identity=guard(), undo=undo)
    session.open_photo(photo)
    with pytest.raises(CommandUnavailable) as failure:
        session.run(parse_pro_commands("/cleanup 3.8 /poseonly 4.0"))
    assert failure.value.code == "pose_evidence_missing"
    assert undo.undo_count == 0
    assert session.summary.last_plan is None


def test_photo_revision_invalidates_all_mask_and_pose_data() -> None:
    original = frame()
    reads = [0]

    def supplier(value: ImageFrame) -> FaceRegions:
        reads[0] += 1
        return regions(value)

    session = R2HSession(identity=guard())
    session.open_photo(original, supplier=supplier, pose=pose(original))
    for value in (20, 23, 34, 48):
        plan = parse_pro_commands("/studioquality 3.0 /poseonly 3.0")
        plan = plan.edit_level(0, DecimalLevel(value))
        report = session.run(plan, quality="preview")
        assert len(report.steps) == 2
    assert reads == [1]
    assert session.summary.region_reads == 1
    replacement = frame(45, 46)
    session.open_photo(replacement, supplier=supplier)
    assert reads == [2]
    assert session.summary.render_cache_bytes == 0
    with pytest.raises(CommandUnavailable):
        session.run(parse_pro_commands("/poseonly 3.0"))


def test_stale_pose_does_not_commit_undo_or_cache() -> None:
    photo = frame()
    history = ProMemoryUndo()
    session = R2HSession(identity=guard(), undo=history)
    session.open_photo(photo, pose=pose(photo))
    with pytest.raises(CommandUnavailable) as failure:
        session.run(parse_pro_commands("/studioquality 3.5 /poseonly 2.5"),
                    is_current=lambda: False)
    assert failure.value.code == "stale_preview"
    assert history.undo_count == 0
    assert session.summary.render_cache_bytes == 0


def test_level_one_is_unchanged_for_cleanup_studio_pose() -> None:
    photo = frame()
    session = R2HSession(identity=guard())
    session.open_photo(photo, pose=pose(photo))
    plan = parse_pro_commands("/cleanup 1.0 /studioquality 1.0 /poseonly 1.0")
    result = session.run(plan)
    assert result.image.pixels == photo.pixels
    assert all(not step.modified for step in result.steps)
    assert all(step.identity is not None for step in result.steps)


def test_level_one_upscale_does_not_increase_face_detail_sharpening() -> None:
    photo = frame()
    session = R2HSession(identity=guard())
    session.open_photo(photo, regions=regions(photo))
    result = session.run(parse_pro_commands("/upscale 2x level=1.0"))
    assert result.image.width == photo.width * 2
    report = session.upscale_processor.last_report
    assert report is not None
    assert not report.face_detail_enabled


@pytest.mark.parametrize("bad", [None, "invalid", bytes(3)])
def test_pose_rejects_untyped_evidence(bad: object) -> None:
    photo = frame()
    session = R2HSession(identity=guard())
    if bad is None:
        session.open_photo(photo)
        with pytest.raises(CommandUnavailable):
            session.run(parse_pro_commands("/poseonly 2.0"))
    else:
        with pytest.raises(CommandValidationError):
            session.open_photo(photo, pose=bad)
