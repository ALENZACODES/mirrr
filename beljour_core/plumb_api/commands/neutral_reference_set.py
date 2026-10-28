"""Reproducible, image-free before/after neutral upscale regression dossier.

A former 1.0 upscale used cubic sampling while its independently checked
reference used bilinear. Reproduce that earlier cubic path without changing
its current higher-level behaviour, and compare the fixed 1.0 delivered output.
Synthetic pixels are generated in memory; only measurements are returned.
Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from .errors import CommandValidationError
from .frames import ChannelCount, ImageFrame, resize_reference
from .levels import DecimalLevel
from .upscale import UpscaleProcessor
from .upscale_claims import PixelDifference, UpscalePixelClaim, evaluate_upscale_claim

CaseKind = Literal["uniform", "checker", "gradient", "edge", "alpha_corner", "ramp"]
REGRESSION_VERSION = "beljour-neutral-upscale-regression/1"
_CASE_SHAPES: tuple[tuple[int, int, ChannelCount, CaseKind], ...] = (
    (1, 1, 3, "uniform"),
    (8, 7, 3, "checker"),
    (19, 13, 3, "gradient"),
    (47, 31, 4, "alpha_corner"),
    (32, 17, 4, "edge"),
    (63, 44, 3, "ramp"),
    (73, 37, 4, "gradient"),
    (29, 38, 4, "checker"),
)


@dataclass(frozen=True, slots=True)
class RegressionCase:
    index: int
    kind: CaseKind
    source_width: int
    source_height: int
    channels: int
    scale: int
    before: PixelDifference
    after: UpscalePixelClaim

    def public_metadata(self) -> dict[str, object]:
        return {
            "case": self.index,
            "pattern": self.kind,
            "source_size": [self.source_width, self.source_height],
            "channels": self.channels,
            "factor": self.scale,
            "before": self.before.public_metadata(),
            "after": self.after.public_metadata(),
        }


@dataclass(frozen=True, slots=True)
class RegressionSummary:
    cases: tuple[RegressionCase, ...]
    before_mismatch_cases: int
    after_mismatch_cases: int
    before_different_bytes: int
    after_different_bytes: int
    checked_bytes: int

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": REGRESSION_VERSION,
            "reference_algorithm": "clamped_pixel_center_straight_channel_bilinear",
            "old_algorithm": "keys_cubic_sampling_at_neutral_level",
            "fixed_algorithm": "tiled_float64_bilinear_with_half_up_rounding",
            "pairs": len(self.cases),
            "before_mismatch_cases": self.before_mismatch_cases,
            "after_mismatch_cases": self.after_mismatch_cases,
            "before_different_bytes": self.before_different_bytes,
            "after_different_bytes": self.after_different_bytes,
            "checked_bytes": self.checked_bytes,
            "cases": [case.public_metadata() for case in self.cases],
            "data_source": "generated_synthetic_only",
            "external_reference_set": "NOT_RUN",
            "identity_model_approved": False,
            "release_authorized": False,
        }


def synthetic_pair_frame(
    width: int,
    height: int,
    channels: ChannelCount,
    kind: CaseKind,
) -> ImageFrame:
    """Draw distinct in-memory failure patterns without using photographs."""
    if not 1 <= width <= 256 or not 1 <= height <= 256 or channels not in (3, 4):
        raise CommandValidationError("invalid_synthetic_case", "Synthetic dimensions are invalid.")
    pixels = bytearray(width * height * channels)
    for y in range(height):
        for x in range(width):
            if kind == "uniform":
                value = 87
            elif kind == "checker":
                value = 255 if (x // 2 + y // 3) % 2 else 0
            elif kind == "gradient":
                value = (x * 11 + y * 17 + 37) % 256
            elif kind == "edge":
                value = 215 if x * 2 >= width else 24
            elif kind == "alpha_corner":
                value = 245 if (x < width // 2 and y < height // 2) else 10
            elif kind == "ramp":
                value = (x * 37 + y * 5) % 256
            else:
                raise CommandValidationError("invalid_synthetic_case", "Unknown synthetic case.")
            offset = (y * width + x) * channels
            pixels[offset] = value
            pixels[offset + 1] = (value * 3 + 17) % 256
            pixels[offset + 2] = (value * 7 + 9) % 256
            if channels == 4:
                pixels[offset + 3] = (x * 13 + y * 19 + 29) % 256
    if kind == "alpha_corner" and channels == 4:
        pixels[:4] = bytes((255, 0, 255, 0))
        pixels[-4:] = bytes((7, 210, 43, 255))
    return ImageFrame(width, height, channels, bytes(pixels))


def evaluate_reference_set(tile_size: int = 17) -> RegressionSummary:
    """Exercise actual engine paths before and after the level-1.0 correction.

    The before side invokes the still-supported cubic path without face detail.
    Its interpolation is the former neutral behaviour, not an unrelated filter.
    """
    cases: list[RegressionCase] = []
    before_misses = 0
    after_misses = 0
    before_bytes = 0
    after_bytes = 0
    compared = 0
    for index, (width, height, channels, kind) in enumerate(_CASE_SHAPES):
        source = synthetic_pair_frame(width, height, channels, kind)
        original_bytes = source.pixels
        for factor in (2, 4):
            engine = UpscaleProcessor(tile_size=tile_size)
            prior_cubic = engine.render(
                source, scale=factor, dose=0.6, preview=False, neutral_detail=True,
            )
            final = engine.render(source, scale=factor, dose=0.2, preview=False)
            reference = resize_reference(source, width * factor, height * factor)
            before_claim = evaluate_upscale_claim(
                source, prior_cubic, level=DecimalLevel(10), factor=factor, preview=False,
            )
            after_claim = evaluate_upscale_claim(
                source, final, level=DecimalLevel(10), factor=factor, preview=False,
            )
            if before_claim.comparison.compared_bytes != len(reference.pixels):
                raise CommandValidationError(
                    "reference_bytes_invalid", "Reference byte length changed.",
                )
            if source.pixels != original_bytes:
                raise CommandValidationError("source_mutated", "Reference fixture was modified.")
            before = before_claim.comparison
            cases.append(RegressionCase(
                index, kind, width, height, channels, factor, before, after_claim,
            ))
            before_misses += int(before.different_bytes > 0)
            after_misses += int(not after_claim.pixel_exact)
            before_bytes += before.different_bytes
            after_bytes += after_claim.comparison.different_bytes
            compared += before.compared_bytes
    return RegressionSummary(
        tuple(cases), before_misses, after_misses,
        before_bytes, after_bytes, compared,
    )


def render_regression_markdown(summary: RegressionSummary) -> str:
    rows = [
        "# BELJOUR /UPSCALE neutral reference: paired regression",
        "",
        f"Compared output bytes: **{summary.checked_bytes}**",
        f"Before correction: **{summary.before_mismatch_cases}/{len(summary.cases)}** "
        f"cases differed, **{summary.before_different_bytes}** bytes differed.",
        f"After correction: **{summary.after_mismatch_cases}/{len(summary.cases)}** "
        f"cases differed, **{summary.after_different_bytes}** bytes differed.",
        "",
        "| Pattern | Source | Channels | Scale | Before differing | After differing | "
        "Before max delta | After max delta |",
        "|---|---|---:|---:|---:|---:|---:|---:|",
    ]
    for case in summary.cases:
        rows.append(
            f"| {case.kind} | {case.source_width}×{case.source_height} | "
            f"{case.channels} | {case.scale}× | {case.before.different_bytes} | "
            f"{case.after.comparison.different_bytes} | {case.before.max_delta} | "
            f"{case.after.comparison.max_delta} |"
        )
    rows.extend((
        "",
        "## Scope and evidence",
        "",
        "The earlier neutral path sampled the input using Keys cubic interpolation, "
        "while the checked independent resize used bilinear interpolation.",
        "The current neutral path uses the independent reference's clamped "
        "pixel-centre coordinates, float64 arithmetic and half-up byte rounding.",
        "Higher levels deliberately retain the cubic sampler. A mandatory "
        "/CLEANUP pre-step changes which image is the upscale input; the claim "
        "must be checked against that actual intermediate image.",
        "",
        "PSNR is infinite for byte-identical pairs. The reported 8×8 "
        "SSIM is a diagnostic of sampled RGB windows, not an external quality gate.",
        "Generated colour grids only. Authorized paired real-face fixtures "
        "and independent identity qualification: **NOT RUN**.",
        "No fidelity, reconstruction, face-quality, or release claim is made.",
    ))
    return "\n".join(rows) + "\n"


def export_regression_summary(folder: Path, summary: RegressionSummary) -> tuple[Path, Path]:
    """Create two photo-free reports; never overwrite a previous evidence set."""
    if not isinstance(folder, Path) or not folder.is_dir() or folder.is_symlink():
        raise CommandValidationError("invalid_evidence_folder", "Use a local existing directory.")
    json_path = folder / "neutral-pixel-diff.json"
    markdown_path = folder / "neutral-pixel-diff.md"
    if json_path.exists() or markdown_path.exists():
        raise CommandValidationError("evidence_exists", "Existing evidence cannot be overwritten.")
    payload = json.dumps(summary.public_metadata(), sort_keys=True, indent=2) + "\n"
    json_path.write_text(payload, encoding="utf-8")
    markdown_path.write_text(render_regression_markdown(summary), encoding="utf-8")
    return json_path, markdown_path
