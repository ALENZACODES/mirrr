"""Run all five local effects through default-on identity checks at decimal stops.

All scenes and controls are constructed from generated pixels and mask bytes.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandUnavailable
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.pose_geometry import PoseEvidence, PoseHandle
from plumb_api.commands.pro_plan import parse_pro_commands
from plumb_api.commands.pro_undo import ProMemoryUndo
from plumb_api.commands.r2h_session import R2HSession
from plumb_api.commands.regions import FaceRegions
from plumb_api.commands.types import CommandName


def scene(width: int = 48, height: int = 56) -> ImageFrame:
    yy, xx = np.indices((height, width))
    r = np.asarray((22 + xx * 9 + yy * 4) % 255, dtype=np.uint8)
    g = np.asarray((31 + xx * 3 + yy * 7) % 255, dtype=np.uint8)
    b = np.asarray((41 + xx * 4 + yy * 11) % 255, dtype=np.uint8)
    alpha = np.asarray((xx * 2 + yy * 3) % 256, dtype=np.uint8)
    rgba = np.stack((r, g, b, alpha), axis=-1)
    return ImageFrame(width, height, 4, rgba.tobytes())


def measured_pose(image: ImageFrame) -> PoseEvidence:
    body = np.zeros((image.height, image.width), dtype=np.uint8)
    body[14:-4, 7:-7] = 255
    return PoseEvidence(image.width, image.height, body.tobytes(), (
        PoseHandle("left", 0.25, 0.40, -0.024, 0.002),
        PoseHandle("right", 0.75, 0.40, 0.024, 0.002),
        PoseHandle("waist", 0.5, 0.7, 0, -0.015),
    ), "synthetic_test")


def masks(image: ImageFrame) -> FaceRegions:
    skin = np.zeros((image.height, image.width), dtype=np.uint8)
    skin[3:22, 8:-8] = 255
    protected = np.zeros_like(skin)
    protected[5:15, 18:30] = 255
    return FaceRegions(image.width, image.height, skin=skin.tobytes(),
                       protected=protected.tobytes())


def make_session(image: ImageFrame) -> R2HSession:
    approved_test_guard = IdentityGuard(
        DeterministicTestEmbedder(), allow_test_embedder=True,
    )
    session = R2HSession(identity=approved_test_guard, undo=ProMemoryUndo())
    session.open_photo(image, regions=masks(image), pose=measured_pose(image))
    return session


@pytest.mark.parametrize("command", (
    CommandName.IDENTITYLOCK,
    CommandName.CLEANUP,
    CommandName.UPSCALE,
    CommandName.STUDIOQUALITY,
    CommandName.POSEONLY,
))
def test_one_guard_for_every_level(command: CommandName) -> None:
    image = scene()
    session = make_session(image)
    original_bytes = bytes(image.pixels)
    for tenths in range(10, 51):
        level = DecimalLevel(tenths).label
        text = f"/{command.value} level={level}"
        if command is CommandName.UPSCALE:
            text += " scale=2x"
        plan = parse_pro_commands(text)
        assert plan.identity.enabled
        result = session.run(plan, quality="preview")
        assert len(result.steps) == 1
        assert result.steps[0].identity is not None
        assert result.steps[0].identity.synthetic_evidence
        assert result.steps[0].level == level
        assert image.pixels == original_bytes
        assert session.summary.photo_open


def test_studio_and_pose_technical_measurements_are_actual_outputs() -> None:
    image = scene()
    session = make_session(image)
    session.run(parse_pro_commands("/studioquality 5.0 /poseonly 5.0"))
    studio = session.studio_processor.last_report
    pose = session.pose_processor.last_report
    assert studio is not None
    assert studio.masks_evidence
    assert studio.maximum_skin_lift_l is not None
    assert studio.maximum_skin_lift_l <= 2.5 + 1e-8
    assert pose is not None
    assert pose.fold_minimum is not None
    assert pose.fold_minimum >= 0.25
    assert pose.fold_retention >= 0.25
    assert pose.protected_unchanged


def test_five_command_chain_returns_five_identity_receipts_and_one_undo() -> None:
    image = scene()
    session = make_session(image)
    plan = parse_pro_commands(
        "/cleanup 2.0 /studioquality 3.0 /poseonly 2.5 "
        "/upscale 2x level=1.0 /identitylock"
    )
    result = session.run(plan, quality="export")
    assert len(result.steps) == 5
    assert all(step.identity is not None for step in result.steps)
    assert result.image.width == image.width * 2
    assert result.image.height == image.height * 2
    assert result.timing.elapsed_ms >= 0
    assert result.timing.quality == "export"


def test_new_photo_cannot_keep_old_person_or_model_state() -> None:
    first = scene()
    session = make_session(first)
    session.run(parse_pro_commands("/poseonly 3.0"))
    session.close_photo()
    with pytest.raises(CommandUnavailable):
        session.run(parse_pro_commands("/poseonly 3.0"))
    replacement = scene(52, 60)
    session.open_photo(replacement, regions=masks(replacement))
    with pytest.raises(CommandUnavailable):
        session.run(parse_pro_commands("/poseonly 3.0"))


def test_unapproved_identity_model_still_fails_closed() -> None:
    image = scene()
    session = R2HSession(identity=None)
    session.open_photo(image, pose=measured_pose(image))
    for command in ("/studioquality 3.0", "/poseonly 3.0", "/identitylock"):
        with pytest.raises(CommandUnavailable) as failure:
            session.run(parse_pro_commands(command))
        assert failure.value.code == "identity_model_unavailable"
