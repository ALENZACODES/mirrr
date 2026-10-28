"""Prove the neutral claim from actual delivered image bytes.

Includes cleanup-input scoping, reference corruption, alpha, nonneutral
abstention and a reproducible before/after synthetic reference set.
Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path
from typing import cast

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame, resize_reference
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.neutral_reference_set import (
    CaseKind,
    evaluate_reference_set,
    export_regression_summary,
    render_regression_markdown,
    synthetic_pair_frame,
)
from plumb_api.commands.upscale import UpscaleProcessor
from plumb_api.commands.upscale_claims import (
    PIXEL_CLAIM_WORDING,
    compare_delivered_pixels,
    evaluate_upscale_claim,
)


def altered(frame: ImageFrame, *, offset: int, delta: int = 1) -> ImageFrame:
    pixels = bytearray(frame.pixels)
    pixels[offset] = (pixels[offset] + delta) % 256
    return ImageFrame(frame.width, frame.height, frame.channels, bytes(pixels))


@pytest.mark.parametrize("kind", ("uniform", "checker", "gradient", "edge", "alpha_corner", "ramp"))
@pytest.mark.parametrize("channels", (3, 4))
@pytest.mark.parametrize("factor", (2, 4))
@pytest.mark.parametrize("dimensions", ((1, 1), (19, 13), (34, 37)))
def test_actual_neutral_delivery_is_pixel_exact(
    kind: str,
    channels: int,
    factor: int,
    dimensions: tuple[int, int],
) -> None:
    source = synthetic_pair_frame(
        *dimensions, channels,
        cast(CaseKind, kind),
    )
    before = source.pixels
    actual = UpscaleProcessor(tile_size=17).render(
        source, scale=factor, dose=0.2, preview=True,
    )
    report = evaluate_upscale_claim(
        source, actual, level=DecimalLevel(10), factor=factor, preview=True,
    )
    assert report.pixel_exact
    assert report.status == "PIXEL_EXACT"
    assert report.comparison.different_bytes == 0
    assert report.comparison.first_difference is None
    assert report.comparison.max_delta == 0
    assert report.comparison.psnr_db is None
    assert report.comparison.ssim8_rgb == pytest.approx(1.0, abs=1e-10)
    assert report.comparison.compared_bytes == len(actual.pixels)
    assert source.pixels == before
    assert not report.public_metadata()["realface_release_approved"]
    assert "pixels" not in str(report.public_metadata())
    assert "face_embedding" not in str(report.public_metadata())


@pytest.mark.parametrize("factor", (2, 4))
@pytest.mark.parametrize("channels", (3, 4))
def test_one_channel_difference_blocks_pixel_exact_claim(factor: int, channels: int) -> None:
    source = synthetic_pair_frame(19, 13, channels, "gradient")
    expected = resize_reference(source, source.width * factor, source.height * factor)
    at = (3 * expected.width + 2) * channels + channels - 1
    failed = altered(expected, offset=at)
    report = evaluate_upscale_claim(
        source, failed, level=DecimalLevel(10), factor=factor, preview=False,
    )
    assert report.status == "PIXEL_MISMATCH"
    assert not report.pixel_exact
    assert report.comparison.different_bytes == 1
    assert report.comparison.first_difference == (3, 2, channels - 1)
    assert report.comparison.differences_per_channel[channels - 1] == 1
    assert report.comparison.max_delta == 1
    assert report.comparison.mean_squared_byte_error > 0
    assert report.comparison.psnr_db is not None
    if channels == 3:
        assert report.comparison.ssim8_rgb < 1.0


@pytest.mark.parametrize("level", (11, 12, 25, 30, 40, 50))
def test_non_neutral_must_not_assert_pixel_exact_even_if_bytes_match(level: int) -> None:
    source = synthetic_pair_frame(7, 5, 4, "gradient")
    delivered = resize_reference(source, 14, 10)
    report = evaluate_upscale_claim(
        source, delivered, level=DecimalLevel(level), factor=2, preview=False,
    )
    assert report.status == "OUTSIDE_SCOPE"
    assert not report.pixel_exact
    assert report.comparison.different_bytes == 0
    assert report.public_metadata()["realface_release_approved"] is False


def test_cleanup_first_uses_guarded_post_cleanup_frame() -> None:
    source = synthetic_pair_frame(18, 13, 4, "gradient")
    cleaned = altered(source, offset=23, delta=80)
    delivered = resize_reference(cleaned, 36, 26)
    correct = evaluate_upscale_claim(
        source, delivered, level=DecimalLevel(10), factor=2,
        preview=False, post_cleanup=cleaned,
    )
    incorrect = evaluate_upscale_claim(
        source, delivered, level=DecimalLevel(10), factor=2,
        preview=False,
    )
    assert correct.pixel_exact
    assert correct.stage == "post_cleanup"
    assert correct.cleanup_pre_step
    assert not incorrect.pixel_exact
    assert incorrect.status == "PIXEL_MISMATCH"
    assert "post-cleanup" in PIXEL_CLAIM_WORDING
    assert correct.public_metadata()["production_identity_proved"] is False


def test_cleanup_is_not_certified_if_guard_alters_final_upscale() -> None:
    source = synthetic_pair_frame(17, 19, 4, "checker")
    cleaned = altered(source, offset=34)
    neutral = resize_reference(cleaned, 34, 38)
    guard_altered = altered(neutral, offset=17)
    report = evaluate_upscale_claim(
        source, guard_altered, level=DecimalLevel(10), factor=2,
        preview=True, post_cleanup=cleaned,
    )
    assert report.status == "PIXEL_MISMATCH"
    assert not report.pixel_exact


@pytest.mark.parametrize("channel", (0, 1, 2, 3))
def test_rgba_final_byte_audit_includes_every_channel(channel: int) -> None:
    source = synthetic_pair_frame(9, 7, 4, "alpha_corner")
    expected = resize_reference(source, 18, 14)
    modified = altered(expected, offset=3 * 4 + channel)
    result = compare_delivered_pixels(expected, modified)
    assert result.different_bytes == 1
    assert result.differences_per_channel[channel] == 1
    assert sum(result.differences_per_channel) == 1
    assert result.first_difference == (0, 3, channel)


@pytest.mark.parametrize("kind", ("uniform", "checker", "ramp"))
@pytest.mark.parametrize("factor", (2, 4))
def test_cubic_before_neutral_is_not_conflated_with_fixed_path(kind: str, factor: int) -> None:
    source = synthetic_pair_frame(27, 29, 4, cast(CaseKind, kind))
    old = UpscaleProcessor(tile_size=17).render(
        source, scale=factor, dose=0.6, preview=False, neutral_detail=True,
    )
    new = UpscaleProcessor(tile_size=17).render(
        source, scale=factor, dose=0.2, preview=False,
    )
    old_claim = evaluate_upscale_claim(
        source, old, level=DecimalLevel(10), factor=factor, preview=False,
    )
    new_claim = evaluate_upscale_claim(
        source, new, level=DecimalLevel(10), factor=factor, preview=False,
    )
    assert new_claim.pixel_exact
    if kind != "uniform":
        assert old_claim.status == "PIXEL_MISMATCH"
        assert old_claim.comparison.different_bytes > 0


@pytest.mark.parametrize("bad", (0, 1, 3, 5, True, "2x"))
def test_invalid_factors_cannot_generate_a_claim(bad: object) -> None:
    source = synthetic_pair_frame(3, 4, 3, "gradient")
    with pytest.raises(CommandValidationError):
        evaluate_upscale_claim(
            source, source, level=DecimalLevel(10), factor=cast(int, bad), preview=False,
        )


def test_missing_post_cleanup_frame_is_not_invented() -> None:
    source = synthetic_pair_frame(3, 4, 4, "gradient")
    wrong = synthetic_pair_frame(5, 6, 4, "checker")
    output = resize_reference(source, 6, 8)
    with pytest.raises(CommandValidationError, match="Cleanup output"):
        evaluate_upscale_claim(
            source, output, level=DecimalLevel(10), factor=2,
            preview=False, post_cleanup=wrong,
        )


def test_invalid_delivered_size_fails_closed() -> None:
    source = synthetic_pair_frame(3, 4, 4, "checker")
    wrong = ImageFrame(7, 8, 4, bytes(7 * 8 * 4))
    with pytest.raises(CommandValidationError):
        evaluate_upscale_claim(
            source, wrong, level=DecimalLevel(10), factor=2, preview=False,
        )


def test_public_evidence_cannot_have_approval_mutated_into_dataclass() -> None:
    source = synthetic_pair_frame(5, 7, 4, "ramp")
    actual = resize_reference(source, 10, 14)
    result = evaluate_upscale_claim(
        source, actual, level=DecimalLevel(10), factor=2, preview=False,
    )
    assert result.pixel_exact
    assert not result.public_metadata()["realface_release_approved"]
    assert replace(result, status="OUTSIDE_SCOPE").public_metadata()["pixel_exact"] is False
    encoded = json.dumps(result.public_metadata(), sort_keys=True)
    assert "beljour-upscale-neutral-claim/1" in encoded
    assert source.pixels.hex() not in encoded


def test_reference_set_before_after_regression_is_reproducible(tmp_path: Path) -> None:
    report = evaluate_reference_set(tile_size=17)
    assert len(report.cases) == 16
    assert report.before_mismatch_cases > 0
    assert report.before_different_bytes > 0
    assert report.after_mismatch_cases == 0
    assert report.after_different_bytes == 0
    assert report.checked_bytes > 0
    assert all(case.after.pixel_exact for case in report.cases)
    assert report == evaluate_reference_set(tile_size=17)
    published = report.public_metadata()
    assert published["external_reference_set"] == "NOT_RUN"
    assert published["release_authorized"] is False
    paths = export_regression_summary(tmp_path, report)
    assert all(path.exists() for path in paths)
    assert json.loads(paths[0].read_text(encoding="utf-8")) == published
    assert "After correction" in paths[1].read_text(encoding="utf-8")
    assert "NOT RUN" in render_regression_markdown(report)
    with pytest.raises(CommandValidationError, match="overwritten"):
        export_regression_summary(tmp_path, report)


def test_tiny_reference_ssim_is_diagnostic_not_gate() -> None:
    source = synthetic_pair_frame(1, 1, 4, "uniform")
    true = resize_reference(source, 2, 2)
    corrupt = altered(true, offset=2)
    changed = compare_delivered_pixels(true, corrupt)
    assert changed.ssim_windows_sampled == 1
    assert -1 <= changed.ssim8_rgb <= 1
    assert changed.psnr_db is not None
    assert changed.public_metadata()["ssim_diagnostic_only"]
