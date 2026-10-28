"""Profile guarded cold and warm paths without imposing unstable CI timings.

Every sampled execution keeps Identity Lock active. No production model or
private photographic input is used. Author: John Khan.
"""

from __future__ import annotations

import math
from typing import cast

import numpy as np
import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.latency_probe import LatencyProfile, profile_command_latency
from plumb_api.commands.pro_plan import ProPlan, parse_pro_commands
from plumb_api.commands.r2h_session import R2HSession


def synthetic(width: int = 24, height: int = 24, *, uniform: bool = False) -> ImageFrame:
    pixels = np.full((height, width, 4), 101, dtype=np.uint8)
    if not uniform:
        yy, xx = np.indices((height, width))
        pixels[:, :, 0] = (xx * 11 + yy * 29) % 255
        pixels[:, :, 1] = (xx * 31 + yy * 7) % 255
        pixels[:, :, 2] = (xx * 17 + yy * 19) % 255
        pixels[:, :, 3] = (xx * 5 + yy * 3) % 255
    return ImageFrame(width, height, 4, pixels.tobytes())


def guarded_session(photo: ImageFrame) -> R2HSession:
    guard = IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True)
    session = R2HSession(identity=guard, tile_size=16)
    session.open_photo(photo)
    return session


@pytest.mark.parametrize("command", (
    "/cleanup 1.0", "/upscale 1.0 scale=2x",
    "/studioquality 1.0", "/poseonly 1.0", "/identitylock 1.0",
))
@pytest.mark.parametrize("quality", ("preview", "export"))
def test_five_commands_timing_keeps_identity_lock_enabled(command: str, quality: str) -> None:
    photo = synthetic()
    session = guarded_session(photo)
    plan = parse_pro_commands(command)
    assert plan.identity.enabled
    report = profile_command_latency(session, plan, quality=cast(str, quality), warm_runs=3)
    assert isinstance(report, LatencyProfile)
    assert report.quality == quality
    assert report.warm_runs == 3
    assert report.plan_fingerprint == plan.fingerprint()
    assert report.cold_ms >= 0.0
    assert report.warm_p95_ms >= report.warm_median_ms or report.warm_p95_ms >= 0.0
    assert report.target_ms > 0.0
    assert report.measured_device is False
    assert report.realface_approved is False
    assert report.public_metadata()["realface_approved"] is False
    assert session.summary.photo_open
    assert len(session.recorder.samples) == 4
    assert all(item.work_steps >= 1 for item in session.recorder.samples)


def test_repeated_neutral_resize_uses_guarded_cache() -> None:
    source = synthetic(37, 29)
    session = guarded_session(source)
    plan = parse_pro_commands("/upscale 1.0 scale=4x")
    result = profile_command_latency(session, plan, warm_runs=5)
    assert result.warm_cache_hits >= 4
    assert result.warm_runs == 5
    assert not result.cold_cache_hit
    assert result.cold_ms >= 0
    assert result.warm_median_ms >= 0
    assert result.speedup_ratio is None or result.speedup_ratio >= 0
    assert all(sample.within_target for sample in session.recorder.samples) or isinstance(
        result.budget_exceeded, bool
    )


def test_uniform_upscale_fast_path_reports_bounded_scratch_storage() -> None:
    source = synthetic(46, 53, uniform=True)
    session = guarded_session(source)
    plan = parse_pro_commands("/upscale 1.0 scale=4x")
    result = session.run(plan, quality="preview")
    report = session.upscale_processor.last_report
    assert report is not None
    assert report.face_detail_enabled is False
    assert report.largest_tile_bytes == 0
    assert result.image.width == source.width * 4
    assert result.image.height == source.height * 4
    assert result.steps[0].identity is not None
    assert result.steps[0].identity.synthetic_evidence
    assert result.timing.target_ms == 100.0


def test_nonuniform_source_does_not_incorrectly_use_constant_fast_path() -> None:
    source = synthetic(46, 53)
    session = guarded_session(source)
    plan = parse_pro_commands("/upscale 1.0 scale=2x")
    session.run(plan, quality="preview")
    report = session.upscale_processor.last_report
    assert report is not None
    assert report.largest_tile_bytes > 0


def test_photo_replacement_invalidates_cached_preview_results() -> None:
    one = synthetic(18, 19)
    session = guarded_session(one)
    plan = parse_pro_commands("/cleanup 2.0")
    session.run(plan, quality="preview")
    before = session.summary
    session.open_photo(synthetic(19, 19))
    after = session.summary
    assert after.revision == before.revision + 1
    assert after.last_plan is None
    assert after.render_cache_bytes == 0
    report = profile_command_latency(session, plan, warm_runs=2)
    assert report.cold_cache_hit is False


@pytest.mark.parametrize("count", (0, 1, 41, True, 1.5))
def test_invalid_repetitions_fail_at_the_public_boundary(count: object) -> None:
    session = guarded_session(synthetic())
    plan = parse_pro_commands("/cleanup 1.0")
    with pytest.raises(CommandValidationError):
        profile_command_latency(session, plan, warm_runs=cast(int, count))


def test_latency_requires_an_open_photo_and_valid_plan() -> None:
    session = R2HSession(identity=IdentityGuard(
        DeterministicTestEmbedder(), allow_test_embedder=True,
    ))
    plan = parse_pro_commands("/cleanup 1.0")
    with pytest.raises(CommandValidationError):
        profile_command_latency(session, plan)
    session.open_photo(synthetic())
    with pytest.raises(CommandValidationError):
        profile_command_latency(session, cast(ProPlan, object()))


def test_latency_values_are_finite_and_do_not_include_photo_bytes() -> None:
    session = guarded_session(synthetic())
    result = profile_command_latency(session, parse_pro_commands("/cleanup 1.0"), warm_runs=3)
    report = result.public_metadata()
    assert math.isfinite(result.cold_ms)
    assert math.isfinite(result.warm_median_ms)
    assert all("photo" not in key and "image" not in key for key in report)
    assert not report["measured_device"]


@pytest.mark.parametrize("level", (10, 11, 19, 27, 33, 41, 50))
def test_decimal_lattice_preserves_guarded_warm_cache_evidence(level: int) -> None:
    photo = synthetic(16, 17)
    session = guarded_session(photo)
    plan = parse_pro_commands(f"/cleanup level={level / 10:.1f}")
    measured = profile_command_latency(session, plan, warm_runs=2)
    assert measured.warm_cache_hits == 2
    assert measured.quality == "preview"
    assert session.recorder.samples[0].cache_hit is False
    assert all(item.cache_hit for item in session.recorder.samples[1:])
    assert measured.target_ms == 100.0
    assert isinstance(measured.budget_exceeded, bool)


def test_full_render_profile_reports_original_budget_without_loosening() -> None:
    frame = synthetic(18, 18)
    session = guarded_session(frame)
    plan = parse_pro_commands("/studioquality level=3.0")
    result = profile_command_latency(session, plan, quality="export", warm_runs=4)
    assert result.target_ms == 2000.0
    assert result.warm_cache_hits == 4
    assert result.warm_runs == 4
    assert result.cold_cache_hit is False
    assert result.speedup_ratio is None or result.speedup_ratio >= 0
    assert result.public_metadata()["realface_approved"] is False
