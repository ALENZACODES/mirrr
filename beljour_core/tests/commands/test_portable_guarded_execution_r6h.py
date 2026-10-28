"""Portable recipes executed through the real guarded command contract.

All frames and identity vectors are synthetic and have no release meaning.
Author: John Khan.
"""

from __future__ import annotations

import json

import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandUnavailable, CommandValidationError
from plumb_api.commands.frames import ImageFrame, resize_reference
from plumb_api.commands.guarded import GuardedProExecutor, ProEffect
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.portable_recipe import export_portable_recipe, import_portable_recipe
from plumb_api.commands.pro_plan import ProPlan, ProStep
from plumb_api.commands.pro_undo import ProMemoryUndo
from plumb_api.commands.share_fragment import export_recipe_fragment, import_recipe_fragment
from plumb_api.commands.types import CommandName


def source_frame() -> ImageFrame:
    return ImageFrame(8, 8, 4, bytes(
        value for row in range(8) for column in range(8)
        for value in (50 + row, 70 + column, 110, 255)
    ))


def plan() -> ProPlan:
    return ProPlan((
        ProStep(CommandName.CLEANUP, DecimalLevel(25), 2, 0),
        ProStep(CommandName.STUDIOQUALITY, DecimalLevel(32), 2, 1),
        ProStep(CommandName.POSEONLY, DecimalLevel(10), 2, 2),
        ProStep(CommandName.UPSCALE, DecimalLevel(10), 2, 3),
        ProStep(CommandName.IDENTITYLOCK, DecimalLevel(10), 2, 4),
    ))


def handler(image: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
    if step.name is CommandName.UPSCALE:
        return resize_reference(image, image.width * step.scale, image.height * step.scale)
    if step.name is CommandName.POSEONLY or step.level.tenths == 10:
        return image
    pixels = bytearray(image.pixels)
    for index in range(0, len(pixels), image.channels):
        pixels[index] = min(255, pixels[index] + 1)
    return ImageFrame(image.width, image.height, image.channels, bytes(pixels))


def port_map() -> dict[CommandName, ProEffect]:
    return {name: handler for name in (
        CommandName.CLEANUP, CommandName.STUDIOQUALITY,
        CommandName.POSEONLY, CommandName.UPSCALE,
    )}


def mock_guard() -> IdentityGuard:
    return IdentityGuard(
        DeterministicTestEmbedder(), allow_test_embedder=True,
        coarse_samples=5, refine_iterations=5,
    )


def test_imported_recipe_refuses_missing_identity_before_any_edit() -> None:
    called: list[str] = []

    def spy(image: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
        called.append(step.name.value)
        return handler(image, step, quality)

    parsed = import_portable_recipe(export_portable_recipe(plan())).plan
    engine = GuardedProExecutor(handlers={CommandName.CLEANUP: spy, **port_map()})
    with pytest.raises(CommandUnavailable) as raised:
        engine.run(parsed, source_frame())
    assert raised.value.code == "identity_model_unavailable"
    assert not called


def test_roundtrip_executes_every_step_with_guard_receipts() -> None:
    original = source_frame()
    before = original.pixels
    restored = import_portable_recipe(export_portable_recipe(plan())).plan
    history = ProMemoryUndo()
    output = GuardedProExecutor(
        handlers=port_map(), identity=mock_guard(), undo=history,
    ).run(restored, original)
    assert len(output.steps) == 5
    assert all(item.identity is not None for item in output.steps)
    assert all(item.identity is not None and item.identity.synthetic_evidence
               for item in output.steps)
    assert output.image.width == original.width * 2
    assert output.image.height == original.height * 2
    assert original.pixels == before
    assert history.undo_count == output.undo_steps
    assert output.plan.fingerprint() == plan().fingerprint()


def test_share_fragment_same_plan_has_identical_guarded_result() -> None:
    original = source_frame()
    file_plan = import_portable_recipe(export_portable_recipe(plan())).plan
    shared_plan = import_recipe_fragment(export_recipe_fragment(plan())).plan
    first = GuardedProExecutor(handlers=port_map(), identity=mock_guard()).run(file_plan, original)
    second = GuardedProExecutor(handlers=port_map(), identity=mock_guard()).run(shared_plan, original)
    assert first.image.pixels == second.image.pixels
    assert first.image.width == second.image.width
    assert first.plan.fingerprint() == second.plan.fingerprint()


def test_changing_upscale_settings_without_updating_digest_fails() -> None:
    original = json.loads(export_portable_recipe(plan()))
    original["plan"]["steps"][3]["scale"] = 4
    with pytest.raises(CommandValidationError) as caught:
        import_portable_recipe(json.dumps(original))
    assert caught.value.code == "recipe_integrity_failed"


def test_noop_identity_step_never_silently_waives_guard() -> None:
    only_identity = ProPlan((ProStep(CommandName.IDENTITYLOCK, DecimalLevel(10), 2, 0),))
    imported = import_portable_recipe(export_portable_recipe(only_identity)).plan
    with pytest.raises(CommandUnavailable):
        GuardedProExecutor(handlers=port_map()).run(imported, source_frame())
    accepted = GuardedProExecutor(handlers=port_map(), identity=mock_guard()).run(
        imported, source_frame(),
    )
    assert accepted.steps[0].identity is not None
    assert accepted.image.identical(source_frame())


def test_no_private_photo_embedded_in_public_metadata() -> None:
    plan_record = import_portable_recipe(export_portable_recipe(plan()))
    data = json.dumps(plan_record.public_metadata())
    assert plan_record.public_metadata()["synthetic_or_realface_qualified"] is False
    for sensitive in ("pixels", "face_id", "subject", "image", "filename", "embedding"):
        assert sensitive not in data
