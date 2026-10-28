"""Evidence-backed wording for the neutral BELJOUR /UPSCALE contract.

A neutral edit is a pixel-centre bilinear size change, not recovery of lost
photographic detail. Verify delivered bytes against an independently computed
reference. Claims about a cleaned image refer to the image AFTER /CLEANUP,
not to the earlier source. A guarded edit can change pixels after resampling,
so its final output must be compared again before making a parity claim.

Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

import numpy as np

from .errors import CommandValidationError
from .frames import ImageFrame, resize_reference
from .levels import DecimalLevel

ReferenceStage = Literal["original", "post_cleanup"]
PixelClaimStatus = Literal["PIXEL_EXACT", "PIXEL_MISMATCH", "OUTSIDE_SCOPE"]
PIXEL_CLAIM_VERSION = "beljour-upscale-neutral-claim/1"
PIXEL_CLAIM_WORDING = (
    "At strength 1.0, /UPSCALE performs pixel-centre bilinear resizing "
    "without added detail. Pixel-exact parity applies only to the delivered "
    "2x/4x RGB/RGBA bytes compared with an independent resize of the exact "
    "input supplied to /UPSCALE. With /CLEANUP, that input is the guarded "
    "post-cleanup frame. Higher strengths use different sampling; none of "
    "these checks establish reconstructed detail, identity or real-face quality."
)


@dataclass(frozen=True, slots=True)
class PixelDifference:
    compared_bytes: int
    different_bytes: int
    max_delta: int
    first_difference: tuple[int, int, int] | None
    differences_per_channel: tuple[int, ...]
    mean_squared_byte_error: float
    psnr_db: float | None
    ssim8_rgb: float
    ssim_windows_sampled: int

    def __post_init__(self) -> None:
        if self.compared_bytes < 1 or self.different_bytes < 0:
            raise CommandValidationError("invalid_pixel_evidence", "Pixel counts are invalid.")
        if self.different_bytes > self.compared_bytes or self.max_delta > 255:
            raise CommandValidationError("invalid_pixel_evidence", "Pixel differences are invalid.")

    def public_metadata(self) -> dict[str, object]:
        return {
            "compared_bytes": self.compared_bytes,
            "different_bytes": self.different_bytes,
            "max_delta": self.max_delta,
            "first_difference_yxc": list(self.first_difference)
            if self.first_difference is not None else None,
            "differences_per_channel": list(self.differences_per_channel),
            "mse_byte": round(self.mean_squared_byte_error, 8),
            "psnr_db": round(self.psnr_db, 6) if self.psnr_db is not None else None,
            "psnr_infinite": self.psnr_db is None,
            "ssim8_rgb": round(self.ssim8_rgb, 8),
            "ssim_windows_sampled": self.ssim_windows_sampled,
            "ssim_diagnostic_only": True,
        }


@dataclass(frozen=True, slots=True)
class UpscalePixelClaim:
    stage: ReferenceStage
    level: str
    factor: int
    preview: bool
    status: PixelClaimStatus
    comparison: PixelDifference
    cleanup_pre_step: bool
    input_stage_verified: bool

    @property
    def pixel_exact(self) -> bool:
        return self.status == "PIXEL_EXACT"

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": PIXEL_CLAIM_VERSION,
            "stage": self.stage,
            "level": self.level,
            "factor": self.factor,
            "preview": self.preview,
            "status": self.status,
            "pixel_exact": self.pixel_exact,
            "cleanup_before_upscale": self.cleanup_pre_step,
            "input_stage_verified": self.input_stage_verified,
            "comparison": self.comparison.public_metadata(),
            "claim_wording": PIXEL_CLAIM_WORDING,
            "synthetic_or_local_only": True,
            "production_identity_proved": False,
            "realface_release_approved": False,
        }


def _sampled_ssim(
    expected: ImageFrame,
    actual: ImageFrame,
    *,
    maximum_windows: int = 512,
) -> tuple[float, int]:
    """Diagnostic 8x8 local SSIM, deterministic subsampling when oversized.

    This is neither a clinical score nor a standard multiscale SSIM gate.
    Only RGB contributes; transparency is compared in the byte counters.
    """
    width = expected.width
    height = expected.height
    channels = expected.channels
    before = np.frombuffer(expected.pixels, dtype=np.uint8).reshape(height, width, channels)
    after = np.frombuffer(actual.pixels, dtype=np.uint8).reshape(height, width, channels)
    rows = (height + 7) // 8
    columns = (width + 7) // 8
    total = rows * columns
    sample_count = min(maximum_windows, total)
    selected = np.linspace(0, total - 1, sample_count, dtype=np.intp)
    c1 = (0.01 * 255.0) ** 2
    c2 = (0.03 * 255.0) ** 2
    score = 0.0
    for slot in selected:
        y = int(slot // columns) * 8
        x = int(slot % columns) * 8
        left = np.asarray(before[y:y + 8, x:x + 8, :3], dtype=np.float64).ravel()
        right = np.asarray(after[y:y + 8, x:x + 8, :3], dtype=np.float64).ravel()
        mu_left = float(np.mean(left))
        mu_right = float(np.mean(right))
        variance_left = float(np.mean((left - mu_left) ** 2))
        variance_right = float(np.mean((right - mu_right) ** 2))
        covariance = float(np.mean((left - mu_left) * (right - mu_right)))
        numerator = (2 * mu_left * mu_right + c1) * (2 * covariance + c2)
        denominator = (
            (mu_left ** 2 + mu_right ** 2 + c1)
            * (variance_left + variance_right + c2)
        )
        score += numerator / denominator
    return max(-1.0, min(1.0, score / sample_count)), sample_count


def compare_delivered_pixels(
    expected: ImageFrame,
    delivered: ImageFrame,
) -> PixelDifference:
    """Compare ALL output bytes in bounded chunks, including transparent RGB.

    The caller supplies already-validated frames; no source pixels leave
    memory in the returned photo-free evidence.
    """
    if not isinstance(expected, ImageFrame) or not isinstance(delivered, ImageFrame):
        raise CommandValidationError("invalid_reference", "Both images must be checked frames.")
    if not expected.same_layout(delivered):
        raise CommandValidationError("invalid_reference", "Output and reference layouts differ.")
    before = memoryview(expected.pixels)
    after = memoryview(delivered.pixels)
    channels = expected.channels
    different = 0
    maximum = 0
    first: tuple[int, int, int] | None = None
    per_channel = [0] * channels
    sum_squared = 0
    # Chunks stay aligned to RGB/RGBA pixels and have bounded intermediate arrays.
    chunk_size = (65536 // channels) * channels
    for start in range(0, len(before), chunk_size):
        end = min(len(before), start + chunk_size)
        left = np.frombuffer(before[start:end], dtype=np.uint8)
        right = np.frombuffer(after[start:end], dtype=np.uint8)
        delta = np.asarray(left, dtype=np.int16) - np.asarray(right, dtype=np.int16)
        absolute = np.abs(delta)
        hits = np.flatnonzero(absolute)
        different += int(hits.size)
        if hits.size > 0 and first is None:
            offset = start + int(hits[0])
            pixel = offset // channels
            first = (pixel // expected.width, pixel % expected.width, offset % channels)
        if hits.size > 0:
            maximum = max(maximum, int(np.max(absolute)))
        per_pixel = absolute.reshape((-1, channels))
        for channel in range(channels):
            per_channel[channel] += int(np.count_nonzero(per_pixel[:, channel]))
        squares = np.asarray(delta, dtype=np.int32)
        sum_squared += int(np.sum(squares * squares, dtype=np.int64))
    mse = sum_squared / len(before)
    psnr = 10 * math.log10((255.0 * 255.0) / mse) if mse > 0 else None
    ssim, sampled = _sampled_ssim(expected, delivered)
    return PixelDifference(
        len(before), different, maximum, first, tuple(per_channel),
        float(mse), psnr, ssim, sampled,
    )


def evaluate_upscale_claim(
    source: ImageFrame,
    delivered: ImageFrame,
    *,
    level: DecimalLevel,
    factor: int,
    preview: bool,
    post_cleanup: ImageFrame | None = None,
) -> UpscalePixelClaim:
    """Certify only a measured neutral output, never a user-supplied flag.

    If a cleanup stage ran, ``post_cleanup`` must be its actual guarded frame.
    The comparison then uses that frame; claiming agreement with the earlier
    photograph would be misleading. The original is not logged or returned.
    """
    if not isinstance(source, ImageFrame) or not isinstance(delivered, ImageFrame):
        raise CommandValidationError("invalid_claim", "Checked input and output are required.")
    if not isinstance(level, DecimalLevel) or type(preview) is not bool:
        raise CommandValidationError("invalid_claim", "Checked level and preview are required.")
    if type(factor) is not int or factor not in (2, 4):
        raise CommandValidationError("invalid_scale", "Reference audit requires 2x or 4x.")
    if post_cleanup is not None and (
        not isinstance(post_cleanup, ImageFrame) or not source.same_layout(post_cleanup)
    ):
        raise CommandValidationError("invalid_claim", "Cleanup output must match input geometry.")
    stage: ReferenceStage = "post_cleanup" if post_cleanup is not None else "original"
    input_to_upscale = post_cleanup if post_cleanup is not None else source
    expected = resize_reference(
        input_to_upscale,
        input_to_upscale.width * factor,
        input_to_upscale.height * factor,
    )
    comparison = compare_delivered_pixels(expected, delivered)
    status: PixelClaimStatus = "OUTSIDE_SCOPE"
    if level.tenths == 10:
        status = "PIXEL_EXACT" if comparison.different_bytes == 0 else "PIXEL_MISMATCH"
    return UpscalePixelClaim(
        stage, level.label, factor, preview, status, comparison,
        post_cleanup is not None, True,
    )
