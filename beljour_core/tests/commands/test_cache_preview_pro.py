"""Cache provenance, stale previews, exact exports and local timing budgets.

No images on disk, model bytes or network dependencies. Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from plumb_api.commands.cache import CachedFaceEmbedder, FrameCache, evidence_digest, frame_digest
from plumb_api.commands.embedders import DeterministicTestEmbedder, EmbedderEvidence
from plumb_api.commands.errors import CommandExecutionError, CommandUnavailable, CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.guarded import GuardedProExecutor
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.performance import (
    PerformanceBudget,
    PerformanceRecorder,
    TimingObservation,
    inspect_timings,
)
from plumb_api.commands.preview import PreviewCoordinator
from plumb_api.commands.pro_plan import ProStep, parse_pro_commands
from plumb_api.commands.types import CommandName


def sample(value: int = 30, width: int = 8, height: int = 8) -> ImageFrame:
    return ImageFrame(width, height, 3, bytes([value, value + 4, value + 9]) * (width * height))


def effect(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
    contents = bytearray(frame.pixels)
    contents[0] = min(255, contents[0] + 2)
    return ImageFrame(frame.width, frame.height, frame.channels, bytes(contents))


def executor(*, cache: FrameCache | None = None) -> GuardedProExecutor:
    embedding = CachedFaceEmbedder(DeterministicTestEmbedder())
    identity = IdentityGuard(embedding, allow_test_embedder=True)
    return GuardedProExecutor(handlers={CommandName.POSEONLY: effect}, identity=identity, cache=cache)


def test_frame_digest_uses_dimensions_and_pixels_without_leaking_them() -> None:
    first = frame_digest(sample(30))
    second = frame_digest(sample(31))
    reshaped = frame_digest(sample(30, width=4, height=16))
    assert len(first) == 64
    assert first != second
    assert first != reshaped
    assert "30" not in str(FrameCache(max_bytes=100).stats.public_metadata())


def test_cache_key_binds_model_provenance_quality_and_plan() -> None:
    source = sample()
    record = DeterministicTestEmbedder().evidence
    altered = replace(record, model_id="different-test-model")
    first = FrameCache.make_key(source, "first", record, "preview")
    assert first != FrameCache.make_key(source, "first", record, "export")
    assert first != FrameCache.make_key(source, "second", record, "preview")
    assert first != FrameCache.make_key(sample(31), "first", record, "preview")
    assert first != FrameCache.make_key(source, "first", altered, "preview")
    assert evidence_digest(record) != evidence_digest(altered)
    with pytest.raises(CommandValidationError):
        FrameCache.make_key(source, "first", record, "thumbnail")


def test_frame_cache_lru_byte_bound_and_eviction() -> None:
    cache = FrameCache(max_bytes=sample().byte_size * 2, max_entries=2)
    a = "a" * 64
    b = "b" * 64
    c = "c" * 64
    cache.put(a, sample(30))
    cache.put(b, sample(40))
    assert cache.get(a) is not None
    cache.put(c, sample(50))
    assert cache.get(b) is None
    assert cache.get(a) is not None
    assert cache.get(c) is not None
    assert cache.stats.evictions == 1
    assert cache.stats.retained_bytes <= sample().byte_size * 2
    cache.clear()
    assert cache.stats.entries == 0
    assert cache.stats.retained_bytes == 0


def test_cache_rejects_oversize_and_bad_ownership() -> None:
    cache = FrameCache(max_bytes=100, max_entries=1)
    cache.put("a" * 64, sample())
    assert cache.stats.entries == 0
    with pytest.raises(CommandValidationError):
        cache.put("not-a-digest", sample())
    with pytest.raises(CommandValidationError):
        FrameCache(max_bytes=-1)
    with pytest.raises(CommandValidationError):
        FrameCache(max_entries=0)


def test_embedding_cache_reuses_only_exact_bytes_and_model_evidence() -> None:
    embedder = CachedFaceEmbedder(DeterministicTestEmbedder(), max_entries=2)
    one = embedder.embed(sample(40))
    two = embedder.embed(sample(40))
    assert one == two
    assert embedder.misses == 1
    assert embedder.hits == 1
    embedder.embed(sample(41))
    embedder.embed(sample(42))
    embedder.embed(sample(40))
    assert embedder.misses == 4
    embedder.clear()
    embedder.embed(sample(40))
    assert embedder.misses == 5


def test_embedding_evidence_still_requires_approval() -> None:
    record: EmbedderEvidence = DeterministicTestEmbedder().evidence
    with pytest.raises(CommandUnavailable) as failure:
        record.validate()
    assert failure.value.code == "test_model_forbidden"
    assert not record.real_face_validation_passed


def test_repeated_command_uses_cache_but_guard_still_checks_again() -> None:
    count = [0]

    def handler(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
        count[0] += 1
        return effect(frame, step, quality)

    cache = FrameCache()
    embedder = CachedFaceEmbedder(DeterministicTestEmbedder())
    guard = IdentityGuard(embedder, allow_test_embedder=True)
    runner = GuardedProExecutor(handlers={CommandName.POSEONLY: handler}, identity=guard, cache=cache)
    plan = parse_pro_commands("/poseonly 3.4")
    first = runner.run(plan, sample())
    second = runner.run(plan, sample())
    assert count[0] == 1
    assert not first.steps[0].cache_hit
    assert second.steps[0].cache_hit
    assert second.steps[0].identity is not None
    assert embedder.hits >= 1
    assert first.image.pixels == second.image.pixels
    runner.clear_photo()
    assert cache.stats.entries == 0


def test_preview_is_debounced_and_replaced_revision_is_stale() -> None:
    now = [100.0]
    coordinator = PreviewCoordinator(executor(), debounce_ms=60, clock_ms=lambda: now[0])
    coordinator.open_photo(sample())
    first = coordinator.request(parse_pro_commands("/poseonly 2.0"))
    assert not coordinator.ready(first)
    with pytest.raises(CommandUnavailable) as failure:
        coordinator.render_ready(first)
    assert failure.value.code == "preview_debouncing"
    now[0] = 200.0
    assert coordinator.ready(first)
    newer = coordinator.request(parse_pro_commands("/poseonly 3.0"))
    assert not coordinator.is_current(first)
    with pytest.raises(CommandUnavailable):
        coordinator.render_ready(first)
    now[0] = 261.0
    result = coordinator.render_ready(newer)
    assert result.image.width == 8
    assert result.timing.quality == "preview"
    assert coordinator.pending is None


def test_export_is_full_resolution_and_cannot_inherit_preview_frame() -> None:
    now = [10.0]
    budget = PerformanceBudget(preview_long_edge=64)
    coordinator = PreviewCoordinator(executor(), budget=budget, clock_ms=lambda: now[0])
    coordinator.open_photo(sample(30, width=128, height=64))
    before = coordinator.request(parse_pro_commands("/poseonly 2.0"), quality="preview")
    now[0] += 61.0
    preview = coordinator.render_ready(before)
    assert preview.image.width == 64
    assert preview.image.height == 32
    full = coordinator.request(parse_pro_commands("/poseonly 2.0"), quality="export")
    exported = coordinator.render_ready(full)
    assert exported.image.width == 128
    assert exported.image.height == 64
    assert exported.timing.quality == "export"
    assert not exported.steps[0].cache_hit


def test_replace_photo_invalidates_tickets_and_caches() -> None:
    runner = executor()
    now = [90.0]
    coordinator = PreviewCoordinator(runner, clock_ms=lambda: now[0])
    coordinator.open_photo(sample(30))
    old = coordinator.request(parse_pro_commands("/poseonly"))
    coordinator.open_photo(sample(31))
    assert not coordinator.is_current(old)
    assert runner.cache.stats.entries == 0
    with pytest.raises(CommandUnavailable):
        coordinator.render_ready(old)
    coordinator.close_photo()
    with pytest.raises(CommandUnavailable):
        coordinator.request(parse_pro_commands("/cleanup"))


def test_performance_recorder_observes_injected_clock_values() -> None:
    ticks = iter((3.0, 3.095, 4.0, 6.1))
    recorder = PerformanceRecorder(clock=lambda: next(ticks))
    budget = PerformanceBudget(preview_ms=100, export_ms=2000)
    first = recorder.finish(recorder.start(), "preview", budget, cache_hit=False, work_steps=2)
    second = recorder.finish(recorder.start(), "export", budget, cache_hit=True, work_steps=1)
    assert first.elapsed_ms == pytest.approx(95)
    assert first.within_target
    assert second.elapsed_ms == pytest.approx(2100)
    assert not second.within_target
    assert recorder.summary("preview")["median_ms"] == 95
    assert recorder.summary("export")["count"] == 1
    assert len(inspect_timings((first, second))) == 2
    assert "over budget" in inspect_timings((second,))[0]


def test_performance_empty_summary_has_no_invented_metric() -> None:
    recorder = PerformanceRecorder()
    assert recorder.summary("preview")["median_ms"] is None
    assert recorder.summary("export")["count"] == 0
    with pytest.raises(CommandValidationError):
        PerformanceBudget(preview_ms=-1)
    with pytest.raises(CommandValidationError):
        PerformanceRecorder(max_samples=0)


@pytest.mark.parametrize("quality", ["preview", "export"])
def test_bad_timing_values_fail_closed(quality: str) -> None:
    with pytest.raises(CommandValidationError):
        TimingObservation(quality, float("nan"), 100.0, False, 1)
    with pytest.raises(CommandValidationError):
        TimingObservation(quality, 1.0, -1.0, False, 1)


def test_a_late_failure_never_caches_an_uncommitted_earlier_edit() -> None:
    cached = FrameCache()

    def fail(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
        raise RuntimeError("injected later failure")

    runner = GuardedProExecutor(
        handlers={CommandName.POSEONLY: effect, CommandName.CLEANUP: fail},
        identity=IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True),
        cache=cached,
    )
    with pytest.raises(CommandExecutionError):
        runner.run(parse_pro_commands("/poseonly 2.0 /cleanup 4.0"), sample())
    assert cached.stats.entries == 0
    assert cached.stats.retained_bytes == 0
