"""Photo-scoped local pose-only warp with explicit checked human controls.

The body mask and every displacement are supplied by the caller. No hidden
anatomy is hallucinated. Face/protected pixels and original alpha are pinned.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter

import numpy as np

from .errors import CommandUnavailable, CommandValidationError
from .frames import ImageFrame
from .levels import DecimalLevel
from .pose_field import PreparedPoseField, prepare_pose_field
from .pose_geometry import PoseEvidence, displacement, edge_weight, pose_dose, sample_rgb
from .pose_safety import PoseSafetyDecision, choose_pose_dose
from .regions import PhotoRegionCache


@dataclass(frozen=True, slots=True)
class PoseReport:
    level: str
    elapsed_ms: float
    preview: bool
    changed_pixels: int
    tile_count: int
    peak_working_bytes: int
    largest_displacement_px: float
    protected_unchanged: bool
    alpha_unchanged: bool
    evidence: str | None
    fold_minimum: float | None = None
    fold_retention: float = 1.0
    field_cache_hit: bool = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "level": self.level,
            "elapsed_ms": round(self.elapsed_ms, 3),
            "preview": self.preview,
            "changed_pixels": self.changed_pixels,
            "tile_count": self.tile_count,
            "peak_working_bytes": self.peak_working_bytes,
            "largest_displacement_px": round(self.largest_displacement_px, 4),
            "protected_unchanged": self.protected_unchanged,
            "alpha_unchanged": self.alpha_unchanged,
            "evidence": self.evidence,
            "fold_minimum": self.fold_minimum,
            "fold_retention": self.fold_retention,
            "field_cache_hit": self.field_cache_hit,
            "realface_verified": False,
        }


class PoseOnlyProcessor:
    """CPU deterministic inverse displacement; refuse when body data are absent."""

    def __init__(self, regions: PhotoRegionCache | None = None, *, tile_size: int = 96) -> None:
        if type(tile_size) is not int or not 16 <= tile_size <= 384:
            raise CommandValidationError("invalid_tiles", "Pose tile size must be 16 to 384.")
        self._regions = regions
        self._tile_size = tile_size
        self._evidence: PoseEvidence | None = None
        self._last: PoseReport | None = None
        self._safety: dict[int, PoseSafetyDecision] = {}
        self._prepared: PreparedPoseField | None = None

    def open_photo(self, frame: ImageFrame, evidence: PoseEvidence | None) -> None:
        if not isinstance(frame, ImageFrame):
            raise CommandValidationError("invalid_frame", "Pose needs a valid photo.")
        if evidence is not None and not isinstance(evidence, PoseEvidence):
            raise CommandValidationError("invalid_pose", "Pose evidence must be a checked record.")
        if evidence is not None and (evidence.width, evidence.height) != (frame.width, frame.height):
            raise CommandValidationError("invalid_pose", "Pose evidence must belong to the open photo.")
        self._evidence = evidence
        self._last = None
        self._safety.clear()
        self._prepared = None

    def close_photo(self) -> None:
        self._evidence = None
        self._last = None
        self._safety.clear()
        self._prepared = None

    @property
    def last_report(self) -> PoseReport | None:
        return self._last

    def render(self, frame: ImageFrame, *, level: DecimalLevel, preview: bool) -> ImageFrame:
        started = perf_counter()
        if not isinstance(frame, ImageFrame):
            raise CommandValidationError("invalid_frame", "Pose rendering needs a checked frame.")
        if type(preview) is not bool:
            raise CommandValidationError("invalid_quality", "Pose preview flag must be boolean.")
        dose = pose_dose(level)
        if dose == 0.0:
            self._last = PoseReport(level.label, (perf_counter() - started) * 1000.0,
                                    preview, 0, 0, 0, 0.0, True, True, None)
            return frame
        evidence = self._evidence
        if evidence is None:
            raise CommandUnavailable(
                "pose_evidence_missing", "Pose needs checked full-body controls and mask.",
            )
        if (frame.width, frame.height) != (evidence.width, evidence.height):
            raise CommandUnavailable(
                "pose_image_changed", "Pose controls do not belong to this image geometry.",
            )
        guard = self._safety.get(level.tenths)
        if guard is None:
            guard = choose_pose_dose(evidence, dose)
            self._safety[level.tenths] = guard
        used_dose = guard.used_dose
        cache_hit = self._prepared is not None
        if self._prepared is None:
            self._prepared = prepare_pose_field(evidence)
        raw = np.frombuffer(frame.pixels, dtype=np.uint8).reshape(
            frame.height, frame.width, frame.channels,
        )
        person = np.frombuffer(evidence.body_mask, dtype=np.uint8).reshape(frame.height, frame.width)
        eyes = (
            self._regions.mask("eyes", frame.width, frame.height)
            if self._regions is not None else None
        )
        skin = (
            self._regions.mask("skin", frame.width, frame.height)
            if self._regions is not None else None
        )
        protected = (
            self._regions.mask("protected", frame.width, frame.height)
            if self._regions is not None else None
        )
        output = bytearray(frame.pixels)
        result = np.frombuffer(output, dtype=np.uint8).reshape(frame.height, frame.width, frame.channels)
        count = 0
        changed = 0
        peak = 0
        largest = 0.0
        safe = True
        for y0 in range(0, frame.height, self._tile_size):
            y1 = min(y0 + self._tile_size, frame.height)
            for x0 in range(0, frame.width, self._tile_size):
                x1 = min(x0 + self._tile_size, frame.width)
                yy, xx = np.mgrid[y0:y1, x0:x1]
                grid_x = np.asarray(xx, dtype=np.float64)
                grid_y = np.asarray(yy, dtype=np.float64)
                if self._prepared is not None:
                    dx, dy = self._prepared.tile(y0, y1, x0, x1, used_dose)
                else:
                    dx, dy = displacement(evidence, grid_x, grid_y, used_dose)
                weights = edge_weight(person, y0, y1, x0, x1)
                # Every positively annotated face/eye/protected pixel is pinned.
                # A one-byte antialiased edge must not receive a near-full warp.
                if eyes is not None:
                    weights = np.where(eyes[y0:y1, x0:x1] > 0.0, 0.0, weights)
                if skin is not None:
                    weights = np.where(skin[y0:y1, x0:x1] > 0.0, 0.0, weights)
                if protected is not None:
                    weights = np.where(protected[y0:y1, x0:x1] > 0.0, 0.0, weights)
                weights = np.clip(weights, 0.0, 1.0)
                if not np.any(weights > 0.0):
                    count += 1
                    continue
                moved = sample_rgb(raw, grid_x - dx, grid_y - dy)
                original = np.asarray(raw[y0:y1, x0:x1, :3], dtype=np.float64)
                adjusted = original + (moved - original) * weights[:, :, None]
                rounded = np.floor(np.clip(adjusted, 0.0, 255.0) + 0.5).astype(np.uint8)
                result[y0:y1, x0:x1, :3] = rounded
                changed += int(np.count_nonzero(np.any(rounded != raw[y0:y1, x0:x1, :3], axis=2)))
                largest = max(largest, float(np.max(np.hypot(dx * weights, dy * weights))))
                if protected is not None:
                    keep = protected[y0:y1, x0:x1] > 0.0
                    if np.any(keep):
                        safe = safe and bool(np.all(rounded[keep] == raw[y0:y1, x0:x1, :3][keep]))
                peak = max(peak, moved.nbytes + adjusted.nbytes + rounded.nbytes + dx.nbytes + dy.nbytes)
                count += 1
        edited = ImageFrame(frame.width, frame.height, frame.channels, bytes(output))
        alpha_ok = frame.channels == 3 or frame.pixels[3::4] == edited.pixels[3::4]
        self._last = PoseReport(level.label, (perf_counter() - started) * 1000.0,
                                preview, changed, count, peak, largest, safe, alpha_ok,
                                evidence.evidence, guard.smallest_determinant, guard.retention,
                                cache_hit)
        return edited
