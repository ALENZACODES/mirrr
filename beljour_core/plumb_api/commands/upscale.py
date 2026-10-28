"""Real 2x/4x tiled CPU upscale with checked face-region detail control.

Only existing input detail is transported. The algorithm cannot reconstruct
hidden face geometry or claim neural super-resolution quality. Every tile uses
absolute output coordinates so chunk size cannot affect the resulting pixels.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from time import perf_counter

import numpy as np
import numpy.typing as npt

from .errors import CommandValidationError
from .frames import MAX_IMAGE_PIXELS, ImageFrame
from .neutral_resize import resize_neutral_tiled
from .numeric import float_image, smooth5, validate_dose
from .regions import PhotoRegionCache
from .upscale_kernel import clip_ringing, sample_alpha_tile, sample_cubic_tile, tile_regions


@dataclass(frozen=True, slots=True)
class UpscaleReport:
    factor: int
    source_pixels: int
    output_pixels: int
    tile_count: int
    tile_size: int
    largest_tile_bytes: int
    face_detail_enabled: bool
    preview: bool
    elapsed_ms: float

    def public_metadata(self) -> dict[str, object]:
        return {
            "factor": self.factor,
            "source_pixels": self.source_pixels,
            "output_pixels": self.output_pixels,
            "tile_count": self.tile_count,
            "tile_size": self.tile_size,
            "largest_tile_bytes": self.largest_tile_bytes,
            "face_detail_enabled": self.face_detail_enabled,
            "preview": self.preview,
            "elapsed_ms": round(self.elapsed_ms, 3),
            "quality_source": "local_synthetic_or_manual",
        }


class UpscaleProcessor:
    """Bounded classical resampling through the existing public UpscalePort."""

    def __init__(
        self,
        regions: PhotoRegionCache | None = None,
        *,
        tile_size: int = 192,
        level: float = 3.0,
    ) -> None:
        if type(tile_size) is not int or not 16 <= tile_size <= 1024:
            raise CommandValidationError("invalid_tiles", "Upscale tile size is invalid.")
        if isinstance(level, bool) or not math.isfinite(level) or not 1.0 <= level <= 5.0:
            raise CommandValidationError("invalid_level", "Upscale needs a valid decimal strength.")
        self._regions = regions
        self._tile_size = tile_size
        self._dose = validate_dose(round(level * 10) / 50.0)
        self._last_report: UpscaleReport | None = None

    @property
    def last_report(self) -> UpscaleReport | None:
        return self._last_report

    def upscale(self, frame: ImageFrame, *, scale: int, preview: bool) -> ImageFrame:
        return self.render(frame, scale=scale, dose=self._dose, preview=preview)

    def render(
        self, frame: ImageFrame, *, scale: int, dose: float, preview: bool,
        neutral_detail: bool = False,
    ) -> ImageFrame:
        started = perf_counter()
        if not isinstance(frame, ImageFrame):
            raise CommandValidationError("invalid_frame", "Upscale needs a valid original frame.")
        if type(scale) is not int or scale not in (2, 4):
            raise CommandValidationError("invalid_scale", "Upscale only supports 2x and 4x.")
        strength = validate_dose(dose)
        if type(preview) is not bool:
            raise CommandValidationError("invalid_quality", "Preview flag must be boolean.")
        target_width = frame.width * scale
        target_height = frame.height * scale
        if target_width * target_height > MAX_IMAGE_PIXELS:
            raise CommandValidationError("invalid_dimensions", "Upscale exceeds 24 MP.")
        if strength == 0.2:
            neutral = resize_neutral_tiled(frame, scale=scale, tile_size=self._tile_size)
            self._last_report = UpscaleReport(
                scale, frame.width * frame.height, target_width * target_height,
                neutral.tiles, self._tile_size, neutral.estimated_peak_tile_bytes,
                False, preview, (perf_counter() - started) * 1000.0,
            )
            return neutral.image
        raw = np.frombuffer(frame.pixels, dtype=np.uint8).reshape(
            frame.height, frame.width, frame.channels,
        )
        rgb = np.asarray(float_image(frame), dtype=np.float32)
        alpha = np.asarray(raw[:, :, 3], dtype=np.float32) if frame.channels == 4 else None
        detail = rgb if neutral_detail else self._prepare_detail(frame, rgb, strength)
        if alpha is not None:
            colour_source = detail * (alpha[:, :, None] / 255.0)
        else:
            colour_source = detail
        tiles = tile_regions(target_width, target_height, tile_size=self._tile_size)
        destination = np.empty((target_height, target_width, frame.channels), dtype=np.uint8)
        peak_tile = 0
        for region in tiles:
            rendered = sample_cubic_tile(colour_source, region, scale)
            rendered = clip_ringing(rendered, colour_source, region, scale)
            if alpha is not None:
                new_alpha = sample_alpha_tile(alpha, region, scale)
                scaled_alpha = new_alpha / 255.0
                safe = np.maximum(scaled_alpha[:, :, None], 1e-5)
                rendered = np.where(scaled_alpha[:, :, None] > 1e-5, rendered / safe, 0.0)
                destination[region.y0:region.y1, region.x0:region.x1, 3] = (
                    np.floor(new_alpha + 0.5).astype(np.uint8)
                )
            output_rgb = np.floor(np.clip(rendered, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8)
            destination[region.y0:region.y1, region.x0:region.x1, :3] = output_rgb
            peak_tile = max(peak_tile, rendered.nbytes + output_rgb.nbytes)
        final = ImageFrame(target_width, target_height, frame.channels, destination.tobytes())
        self._last_report = UpscaleReport(
            scale, frame.width * frame.height, target_width * target_height,
            len(tiles), self._tile_size, peak_tile,
            detail is not rgb, preview, (perf_counter() - started) * 1000.0,
        )
        return final

    def _prepare_detail(
        self, frame: ImageFrame, original: npt.NDArray[np.float32], dose: float,
    ) -> npt.NDArray[np.float32]:
        regions = self._regions
        if regions is None:
            return original
        eyes = regions.mask("eyes", frame.width, frame.height)
        hair = regions.mask("hair", frame.width, frame.height)
        skin = regions.mask("skin", frame.width, frame.height)
        protected = regions.mask("protected", frame.width, frame.height)
        if eyes is None and hair is None and skin is None:
            return original
        weight = np.zeros((frame.height, frame.width), dtype=np.float32)
        if skin is not None:
            weight += np.asarray(skin * 0.018, dtype=np.float32)
        if hair is not None:
            weight += np.asarray(hair * 0.12, dtype=np.float32)
        if eyes is not None:
            weight += np.asarray(eyes * 0.16, dtype=np.float32)
        if protected is not None:
            weight *= np.asarray(1.0 - protected, dtype=np.float32)
        weight = np.asarray(np.minimum(weight, 0.17) * dose, dtype=np.float32)
        low = np.asarray(smooth5(np.asarray(original, dtype=np.float64)), dtype=np.float32)
        modified = original + (original - low) * weight[:, :, None]
        return np.asarray(np.clip(modified, 0.0, 1.0), dtype=np.float32)
