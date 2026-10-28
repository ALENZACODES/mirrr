"""Texture-preserving CPU cleanup for /cleanup, without model dependencies.

A gentle frequency split, block-boundary correction and explicitly checked
spots remove isolated artefacts without generating facial details. Unchecked
regions are not treated as inferred faces. Synthetic tests are not proof of
real-person quality; release evidence is maintained separately.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter

import numpy as np

from .cleanup_detail import (
    CleanupSignals,
    SpotHint,
    correct_isolated_dust,
    deblock_8x8,
    guided_frequency_denoise,
    remove_checked_spots,
    signals,
)
from .errors import CommandValidationError
from .frames import ImageFrame
from .numeric import capped_skin_rise, float_image, image_from_float, validate_dose
from .regions import PhotoRegionCache


@dataclass(frozen=True, slots=True)
class CleanupReport:
    before: CleanupSignals
    after: CleanupSignals
    changed_pixels: int
    alpha_preserved: bool
    protected_preserved: bool
    preview: bool
    elapsed_ms: float
    target_ms: float = 100.0

    def public_metadata(self) -> dict[str, object]:
        return {
            "before": self.before.public_metadata(),
            "after": self.after.public_metadata(),
            "changed_pixels": self.changed_pixels,
            "alpha_preserved": self.alpha_preserved,
            "protected_preserved": self.protected_preserved,
            "preview": self.preview,
            "elapsed_ms": round(self.elapsed_ms, 3),
            "target_ms": self.target_ms,
            "within_target": self.elapsed_ms <= self.target_ms,
            "quality_source": "local_synthetic_or_manual",
        }


class CleanupProcessor:
    """A bounded CPU implementation of the existing public RepairPort protocol."""

    def __init__(
        self,
        regions: PhotoRegionCache | None = None,
        *,
        spots: tuple[SpotHint, ...] = (),
        allow_automatic_dust: bool = True,
    ) -> None:
        if len(spots) > 24 or any(not isinstance(spot, SpotHint) for spot in spots):
            raise CommandValidationError("invalid_spots", "Only 24 typed checked marks are accepted.")
        if type(allow_automatic_dust) is not bool:
            raise CommandValidationError("invalid_cleanup_mode", "Dust mode must be boolean.")
        self._regions = regions
        self._spots = spots
        self._auto_dust = allow_automatic_dust
        self._last_report: CleanupReport | None = None

    @property
    def last_report(self) -> CleanupReport | None:
        return self._last_report

    def cleanup(self, frame: ImageFrame, *, dose: float, preview: bool) -> ImageFrame:
        start = perf_counter()
        strength = validate_dose(dose)
        if type(preview) is not bool:
            raise CommandValidationError("invalid_quality", "Preview must be explicitly boolean.")
        original = float_image(frame)
        before = signals(original)
        regions = self._regions
        skin = regions.mask("skin", frame.width, frame.height) if regions is not None else None
        eyes = regions.mask("eyes", frame.width, frame.height) if regions is not None else None
        hair = regions.mask("hair", frame.width, frame.height) if regions is not None else None
        protected = regions.mask("protected", frame.width, frame.height) if regions is not None else None
        if before.noise_mad < 0.003 and before.block_boundary_excess < 0.006 and not self._spots:
            changed = original
            if self._auto_dust and before.isolated_pixels:
                changed, _ = correct_isolated_dust(original, strength)
        else:
            deblocked = deblock_8x8(original, strength)
            changed = guided_frequency_denoise(deblocked, strength, before.noise_mad)
            if self._auto_dust:
                changed, _ = correct_isolated_dust(changed, strength)
            changed = remove_checked_spots(changed, strength, self._spots)
        weight = np.ones((frame.height, frame.width), dtype=np.float64)
        if skin is not None:
            weight *= 1.0 - 0.35 * skin
        if eyes is not None:
            weight *= 1.0 - eyes
        if hair is not None:
            weight *= 1.0 - 0.90 * hair
        if protected is not None:
            weight *= 1.0 - protected
        changed = original + (changed - original) * np.clip(weight, 0.0, 1.0)[:, :, None]
        changed = capped_skin_rise(original, changed, skin)
        if protected is not None:
            changed = np.where(protected[:, :, None] > 0.0, original, changed)
        output = image_from_float(frame, np.clip(changed, 0.0, 1.0))
        original_bytes = np.frombuffer(frame.pixels, dtype=np.uint8).reshape(
            frame.height, frame.width, frame.channels,
        )
        edited_bytes = np.frombuffer(output.pixels, dtype=np.uint8).reshape(
            frame.height, frame.width, frame.channels,
        )
        changed_pixels = int(np.count_nonzero(np.any(original_bytes[:, :, :3] != edited_bytes[:, :, :3], axis=-1)))
        protected_ok = True
        if protected is not None:
            protected_ok = bool(np.all(original_bytes[protected > 0.0] == edited_bytes[protected > 0.0]))
        alpha_ok = frame.channels == 3 or frame.pixels[3::4] == output.pixels[3::4]
        self._last_report = CleanupReport(
            before, signals(float_image(output)), changed_pixels, alpha_ok, protected_ok,
            preview, (perf_counter() - start) * 1000.0,
        )
        return output
