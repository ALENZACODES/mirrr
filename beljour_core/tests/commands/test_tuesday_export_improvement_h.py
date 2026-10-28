"""Review-packet generation, tamper resistance and create-only file export.

All 205 observations are typed test measurements, not private photographs or
independent identity qualification. Author: John Khan.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
from dataclasses import replace
from pathlib import Path
from typing import cast

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.lock_matrix import COMMANDS, LEVELS, LockObservation
from plumb_api.commands.tuesday_export import (
    CSV_COLUMNS,
    TuesdayExport,
    export_tuesday_matrix,
    write_tuesday_export,
)
from plumb_api.commands.tuesday_lock import verify_tuesday_lock_json
from plumb_api.commands.types import CommandName


def valid_row(command: CommandName, level: int) -> LockObservation:
    return LockObservation(
        command=command,
        level_tenths=level,
        preview_ms=float(9 + level / 2),
        export_ms=float(80 + level),
        identity_applied=True,
        alpha_unchanged=True,
        protected_unchanged=True,
        neutral_correct=True,
        skin_lift_l=0.5 if command is CommandName.STUDIOQUALITY else None,
        pose_minimum_jacobian=0.9 if command is CommandName.POSEONLY else None,
        pose_retention=0.9 if command is CommandName.POSEONLY else None,
        measured_device=False,
    )


def full() -> tuple[LockObservation, ...]:
    return tuple(valid_row(command, level) for command in COMMANDS for level in LEVELS)


def csv_rows(bundle: TuesdayExport) -> list[dict[str, str]]:
    return list(csv.DictReader(io.StringIO(bundle.matrix_csv)))


def test_export_contains_205_numbered_rows_and_review_headline() -> None:
    bundle = export_tuesday_matrix(full(), run_id="tuesday-technical", renderer_build="h-improve")
    assert bundle.slot_count == 205
    assert bundle.technical_status == "technical_review_required"
    assert bundle.summary_markdown.startswith("# BELJOUR |")
    assert "Release authorized: **NO**" in bundle.summary_markdown
    assert "Independent real-face gate: **NOT RUN**" in bundle.summary_markdown
    assert set(bundle.files()) == {
        "tuesday-lock.json", "tuesday-review.md", "tuesday-matrix.csv", "manifest.json",
    }
    matrix = csv_rows(bundle)
    assert len(matrix) == 205
    assert tuple(matrix[0]) == CSV_COLUMNS
    assert (matrix[0]["command"], matrix[0]["level_tenths"]) == (COMMANDS[0].value, "10")
    assert (matrix[-1]["command"], matrix[-1]["level_tenths"]) == (COMMANDS[-1].value, "50")
    assert all(row["status"] == "synthetic_checked" for row in matrix)
    assert all(row["measured_device"] == "False" for row in matrix)
    assert "image_bytes" not in bundle.packet_json
    assert "filename" not in bundle.packet_json
    assert "face_hash" not in bundle.packet_json
    assert not verify_tuesday_lock_json(bundle.packet_json)["release_qualified"]


def test_manifest_checksums_are_over_exported_utf8_bytes() -> None:
    bundle = export_tuesday_matrix(full(), run_id="lock-review", renderer_build="h11")
    manifest = json.loads(bundle.manifest_json)
    assert manifest["version"] == "beljour-tuesday-export/1"
    assert manifest["author"] == "John Khan"
    assert manifest["slots"] == 205
    assert manifest["release_qualified"] is False
    for key, digest in manifest["checksums"].items():
        assert digest == hashlib.sha256(bundle.files()[key].encode("utf-8")).hexdigest()


def test_reversed_collection_produces_identical_export() -> None:
    ordered = full()
    normal = export_tuesday_matrix(ordered, run_id="case", renderer_build="v1")
    reverse = export_tuesday_matrix(tuple(reversed(ordered)), run_id="case", renderer_build="v1")
    assert normal.files() == reverse.files()


def test_missing_slots_remain_explicit_and_numbered() -> None:
    rows = full()
    selection = tuple(item for item in rows if item.level_tenths != 30)
    bundle = export_tuesday_matrix(selection, run_id="partial", renderer_build="v1")
    assert bundle.technical_status == "incomplete"
    assert len(csv_rows(bundle)) == 205
    assert sum(row["status"] == "missing" for row in csv_rows(bundle)) == 5
    assert "missing 3.0" in bundle.summary_markdown
    assert "Release authorized: **NO**" in bundle.summary_markdown


def test_safety_and_timing_failures_survive_export() -> None:
    rows = list(full())
    rows[0] = replace(rows[0], identity_applied=False)
    rows[1] = replace(rows[1], export_ms=2001.0)
    bundle = export_tuesday_matrix(tuple(rows), run_id="failure", renderer_build="v1")
    assert bundle.technical_status == "blocked"
    matrix = csv_rows(bundle)
    assert matrix[0]["status"] == "failed_safety"
    assert matrix[1]["status"] == "over_budget"
    assert "safety failed 1.0" in bundle.summary_markdown
    assert "timing failed 1.1" in bundle.summary_markdown


def test_disk_export_is_create_only_and_idempotence_is_not_silent(tmp_path: Path) -> None:
    bundle = export_tuesday_matrix(full(), run_id="tuesday", renderer_build="v1")
    target = write_tuesday_export(bundle, tmp_path)
    assert target == tmp_path / "tuesday-v1"
    assert sorted(path.name for path in target.iterdir()) == sorted(bundle.files())
    for filename, content in bundle.files().items():
        assert (target / filename).read_text(encoding="utf-8") == content
    with pytest.raises(CommandValidationError) as failure:
        write_tuesday_export(bundle, tmp_path)
    assert failure.value.code == "lock_export_exists"
    assert not list(tmp_path.glob(".beljour-lock-*"))


def test_disk_export_refuses_modified_summary_without_writing(tmp_path: Path) -> None:
    bundle = export_tuesday_matrix((), run_id="empty", renderer_build="v1")
    changed = replace(bundle, summary_markdown=bundle.summary_markdown + "injected text\n")
    with pytest.raises(CommandValidationError):
        write_tuesday_export(changed, tmp_path)
    assert list(tmp_path.iterdir()) == []


def test_disk_export_refuses_changed_csv_and_manifest(tmp_path: Path) -> None:
    bundle = export_tuesday_matrix((), run_id="empty", renderer_build="v1")
    for changed in (
        replace(bundle, matrix_csv=bundle.matrix_csv + "other,data\n"),
        replace(bundle, manifest_json=bundle.manifest_json.replace("205", "206")),
        replace(bundle, run_id="different"),
    ):
        with pytest.raises(CommandValidationError):
            write_tuesday_export(changed, tmp_path)
    assert list(tmp_path.iterdir()) == []


def test_export_rejects_unknown_private_identifier_and_duplicate_rows() -> None:
    with pytest.raises(CommandValidationError):
        export_tuesday_matrix(full(), run_id="private/a.jpg", renderer_build="v1")
    with pytest.raises(CommandValidationError):
        export_tuesday_matrix((full()[0], full()[0]), run_id="duplicate", renderer_build="v1")


def test_export_parent_cannot_be_absent_or_symlink(tmp_path: Path) -> None:
    bundle = export_tuesday_matrix((), run_id="case", renderer_build="v1")
    with pytest.raises(CommandValidationError):
        write_tuesday_export(bundle, tmp_path / "absent")
    if hasattr(Path, "symlink_to"):
        symlink = tmp_path / "alias"
        symlink.symlink_to(tmp_path, target_is_directory=True)
        with pytest.raises(CommandValidationError):
            write_tuesday_export(bundle, symlink)


def test_export_rejects_fake_dataclass_instance(tmp_path: Path) -> None:
    bundle = export_tuesday_matrix((), run_id="run", renderer_build="version")
    with pytest.raises(CommandValidationError):
        write_tuesday_export(cast(TuesdayExport, object()), tmp_path)
    with pytest.raises(CommandValidationError):
        write_tuesday_export(bundle, cast(Path, "a string"))


def test_broken_output_symlink_is_never_replaced(tmp_path: Path) -> None:
    bundle = export_tuesday_matrix((), run_id="broken", renderer_build="v1")
    broken = tmp_path / "broken-v1"
    broken.symlink_to(tmp_path / "missing", target_is_directory=True)
    with pytest.raises(CommandValidationError) as failure:
        write_tuesday_export(bundle, tmp_path)
    assert failure.value.code == "lock_export_exists"
    assert broken.is_symlink()
    assert not list(tmp_path.glob(".beljour-lock-*"))


def test_export_summary_keeps_every_failed_level_in_the_csv() -> None:
    observations = [row for row in full() if row.level_tenths != 37]
    first = observations[0]
    observations[0] = replace(first, protected_unchanged=False)
    last = observations[-1]
    observations[-1] = replace(last, preview_ms=101.0)
    bundle = export_tuesday_matrix(
        tuple(observations), run_id="retained-failures", renderer_build="v1",
    )
    matrix = csv_rows(bundle)
    assert len(matrix) == 205
    assert sum(row["status"] == "missing" for row in matrix) == 5
    assert sum(row["status"] == "failed_safety" for row in matrix) == 1
    assert sum(row["status"] == "over_budget" for row in matrix) == 1
    assert "missing 3.7" in bundle.summary_markdown
    assert "Technical verdict: **BLOCKED**" in bundle.summary_markdown
    assert "release_qualified" in bundle.packet_json
    assert "\"release_qualified\":false" in bundle.packet_json


def test_committed_empty_tuesday_dossier_preserves_all_205_missing_slots() -> None:
    folder = Path(__file__).with_name("fixtures") / "tuesday_improvement_h"
    folder /= "tuesday-pending-unverified"
    manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
    content = (folder / "tuesday-lock.json").read_text(encoding="utf-8")
    packet = verify_tuesday_lock_json(content)
    rows = list(csv.DictReader(io.StringIO(
        (folder / "tuesday-matrix.csv").read_text(encoding="utf-8"),
    )))
    assert len(rows) == 205
    assert all(row["status"] == "missing" for row in rows)
    assert packet["technical_status"] == "incomplete"
    assert manifest["technical_status"] == "incomplete"
    assert packet["independent_realface_result"] == "NOT_RUN"
    assert manifest["release_qualified"] is False
    assert "Observed slots: 0/205" in (folder / "tuesday-review.md").read_text(encoding="utf-8")
