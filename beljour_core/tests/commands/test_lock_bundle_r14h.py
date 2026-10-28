"""Create-only Tuesday dossier checks and adverse file-system cases.

No faces, model outputs or external measurements are used. Author: John Khan.
"""

from __future__ import annotations

import csv
import io
import json
from dataclasses import replace
from pathlib import Path

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.lock_bundle import (
    PACK_VERSION,
    prepare_tuesday_lock_bundle,
    verify_written_bundle,
    write_tuesday_lock_bundle,
)
from plumb_api.commands.quality_tier_matrix import build_tier_matrix
from plumb_api.commands.tuesday_lock import build_tuesday_lock_packet
from tests.commands.test_joint_lock_readiness_r14h import (
    BUILD,
    RUN,
    all_commands,
    all_tiers,
    packets,
)


def test_empty_pack_contains_287_gaps_and_205_plus_82_csv_rows() -> None:
    commands, tiers = packets()
    bundle = prepare_tuesday_lock_bundle(commands, tiers)
    report = bundle.validate()
    assert report.status == "incomplete"
    files = bundle.files()
    assert set(files) == {
        "command-lock.json", "tier-lock.json", "command-matrix.csv",
        "tier-matrix.csv", "studio-pose-annex.json", "action-gaps.csv", "review.md", "manifest.json",
    }
    assert len(list(csv.DictReader(io.StringIO(files["command-matrix.csv"])))) == 205
    assert len(list(csv.DictReader(io.StringIO(files["tier-matrix.csv"])))) == 82
    assert len(list(csv.DictReader(io.StringIO(files["action-gaps.csv"])))) == 287
    manifest = json.loads(files["manifest.json"])
    assert manifest["version"] == PACK_VERSION
    assert manifest["combined_slots"] == 287
    assert manifest["open_actions"] == 287
    assert manifest["release_qualified"] is False
    assert manifest["independent_realface_qualified"] is False
    assert manifest["production_identity_qualified"] is False
    assert manifest["command_sha256"] == json.loads(commands)["sha256"]
    assert manifest["tier_sha256"] == json.loads(tiers)["sha256"]
    assert "filename" not in bundle.manifest_json
    assert "image_bytes" not in bundle.manifest_json
    assert "embedding" not in bundle.manifest_json
    assert "Independent 100,000-face qualification: NOT RUN" in files["review.md"]
    assert "soft key" in files["review.md"]
    assert "POSEONLY" in files["review.md"]


def test_independent_packets_produce_identical_dossiers() -> None:
    one = prepare_tuesday_lock_bundle(*packets())
    two = prepare_tuesday_lock_bundle(*packets())
    assert one == two
    assert one.files() == two.files()


def test_different_observation_order_does_not_change_dossier() -> None:
    first = packets(all_commands(), all_tiers())
    second = packets(tuple(reversed(all_commands())), tuple(reversed(all_tiers())))
    assert prepare_tuesday_lock_bundle(*first) == prepare_tuesday_lock_bundle(*second)


def test_package_is_created_privately_and_reverifiable(tmp_path: Path) -> None:
    bundle = prepare_tuesday_lock_bundle(*packets())
    destination = write_tuesday_lock_bundle(bundle, tmp_path)
    assert destination == tmp_path / f"{RUN}-{BUILD}-lock"
    assert destination.is_dir()
    assert destination.stat().st_mode & 0o777 == 0o700
    assert all(path.stat().st_mode & 0o777 == 0o600 for path in destination.iterdir())
    report = verify_written_bundle(destination)
    assert report.observed == 0
    assert report.status == "incomplete"
    with pytest.raises(CommandValidationError) as exc:
        write_tuesday_lock_bundle(bundle, tmp_path)
    assert exc.value.code == "lock_bundle_exists"


@pytest.mark.parametrize("filename", [
    "command-lock.json", "tier-lock.json", "command-matrix.csv",
    "tier-matrix.csv", "studio-pose-annex.json", "action-gaps.csv", "review.md", "manifest.json",
])
def test_any_modified_file_refuses_reverification(filename: str, tmp_path: Path) -> None:
    bundle = prepare_tuesday_lock_bundle(*packets())
    destination = write_tuesday_lock_bundle(bundle, tmp_path)
    path = destination / filename
    path.write_text(path.read_text(encoding="utf-8") + "tampered", encoding="utf-8")
    with pytest.raises(CommandValidationError):
        verify_written_bundle(destination)


