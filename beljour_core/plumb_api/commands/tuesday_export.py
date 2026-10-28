"""Export the complete five-command Tuesday review packet, including failures.

The dossier is a reproducible JSON packet, reviewer worksheet and 205-row CSV.
Only verified numeric lock observations are accepted. It never exports pixels,
biometric vectors, original file names, face IDs, or release approval.
Author: John Khan.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import shutil
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import cast

from .errors import CommandValidationError
from .lock_matrix import LockObservation
from .tuesday_lock import build_tuesday_lock_packet, verify_tuesday_lock_json
from .tuesday_sheet import render_tuesday_lock_sheet
from .types import CommandName

CSV_COLUMNS = (
    "command", "level_tenths", "status", "preview_ms", "export_ms",
    "identity_applied", "alpha_unchanged", "protected_unchanged",
    "neutral_correct", "skin_lift_l", "pose_minimum_jacobian",
    "pose_retention", "measured_device",
)


@dataclass(frozen=True, slots=True)
class TuesdayExport:
    run_id: str
    renderer_build: str
    packet_json: str
    summary_markdown: str
    matrix_csv: str
    manifest_json: str
    slot_count: int
    technical_status: str

    def files(self) -> dict[str, str]:
        return {
            "tuesday-lock.json": self.packet_json + "\n",
            "tuesday-review.md": self.summary_markdown,
            "tuesday-matrix.csv": self.matrix_csv,
            "manifest.json": self.manifest_json + "\n",
        }


def _matrix_csv(rows: list[dict[str, object]]) -> str:
    output = io.StringIO(newline="")
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(CSV_COLUMNS)
    for row in rows:
        writer.writerow(["" if row[field] is None else row[field] for field in CSV_COLUMNS])
    return output.getvalue()


def export_tuesday_matrix(
    observations: tuple[LockObservation, ...],
    *,
    run_id: str,
    renderer_build: str,
    preview_budget_ms: float = 100.0,
    export_budget_ms: float = 2000.0,
) -> TuesdayExport:
    """Retain incomplete rows, failures, and exact order without substitutions."""
    packet = build_tuesday_lock_packet(
        observations,
        run_id=run_id,
        renderer_build=renderer_build,
        preview_budget_ms=preview_budget_ms,
        export_budget_ms=export_budget_ms,
    )
    packet_json = packet.to_json()
    verified = verify_tuesday_lock_json(packet_json)
    raw_rows = verified["rows"]
    if not isinstance(raw_rows, list) or len(raw_rows) != 205:
        raise CommandValidationError("invalid_lock_packet", "Tuesday packet must have 205 rows.")
    rows = cast(list[dict[str, object]], raw_rows)
    contents = {
        "tuesday-lock.json": packet_json + "\n",
        "tuesday-review.md": render_tuesday_lock_sheet(packet_json),
        "tuesday-matrix.csv": _matrix_csv(rows),
    }
    fingerprints = {
        filename: hashlib.sha256(body.encode("utf-8")).hexdigest()
        for filename, body in sorted(contents.items())
    }
    manifest: dict[str, object] = {
        "version": "beljour-tuesday-export/1",
        "author": "John Khan",
        "run_id": packet.run_id,
        "renderer_build": packet.renderer_build,
        "slots": 205,
        "technical_status": packet.technical_status,
        "checksums": fingerprints,
        "release_qualified": False,
        "realface_qualified": False,
    }
    manifest_json = json.dumps(manifest, sort_keys=True, separators=(",", ":"))
    return TuesdayExport(
        packet.run_id,
        packet.renderer_build,
        packet_json,
        contents["tuesday-review.md"],
        contents["tuesday-matrix.csv"],
        manifest_json,
        205,
        packet.technical_status,
    )


def write_tuesday_export(bundle: TuesdayExport, parent: Path) -> Path:
    """Create a new dossier directory without overwriting other runs.

    Write in a private staging directory then rename it into place. On failure,
    remove the staging copy. An operator must supply a pre-existing directory;
    the export never interprets any private image paths or fetches data.
    """
    if not isinstance(bundle, TuesdayExport) or not isinstance(parent, Path):
        raise CommandValidationError("invalid_lock_export", "Checked dossier and target required.")
    if not parent.is_dir() or parent.is_symlink():
        raise CommandValidationError(
            "invalid_lock_export", "An existing ordinary directory is required.",
        )
    # The packet constructor already validates these identifiers. Revalidate
    # after dataclass construction so arbitrary user-built instances fail closed.
    verified = verify_tuesday_lock_json(bundle.packet_json)
    if (verified["run_id"] != bundle.run_id
            or verified["renderer_build"] != bundle.renderer_build
            or verified["technical_status"] != bundle.technical_status):
        raise CommandValidationError("invalid_lock_export", "Dossier and packet do not agree.")
    regenerated = export_tuesday_matrix(
        tuple(_observations_from_verified(verified)),
        run_id=bundle.run_id,
        renderer_build=bundle.renderer_build,
        preview_budget_ms=_matrix_budget(verified, "preview_budget_ms"),
        export_budget_ms=_matrix_budget(verified, "export_budget_ms"),
    )
    if bundle.files() != regenerated.files():
        raise CommandValidationError("invalid_lock_export", "Dossier content changed after validation.")
    target = parent / f"{bundle.run_id}-{bundle.renderer_build}"
    if target.exists() or target.is_symlink():
        raise CommandValidationError("lock_export_exists", "A dossier already exists for this run.")
    staged = Path(tempfile.mkdtemp(dir=parent, prefix=".beljour-lock-"))
    try:
        for filename, content in bundle.files().items():
            destination = staged / filename
            destination.write_text(content, encoding="utf-8", newline="\n")
            destination.chmod(0o600)
        staged.rename(target)
    finally:
        if staged.exists():
            shutil.rmtree(staged)
    return target


def _matrix_budget(record: dict[str, object], field: str) -> float:
    matrix = cast(dict[str, object], record["matrix"])
    value = matrix[field]
    if not isinstance(value, (float, int)) or type(value) is bool:
        raise CommandValidationError("invalid_lock_export", "Packet budget is malformed.")
    return float(value)


def _observations_from_verified(record: dict[str, object]) -> list[LockObservation]:
    """Reconstruct only validated fields to prevent forged file contents."""
    rows = cast(list[dict[str, object]], record["rows"])
    output: list[LockObservation] = []
    for row in rows:
        if row["status"] == "missing":
            continue
        output.append(LockObservation(
            command=CommandName(cast(str, row["command"])),
            level_tenths=cast(int, row["level_tenths"]),
            preview_ms=float(cast(float, row["preview_ms"])),
            export_ms=float(cast(float, row["export_ms"])),
            identity_applied=cast(bool, row["identity_applied"]),
            alpha_unchanged=cast(bool, row["alpha_unchanged"]),
            protected_unchanged=cast(bool, row["protected_unchanged"]),
            neutral_correct=cast(bool, row["neutral_correct"]),
            skin_lift_l=cast(float | None, row["skin_lift_l"]),
            pose_minimum_jacobian=cast(float | None, row["pose_minimum_jacobian"]),
            pose_retention=cast(float | None, row["pose_retention"]),
            measured_device=cast(bool, row["measured_device"]),
        ))
    return output
