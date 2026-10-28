"""Tuesday Quality Generator produces an immutable, photo-free 82-row supplement.

All input is generated metadata, never real-face or device evidence.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import replace
from pathlib import Path

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.quality_tier_export import (
    prepare_tier_dossier,
    render_tier_reviewer_sheet,
    write_tier_dossier,
)
from plumb_api.commands.quality_tier_matrix import TierLockObservation, build_tier_matrix
from plumb_api.commands.tuesday_lock import build_tuesday_lock_packet


@pytest.fixture(scope="module")
def packets() -> tuple[str, str]:
    original = build_tuesday_lock_packet(
        (), run_id="tuesday-quality", renderer_build="local-r13h",
    ).to_json()
    supplement = build_tier_matrix(
        (), original_tuesday_json=original,
        run_id="tuesday-quality", renderer_build="local-r13h",
    )
    return original, supplement


def test_reviewer_sheet_has_both_tiers_and_no_invented_latency(
    packets: tuple[str, str],
) -> None:
    original, supplement = packets
    sheet = render_tier_reviewer_sheet(supplement, original_tuesday_json=original)
    assert "BELJOUR" in sheet
    assert "at least 1920" in sheet
    assert "at least 3840" in sheet
    assert "CLEANUP" in sheet and "UPSCALE" in sheet
    assert "41 | 0 | 41" in sheet
    assert sheet.count("Not measured") == 4
    assert "NOT RUN" in sheet
    assert "NOT APPROVED" in sheet
    assert "205" in sheet and "82" in sheet


def test_manifest_binds_all_supplement_files(packets: tuple[str, str]) -> None:
    original, supplement = packets
    dossier = prepare_tier_dossier(supplement, original_tuesday_json=original)
    files = dossier.files()
    assert sorted(files) == sorted((
        "quality-tiers.json", "quality-tiers.csv",
        "quality-tiers-review.md", "quality-tiers-manifest.json",
    ))
    assert len(files["quality-tiers.csv"].splitlines()) == 83
    manifest = json.loads(files["quality-tiers-manifest.json"])
    assert manifest["supplemental_slots"] == 82
    assert manifest["original_command_slots"] == 205
    assert not manifest["release_qualified"]
    for filename, digest in manifest["files_sha256"].items():
        assert hashlib.sha256(files[filename].encode("utf-8")).hexdigest() == digest


def test_creates_only_new_dossier_and_refuses_overwrite(
    packets: tuple[str, str], tmp_path: Path,
) -> None:
    original, supplement = packets
    dossier = prepare_tier_dossier(supplement, original_tuesday_json=original)
    destination = write_tier_dossier(
        dossier, tmp_path, original_tuesday_json=original,
    )
    assert destination.name == "tuesday-quality-local-r13h-tiers"
    assert all((destination / path).is_file() for path in dossier.files())
    with pytest.raises(CommandValidationError) as reason:
        write_tier_dossier(dossier, tmp_path, original_tuesday_json=original)
    assert reason.value.code == "tier_export_exists"
    assert sorted(path.name for path in tmp_path.iterdir()) == [destination.name]


def test_tampered_dossier_and_parent_refused(
    packets: tuple[str, str], tmp_path: Path,
) -> None:
    original, supplement = packets
    dossier = prepare_tier_dossier(supplement, original_tuesday_json=original)
    with pytest.raises(CommandValidationError):
        write_tier_dossier(replace(dossier, tier_csv="modified"), tmp_path,
                           original_tuesday_json=original)
    with pytest.raises(CommandValidationError):
        write_tier_dossier(dossier, tmp_path / "not-a-directory",
                           original_tuesday_json=original)


def test_dossier_rejects_unrelated_tuesday_matrix(packets: tuple[str, str]) -> None:
    original, supplement = packets
    other = build_tuesday_lock_packet(
        (), run_id="different-run", renderer_build="local-r13h",
    ).to_json()
    with pytest.raises(CommandValidationError):
        prepare_tier_dossier(supplement, original_tuesday_json=other)


def test_latency_median_is_from_supplied_rows_not_a_default(packets: tuple[str, str]) -> None:
    original, _ = packets
    rows = tuple(
        TierLockObservation("1080", level, 960, 540, 1920, 1080, 2,
                            float(level), float(level * 10), True, True, 2, 2,
                            True, False)
        for level in (10, 30, 50)
    )
    new = build_tier_matrix(
        rows, original_tuesday_json=original,
        run_id="tuesday-quality", renderer_build="local-r13h",
    )
    sheet = render_tier_reviewer_sheet(new, original_tuesday_json=original)
    assert "30.00" in sheet
    assert "300.00" in sheet
    assert "41 | 3 | 38" in sheet
    assert "41 | 0 | 41" in sheet
