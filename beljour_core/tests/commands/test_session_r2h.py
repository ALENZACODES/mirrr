"""Default identity path, photo-bound masks, chaining and undo recovery.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandUnavailable, CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.pro_plan import parse_pro_commands
from plumb_api.commands.pro_undo import ProMemoryUndo
from plumb_api.commands.r2h_session import R2HSession
from plumb_api.commands.regions import FaceRegions, PhotoRegionCache
from plumb_api.commands.types import CommandName


def example(value: int = 70, channels: int = 3) -> ImageFrame:
    picture = np.full((18, 21, channels), value, dtype=np.uint8)
    yy, xx = np.indices((18, 21))
    picture[:, :, 0] = np.asarray(value + xx * 2, dtype=np.uint8)
    picture[:, :, 1] = np.asarray(value + yy * 2, dtype=np.uint8)
    picture[:, :, 2] = np.asarray(value + (xx + yy) % 9, dtype=np.uint8)
    if channels == 4:
        picture[:, :, 3] = 255
    return ImageFrame(21, 18, channels, picture.tobytes())


def guard() -> IdentityGuard:
    return IdentityGuard(
        DeterministicTestEmbedder(), allow_test_embedder=True,
        coarse_samples=5, refine_iterations=5,
    )


def supplied(frame: ImageFrame) -> FaceRegions:
    mask = np.zeros((frame.height, frame.width), dtype=np.uint8)
    mask[2:7, 4:11] = 255
    return FaceRegions(frame.width, frame.height, skin=mask.tobytes(), eyes=mask.tobytes())


def test_missing_identity_blocks_every_default_edit() -> None:
    session = R2HSession(identity=None)
    session.open_photo(example())
    with pytest.raises(CommandUnavailable) as failure:
        session.run(parse_pro_commands("/cleanup 2.4 /upscale 2x"))
    assert failure.value.code == "identity_model_unavailable"
    assert session.summary.photo_open
    assert session.summary.render_cache_bytes == 0


def test_checked_chain_has_one_identity_decision_per_edit() -> None:
    session = R2HSession(identity=guard())
    frame = example()
    session.open_photo(frame, regions=supplied(frame))
    plan = parse_pro_commands("/cleanup 2.4 /upscale 2x /identitylock")
    result = session.run(plan)
    assert result.image.width == 42
    assert result.image.height == 36
    assert [step.command for step in result.steps] == [
        CommandName.CLEANUP, CommandName.UPSCALE, CommandName.IDENTITYLOCK,
    ]
    assert all(step.identity is not None for step in result.steps)
    assert session.summary.last_plan == plan.fingerprint()
    assert frame.width == 21 and frame.height == 18


def test_level_change_only_reuses_measured_regions() -> None:
    source = example()
    readings: list[int] = []

    def supplier(frame: ImageFrame) -> FaceRegions:
        readings.append(frame.width)
        return supplied(frame)

    session = R2HSession(identity=guard())
    session.open_photo(source, supplier=supplier)
    original = parse_pro_commands("/cleanup 2.1 /upscale 2x")
    for number in (21, 25, 30, 40):
        varied = original.edit_level(0, original.steps[0].level.__class__(number))
        result = session.run(varied, quality="preview")
        assert result.image.width == 42
    assert readings == [21]
    assert session.summary.region_reads == 1
    assert session.summary.region_hits > 1


def test_new_photo_invalidates_region_reading_and_render_cache() -> None:
    reads = 0

    def supplier(frame: ImageFrame) -> FaceRegions:
        nonlocal reads
        reads += 1
        return supplied(frame)

    session = R2HSession(identity=guard())
    session.open_photo(example(70), supplier=supplier)
    plan = parse_pro_commands("/cleanup 4.0")
    session.run(plan)
    session.run(plan)
    assert session.summary.render_cache_bytes >= 0
    session.open_photo(example(90), supplier=supplier)
    assert reads == 2
    assert session.summary.render_cache_bytes == 0
    assert session.summary.last_plan is None
    session.close_photo()
    assert not session.summary.photo_open
    with pytest.raises(CommandUnavailable):
        session.run(plan)


def test_mismatched_mask_rejected_before_processing() -> None:
    session = R2HSession(identity=guard())
    with pytest.raises(CommandValidationError) as failure:
        session.open_photo(example(), regions=FaceRegions(8, 8, skin=bytes(64)))
    assert failure.value.code == "invalid_regions"
    assert not session.summary.photo_open


def test_two_region_suppliers_cannot_be_used_simultaneously() -> None:
    frame = example()
    session = R2HSession(identity=guard())
    with pytest.raises(CommandValidationError):
        session.open_photo(frame, regions=supplied(frame), supplier=supplied)


def test_failed_step_does_not_commit_undo() -> None:
    undo = ProMemoryUndo()
    session = R2HSession(identity=guard(), undo=undo)
    session.open_photo(example())
    plan = parse_pro_commands("/cleanup 1.0 /upscale 4x /upscale 4x /upscale 4x /upscale 4x")
    with pytest.raises(CommandValidationError):
        session.run(plan)
    assert undo.undo_count == 0
    assert session.summary.last_plan is None


def test_undo_has_guarded_checkpoints_on_real_edits() -> None:
    undo = ProMemoryUndo()
    frame = example()
    session = R2HSession(identity=guard(), undo=undo)
    session.open_photo(frame)
    plan = parse_pro_commands("/cleanup 5.0 /upscale 2x")
    report = session.run(plan)
    assert report.image.width == 42
    assert undo.undo_count == report.undo_steps
    if undo.undo_count:
        assert undo.undo() is not None


def test_cache_is_scoped_to_the_exact_frame_and_photo_lifecycle() -> None:
    frame = example()
    lookup: PhotoRegionCache = PhotoRegionCache()
    loaded: list[str] = []

    def supplier(source: ImageFrame) -> FaceRegions:
        loaded.append("observed")
        return supplied(source)

    lookup.open(frame, supplier)
    lookup.open(frame, supplier)
    assert loaded == ["observed"]
    assert lookup.stats.hits == 1
    assert lookup.mask("skin", 42, 36) is not None
    assert lookup.mask("skin", 42, 36) is not None
    assert lookup.stats.hits == 2
    lookup.close()
    assert lookup.stats.retained_bytes == 0
    assert not lookup.stats.has_photo


def test_region_mask_is_resampled_for_preview_without_rereading_photo() -> None:
    frame = example()
    cache = PhotoRegionCache()
    cache.open(frame, lambda source: supplied(source))
    original = cache.mask("eyes", frame.width, frame.height)
    preview = cache.mask("eyes", frame.width * 2, frame.height * 2)
    assert original is not None and preview is not None
    assert original.shape == (18, 21)
    assert preview.shape == (36, 42)
    assert float(np.max(preview)) <= 1.0
    assert not preview.flags.writeable
    assert cache.stats.reads == 1


def test_regions_are_optional_not_fabricated_from_skin_colour() -> None:
    frame = example()
    cache = PhotoRegionCache()
    cache.open(frame, None)
    assert cache.regions is None
    assert cache.available() == ()
    assert cache.mask("skin", frame.width, frame.height) is None


@pytest.mark.parametrize("bad", [-5, 0, 10, 999_999_999])
def test_region_cache_memory_budget_rejects_bad_config(bad: int) -> None:
    with pytest.raises(CommandValidationError):
        PhotoRegionCache(max_mask_bytes=bad)


def test_session_public_summary_contains_no_photo_identifiers() -> None:
    session = R2HSession(identity=guard())
    frame = example()
    session.open_photo(frame)
    result = session.summary.public_metadata()
    assert "pixels" not in result
    assert "source_hash" not in result
    assert "filename" not in result
    assert "region_reads" in result


def test_stale_run_refused_before_changes_are_committed() -> None:
    session = R2HSession(identity=guard())
    session.open_photo(example())
    with pytest.raises(CommandUnavailable) as error:
        session.run(parse_pro_commands("/cleanup 2.4"), is_current=lambda: False)
    assert error.value.code == "stale_preview"
    assert session.summary.last_plan is None
