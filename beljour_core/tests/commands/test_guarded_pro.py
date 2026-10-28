"""Protected backend regression: every edit/pose, undo and fail-closed behavior.

Uses synthetic byte arrays and a test-only embedder, never an approved model.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import (
    CommandExecutionError,
    CommandUnavailable,
    CommandValidationError,
    IdentityBlocked,
)
from plumb_api.commands.frames import ImageFrame, resize_reference
from plumb_api.commands.guarded import GuardedProExecutor, ProEffect
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.performance import PerformanceBudget, PerformanceRecorder
from plumb_api.commands.pro_plan import IdentityPolicy, ProStep, parse_pro_commands
from plumb_api.commands.pro_undo import ProMemoryUndo
from plumb_api.commands.repair_gate import FaceFixerGate, RegionEvidence
from plumb_api.commands.types import CommandName, LockMode, LockStrength


def drawn_frame(value: int = 40, *, channels: int = 3) -> ImageFrame:
    buffer = bytearray()
    for y in range(8):
        for x in range(8):
            buffer.extend((min(255, value + x * 7), min(255, value + y * 6), value))
            if channels == 4:
                buffer.append(255)
    return ImageFrame(8, 8, 4 if channels == 4 else 3, bytes(buffer))


def shift(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
    output = bytearray(frame.pixels)
    for index in range(0, len(output), frame.channels):
        output[index] = min(255, frame.pixels[index] + max(1, int(step.level.value)))
    return ImageFrame(frame.width, frame.height, frame.channels, bytes(output))


def scale(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
    return resize_reference(frame, frame.width * step.scale, frame.height * step.scale)


def guard() -> IdentityGuard:
    return IdentityGuard(
        DeterministicTestEmbedder(), allow_test_embedder=True,
        coarse_samples=5, refine_iterations=5,
    )


def handlers() -> dict[CommandName, ProEffect]:
    return {
        CommandName.CLEANUP: shift,
        CommandName.STUDIOQUALITY: shift,
        CommandName.POSEONLY: shift,
        CommandName.UPSCALE: scale,
    }


@pytest.mark.parametrize("command", ["cleanup", "upscale", "studioquality", "poseonly", "identitylock"])
def test_default_protection_refuses_missing_embedder_before_any_effect(command: str) -> None:
    called: list[str] = []

    def spy(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
        called.append(step.name.value)
        return frame

    executor = GuardedProExecutor(handlers={CommandName.CLEANUP: spy, **handlers()})
    with pytest.raises(CommandUnavailable) as failure:
        executor.run(parse_pro_commands("/" + command), drawn_frame())
    assert failure.value.code == "identity_model_unavailable"
    assert called == []


def test_every_effect_and_pose_is_guarded_in_chaining_order() -> None:
    result = GuardedProExecutor(handlers=handlers(), identity=guard()).run(
        parse_pro_commands("/cleanup 2.8 /studioquality 3.0 /poseonly 4.1 /upscale 2x"),
        drawn_frame(),
    )
    assert len(result.steps) == 4
    assert all(row.identity is not None for row in result.steps)
    assert all(row.identity is not None and row.identity.synthetic_evidence for row in result.steps)
    assert [row.command for row in result.steps] == [
        CommandName.CLEANUP, CommandName.STUDIOQUALITY, CommandName.POSEONLY, CommandName.UPSCALE,
    ]
    assert result.image.width == 16
    assert result.image.height == 16
    assert "synthetic_evidence" in str(result.public_metadata())


def test_guarded_pose_without_identity_step_still_runs_face_guard() -> None:
    result = GuardedProExecutor(
        handlers={CommandName.POSEONLY: shift}, identity=guard(),
    ).run(parse_pro_commands("/poseonly 5.0"), drawn_frame())
    assert result.steps[0].identity is not None
    assert result.steps[0].command is CommandName.POSEONLY
    assert result.steps[0].identity.synthetic_evidence


def test_guarded_output_keeps_input_bytes_and_undo_atomic() -> None:
    original = drawn_frame()
    unchanged = bytes(original.pixels)
    history = ProMemoryUndo()
    executor = GuardedProExecutor(handlers=handlers(), identity=guard(), undo=history)
    result = executor.run(parse_pro_commands("/cleanup 3.5 /poseonly 2.3"), original)
    assert original.pixels == unchanged
    assert history.undo_count == result.undo_steps
    assert history.undo_count in (0, 1, 2)
    assert all(step.identity is not None for step in result.steps)
    if history.undo_count:
        reverted = history.undo()
        assert reverted is not None
        assert reverted.width == original.width


def test_guarded_engine_exception_fails_closed_and_scrubs_message() -> None:
    history = ProMemoryUndo()

    def failing(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
        raise RuntimeError("sensitive pixel value and user name")

    executor = GuardedProExecutor(
        handlers={CommandName.CLEANUP: shift, CommandName.POSEONLY: failing},
        identity=guard(), undo=history,
    )
    with pytest.raises(CommandExecutionError) as failure:
        executor.run(parse_pro_commands("/cleanup /poseonly"), drawn_frame())
    assert failure.value.code == "command_engine_failed"
    assert "sensitive" not in str(failure.value)
    assert history.undo_count == 0
    assert history.abort_codes == ("command_engine_failed",)


def test_approved_identity_control_cannot_be_overridden_as_engine() -> None:
    with pytest.raises(CommandValidationError) as failure:
        GuardedProExecutor(handlers={CommandName.IDENTITYLOCK: shift}, identity=guard())
    assert failure.value.code == "identity_override"


def test_user_override_can_disable_lock_but_not_by_default() -> None:
    plan = parse_pro_commands("/cleanup 3.6 /poseonly 4.4")
    executor = GuardedProExecutor(handlers=handlers())
    with pytest.raises(CommandUnavailable):
        executor.run(plan, drawn_frame())
    overridden = plan.with_identity(plan.identity.with_user_override(enabled=False))
    report = executor.run(overridden, drawn_frame())
    assert all(item.identity is None for item in report.steps)
    assert report.image.pixels != drawn_frame().pixels
    assert overridden.fingerprint() != plan.fingerprint()


def test_user_warn_override_still_performs_identity_comparison() -> None:
    plan = parse_pro_commands("/poseonly 4.5")
    overridden = plan.with_identity(plan.identity.with_user_override(mode=LockMode.WARN))
    result = GuardedProExecutor(
        handlers={CommandName.POSEONLY: shift}, identity=guard(),
    ).run(overridden, drawn_frame())
    assert result.steps[0].identity is not None
    assert overridden.identity.explicit_user_override


@pytest.mark.parametrize("mode", [LockMode.BLOCK, LockMode.SOFTEN])
@pytest.mark.parametrize("strength", [LockStrength.NORMAL, LockStrength.STRICT])
def test_guard_all_blocking_modes_and_levels(mode: LockMode, strength: LockStrength) -> None:
    def invert(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
        inverted = bytes(255 - item for item in frame.pixels)
        return ImageFrame(frame.width, frame.height, frame.channels, inverted)

    plan = parse_pro_commands("/poseonly 5.0")
    policy = IdentityPolicy(mode=mode, strength=strength)
    protected = plan.with_identity(policy)
    runner = GuardedProExecutor(handlers={CommandName.POSEONLY: invert}, identity=guard())
    if mode is LockMode.BLOCK:
        with pytest.raises(IdentityBlocked):
            runner.run(protected, drawn_frame())
    else:
        result = runner.run(protected, drawn_frame())
        assert result.steps[0].identity is not None
        assert result.steps[0].identity.final_cosine >= result.steps[0].identity.threshold


def test_guarded_repair_path_calls_observer_without_editing_repair_source() -> None:
    region = RegionEvidence(8, 8, skin=bytes([255]) * 64, protected=bytes(64))
    fixer = FaceFixerGate(region)
    result = GuardedProExecutor(
        handlers={CommandName.CLEANUP: shift}, identity=guard(), face_fixer=fixer,
    ).run(parse_pro_commands("/cleanup 2.0"), drawn_frame())
    assert len(fixer.reports) == 1
    assert fixer.reports[0].status in ("unproven", "fail")
    assert not fixer.reports[0].realface_qualified
    assert result.image.width == 8


def test_rgba_alpha_mutation_rejected_by_identity_guard() -> None:
    def break_alpha(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
        content = bytearray(frame.pixels)
        content[3] = 0
        return ImageFrame(frame.width, frame.height, frame.channels, bytes(content))

    with pytest.raises(CommandValidationError) as failure:
        GuardedProExecutor(
            handlers={CommandName.POSEONLY: break_alpha}, identity=guard(),
        ).run(parse_pro_commands("/poseonly"), drawn_frame(channels=4))
    assert failure.value.code == "alpha_changed"


def test_wrong_upscale_dimensions_fails_before_guard_and_history_commit() -> None:
    history = ProMemoryUndo()
    with pytest.raises(CommandExecutionError) as failure:
        GuardedProExecutor(
            handlers={CommandName.UPSCALE: shift}, identity=guard(), undo=history,
        ).run(parse_pro_commands("/upscale 4x"), drawn_frame())
    assert failure.value.code == "invalid_scale_output"
    assert history.undo_count == 0


def test_missing_effect_engine_fails_even_with_good_identity_model() -> None:
    with pytest.raises(CommandUnavailable) as failure:
        GuardedProExecutor(identity=guard()).run(parse_pro_commands("/cleanup"), drawn_frame())
    assert failure.value.code == "command_engine_unavailable"


def test_stale_revision_aborts_before_undo_commit() -> None:
    history = ProMemoryUndo()
    counts = [0]

    def is_current() -> bool:
        counts[0] += 1
        return counts[0] < 3

    runner = GuardedProExecutor(handlers=handlers(), identity=guard(), undo=history)
    with pytest.raises(CommandUnavailable) as failure:
        runner.run(parse_pro_commands("/cleanup /poseonly"), drawn_frame(), is_current=is_current)
    assert failure.value.code == "stale_preview"
    assert history.undo_count == 0
    assert history.abort_codes == ("stale_preview",)


def test_successful_preview_reports_real_time_not_a_fake_claim() -> None:
    time_values = iter((10.0, 10.034))
    performance = PerformanceRecorder(clock=lambda: next(time_values))
    budget = PerformanceBudget(preview_ms=100.0, export_ms=2000.0)
    runner = GuardedProExecutor(
        handlers=handlers(), identity=guard(), recorder=performance, budget=budget,
    )
    result = runner.run(parse_pro_commands("/cleanup 2.0"), drawn_frame(), quality="preview")
    assert result.timing.quality == "preview"
    assert result.timing.elapsed_ms == pytest.approx(34.0)
    assert result.timing.within_target
    assert performance.summary("preview")["count"] == 1


def test_engine_result_cannot_change_size_for_pose_only() -> None:
    def grow(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
        return resize_reference(frame, 16, 16)

    with pytest.raises(CommandExecutionError) as failure:
        GuardedProExecutor(handlers={CommandName.POSEONLY: grow}, identity=guard()).run(
            parse_pro_commands("/poseonly"), drawn_frame(),
        )
    assert failure.value.code == "unexpected_resize"


def test_coarse_strength_is_per_step_not_shared_state() -> None:
    levels: list[float] = []

    def capture(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
        levels.append(step.level.value)
        return frame

    plan = parse_pro_commands("/cleanup 1.1 /studioquality 2.4 /poseonly 5.0")
    executor = GuardedProExecutor(
        handlers={
            CommandName.CLEANUP: capture,
            CommandName.STUDIOQUALITY: capture,
            CommandName.POSEONLY: capture,
        },
        identity=guard(),
    )
    executor.run(plan, drawn_frame())
    assert levels == [1.1, 2.4, 5.0]
