"""Pro preflight compatibility and safety tests on synthetic frames only.

Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace
from typing import cast

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.performance import RenderQuality
from plumb_api.commands.preflight import (
    PreflightCapabilities,
    PreflightCapacity,
    preflight_plan,
)
from plumb_api.commands.pro_plan import IdentityPolicy, parse_pro_commands
from plumb_api.commands.types import CommandName


@pytest.fixture
def frame() -> ImageFrame:
    return ImageFrame(64, 48, 4, bytes((8, 17, 23, 255)) * (64 * 48))


@pytest.fixture
def capabilities() -> PreflightCapabilities:
    return PreflightCapabilities(
        identity_guard_available=True,
        enabled_effects=frozenset({
            CommandName.CLEANUP, CommandName.UPSCALE,
            CommandName.STUDIOQUALITY, CommandName.POSEONLY,
        }),
        checked_pose_available=True,
        checked_masks_available=True,
    )


def test_preflight_all_five_commands(frame: ImageFrame, capabilities: PreflightCapabilities) -> None:
    plan = parse_pro_commands(
        "/cleanup 2.4 /upscale 2x /studioquality 3.1 /poseonly 1.8 /identitylock",
    )
    before = frame.pixels
    found = preflight_plan(plan, frame, capabilities)
    assert found.status == "ready"
    assert found.identity_on is True
    assert len(found.steps) == 5
    assert found.steps[0].width == 64
    assert found.steps[1].width == 128
    assert found.steps[2].width == 128
    assert found.steps[3].height == 96
    assert found.steps[4].width == 128
    assert found.result_pixels == 128 * 96
    assert found.issues == ()
    assert found.warnings == ()
    assert before == frame.pixels
    assert "pixels" not in found.public_metadata()
    assert "release_qualified" in found.public_metadata()
    assert found.public_metadata()["release_qualified"] is False


def test_default_lock_needs_model(frame: ImageFrame, capabilities: PreflightCapabilities) -> None:
    plan = parse_pro_commands("/cleanup 3.0 /poseonly 2.0")
    got = preflight_plan(plan, frame, replace(capabilities, identity_guard_available=False))
    assert got.status == "blocked"
    assert got.issues == ("identity_model_unavailable",)
    assert all("identity_model_unavailable" in step.errors for step in got.steps)


def test_pose_needs_checked_geometry(frame: ImageFrame, capabilities: PreflightCapabilities) -> None:
    plan = parse_pro_commands("/poseonly 2.3")
    result = preflight_plan(plan, frame, replace(capabilities, checked_pose_available=False))
    assert result.issues == ("pose_evidence_missing",)
    assert result.status == "blocked"


def test_neutral_pose_does_not_need_geometry(frame: ImageFrame, capabilities: PreflightCapabilities) -> None:
    plan = parse_pro_commands("/poseonly 1.0")
    result = preflight_plan(plan, frame, replace(capabilities, checked_pose_available=False))
    assert result.status == "ready"


def test_missing_masks_is_warning(frame: ImageFrame, capabilities: PreflightCapabilities) -> None:
    plan = parse_pro_commands("/cleanup /upscale 2x /studioquality /identitylock")
    result = preflight_plan(plan, frame, replace(capabilities, checked_masks_available=False))
    assert result.status == "ready"
    assert result.warnings == ("face_masks_unavailable",)
    assert result.steps[-1].warnings == ()


def test_missing_effect_is_blocked(frame: ImageFrame, capabilities: PreflightCapabilities) -> None:
    plan = parse_pro_commands("/cleanup 2.1 /studioquality 4.0")
    result = preflight_plan(
        plan, frame,
        replace(capabilities, enabled_effects=frozenset({CommandName.CLEANUP})),
    )
    assert result.steps[0].ready
    assert not result.steps[1].ready
    assert result.issues == ("engine_unavailable",)


def test_explicit_user_optout(frame: ImageFrame, capabilities: PreflightCapabilities) -> None:
    policy = IdentityPolicy().with_user_override(enabled=False)
    plan = parse_pro_commands("/cleanup /identitylock", policy=policy)
    result = preflight_plan(plan, frame, replace(capabilities, identity_guard_available=False))
    assert result.status == "ready"
    assert result.warnings == ("identity_explicitly_disabled",)
    assert not result.identity_on


def test_multiple_upscales_still_checked(frame: ImageFrame, capabilities: PreflightCapabilities) -> None:
    plan = parse_pro_commands("/upscale 4x /upscale 4x")
    result = preflight_plan(plan, frame, capabilities)
    assert result.status == "ready"
    assert result.result_pixels == 64 * 48 * 256
    assert result.steps[1].width == 1024
    assert result.steps[1].height == 768


def test_pixel_budget_without_allocation(capabilities: PreflightCapabilities) -> None:
    frame = ImageFrame(2048, 1024, 3, bytes(2048 * 1024 * 3))
    plan = parse_pro_commands("/upscale 4x")
    result = preflight_plan(plan, frame, capabilities)
    assert "pixel_budget_exceeded" in result.issues
    assert result.status == "blocked"


def test_memory_budget(frame: ImageFrame, capabilities: PreflightCapabilities) -> None:
    plan = parse_pro_commands("/cleanup 2.3 /upscale 2x")
    limit = PreflightCapacity(max_working_bytes=100_000)
    result = preflight_plan(plan, frame, capabilities, capacity=limit)
    assert "working_memory_exceeded" in result.issues
    assert result.estimated_peak_bytes > 100_000


@pytest.mark.parametrize("value", [0, -1, 3.1, True, "100", None])
def test_bad_memory_limit(value: object) -> None:
    with pytest.raises(CommandValidationError):
        PreflightCapacity(max_working_bytes=cast(int, value))


@pytest.mark.parametrize("value", [0, 24_000_001, -1, False, 4.1])
def test_bad_pixel_limit(value: object) -> None:
    with pytest.raises(CommandValidationError):
        PreflightCapacity(max_output_pixels=cast(int, value))


def test_effect_cannot_replace_identity() -> None:
    with pytest.raises(CommandValidationError):
        PreflightCapabilities(enabled_effects=frozenset({CommandName.IDENTITYLOCK}))


def test_repeated_report_is_deterministic(frame: ImageFrame, capabilities: PreflightCapabilities) -> None:
    plan = parse_pro_commands("/cleanup 3.4 /upscale 2x /studioquality 4.3")
    first = preflight_plan(plan, frame, capabilities)
    second = preflight_plan(plan, frame, capabilities)
    assert first.public_metadata() == second.public_metadata()
    assert first.plan_fingerprint == plan.fingerprint()


def test_quality_validation(frame: ImageFrame, capabilities: PreflightCapabilities) -> None:
    plan = parse_pro_commands("/cleanup 3.4")
    with pytest.raises(CommandValidationError):
        preflight_plan(plan, frame, capabilities, quality=cast(RenderQuality, "high"))
