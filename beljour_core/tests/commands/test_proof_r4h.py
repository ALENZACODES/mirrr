"""Independent Pro receipt tests on byte-drawn fixtures only. Author: John Khan."""

from __future__ import annotations

from dataclasses import replace

import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame, resize_reference
from plumb_api.commands.guarded import GuardedProExecutor
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.pro_plan import ProStep, parse_pro_commands
from plumb_api.commands.proof import inspect_pro_run
from plumb_api.commands.types import CommandName


def photo() -> ImageFrame:
    pixels = bytearray()
    for y in range(11):
        for x in range(13):
            pixels.extend((40 + x * 3, 50 + y * 2, 40 + x + y))
    return ImageFrame(13, 11, 3, bytes(pixels))


def shift(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
    output = bytearray(frame.pixels)
    for offset in range(0, len(output), frame.channels):
        output[offset] = min(255, output[offset] + step.level.tenths // 10)
    return ImageFrame(frame.width, frame.height, frame.channels, bytes(output))


def scale(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
    return resize_reference(frame, frame.width * step.scale, frame.height * step.scale)


def executor() -> GuardedProExecutor:
    guard = IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True)
    return GuardedProExecutor(
        handlers={
            CommandName.CLEANUP: shift,
            CommandName.STUDIOQUALITY: shift,
            CommandName.POSEONLY: shift,
            CommandName.UPSCALE: scale,
        },
        identity=guard,
    )


def test_all_five_commands_are_receipted_without_release_claim() -> None:
    plan = parse_pro_commands(
        "/cleanup 1.2 /studioquality 2.3 /poseonly 3.4 /upscale 2x /identitylock"
    )
    outcome = executor().run(plan, photo())
    report = inspect_pro_run(plan, outcome)
    assert len(report.steps) == 5
    assert all(step.lock_applied for step in report.steps)
    assert report.status == "synthetic"
    assert "identity_synthetic" in report.reasons
    assert "face_review_pending" in report.reasons
    assert report.public_metadata()["realface_pass"] is False
    assert report.public_metadata()["steps"][0]["command"] == "cleanup"


def test_receipt_does_not_expose_pixels_or_person_metadata() -> None:
    plan = parse_pro_commands("/cleanup /poseonly")
    result = executor().run(plan, photo())
    text = str(inspect_pro_run(plan, result).public_metadata())
    assert "pixels" not in text
    assert "embedding" not in text
    assert "filename" not in text
    assert "weights_sha256" not in text


def test_explicit_identity_optout_needs_review() -> None:
    plan = parse_pro_commands("/cleanup 2.5")
    plan = plan.with_identity(plan.identity.with_user_override(enabled=False))
    runner = GuardedProExecutor(handlers={CommandName.CLEANUP: shift})
    report = inspect_pro_run(plan, runner.run(plan, photo()))
    assert report.status == "blocked"
    assert "identity_user_override" in report.reasons
    assert "identity_missing" in report.reasons


def test_bad_order_makes_receipt_blocked() -> None:
    plan = parse_pro_commands("/cleanup /poseonly")
    result = executor().run(plan, photo())
    swapped = replace(result, steps=(result.steps[1], result.steps[0]))
    audit = inspect_pro_run(plan, swapped)
    assert audit.status == "blocked"
    assert "step_order_mismatch" in audit.reasons


def test_missing_step_makes_receipt_blocked() -> None:
    plan = parse_pro_commands("/cleanup /poseonly")
    result = executor().run(plan, photo())
    incomplete = replace(result, steps=result.steps[:1])
    report = inspect_pro_run(plan, incomplete)
    assert "step_missing" in report.reasons
    assert report.status == "blocked"


def test_altered_plan_fingerprint_is_rejected() -> None:
    plan = parse_pro_commands("/cleanup 2.0")
    result = executor().run(plan, photo())
    other = parse_pro_commands("/cleanup 3.0")
    report = inspect_pro_run(other, result)
    assert report.status == "blocked"
    assert "plan_mismatch" in report.reasons


@pytest.mark.parametrize("name", [
    "/cleanup", "/studioquality", "/poseonly", "/upscale 2x", "/identitylock",
])
def test_every_command_receipt_keeps_release_unproven(name: str) -> None:
    plan = parse_pro_commands(name)
    result = executor().run(plan, photo())
    receipt = inspect_pro_run(plan, result)
    assert receipt.realface_pass is False
    assert receipt.public_metadata()["realface_pass"] is False
    assert len(receipt.steps) == 1


def test_invalid_receipt_inputs_fail_closed() -> None:
    with pytest.raises(CommandValidationError):
        inspect_pro_run("/cleanup", 3)
