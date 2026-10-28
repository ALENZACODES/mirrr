"""Chain order, undo transactions, resize boundaries and failure safety.

Synthetic RGB only; no provider calls or real identity model. Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable

import pytest

from plumb_api.commands import CommandExecutionError
from plumb_api.commands import CommandExecutor
from plumb_api.commands import CommandName
from plumb_api.commands import CommandPlan
from plumb_api.commands import CommandUnavailable
from plumb_api.commands import CommandValidationError
from plumb_api.commands import DeterministicTestEmbedder
from plumb_api.commands import IdentityBlocked
from plumb_api.commands import IdentityGuard
from plumb_api.commands import ImageFrame
from plumb_api.commands import MemoryUndoStack
from plumb_api.commands import NullUndoHook
from plumb_api.commands import parse_commands
from plumb_api.commands import UpscaleArgs
from plumb_api.commands.frames import resize_reference
from plumb_api.commands.types import CommandArgs
from plumb_api.commands.undo import UndoCheckpoint


def photo(value: int = 20, width: int = 4, height: int = 4) -> ImageFrame:
    return ImageFrame(width, height, 3, bytes([value]) * (width * height * 3))


def brighten(frame: ImageFrame, args: CommandArgs) -> ImageFrame:
    pixels = bytes(min(255, byte + 10) for byte in frame.pixels)
    return ImageFrame(frame.width, frame.height, frame.channels, pixels)


def darken(frame: ImageFrame, args: CommandArgs) -> ImageFrame:
    pixels = bytes(max(0, byte - 7) for byte in frame.pixels)
    return ImageFrame(frame.width, frame.height, frame.channels, pixels)


def two_or_four_times(frame: ImageFrame, args: CommandArgs) -> ImageFrame:
    if not isinstance(args, UpscaleArgs):
        raise ValueError("Wrong args")
    return resize_reference(frame, frame.width * args.scale, frame.height * args.scale)


def test_missing_engines_refuse_honestly() -> None:
    original = photo()
    undo = MemoryUndoStack()
    runner = CommandExecutor(undo=undo)
    for name in ("cleanup", "upscale", "studioquality", "poseonly"):
        with pytest.raises(CommandUnavailable) as failure:
            runner.run(parse_commands("/" + name), original)
        assert failure.value.code == "command_engine_unavailable"
    assert undo.undo_count == 0
    assert undo.abort_codes == ("command_engine_unavailable",) * 4
    assert original.pixels == bytes([20]) * 48


def test_missing_identity_model_cannot_be_silent_noop() -> None:
    with pytest.raises(CommandUnavailable) as failure:
        CommandExecutor().run(parse_commands("/identitylock"), photo())
    assert failure.value.code == "identity_model_unavailable"


def test_injected_engines_run_in_declared_order() -> None:
    calls: list[str] = []

    def step(tag: str, function: Callable[[ImageFrame, CommandArgs], ImageFrame]) -> Callable[
        [ImageFrame, CommandArgs], ImageFrame,
    ]:
        def handle(frame: ImageFrame, args: CommandArgs) -> ImageFrame:
            calls.append(tag)
            return function(frame, args)
        return handle

    runner = CommandExecutor(handlers={
        CommandName.CLEANUP: step("cleanup", brighten),
        CommandName.UPSCALE: step("upscale", two_or_four_times),
        CommandName.STUDIOQUALITY: step("studio", darken),
        CommandName.POSEONLY: step("pose", brighten),
    })
    plan = parse_commands("/cleanup /upscale 2x /studioquality /poseonly")
    result = runner.run(plan, photo())
    assert calls == ["cleanup", "upscale", "studio", "pose"]
    assert result.image.width == 8
    assert result.image.height == 8
    assert set(result.image.pixels) == {33}
    assert result.undo_steps == 4
    assert all(report.modified for report in result.steps)
    assert result.public_metadata()["plan_fingerprint"] == plan.fingerprint()


def test_example_chain_with_guard_enforces_at_original_resolution() -> None:
    original = photo(0, width=2, height=2)
    plan = parse_commands("/cleanup /upscale 2x /identitylock strict")
    undo = MemoryUndoStack()
    runner = CommandExecutor(
        handlers={CommandName.CLEANUP: brighten, CommandName.UPSCALE: two_or_four_times},
        identity=IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True),
        undo=undo,
    )
    result = runner.run(plan, original)
    assert result.image.width == 4
    assert result.image.height == 4
    assert result.steps[-1].identity is not None
    assert result.steps[-1].identity.identity_match >= 0
    assert undo.undo_count == 2
    assert result.image.pixels != b""
    assert original.width == 2
    assert original.pixels == bytes(12)


def test_abort_discards_all_steps_after_late_engine_failure() -> None:
    def explode(frame: ImageFrame, args: CommandArgs) -> ImageFrame:
        raise RuntimeError("secret input frame leaked here if surfaced")

    plan = parse_commands("/cleanup /poseonly")
    undo = MemoryUndoStack()
    runner = CommandExecutor(
        handlers={CommandName.CLEANUP: brighten, CommandName.POSEONLY: explode},
        undo=undo,
    )
    original = photo()
    with pytest.raises(CommandExecutionError) as failure:
        runner.run(plan, original)
    assert failure.value.code == "command_engine_failed"
    assert "secret" not in str(failure.value)
    assert undo.undo_count == 0
    assert undo.redo_count == 0
    assert undo.abort_codes == ("command_engine_failed",)
    assert original.pixels == bytes([20]) * 48


def test_identity_block_does_not_commit_upstream_mutations() -> None:
    def change(frame: ImageFrame, args: CommandArgs) -> ImageFrame:
        return photo(250)

    plan = parse_commands("/cleanup /identitylock block strict")
    undo = MemoryUndoStack()
    runner = CommandExecutor(
        handlers={CommandName.CLEANUP: change},
        identity=IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True),
        undo=undo,
    )
    original = photo(0)
    with pytest.raises(IdentityBlocked):
        runner.run(plan, original)
    assert undo.undo_count == 0
    assert undo.abort_codes == ("identity_below_threshold",)
    assert original.pixels == bytes(48)


def test_undo_and_redo_follow_each_real_pixel_edit() -> None:
    history = MemoryUndoStack()
    runner = CommandExecutor(
        handlers={CommandName.CLEANUP: brighten, CommandName.POSEONLY: darken},
        undo=history,
    )
    plan = parse_commands("/cleanup /poseonly")
    result = runner.run(plan, photo(20))
    assert result.image.pixels == bytes([23]) * 48
    assert history.undo_count == 2
    first_undo = history.undo()
    assert first_undo is not None and first_undo.pixels == bytes([30]) * 48
    second_undo = history.undo()
    assert second_undo is not None and second_undo.pixels == bytes([20]) * 48
    assert history.undo() is None
    assert history.redo_count == 2
    redo_one = history.redo()
    assert redo_one is not None and redo_one.pixels == bytes([30]) * 48
    redo_two = history.redo()
    assert redo_two is not None and redo_two.pixels == bytes([23]) * 48
    assert history.redo() is None
    assert history.redo_count == 0
    history.clear()
    assert history.undo_count == 0
    assert history.retained_bytes == 0


def test_undo_redo_discarded_only_after_new_committed_edit() -> None:
    history = MemoryUndoStack()
    runner = CommandExecutor(handlers={CommandName.CLEANUP: brighten}, undo=history)
    runner.run(parse_commands("/cleanup"), photo())
    history.undo()
    assert history.redo_count == 1
    with pytest.raises(CommandUnavailable):
        runner.run(parse_commands("/studioquality"), photo())
    assert history.redo_count == 1
    runner.run(parse_commands("/cleanup"), photo())
    assert history.redo_count == 0


def test_undo_budget_and_capacity_never_partial_commit() -> None:
    plan = parse_commands("/cleanup /poseonly")
    history = MemoryUndoStack(max_bytes=100, max_steps=1)
    runner = CommandExecutor(
        handlers={CommandName.CLEANUP: brighten, CommandName.POSEONLY: darken},
        undo=history,
    )
    runner.run(plan, photo())
    assert history.undo_count == 1
    assert history.retained_bytes <= 100
    tiny = MemoryUndoStack(max_bytes=20)
    with pytest.raises(CommandValidationError) as failure:
        CommandExecutor(handlers={CommandName.CLEANUP: brighten}, undo=tiny).run(
            parse_commands("/cleanup"), photo(),
        )
    assert failure.value.code == "history_capacity_exceeded"
    assert tiny.undo_count == 0
    assert tiny.abort_codes == ("history_capacity_exceeded",)


def test_undo_record_must_match_plan_and_order() -> None:
    plan = parse_commands("/cleanup")
    original = photo()
    changed = brighten(original, plan.steps[0].args)
    wrong = UndoCheckpoint("0" * 64, 0, CommandName.CLEANUP, original, changed)
    history = MemoryUndoStack()
    with pytest.raises(CommandValidationError):
        history.commit(plan, (wrong,))
    assert history.undo_count == 0
    correct = UndoCheckpoint(plan.fingerprint(), 0, CommandName.CLEANUP, original, changed)
    history.commit(plan, (correct,))
    assert history.undo_count == 1
    assert "pixels" not in repr(correct)


def test_no_op_does_not_add_phantom_undo_entry() -> None:
    def no_change(frame: ImageFrame, args: CommandArgs) -> ImageFrame:
        return frame

    undo = MemoryUndoStack()
    result = CommandExecutor(
        handlers={CommandName.CLEANUP: no_change}, undo=undo,
    ).run(parse_commands("/cleanup"), photo())
    assert result.undo_steps == 0
    assert not result.steps[0].modified
    assert undo.undo_count == 0


@pytest.mark.parametrize("invalid", ["wrong_size", "wrong_channels", "wrong_type"])
def test_engine_return_boundaries(invalid: str) -> None:
    def broken(frame: ImageFrame, args: CommandArgs) -> ImageFrame:
        if invalid == "wrong_size":
            return photo(10, width=8, height=4)
        if invalid == "wrong_channels":
            return ImageFrame(4, 4, 4, bytes([10]) * 64)
        return b"not a frame"

    with pytest.raises(CommandExecutionError) as failure:
        CommandExecutor(handlers={CommandName.CLEANUP: broken}).run(parse_commands("/cleanup"), photo())
    assert failure.value.code in {"unexpected_resize", "channels_changed", "invalid_engine_output"}


def test_upscale_handler_must_return_exact_dimensions() -> None:
    with pytest.raises(CommandExecutionError) as failure:
        CommandExecutor(handlers={CommandName.UPSCALE: brighten}).run(
            parse_commands("/upscale 4x"), photo(),
        )
    assert failure.value.code == "invalid_scale_output"


def test_handler_cannot_override_identity_guard() -> None:
    with pytest.raises(CommandValidationError) as failure:
        CommandExecutor(handlers={CommandName.IDENTITYLOCK: brighten})
    assert failure.value.code == "identity_override"


def test_effect_after_identity_is_not_falsely_guarded() -> None:
    undo = MemoryUndoStack()
    runner = CommandExecutor(
        handlers={CommandName.CLEANUP: brighten},
        identity=IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True),
        undo=undo,
    )
    plan = parse_commands("/identitylock block /cleanup")
    result = runner.run(plan, photo(20))
    assert result.steps[0].identity is not None
    assert result.steps[0].identity.status == "kept"
    assert result.steps[1].modified
    assert undo.undo_count == 1


def test_plan_snapshot_and_result_repr_never_show_photo_bytes() -> None:
    original = photo(101)
    result = CommandExecutor(handlers={CommandName.CLEANUP: brighten}).run(
        parse_commands("/cleanup"), original,
    )
    assert "101" not in repr(result)
    assert "pixels" not in repr(result)
    assert "pixels" not in str(result.public_metadata())


def test_noop_undo_hook_has_no_storage() -> None:
    hook = NullUndoHook()
    plan: CommandPlan = parse_commands("/cleanup")
    hook.commit(plan, ())
    hook.abort(plan, 0, "test")


def test_unknown_operation_can_never_be_a_paid_or_network_fallback() -> None:
    handlers = {CommandName.CLEANUP: brighten}
    original = photo()
    runner = CommandExecutor(handlers=handlers)
    with pytest.raises(CommandUnavailable):
        runner.run(parse_commands("/cleanup /studioquality"), original)
    assert original.pixels == bytes([20]) * 48


def test_reordered_or_disconnected_history_checkpoints_are_rejected() -> None:
    plan = parse_commands("/cleanup /poseonly")
    original = photo()
    edited = brighten(original, plan.steps[0].args)
    first = UndoCheckpoint(plan.fingerprint(), 0, CommandName.CLEANUP, original, edited)
    unordered = UndoCheckpoint(plan.fingerprint(), 0, CommandName.CLEANUP, edited, original)
    disconnected = UndoCheckpoint(plan.fingerprint(), 1, CommandName.POSEONLY, original, edited)
    history = MemoryUndoStack()
    for records in ((first, unordered), (first, disconnected)):
        with pytest.raises(CommandValidationError):
            history.commit(plan, records)
    assert history.undo_count == 0
