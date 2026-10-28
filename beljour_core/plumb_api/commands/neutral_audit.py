"""Independent, photo-free diagnostic for level-1.0 upscale parity.

At neutral strength the contract is a size change only: clamped, pixel-centre,
straight-channel bilinear interpolation with final half-up byte rounding.
Higher strengths intentionally use a different resampler and are not subject
 to this neutral-byte contract. Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

import numpy as np

from .errors import CommandValidationError
from .frames import ImageFrame, resize_reference
from .neutral_resize import resize_neutral_tiled

ReferencePort = Callable[[ImageFrame, int, int], ImageFrame]


@dataclass(frozen=True, slots=True)
class NeutralAudit:
    factor: int
    tile_size: int
    width: int
    height: int
    channels: int
    compared_bytes: int
    different_bytes: int
    largest_delta: int
    first_difference: tuple[int, int, int] | None
    neutral_pixel_exact: bool
    tile_fast_path: bool
    source_unchanged: bool
    realface_approved: bool = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": "beljour-neutral-resize-audit/1",
            "factor": self.factor,
            "tile_size": self.tile_size,
            "width": self.width,
            "height": self.height,
            "channels": self.channels,
            "compared_bytes": self.compared_bytes,
            "different_bytes": self.different_bytes,
            "largest_delta": self.largest_delta,
            "first_difference": self.first_difference,
            "neutral_pixel_exact": self.neutral_pixel_exact,
            "tile_fast_path": self.tile_fast_path,
            "source_unchanged": self.source_unchanged,
            "realface_approved": False,
        }


def audit_neutral_upscale(
    source: ImageFrame,
    *,
    scale: int,
    tile_size: int,
    reference: ReferencePort = resize_reference,
) -> NeutralAudit:
    """Diagnose the first differing channel, not merely a PSNR summary.

    The reference is an independently implemented kernel; supplying a test
    reference permits negative controls that must find a one-byte regression.
    Only numeric mismatch metadata is returned. Neither image bytes nor
    image hashes are retained by the result.
    """
    if not isinstance(source, ImageFrame) or not callable(reference):
        raise CommandValidationError("invalid_neutral_audit", "Checked source and reference required.")
    original = source.pixels
    result = resize_neutral_tiled(source, scale=scale, tile_size=tile_size)
    independent = reference(source, source.width * scale, source.height * scale)
    if not isinstance(independent, ImageFrame) or not independent.same_layout(result.image):
        raise CommandValidationError(
            "invalid_neutral_audit", "Reference dimensions or channels changed.",
        )
    expected = np.frombuffer(independent.pixels, dtype=np.uint8)
    actual = np.frombuffer(result.image.pixels, dtype=np.uint8)
    delta = np.abs(actual.astype(np.int16) - expected.astype(np.int16))
    mismatches = np.flatnonzero(delta)
    first: tuple[int, int, int] | None = None
    if mismatches.size:
        offset = int(mismatches[0])
        channel = offset % source.channels
        pixel = offset // source.channels
        first = (pixel // result.image.width, pixel % result.image.width, channel)
    return NeutralAudit(
        scale,
        tile_size,
        result.image.width,
        result.image.height,
        source.channels,
        actual.size,
        int(mismatches.size),
        int(np.max(delta)) if delta.size else 0,
        first,
        mismatches.size == 0,
        result.fast_path_used,
        original == source.pixels,
    )
