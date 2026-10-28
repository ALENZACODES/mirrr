"""Tile-bounded CPU studio enhancement, with mask-safe local corrections.

Inputs are immutable frames, checked photo-scoped masks and typed controls.
Neutral level 1.0 never changes pixels; the saved source is never mutated.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter

import numpy as np

from .errors import CommandValidationError
from .frames import ImageFrame
from .levels import DecimalLevel
from .regions import PhotoRegionCache
from .studio_kernels import StudioSettings, blur5_luma, reduce_skin_lightness, studio_dose, studio_tile
from .studio_protection import protect_rounded_skin

# Editorial lighting reference; existing numerical safety gates are unchanged.
STUDIO_LIGHT_REFERENCE = (
    "STUDIO light: cover lighting; soft key; gentle sculpting; "
    "texture preserved; colour true."
)


@dataclass(frozen=True, slots=True)
class StudioReport:
    level: str
    elapsed_ms: float
    preview: bool
    tile_count: int
    peak_working_bytes: int
    modified_pixels: int
    protected_unchanged: bool
    alpha_unchanged: bool
    masks_evidence: bool
    maximum_skin_lift_l: float | None = None
    adjusted_skin_pixels: int = 0

    def public_metadata(self) -> dict[str, object]:
        return {
            "level": self.level,
            "elapsed_ms": round(self.elapsed_ms, 3),
            "preview": self.preview,
            "tile_count": self.tile_count,
            "peak_working_bytes": self.peak_working_bytes,
            "modified_pixels": self.modified_pixels,
            "protected_unchanged": self.protected_unchanged,
            "alpha_unchanged": self.alpha_unchanged,
            "masks_evidence": self.masks_evidence,
            "maximum_skin_lift_l": self.maximum_skin_lift_l,
            "adjusted_skin_pixels": self.adjusted_skin_pixels,
            "realface_verified": False,
        }


class StudioQualityProcessor:
    """Classical colour/exposure correction with session-scoped optional masks."""

    def __init__(
        self,
        regions: PhotoRegionCache | None = None,
        *,
        settings: StudioSettings | None = None,
        tile_rows: int = 96,
    ) -> None:
        if type(tile_rows) is not int or not 16 <= tile_rows <= 512:
            raise CommandValidationError("invalid_tiles", "Studio tile rows must be 16 to 512.")
        self._regions = regions
        self._settings = settings if settings is not None else StudioSettings()
        self._tile_rows = tile_rows
        self._last: StudioReport | None = None

    @property
    def last_report(self) -> StudioReport | None:
        return self._last

    def render(self, frame: ImageFrame, *, level: DecimalLevel, preview: bool) -> ImageFrame:
        started = perf_counter()
        if not isinstance(frame, ImageFrame):
            raise CommandValidationError("invalid_frame", "Studio rendering requires a checked image.")
        if type(preview) is not bool:
            raise CommandValidationError("invalid_quality", "Studio preview flag must be boolean.")
        dose = studio_dose(level)
        if dose == 0.0:
            self._last = StudioReport(level.label, (perf_counter() - started) * 1000.0,
                                      preview, 0, 0, 0, True, True, False)
            return frame
        raw = np.frombuffer(frame.pixels, dtype=np.uint8).reshape(
            frame.height, frame.width, frame.channels,
        )
        original = np.asarray(raw[:, :, :3], dtype=np.float32) / 255.0
        output = bytearray(frame.pixels)
        destination = np.frombuffer(output, dtype=np.uint8).reshape(
            frame.height, frame.width, frame.channels,
        )
        skin = (
            self._regions.mask("skin", frame.width, frame.height)
            if self._regions is not None else None
        )
        eyes = (
            self._regions.mask("eyes", frame.width, frame.height)
            if self._regions is not None else None
        )
        protected = (
            self._regions.mask("protected", frame.width, frame.height)
            if self._regions is not None else None
        )
        masks_available = skin is not None or eyes is not None or protected is not None
        count = 0
        peak = 0
        modified = 0
        protected_ok = True
        max_skin_lift = 0.0
        adjusted_skin_pixels = 0
        for y0 in range(0, frame.height, self._tile_rows):
            y1 = min(y0 + self._tile_rows, frame.height)
            tile = original[y0:y1]
            blurred = blur5_luma(original, y0, y1)
            edited = studio_tile(tile, blurred, dose, self._settings)
            if skin is not None:
                skin_tile = np.asarray(skin[y0:y1], dtype=np.float32)
                edited = reduce_skin_lightness(tile, edited, skin_tile)
                weight = 1.0 - 0.40 * np.clip(skin_tile, 0.0, 1.0)
                edited = tile + (edited - tile) * weight[:, :, None]
            if eyes is not None:
                eye_tile = np.asarray(eyes[y0:y1], dtype=np.float32)
                edited = tile + (edited - tile) * (1.0 - np.clip(eye_tile, 0.0, 1.0))[:, :, None]
            if protected is not None:
                keep = np.asarray(protected[y0:y1] > 0.0, dtype=np.bool_)
                edited = np.where(keep[:, :, None], tile, edited)
            converted = np.floor(np.clip(edited, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8)
            if skin is not None:
                converted, protection = protect_rounded_skin(
                    np.asarray(raw[y0:y1, :, :3], dtype=np.uint8),
                    converted,
                    np.asarray(skin[y0:y1], dtype=np.float32),
                )
                max_skin_lift = max(max_skin_lift, protection.maximum_lift_l)
                adjusted_skin_pixels += protection.adjusted_pixels
            destination[y0:y1, :, :3] = converted
            modified += int(np.count_nonzero(np.any(converted != raw[y0:y1, :, :3], axis=2)))
            if protected is not None:
                checked = np.asarray(protected[y0:y1] > 0.0, dtype=np.bool_)
                if np.any(checked):
                    protected_ok = protected_ok and bool(np.all(
                        converted[checked] == raw[y0:y1, :, :3][checked],
                    ))
            peak = max(peak, blurred.nbytes + edited.nbytes + converted.nbytes)
            count += 1
        result = ImageFrame(frame.width, frame.height, frame.channels, bytes(output))
        alpha_ok = frame.channels == 3 or frame.pixels[3::4] == result.pixels[3::4]
        self._last = StudioReport(level.label, (perf_counter() - started) * 1000.0,
                                  preview, count, peak, modified, protected_ok, alpha_ok,
                                  masks_available, max_skin_lift if skin is not None else None,
                                  adjusted_skin_pixels)
        return result
