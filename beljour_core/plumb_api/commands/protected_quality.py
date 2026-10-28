"""Bounded-memory preservation measurements over checked external masks.

No face area or skin tone is inferred. Measurements are diagnostic, not proof
of identity or an authorization to publish the resulting photograph. Mask
boundaries are measured separately so a mean score cannot hide a hard seam.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

import numpy as np
import numpy.typing as npt

from .errors import CommandValidationError
from .frames import ImageFrame

FloatArray = npt.NDArray[np.float64]
MaskKind = Literal["face", "skin", "eyes", "hair", "person", "protected"]


@dataclass(frozen=True, slots=True)
class MaskEvidence:
    kind: MaskKind
    width: int
    height: int
    alpha: bytes
    checked_by_user: bool

    def __post_init__(self) -> None:
        if self.kind not in ("face", "skin", "eyes", "hair", "person", "protected"):
            raise CommandValidationError("invalid_mask", "Unknown protection mask category.")
        if (
            type(self.width) is not int
            or type(self.height) is not int
            or self.width < 1
            or self.height < 1
            or self.width * self.height > 24_000_000
        ):
            raise CommandValidationError("invalid_mask", "Mask dimensions are invalid.")
        if type(self.alpha) is not bytes or len(self.alpha) != self.width * self.height:
            raise CommandValidationError("invalid_mask", "Mask bytes and dimensions do not agree.")
        if type(self.checked_by_user) is not bool:
            raise CommandValidationError("invalid_mask", "Mask provenance must be explicit.")


@dataclass(frozen=True, slots=True)
class ProtectionReading:
    category: MaskKind
    eligible_pixels: int
    changed_pixels: int
    mean_rgb_delta: float | None
    largest_rgb_delta: int | None
    boundary_largest_delta: int | None
    skin_lstar_max_rise: float | None
    alpha_mismatch_pixels: int
    reference_checked: bool
    realface_pass: Literal[False] = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "category": self.category,
            "eligible_pixels": self.eligible_pixels,
            "changed_pixels": self.changed_pixels,
            "mean_rgb_delta": self.mean_rgb_delta,
            "largest_rgb_delta": self.largest_rgb_delta,
            "boundary_largest_delta": self.boundary_largest_delta,
            "skin_lstar_max_rise": self.skin_lstar_max_rise,
            "alpha_mismatch_pixels": self.alpha_mismatch_pixels,
            "reference_checked": self.reference_checked,
            "realface_pass": False,
        }


@dataclass(frozen=True, slots=True)
class ProtectionReport:
    source_width: int
    source_height: int
    readings: tuple[ProtectionReading, ...]
    missing_categories: tuple[MaskKind, ...]
    complete: bool
    realface_pass: Literal[False] = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": "beljour-pro-protected-regions/1",
            "width": self.source_width,
            "height": self.source_height,
            "readings": [reading.public_metadata() for reading in self.readings],
            "missing_categories": list(self.missing_categories),
            "complete": self.complete,
            "realface_pass": False,
        }


def _rgb_lstar(rgb: FloatArray) -> FloatArray:
    """Compute only CIE L* via linear sRGB Y, without inferred complexion labels."""
    encoded = rgb / 255.0
    linear = np.where(
        encoded <= 0.04045,
        encoded / 12.92,
        ((encoded + 0.055) / 1.055) ** 2.4,
    )
    y = linear[..., 0] * 0.2126 + linear[..., 1] * 0.7152 + linear[..., 2] * 0.0722
    yr = y / 1.0
    pivot = np.where(yr > 216 / 24389, np.cbrt(yr), (24389 / 27 * yr + 16) / 116)
    return 116 * pivot - 16


def _boundary(binary: npt.NDArray[np.bool_]) -> npt.NDArray[np.bool_]:
    edges = np.zeros(binary.shape, dtype=np.bool_)
    if binary.shape[0] > 1:
        edges[1:, :] |= binary[1:, :] != binary[:-1, :]
        edges[:-1, :] |= binary[1:, :] != binary[:-1, :]
    if binary.shape[1] > 1:
        edges[:, 1:] |= binary[:, 1:] != binary[:, :-1]
        edges[:, :-1] |= binary[:, 1:] != binary[:, :-1]
    return edges & binary


def measure_protection(
    original: ImageFrame,
    edited: ImageFrame,
    evidence: tuple[MaskEvidence, ...],
    *,
    required: tuple[MaskKind, ...] = (),
    rows_per_chunk: int = 128,
) -> ProtectionReport:
    """Measure chosen regions in bounded row chunks and refuse invalid masks."""
    if not isinstance(original, ImageFrame) or not isinstance(edited, ImageFrame):
        raise CommandValidationError("invalid_quality_frame", "Frames must be validated.")
    if not original.same_layout(edited):
        raise CommandValidationError("invalid_quality_frame", "Align resolution before comparing.")
    if type(rows_per_chunk) is not int or not 1 <= rows_per_chunk <= 2048:
        raise CommandValidationError("invalid_chunk", "Chunk size must be bounded.")
    if not isinstance(evidence, tuple) or any(not isinstance(entry, MaskEvidence) for entry in evidence):
        raise CommandValidationError("invalid_mask", "Mask evidence must be a typed tuple.")
    if len(evidence) > 16:
        raise CommandValidationError("invalid_mask", "Too many protection masks.")
    if any(item not in ("face", "skin", "eyes", "hair", "person", "protected") for item in required):
        raise CommandValidationError("invalid_mask", "Required mask category is not known.")
    kinds = [item.kind for item in evidence]
    if len(set(kinds)) != len(kinds):
        raise CommandValidationError("invalid_mask", "Each checked category must be unique.")
    if any(entry.width != original.width or entry.height != original.height for entry in evidence):
        raise CommandValidationError("invalid_mask", "Mask must match rendered image geometry.")
    missing = tuple(kind for kind in required if kind not in kinds)
    source = np.frombuffer(original.pixels, dtype=np.uint8).reshape(
        original.height, original.width, original.channels,
    )
    target = np.frombuffer(edited.pixels, dtype=np.uint8).reshape(
        edited.height, edited.width, edited.channels,
    )
    readings: list[ProtectionReading] = []
    for item in evidence:
        coverage = np.frombuffer(item.alpha, dtype=np.uint8).reshape(item.height, item.width)
        eligible = 0
        changed = 0
        rgb_delta_sum = 0.0
        max_delta = 0
        boundary_delta = 0
        max_lstar_rise = -math.inf
        alpha_mismatch = 0
        for begin in range(0, original.height, rows_per_chunk):
            end = min(original.height, begin + rows_per_chunk)
            weights = coverage[begin:end, :] > 0
            if not np.any(weights):
                continue
            first = source[begin:end, :, :3]
            second = target[begin:end, :, :3]
            differences = np.abs(first.astype(np.int16) - second.astype(np.int16))
            changed_rgb = np.any(differences != 0, axis=2)
            changed += int(np.count_nonzero(changed_rgb & weights))
            eligible += int(np.count_nonzero(weights))
            per_pixel = np.max(differences, axis=2)
            rgb_delta_sum += float(np.sum(per_pixel[weights], dtype=np.float64))
            max_delta = max(max_delta, int(np.max(per_pixel[weights])))
            extended = coverage[max(0, begin - 1):min(original.height, end + 1), :] > 0
            rim = _boundary(extended)
            offset = begin - max(0, begin - 1)
            local_rim = rim[offset:offset + end - begin, :]
            if np.any(local_rim):
                boundary_delta = max(boundary_delta, int(np.max(per_pixel[local_rim])))
            if item.kind == "skin":
                before_lstar = _rgb_lstar(first.astype(np.float64))
                after_lstar = _rgb_lstar(second.astype(np.float64))
                max_lstar_rise = max(
                    max_lstar_rise,
                    float(np.max((after_lstar - before_lstar)[weights])),
                )
            if original.channels == 4:
                first_alpha = source[begin:end, :, 3]
                second_alpha = target[begin:end, :, 3]
                alpha_mismatch += int(np.count_nonzero((first_alpha != second_alpha) & weights))
        readings.append(
            ProtectionReading(
                item.kind, eligible, changed,
                (rgb_delta_sum / eligible) if eligible else None,
                max_delta if eligible else None,
                boundary_delta if eligible else None,
                max_lstar_rise if item.kind == "skin" and eligible else None,
                alpha_mismatch, item.checked_by_user,
            )
        )
    return ProtectionReport(
        original.width, original.height, tuple(readings), missing,
        len(missing) == 0 and all(
            entry.reference_checked and entry.eligible_pixels > 0 for entry in readings
        ),
    )
