"""Preview/full-size drift is measured on synthetic bytes only. Author: John Khan."""

from __future__ import annotations

import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.guarded import GuardedProExecutor
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.performance import RenderQuality
from plumb_api.commands.preview_parity import compare_render_paths
from plumb_api.commands.pro_plan import ProStep, parse_pro_commands
from plumb_api.commands.types import CommandName


def image() -> ImageFrame:
    pixels = bytes([50, 90, 130] * 400)
    return ImageFrame(20, 20, 3, pixels)


def engine(frame: ImageFrame, step: ProStep, quality: RenderQuality) -> ImageFrame:
    if quality == "preview":
        return frame
    return ImageFrame(frame.width, frame.height, frame.channels, bytes(
        min(255, item + 4) for item in frame.pixels
    ))


def runner() -> GuardedProExecutor:
    return GuardedProExecutor(
        handlers={CommandName.CLEANUP: engine},
        identity=IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True),
    )


def test_equal_frames_drift_is_zero_but_synthetic_is_unproven() -> None:
    source = image()
    plan = parse_pro_commands("/identitylock")
    worker = runner()
    preview = worker.run(plan, source, quality="preview")
    exported = worker.run(plan, source, quality="export")
    report = compare_render_paths(preview, exported)
    assert report.mean_error == 0
    assert report.maximum_error == 0
    assert report.changed_pixel_fraction == 0
    assert report.realface_pass is False
    assert report.status == "needs_review"
    assert "synthetic_only" in report.reason_codes


def test_preview_drift_is_detected_at_both_tolerances() -> None:
    source = image()
    plan = parse_pro_commands("/cleanup 3.1")
    worker = runner()
    before = worker.run(plan, source, quality="preview")
    after = worker.run(plan, source, quality="export")
    report = compare_render_paths(before, after, review_mean_delta=1, review_max_delta=2)
    assert report.mean_error >= 1
    assert report.maximum_error >= 2
    assert "mean_preview_drift" in report.reason_codes
    assert "peak_preview_drift" in report.reason_codes


def test_review_tolerances_do_not_reclassify_synthetic_as_pass() -> None:
    plan = parse_pro_commands("/cleanup")
    worker = runner()
    before = worker.run(plan, image(), quality="preview")
    after = worker.run(plan, image(), quality="export")
    report = compare_render_paths(before, after, review_mean_delta=255, review_max_delta=255)
    assert report.realface_pass is False
    assert "synthetic_only" in report.reason_codes


def test_mismatched_plan_is_refused_before_comparison() -> None:
    worker = runner()
    before = worker.run(parse_pro_commands("/cleanup 2.0"), image(), quality="preview")
    after = worker.run(parse_pro_commands("/cleanup 2.1"), image(), quality="export")
    with pytest.raises(CommandValidationError):
        compare_render_paths(before, after)


def test_reversed_render_roles_are_refused() -> None:
    worker = runner()
    plan = parse_pro_commands("/cleanup 2.0")
    preview = worker.run(plan, image(), quality="preview")
    full = worker.run(plan, image(), quality="export")
    with pytest.raises(CommandValidationError):
        compare_render_paths(full, preview)


@pytest.mark.parametrize("mean,max_value,chunk", [
    (-1, 5, 128), (2, 256, 128), (2, 10, 0), (2, 10, 2049),
])
def test_invalid_comparison_settings_rejected(mean: int, max_value: int, chunk: int) -> None:
    worker = runner()
    plan = parse_pro_commands("/identitylock")
    before = worker.run(plan, image(), quality="preview")
    after = worker.run(plan, image(), quality="export")
    with pytest.raises(CommandValidationError):
        compare_render_paths(
            before, after, review_mean_delta=mean,
            review_max_delta=max_value, rows_per_chunk=chunk,
        )


def test_report_omits_pixels_and_true_release_claims() -> None:
    worker = runner()
    plan = parse_pro_commands("/cleanup")
    summary = compare_render_paths(
        worker.run(plan, image(), quality="preview"),
        worker.run(plan, image(), quality="export"),
    ).public_metadata()
    assert summary["realface_pass"] is False
    assert "raw_pixels" not in str(summary)
    assert "face_embedding" not in str(summary)
