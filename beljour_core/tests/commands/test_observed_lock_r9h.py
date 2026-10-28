"""Observed lock evidence must originate in guarded command execution.

Synthetic inputs do not provide device timing or independent face approval.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.guarded import ProExecutionResult
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.observed_lock import LockCaptureOptions, collect_guarded_observation
from plumb_api.commands.pro_plan import parse_pro_commands
from plumb_api.commands.r2h_session import R2HSession
from plumb_api.commands.pose_geometry import PoseEvidence, PoseHandle
from plumb_api.commands.regions import FaceRegions
from plumb_api.commands.types import CommandName


def _photo() -> ImageFrame:
    y, x = np.indices((36, 40))
    pixels = np.stack((
        np.asarray((x * 9 + y * 4 + 51) % 255, dtype=np.uint8),
        np.asarray((x * 5 + y * 7 + 31) % 255, dtype=np.uint8),
        np.asarray((x * 7 + y * 11 + 25) % 255, dtype=np.uint8),
        np.asarray((x * 3 + y * 2 + 91) % 255, dtype=np.uint8),
    ), axis=-1)
    return ImageFrame(40, 36, 4, pixels.tobytes())


def _regions(frame: ImageFrame) -> FaceRegions:
    mask = np.zeros((frame.height, frame.width), dtype=np.uint8)
    mask[3:18, 8:32] = 255
    return FaceRegions(frame.width, frame.height, skin=mask.tobytes(),
                       protected=mask.tobytes(), evidence="synthetic_test")


def _pose(frame: ImageFrame) -> PoseEvidence:
    mask = np.zeros((frame.height, frame.width), dtype=np.uint8)
    mask[16:32, 8:32] = 255
    return PoseEvidence(frame.width, frame.height, mask.tobytes(), (
        PoseHandle("left", 0.3, 0.6, -0.018, 0.005),
        PoseHandle("right", 0.7, 0.6, 0.018, 0.005),
    ), "synthetic_test")


def _session(frame: ImageFrame) -> R2HSession:
    guard = IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True)
    session = R2HSession(identity=guard)
    session.open_photo(frame, regions=_regions(frame), pose=_pose(frame))
    return session


def _results(name: str, level: str = "3.0") -> tuple[
    ImageFrame, ProExecutionResult, ProExecutionResult, R2HSession
]:
    frame = _photo()
    session = _session(frame)
    suffix = " scale=2x" if name == "upscale" else ""
    plan = parse_pro_commands(f"/{name} {level}{suffix}")
    preview = session.run(plan, quality="preview")
    exported = session.run(plan, quality="export")
    return frame, preview, exported, session


@pytest.mark.parametrize("name", tuple(name.value for name in CommandName))
def test_capture_actual_guarded_command(name: str) -> None:
    source, preview, exported, session = _results(name)
    observation = collect_guarded_observation(
        source, preview, exported,
        studio=session.studio_processor.last_report if name == "studioquality" else None,
        pose=session.pose_processor.last_report if name == "poseonly" else None,
        options=LockCaptureOptions(checked_protected_regions=True, neutral_upscale_detail=True,
                                   observed_on_device=True),
    )
    assert observation.command.value == name
    assert observation.level_tenths == 30
    assert observation.preview_ms >= 0
    assert observation.export_ms >= 0
    assert observation.identity_applied
    assert observation.alpha_unchanged
    assert not observation.measured_device
    if name == "studioquality":
        assert observation.skin_lift_l is not None
        assert observation.skin_lift_l <= 2.5
    if name == "poseonly":
        assert observation.pose_minimum_jacobian is not None
        assert observation.pose_minimum_jacobian >= 0.25
        assert observation.pose_retention is not None


@pytest.mark.parametrize("name", tuple(name.value for name in CommandName))
def test_neutral_actual_bytes(name: str) -> None:
    source, preview, exported, session = _results(name, "1.0")
    observation = collect_guarded_observation(
        source, preview, exported,
        studio=session.studio_processor.last_report if name == "studioquality" else None,
        pose=session.pose_processor.last_report if name == "poseonly" else None,
        options=LockCaptureOptions(checked_protected_regions=True, neutral_upscale_detail=True),
    )
    assert observation.neutral_correct


def test_different_plan_cannot_pair() -> None:
    original, preview, _, session = _results("cleanup")
    other = session.run(parse_pro_commands("/cleanup 4.0"), quality="export")
    with pytest.raises(CommandValidationError, match="matching"):
        collect_guarded_observation(original, preview, other)


def test_two_step_chain_cannot_fake_single_command_timing() -> None:
    source = _photo()
    session = _session(source)
    plan = parse_pro_commands("/cleanup 2.0 /studioquality 2.0")
    preview = session.run(plan, quality="preview")
    exported = session.run(plan, quality="export")
    with pytest.raises(CommandValidationError, match="matching"):
        collect_guarded_observation(source, preview, exported)


def test_export_must_be_real_export() -> None:
    source, preview, _, _ = _results("cleanup")
    with pytest.raises(CommandValidationError, match="matching"):
        collect_guarded_observation(source, preview, preview)


def test_plan_change_with_same_step_is_refused() -> None:
    source, preview, exported, _ = _results("cleanup")
    other_plan = parse_pro_commands("/cleanup 3.0 /identitylock")
    with pytest.raises(CommandValidationError, match="matching"):
        collect_guarded_observation(source, preview, replace(exported, plan=other_plan))


def test_identity_disabled_is_not_accepted_as_guarded() -> None:
    source, preview, exported, _ = _results("cleanup")
    off = parse_pro_commands("/cleanup 3.0").identity.with_user_override(enabled=False)
    other_plan = exported.plan.with_identity(off)
    replaced_preview = replace(preview, plan=other_plan)
    replaced_export = replace(exported, plan=other_plan)
    observation = collect_guarded_observation(source, replaced_preview, replaced_export)
    assert not observation.identity_applied


def test_missing_identity_result_is_not_trusted() -> None:
    source, preview, exported, _ = _results("cleanup")
    fake = replace(exported.steps[0], identity=None)
    altered = replace(exported, steps=(fake,))
    assert not collect_guarded_observation(source, preview, altered).identity_applied


def test_missing_pose_diagnostics_stays_unproven() -> None:
    source, preview, exported, _ = _results("poseonly")
    observation = collect_guarded_observation(source, preview, exported)
    assert observation.pose_minimum_jacobian is None
    assert not observation.protected_unchanged


def test_missing_studio_diagnostics_stays_unproven() -> None:
    source, preview, exported, _ = _results("studioquality")
    observation = collect_guarded_observation(source, preview, exported)
    assert observation.skin_lift_l is None
    assert not observation.protected_unchanged


def test_wrong_studio_level_is_rejected() -> None:
    source, preview, exported, session = _results("studioquality")
    report = session.studio_processor.last_report
    assert report is not None
    with pytest.raises(CommandValidationError, match="another render"):
        collect_guarded_observation(source, preview, exported,
                                    studio=replace(report, level="4.0"))


def test_wrong_pose_level_is_rejected() -> None:
    source, preview, exported, session = _results("poseonly")
    report = session.pose_processor.last_report
    assert report is not None
    with pytest.raises(CommandValidationError, match="another render"):
        collect_guarded_observation(source, preview, exported,
                                    pose=replace(report, level="4.0"))


def test_source_is_always_immutable() -> None:
    source, preview, exported, _ = _results("cleanup")
    original = bytes(source.pixels)
    collect_guarded_observation(source, preview, exported)
    assert source.pixels == original


def test_observation_never_contains_image_bytes() -> None:
    source, preview, exported, _ = _results("cleanup")
    record = collect_guarded_observation(source, preview, exported)
    output = repr(record)
    assert "pixels" not in output
    assert "file" not in output
    assert "model" not in output


def test_invalid_option_flags_rejected() -> None:
    with pytest.raises(CommandValidationError):
        LockCaptureOptions(checked_protected_regions=1)


def test_wrong_source_dimensions_rejected() -> None:
    _, preview, exported, _ = _results("cleanup")
    other = ImageFrame(1, 1, 4, b"\x00\x00\x00\x00")
    with pytest.raises(CommandValidationError, match="aligned"):
        collect_guarded_observation(other, preview, exported)
