"""Create-only, photo-free Tuesday quality-tier supplement for BELJOUR.

Keeps the unchanged 205-command dossier separate from the 82 tier slots,
binds both by digest, and refuses to label synthetic rows as production proof.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import statistics
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import cast

from .errors import CommandValidationError
from .quality_tier_matrix import tier_matrix_csv, verify_tier_matrix


@dataclass(frozen=True, slots=True)
class QualityTierDossier:
    run_id: str
    renderer_build: str
    tier_json: str
    tier_csv: str
    reviewer_markdown: str
    manifest_json: str

    def files(self) -> dict[str, str]:
        return {
            "quality-tiers.json": self.tier_json + "\n",
            "quality-tiers.csv": self.tier_csv,
            "quality-tiers-review.md": self.reviewer_markdown,
            "quality-tiers-manifest.json": self.manifest_json + "\n",
        }


def _row_values(rows: list[dict[str, object]], tier: str) -> dict[str, object]:
    part = [row for row in rows if row["tier"] == tier]
    observed = [row for row in part if row["status"] != "missing"]
    preview = [float(cast(float, row["preview_ms"])) for row in observed]
    exported = [float(cast(float, row["export_ms"])) for row in observed]
    return {
        "total": len(part),
        "observed": len(observed),
        "missing": len(part) - len(observed),
        "failed": sum(row["status"] == "failed_safety" for row in observed),
        "slow": sum(row["status"] == "over_budget" for row in observed),
        "device": sum(row["status"] == "device_checked" for row in observed),
        "preview_median": statistics.median(preview) if preview else None,
        "export_median": statistics.median(exported) if exported else None,
    }


def _format_time(value: object) -> str:
    return "Not measured" if value is None else f"{float(cast(float, value)):.2f}"


def render_tier_reviewer_sheet(
    tier_json: str, *, original_tuesday_json: str,
) -> str:
    report = verify_tier_matrix(tier_json, original_tuesday_json=original_tuesday_json)
    rows = cast(list[dict[str, object]], report["rows"])
    lines = [
        "# BELJOUR — Tuesday Quality Generator tier supplement",
        "",
        "Author: John Khan",
        f"Run: `{report['run_id']}` · renderer: `{report['renderer_build']}`",
        "",
        "## Tier contract",
        "",
        "1080: output long edge at least 1920 pixels. 4K: at least 3840 pixels.",
        "Source aspect ratio is preserved. /CLEANUP runs before /UPSCALE.",
        "Both steps must invoke the default-on identity guard.",
        "Unsupported 2×/4× source sizes fail visibly instead of downgrading.",
        "",
        "## Measured evidence (not release approval)",
        "",
        (
            "| Tier | Slots | Observed | Missing | Safety failed | Over budget | "
            "Device checked | Preview median ms | Export median ms |"
        ),
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for tier in ("1080", "4k"):
        summary = _row_values(rows, tier)
        lines.append(
            f"| {tier} | {summary['total']} | {summary['observed']} | "
            f"{summary['missing']} | {summary['failed']} | {summary['slow']} | "
            f"{summary['device']} | {_format_time(summary['preview_median'])} | "
            f"{_format_time(summary['export_median'])} |"
        )
    lines.extend([
        "",
        f"Technical status: **{report['status']}**.",
        "",
        "The original 205-command evidence remains unchanged. These are 82 additional slots.",
        "Production identity qualification: **NOT APPROVED**.",
        "Independent frozen 100,000-face release gate: **NOT RUN**.",
        "Synthetic or incomplete evidence is not a real-face result.",
        "",
    ])
    return "\n".join(lines)


def prepare_tier_dossier(
    tier_json: str, *, original_tuesday_json: str,
) -> QualityTierDossier:
    verified = verify_tier_matrix(tier_json, original_tuesday_json=original_tuesday_json)
    raw = {
        "quality-tiers.json": tier_json + "\n",
        "quality-tiers.csv": tier_matrix_csv(
            tier_json, original_tuesday_json=original_tuesday_json,
        ),
        "quality-tiers-review.md": render_tier_reviewer_sheet(
            tier_json, original_tuesday_json=original_tuesday_json,
        ),
    }
    checksums = {
        name: hashlib.sha256(value.encode("utf-8")).hexdigest()
        for name, value in sorted(raw.items())
    }
    manifest: dict[str, object] = {
        "version": "beljour-quality-tiers-export/1",
        "run_id": verified["run_id"],
        "renderer_build": verified["renderer_build"],
        "original_tuesday_sha256": verified["original_tuesday_sha256"],
        "supplemental_slots": 82,
        "original_command_slots": 205,
        "technical_status": verified["status"],
        "files_sha256": checksums,
        "production_identity_qualified": False,
        "release_qualified": False,
        "author": "John Khan",
    }
    return QualityTierDossier(
        cast(str, verified["run_id"]),
        cast(str, verified["renderer_build"]),
        tier_json,
        raw["quality-tiers.csv"],
        raw["quality-tiers-review.md"],
        json.dumps(manifest, sort_keys=True, separators=(",", ":")),
    )


def write_tier_dossier(
    dossier: QualityTierDossier,
    parent: Path,
    *,
    original_tuesday_json: str,
) -> Path:
    """Atomic create-only export; never modifies an existing evidence directory."""
    if not isinstance(dossier, QualityTierDossier) or not isinstance(parent, Path):
        raise CommandValidationError(
            "invalid_tier_export", "A checked tier dossier and path are required.",
        )
    if not parent.is_dir() or parent.is_symlink():
        raise CommandValidationError(
            "invalid_tier_export", "An existing ordinary directory is required.",
        )
    regenerated = prepare_tier_dossier(
        dossier.tier_json, original_tuesday_json=original_tuesday_json,
    )
    if regenerated != dossier:
        raise CommandValidationError(
            "invalid_tier_export", "Tier dossier was modified after validation.",
        )
    destination = parent / f"{dossier.run_id}-{dossier.renderer_build}-tiers"
    if destination.exists() or destination.is_symlink():
        raise CommandValidationError(
            "tier_export_exists", "Tier dossier already exists for this run.",
        )
    staging = Path(tempfile.mkdtemp(dir=parent, prefix=".beljour-quality-tier-"))
    try:
        for filename, contents in dossier.files().items():
            output = staging / filename
            output.write_text(contents, encoding="utf-8", newline="\n")
            output.chmod(0o600)
        staging.rename(destination)
    finally:
        if staging.exists():
            shutil.rmtree(staging)
    return destination
