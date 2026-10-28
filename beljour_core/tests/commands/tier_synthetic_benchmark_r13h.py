"""Operator-run, fully synthetic guarded tier latency probe; never release evidence.

No measured value is hard-coded. Run only on a configured local development
machine to populate a photo-free incomplete Tuesday tier supplement.
Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from plumb_api.commands.embedders import DeterministicTestEmbedder, EmbedderEvidence
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.neutral_resize import resize_neutral_tiled
from plumb_api.commands.quality_tier_matrix import (
    build_tier_matrix,
    observation_from_runs,
)
from plumb_api.commands.quality_tiers import (
    QualityTierRecipe,
    run_quality_tier,
)
from plumb_api.commands.r2h_session import R2HSession
from plumb_api.commands.tuesday_lock import build_tuesday_lock_packet


@dataclass(frozen=True, slots=True)
class SyntheticGeometryEmbedder:
    """Checks only test-grid bytes. It cannot recognize real individuals."""

    @property
    def evidence(self) -> EmbedderEvidence:
        return DeterministicTestEmbedder().evidence

    def embed(self, frame: ImageFrame) -> tuple[float, ...]:
        source = frame.pixels
        return (1.0, float(source[0] - source[-3]) / 255.0)


def _fast_reference(frame: ImageFrame, width: int, height: int) -> ImageFrame:
    if width % frame.width or height % frame.height:
        raise ValueError("Synthetic alignment requires integer enlargement.")
    scale = width // frame.width
    if scale != height // frame.height:
        raise ValueError("Synthetic alignment requires equal axis scaling.")
    return resize_neutral_tiled(frame, scale=scale, tile_size=256).image


def run_synthetic_tier_probe() -> dict[str, object]:
    """Measure two real guarded passes per tier, with toy identity evidence."""
    source = ImageFrame(960, 540, 3, bytes((126, 137, 148)) * (960 * 540))
    identity = IdentityGuard(
        SyntheticGeometryEmbedder(), allow_test_embedder=True,
        align_original=_fast_reference,
    )
    session = R2HSession(identity=identity, tile_size=256)
    session.open_photo(source)
    observations = []
    for tier in ("1080", "4k"):
        recipe = QualityTierRecipe(tier, DecimalLevel(10), DecimalLevel(10))
        preview = run_quality_tier(session, source, recipe, quality="preview")
        export = run_quality_tier(session, source, recipe, quality="export")
        expected = resize_neutral_tiled(
            source, scale=export.plan.upscale_factor, tile_size=256,
        ).image
        byte_exact = export.result.image.pixels == expected.pixels
        observed = observation_from_runs(
            preview, export, neutral_reference_exact=byte_exact,
        )
        observations.append(observed)
    original = build_tuesday_lock_packet(
        (), run_id="r13h-local-synthetic", renderer_build="r13h-local",
    ).to_json()
    new = build_tier_matrix(
        tuple(observations), original_tuesday_json=original,
        run_id="r13h-local-synthetic", renderer_build="r13h-local",
    )
    packet = json.loads(new)
    return {
        "version": "beljour-synthetic-tier-measurement/1",
        "measured_rows": [
            row for row in packet["rows"] if row["status"] != "missing"
        ],
        "tuesday_status": packet["status"],
        "missing_rows": sum(row["status"] == "missing" for row in packet["rows"]),
        "identity_model": "synthetic_test_only",
        "device_qualified": False,
        "release_qualified": False,
    }


if __name__ == "__main__":
    print(json.dumps(run_synthetic_tier_probe(), sort_keys=True, indent=2))
