"""Actual guarded command sweep is separate from external face certification.

Tests use only generated pixels and explicitly enabled synthetic comparisons.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.observed_sweep import run_observed_sweep
from plumb_api.commands.pose_geometry import PoseEvidence, PoseHandle
from plumb_api.commands.r2h_session import R2HSession
from plumb_api.commands.regions import FaceRegions
from plumb_api.commands.types import CommandName


def fixture() -> ImageFrame:
    yy, xx = np.indices((28, 32))
    rgb = np.stack((
        np.asarray((xx * 5 + yy * 7 + 28) % 255, dtype=np.uint8),
        np.asarray((xx * 3 + yy * 11 + 38) % 255, dtype=np.uint8),
        np.asarray((xx * 9 + yy * 2 + 52) % 255, dtype=np.uint8),
    ), axis=-1)
    return ImageFrame(32, 28, 3, rgb.tobytes())


def session(frame: ImageFrame, with_pose: bool = True) -> R2HSession:
    skin = np.zeros((frame.height, frame.width), dtype=np.uint8)
    skin[2:14, 4:25] = 255
    regions = FaceRegions(frame.width, frame.height, skin=skin.tobytes(),
                          evidence="synthetic_test")
    body = np.zeros_like(skin)
    body[15:27, 6:26] = 255
    pose = PoseEvidence(frame.width, frame.height, body.tobytes(), (
        PoseHandle("left", 0.3, 0.6, -0.015, 0.003),
        PoseHandle("right", 0.7, 0.6, 0.015, 0.003),
    ), "synthetic_test") if with_pose else None
    guard = IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True)
    engine = R2HSession(identity=guard)
    engine.open_photo(frame, regions=regions, pose=pose)
    return engine


def test_sweep_captures_actual_studio_and_pose() -> None:
    source = fixture()
    engine = session(source)
    result = run_observed_sweep(engine, source,
                                commands=(CommandName.STUDIOQUALITY, CommandName.POSEONLY),
                                levels=(10, 20, 30), checked_protected_regions=True)
    assert result.attempted == 6
    assert result.captured == 6
    assert not result.cancelled
    assert result.problems == ()
    assert result.report.status == "incomplete"
    assert not result.release_qualified
    assert result.report.findings[3].checked_levels == 3
    assert result.report.findings[4].checked_levels == 3
    assert not result.report.findings[3].failed_levels
    assert not result.report.findings[4].failed_levels


def test_sweep_never_reports_release_certification() -> None:
    source = fixture()
    result = run_observed_sweep(session(source), source,
                                commands=(CommandName.CLEANUP,),
                                levels=(10, 20), checked_protected_regions=True)
    data = result.public_metadata()
    assert data["release_qualified"] is False
    assert data["source"] == "actual_guarded_synthetic_or_local"
    assert data["report"]["independent_face_evidence"] is False
    assert result.report.status == "incomplete"


def test_upscale_at_neutral_matches_reference() -> None:
    source = fixture()
    result = run_observed_sweep(session(source), source,
                                commands=(CommandName.UPSCALE,),
                                levels=(10,), checked_protected_regions=True)
    assert result.captured == 1
    assert result.report.status == "incomplete"
    assert result.report.findings[2].failed_levels == ()
    assert result.report.findings[2].checked_levels == 1


def test_missing_body_evidence_yields_missing_pose_rows() -> None:
    source = fixture()
    result = run_observed_sweep(session(source, with_pose=False), source,
                                commands=(CommandName.POSEONLY,),
                                levels=(10, 20), checked_protected_regions=True)
    assert result.attempted == 2
    assert result.captured == 1
    assert len(result.problems) == 1
    assert result.problems[0].error_code == "pose_evidence_missing"
    assert result.report.status == "incomplete"
    assert 20 in result.report.findings[4].missing_levels


def test_no_protected_evidence_does_not_pass_matrix() -> None:
    source = fixture()
    result = run_observed_sweep(session(source), source,
                                commands=(CommandName.CLEANUP,), levels=(20,))
    assert result.report.status == "blocked"
    assert result.report.findings[1].failed_levels == (20,)


def test_cancelled_after_one_observation() -> None:
    source = fixture()
    counter = 0

    def current() -> bool:
        nonlocal counter
        counter += 1
        return counter < 5

    result = run_observed_sweep(session(source), source,
                                commands=(CommandName.CLEANUP,), levels=(10, 20, 30),
                                current=current, checked_protected_regions=True)
    assert result.cancelled
    assert result.captured < 3
    assert result.report.status == "incomplete"


@pytest.mark.parametrize("commands,levels", (
    ((CommandName.CLEANUP, CommandName.CLEANUP), (10,)),
    ((CommandName.CLEANUP,), (10, 10)),
    ((CommandName.CLEANUP,), (9,)),
    ((), (10,)),
))
def test_invalid_sweep_boundaries(commands: tuple[CommandName, ...],
                                  levels: tuple[int, ...]) -> None:
    source = fixture()
    with pytest.raises(CommandValidationError):
        run_observed_sweep(session(source), source, commands=commands, levels=levels)


def test_sweep_sanitizes_caught_error_codes() -> None:
    source = fixture()
    engine = session(source)
    engine.close_photo()
    result = run_observed_sweep(engine, source,
                                commands=(CommandName.CLEANUP,), levels=(20,))
    assert result.attempted == 1
    assert result.captured == 0
    assert len(result.problems) == 1
    assert result.problems[0].error_code == "photo_missing"
