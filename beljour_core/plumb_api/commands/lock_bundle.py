"""Create-only Tuesday lock dossier combining 205 command and 82 tier slots.

The dossier is entirely photo-free. It only validates and organizes supplied
measurements; synthetic evidence and device measurements cannot independently
approve an identity model or the real-face release gate.
Author: John Khan.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import cast

from .errors import CommandValidationError
from .lock_readiness import TuesdayReadiness, assess_tuesday_readiness
from .quality_tier_matrix import tier_matrix_csv
from .studio_pose_annex import build_studio_pose_annex, verify_studio_pose_annex
from .tuesday_export import CSV_COLUMNS

PACK_VERSION = "beljour-tuesday-lock-pack/1"


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _json(data: dict[str, object]) -> str:
    return json.dumps(
        data, sort_keys=True, ensure_ascii=True, allow_nan=False, separators=(",", ":"),
    )


def _command_csv(command_json: str) -> str:
    document = json.loads(command_json)
    rows = cast(list[dict[str, object]], document["rows"])
    output = io.StringIO(newline="")
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(CSV_COLUMNS)
    for row in rows:
        writer.writerow(["" if row[field] is None else row[field] for field in CSV_COLUMNS])
    return output.getvalue()


def _gap_csv(report: TuesdayReadiness) -> str:
    output = io.StringIO(newline="")
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(("scope", "level", "reason"))
    for item in report.gaps:
        writer.writerow((item.scope, f"{item.level_tenths / 10:.1f}", item.reason))
    return output.getvalue()


def _review(report: TuesdayReadiness) -> str:
    lines = [
        "# BELJOUR | Tuesday technical lock review",
        "",
        "Author: John Khan",
        f"Run: `{report.run_id}`; renderer: `{report.renderer_build}`",
        "",
        "## Evidence contract",
        "",
        "Five commands at 41 strengths each, plus 1080 and 4K at 41 strengths each.",
        "Every command uses Identity Lock by default. /CLEANUP precedes tier /UPSCALE.",
        "1080 requires a 1920px long edge; 4K requires a 3840px long edge.",
        "The STUDIO reference uses a soft key, gentle sculpting, preserved texture and true colour.",
        "POSEONLY must preserve protected face pixels and satisfy the pose fold guard.",
        "",
        "## Current measurement coverage",
        "",
        "| Scope | Slots | Observed | Device | Missing | Safety | Timing | Status |",
        "|---|---:|---:|---:|---:|---:|---:|---|",
    ]
    for scope in report.scopes:
        lines.append(
            f"| {scope.scope} | {scope.slots} | {scope.observed} | "
            f"{scope.device} | {scope.missing} | {scope.failed_safety} | "
            f"{scope.over_budget} | {scope.status} |"
        )
    lines.extend([
        "",
        f"**Technical preflight: {report.status.upper().replace('_', ' ')}.**",
        "",
        "This is an operator-ready evidence layout, not release approval.",
        "The SHA-256 checksums detect file damage, not authentic model or consent provenance.",
        "Production identity model: NOT APPROVED.",
        "Independent 100,000-face qualification: NOT RUN.",
        "Device performance across all 287 slots: NOT COMPLETE unless every device row is measured.",
        "",
        "## Before Tuesday's lock",
        "",
        "1. Run each missing level on the frozen renderer build and original photo session.",
        "2. Retain measured preview/export latencies and per-edit identity decisions.",
        "3. Check STUDIO skin lightness, colour, texture, protected pixels and alpha.",
        "4. Check POSEONLY fold minima, applied retention and face immutability.",
        "5. Keep 1080 and 4K timing separate, and do not conceal 4K preview misses.",
        "6. Obtain the independent real-face verdict; never infer it from this packet.",
        "",
        "See `action-gaps.csv` for each missing, failed, late or device-unmeasured slot.",
        "",
    ])
    return "\n".join(lines)


@dataclass(frozen=True, slots=True)
class TuesdayLockBundle:
    run_id: str
    renderer_build: str
    contents: tuple[tuple[str, str], ...]
    manifest_json: str

    def files(self) -> dict[str, str]:
        return {**dict(self.contents), "manifest.json": self.manifest_json + "\n"}

    def validate(self) -> TuesdayReadiness:
        """Regenerate every output to detect any post-creation editing."""
        parts = dict(self.contents)
        if set(parts) != {
            "command-lock.json", "tier-lock.json", "command-matrix.csv",
            "tier-matrix.csv", "studio-pose-annex.json", "action-gaps.csv", "review.md",
        }:
            raise CommandValidationError("invalid_lock_bundle", "Lock bundle file set changed.")
        regenerated = prepare_tuesday_lock_bundle(
            parts["command-lock.json"].removesuffix("\n"),
            parts["tier-lock.json"].removesuffix("\n"),
            studio_pose_json=parts["studio-pose-annex.json"].removesuffix("\n"),
        )
        if regenerated != self:
            raise CommandValidationError("invalid_lock_bundle", "The lock bundle was modified.")
        return assess_tuesday_readiness(
            parts["command-lock.json"].removesuffix("\n"),
            parts["tier-lock.json"].removesuffix("\n"),
        )


def prepare_tuesday_lock_bundle(
    command_json: str,
    tier_json: str,
    *,
    studio_pose_json: str | None = None,
) -> TuesdayLockBundle:
    """Reverify both packets, then create complete, unapproved review artifacts."""
    report = assess_tuesday_readiness(command_json, tier_json)
    annex = (
        studio_pose_json if studio_pose_json is not None
        else build_studio_pose_annex(command_json)
    )
    validated_annex = verify_studio_pose_annex(annex, command_json=command_json)
    files = {
        "command-lock.json": command_json + "\n",
        "tier-lock.json": tier_json + "\n",
        "studio-pose-annex.json": annex + "\n",
        "command-matrix.csv": _command_csv(command_json),
        "tier-matrix.csv": tier_matrix_csv(tier_json, original_tuesday_json=command_json),
        "action-gaps.csv": _gap_csv(report),
        "review.md": _review(report),
    }
    checksums = {filename: _hash(body) for filename, body in sorted(files.items())}
    manifest = {
        "version": PACK_VERSION,
        "author": "John Khan",
        "run_id": report.run_id,
        "renderer_build": report.renderer_build,
        "command_sha256": report.command_sha256,
        "tier_sha256": report.tier_sha256,
        "command_slots": 205,
        "tier_slots": 82,
        "combined_slots": 287,
        "studio_pose_diagnostic_slots": 82,
        "studio_pose_diagnostics": validated_annex["diagnostic_count"],
        "studio_pose_sha256": validated_annex["sha256"],
        "observed": report.observed,
        "device_measured": report.device_measured,
        "open_actions": len(report.gaps),
        "technical_status": report.status,
        "files_sha256": checksums,
        "independent_realface_qualified": False,
        "production_identity_qualified": False,
        "release_qualified": False,
    }
    return TuesdayLockBundle(
        run_id=report.run_id,
        renderer_build=report.renderer_build,
        contents=tuple(sorted(files.items())),
        manifest_json=_json(manifest),
    )


def write_tuesday_lock_bundle(bundle: TuesdayLockBundle, parent: Path) -> Path:
    """Create a new private dossier, refusing symlinks and existing destinations.

    A manifest is written last so readers cannot mistake a partially written
    directory for a completed evidence export. Roll back failed writes.
    """
    if not isinstance(bundle, TuesdayLockBundle) or not isinstance(parent, Path):
        raise CommandValidationError("invalid_lock_bundle", "Checked lock bundle and path required.")
    if not parent.is_dir() or parent.is_symlink():
        raise CommandValidationError("invalid_lock_bundle", "An ordinary output directory is required.")
    bundle.validate()
    destination = parent / f"{bundle.run_id}-{bundle.renderer_build}-lock"
    try:
        destination.mkdir(mode=0o700, exist_ok=False)
    except FileExistsError as exc:
        raise CommandValidationError(
            "lock_bundle_exists", "Evidence for this run and build already exists.",
        ) from exc
    try:
        for filename, contents in bundle.files().items():
            path = destination / filename
            with path.open("x", encoding="utf-8", newline="\n") as stream:
                stream.write(contents)
            path.chmod(0o600)
    except Exception:
        shutil.rmtree(destination)
        raise
    return destination


def verify_written_bundle(path: Path) -> TuesdayReadiness:
    """Inspect a completed folder without trusting its filename or manifest."""
    if not isinstance(path, Path) or not path.is_dir() or path.is_symlink():
        raise CommandValidationError("invalid_lock_bundle", "Lock evidence directory is missing.")
    required = {
        "command-lock.json", "tier-lock.json", "command-matrix.csv",
        "tier-matrix.csv", "studio-pose-annex.json", "action-gaps.csv",
        "review.md", "manifest.json",
    }
    if {item.name for item in path.iterdir()} != required:
        raise CommandValidationError("invalid_lock_bundle", "Lock evidence files were changed.")
    if any(item.is_symlink() or not item.is_file() for item in path.iterdir()):
        raise CommandValidationError(
            "invalid_lock_bundle", "Only ordinary evidence files are permitted.",
        )
    size_bounds = {
        "command-lock.json": 250_001,
        "tier-lock.json": 120_001,
        "studio-pose-annex.json": 80_001,
        "command-matrix.csv": 100_000,
        "tier-matrix.csv": 100_000,
        "action-gaps.csv": 100_000,
        "review.md": 20_000,
        "manifest.json": 10_000,
    }
    if any((path / name).stat().st_size > limit for name, limit in size_bounds.items()):
        raise CommandValidationError("invalid_lock_bundle", "Evidence file exceeds its size limit.")
    files = {
        filename: (path / filename).read_text(encoding="utf-8")
        for filename in required
    }
    expected = prepare_tuesday_lock_bundle(
        files["command-lock.json"].removesuffix("\n"),
        files["tier-lock.json"].removesuffix("\n"),
        studio_pose_json=files["studio-pose-annex.json"].removesuffix("\n"),
    )
    if files != expected.files() or path.name != f"{expected.run_id}-{expected.renderer_build}-lock":
        raise CommandValidationError(
            "invalid_lock_bundle", "Evidence bytes differ from the verified pack.",
        )
    return expected.validate()