def test_missing_file_refuses_reverification(tmp_path: Path) -> None:
    bundle = prepare_tuesday_lock_bundle(*packets())
    destination = write_tuesday_lock_bundle(bundle, tmp_path)
    (destination / "tier-matrix.csv").unlink()
    with pytest.raises(CommandValidationError):
        verify_written_bundle(destination)


def test_extra_file_refuses_reverification(tmp_path: Path) -> None:
    bundle = prepare_tuesday_lock_bundle(*packets())
    destination = write_tuesday_lock_bundle(bundle, tmp_path)
    (destination / "extra.txt").write_text("not expected", encoding="utf-8")
    with pytest.raises(CommandValidationError):
        verify_written_bundle(destination)


def test_symlink_parent_refused(tmp_path: Path) -> None:
    bundle = prepare_tuesday_lock_bundle(*packets())
    parent = tmp_path / "actual"
    parent.mkdir()
    link = tmp_path / "alias"
    link.symlink_to(parent, target_is_directory=True)
    with pytest.raises(CommandValidationError):
        write_tuesday_lock_bundle(bundle, link)
    assert list(parent.iterdir()) == []


def test_symlink_inside_dossier_refused(tmp_path: Path) -> None:
    bundle = prepare_tuesday_lock_bundle(*packets())
    destination = write_tuesday_lock_bundle(bundle, tmp_path)
    target = destination / "review.md"
    target.unlink()
    target.symlink_to(destination / "manifest.json")
    with pytest.raises(CommandValidationError):
        verify_written_bundle(destination)


def test_non_directory_destination_refused(tmp_path: Path) -> None:
    file_path = tmp_path / "output.txt"
    file_path.write_text("ordinary file", encoding="utf-8")
    bundle = prepare_tuesday_lock_bundle(*packets())
    with pytest.raises(CommandValidationError):
        write_tuesday_lock_bundle(bundle, file_path)


def test_wrong_run_rejected_before_any_disk_mutation(tmp_path: Path) -> None:
    command_json = build_tuesday_lock_packet(
        (), run_id="another-run", renderer_build=BUILD,
    ).to_json()
    unrelated = build_tier_matrix(
        (), original_tuesday_json=command_json,
        run_id="another-run", renderer_build=BUILD,
    )
    original, _ = packets()
    with pytest.raises(CommandValidationError):
        prepare_tuesday_lock_bundle(original, unrelated)
    assert list(tmp_path.iterdir()) == []


def test_mutated_dossier_instance_not_written(tmp_path: Path) -> None:
    bundle = prepare_tuesday_lock_bundle(*packets())
    modified = replace(bundle, manifest_json=bundle.manifest_json.replace("287", "286"))
    with pytest.raises(CommandValidationError):
        write_tuesday_lock_bundle(modified, tmp_path)
    assert list(tmp_path.iterdir()) == []


def test_missing_identity_checks_are_not_hidden_in_export() -> None:
    command_json, tier_json = packets()
    bundle = prepare_tuesday_lock_bundle(command_json, tier_json)
    rows = list(csv.DictReader(io.StringIO(bundle.files()["action-gaps.csv"])))
    assert len([row for row in rows if row["scope"] == "/studioquality"]) == 41
    assert len([row for row in rows if row["scope"] == "/poseonly"]) == 41
    assert len([row for row in rows if row["scope"] == "/upscale:1080"]) == 41
    assert len([row for row in rows if row["scope"] == "/upscale:4k"]) == 41


def test_full_device_tagged_dossier_does_not_claim_release() -> None:
    commands = tuple(replace(row, measured_device=True) for row in all_commands())
    tiers = tuple(replace(row, measured_device=True) for row in all_tiers())
    bundle = prepare_tuesday_lock_bundle(*packets(commands, tiers))
    report = bundle.validate()
    assert report.status == "awaiting_review"
    assert report.gaps == ()
    manifest = json.loads(bundle.manifest_json)
    assert manifest["release_qualified"] is False
    assert manifest["independent_realface_qualified"] is False
    assert manifest["production_identity_qualified"] is False
    assert "NOT APPROVED" in bundle.files()["review.md"]
