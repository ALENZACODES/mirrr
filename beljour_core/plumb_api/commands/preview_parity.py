"""Preview-to-export comparison for a single, identical guarded Pro plan.

A preview may use a smaller image or cheaper kernels. We measure that drift on
actual output bytes instead of assuming a visually identical result. Reports
contain aggregates only and cannot authorize a frozen-face release.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

import numpy as np

from .errors import CommandValidationError
from .frames import ImageFrame, resize_reference
from .guarded import ProExecutionResult

ParityOutcome = Literal["measured", "needs_review", "blocked"]


@dataclass(frozen=True, slots=True)
class PreviewParityReport:
    plan_fingerprint: str
    status: ParityOutcome
    preview_width: int
    preview_height: int
    export_width: int
    export_height: int
    mean_error: float | None
    maximum_error: int | None
    changed_pixel_fraction: float | None
    alpha_mismatch_pixels: int
    reason_codes: tuple[str, ...]
    realface_pass: Literal[False] = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": "beljour-pro-preview-parity/1",
            "plan_fingerprint": self.plan_fingerprint,
            "status": self.status,
            "preview_width": self.preview_width,
            "preview_height": self.preview_height,
            "export_width": self.export_width,
            "export_height": self.export_height,
            "mean_error": self.mean_error,
            "maximum_error": self.maximum_error,
            "changed_pixel_fraction": self.changed_pixel_fraction,
            "alpha_mismatch_pixels": self.alpha_mismatch_pixels,
            "reason_codes": list(self.reason_codes),
            "realface_pass": False,
        }


def _comparison_image(export: ImageFrame, preview: ImageFrame) -> ImageFrame:
    if export.channels != preview.channels:
        raise CommandValidationError("invalid_parity", "Render channels must be identical.")
    if export.width * preview.height != preview.width * export.height:
        raise CommandValidationError("invalid_parity", "Preview and export aspect ratios differ.")
    if export.width < preview.width or export.height < preview.height:
        raise CommandValidationError("invalid_parity", "Preview cannot exceed the full render.")
    return resize_reference(export, preview.width, preview.height)


def compare_render_paths(
    preview: ProExecutionResult,
    exported: ProExecutionResult,
    *,
    review_mean_delta: float = 3.0,
    review_max_delta: int = 32,
    rows_per_chunk: int = 128,
) -> PreviewParityReport:
    """Review against explicit engineering tolerances, never real-face PASS."""
    if not isinstance(preview, ProExecutionResult) or not isinstance(exported, ProExecutionResult):
        raise CommandValidationError("invalid_parity", "Two guarded render results are required.")
    if (
        type(rows_per_chunk) is not int
        or not 1 <= rows_per_chunk <= 2048
        or not math.isfinite(review_mean_delta)
        or not 0 <= review_mean_delta <= 255
        or type(review_max_delta) is not int
        or not 0 <= review_max_delta <= 255
    ):
        raise CommandValidationError("invalid_parity", "Review settings are not bounded.")
    if preview.timing.quality != "preview" or exported.timing.quality != "export":
        raise CommandValidationError("invalid_parity", "Render quality labels do not agree.")
    if preview.plan.fingerprint() != exported.plan.fingerprint():
        raise CommandValidationError("invalid_parity", "Both outputs must share one exact plan.")
    if len(preview.steps) != len(exported.steps) or any(
        a.command is not b.command or a.level != b.level
        for a, b in zip(preview.steps, exported.steps, strict=True)
    ):
        raise CommandValidationError("invalid_parity", "Command ordering changed between renders.")
    low = preview.image
    full = exported.image
    aligned = _comparison_image(full, low)
    before = np.frombuffer(low.pixels, dtype=np.uint8).reshape(low.height, low.width, low.channels)
    after = np.frombuffer(aligned.pixels, dtype=np.uint8).reshape(low.height, low.width, low.channels)
    total_error = 0.0
    compared = 0
    max_error = 0
    changed = 0
    alpha_changes = 0
    for start in range(0, low.height, rows_per_chunk):
        stop = min(low.height, start + rows_per_chunk)
        src = before[start:stop, :, :3]
        dst = after[start:stop, :, :3]
        delta = np.abs(src.astype(np.int16) - dst.astype(np.int16))
        total_error += float(np.sum(delta, dtype=np.float64))
        compared += delta.size
        max_error = max(max_error, int(np.max(delta)))
        changed += int(np.count_nonzero(np.any(delta > 0, axis=2)))
        if low.channels == 4:
            alpha_changes += int(np.count_nonzero(
                before[start:stop, :, 3] != after[start:stop, :, 3]
            ))
    mean = total_error / compared
    reasons: list[str] = []
    if mean > review_mean_delta:
        reasons.append("mean_preview_drift")
    if max_error > review_max_delta:
        reasons.append("peak_preview_drift")
    if alpha_changes:
        reasons.append("alpha_preview_drift")
    if any(item.identity is None for item in (*preview.steps, *exported.steps)):
        reasons.append("identity_evidence_missing")
    if any(
        item.identity is not None and item.identity.synthetic_evidence
        for item in (*preview.steps, *exported.steps)
    ):
        reasons.append("synthetic_only")
    status: ParityOutcome = "needs_review" if reasons else "measured"
    return PreviewParityReport(
        preview.plan.fingerprint(), status, low.width, low.height,
        full.width, full.height, mean, max_error,
        changed / (low.width * low.height), alpha_changes, tuple(reasons),
    )
