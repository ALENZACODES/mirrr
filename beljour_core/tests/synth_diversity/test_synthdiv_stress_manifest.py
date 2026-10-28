"""Metadata-only stress writer, checksum, tamper and path-refusal tests.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import pytest

from lab.synth_diversity.stress_manifest import (
    SCHEMA_NAME,
    STRESS_INFO,
    STRESS_ROWS,
    iter_stress_rows,
    load_stress_header,
    stress_row,
    verify_stress_manifest,
    write_stress_manifest,
)
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_slices import SliceBridge
from lab.synth_diversity.stress_spec import PROVENANCE, STRESS_FORMAT, canonical_bytes
from lab.synth_diversity.types import SyntheticInputError
from lab.synth_diversity.writer import repository_root


def _create(tmp_path: Path, seed: int = 38, count: int = 43) -> Path:
    destination = tmp_path / "synthetic-plan"
    write_stress_manifest(destination, StressSchedule(seed=seed, count=count))
    return destination


def _rewrite_header(folder: Path, edits: dict[str, Any]) -> None:
    info = folder / STRESS_INFO
    original = json.loads(info.read_text(encoding="utf-8"))
    original.update(edits)
    info.write_bytes(canonical_bytes(original) + b"\n")


def _rewrite_rows(folder: Path, rows: list[dict[str, Any]]) -> None:
    payload = b"".join(canonical_bytes(row) + b"\n" for row in rows)
    (folder / STRESS_ROWS).write_bytes(payload)
    _rewrite_header(
        folder,
        {
            "manifest_sha256": hashlib.sha256(payload).hexdigest(),
            "manifest_bytes": len(payload),
        },
    )


def test_writer_creates_only_two_metadata_documents(tmp_path: Path) -> None:
    root = _create(tmp_path)
    assert sorted(path.name for path in root.iterdir()) == sorted([STRESS_ROWS, STRESS_INFO])
    assert not any(path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
                   for path in root.iterdir())
    assert verify_stress_manifest(root) == []


def test_stress_header_is_stable_and_covers_all_provenance_fields(tmp_path: Path) -> None:
    root = _create(tmp_path, seed=4, count=47)
    header = load_stress_header(root)
    assert header["schema"] == SCHEMA_NAME
    assert header["format"] == STRESS_FORMAT
    assert header["count"] == 47
    assert header["study_seed"] == 4
    assert header["age_min"] == 18
    assert header["age_max"] == 80
    assert header["group_alignment"] == "UNMAPPED"
    assert header["lane_g_bridge_sha256"] is None
    assert all(header[key] == value for key, value in PROVENANCE.items())


def test_manifest_rows_have_complete_declared_tags_and_licence(tmp_path: Path) -> None:
    root = _create(tmp_path, seed=101, count=52)
    rows = list(iter_stress_rows(root))
    assert len(rows) == 52
    for ordinal, row in enumerate(rows):
        assert row["ordinal"] == ordinal
        assert row["case_id"].startswith("S21-")
        assert row["source_id"] == "S21"
        assert row["licence"] == "Own work, John Khan"
        assert row["test_only"] is True
        assert row["train_allowed"] is False
        assert len(row["local_slice_labels"]) == 12
        assert len(row["tags"]) == 13
        assert len(row["parameters"]) == 14
        assert 18 <= row["age_years"] <= 80


def test_repeated_export_has_identical_json_bytes_in_different_directories(
    tmp_path: Path,
) -> None:
    a = tmp_path / "one"
    b = tmp_path / "two"
    schedule = StressSchedule(seed=65537, count=64)
    write_stress_manifest(a, schedule)
    write_stress_manifest(b, schedule)
    assert (a / STRESS_ROWS).read_bytes() == (b / STRESS_ROWS).read_bytes()
    assert (a / STRESS_INFO).read_bytes() == (b / STRESS_INFO).read_bytes()
    assert verify_stress_manifest(a) == []
    assert verify_stress_manifest(b) == []


def test_different_study_seed_changes_stress_manifest_hash(tmp_path: Path) -> None:
    a = _create(tmp_path / "one", seed=17)
    b = _create(tmp_path / "two", seed=18)
    assert load_stress_header(a)["manifest_sha256"] != load_stress_header(b)["manifest_sha256"]


def test_writer_refuses_existing_output_and_inside_repository(tmp_path: Path) -> None:
    target = _create(tmp_path)
    with pytest.raises(SyntheticInputError):
        write_stress_manifest(target, StressSchedule(seed=1, count=40))
    with pytest.raises(SyntheticInputError, match="forbidden"):
        write_stress_manifest(
            repository_root() / "this_must_never_be_created",
            StressSchedule(seed=1, count=40),
        )


def test_writer_does_not_leave_partial_target_after_failure(tmp_path: Path) -> None:
    destination = tmp_path / "failed-plan"
    invalid = StressSchedule(seed=7, count=40)
    bridge = SliceBridge({"fitzpatrick=VI": "deep"})
    write_stress_manifest(destination, invalid, bridge)
    with pytest.raises(SyntheticInputError):
        write_stress_manifest(destination, invalid, bridge)
    assert verify_stress_manifest(destination, bridge) == []


def test_explicit_group_bridge_is_applied_verbatim(tmp_path: Path) -> None:
    schedule = StressSchedule(seed=3, count=40)
    bridge = SliceBridge({"fitzpatrick=VI": "Deep tone G", "glasses=tinted": "Tinted G"})
    destination = tmp_path / "with-groups"
    write_stress_manifest(destination, schedule, bridge)
    header = load_stress_header(destination)
    assert header["lane_g_bridge_sha256"] == bridge.digest
    assert header["group_alignment"] == "EXPLICIT_MAPPING"
    assert verify_stress_manifest(destination, bridge) == []
    assert verify_stress_manifest(destination)
    assert verify_stress_manifest(destination, SliceBridge({"fitzpatrick=VI": "Wrong"}))
    labels = {name for row in iter_stress_rows(destination) for name in row["lane_g_groups"]}
    assert labels.issubset({"Deep tone G", "Tinted G"})


def test_unmapped_manifest_cannot_be_relabelled_after_export(tmp_path: Path) -> None:
    root = _create(tmp_path)
    bridge = SliceBridge({"fitzpatrick=VI": "deep"})
    assert verify_stress_manifest(root, bridge)
    assert verify_stress_manifest(root) == []


def test_checksum_detects_single_character_edit(tmp_path: Path) -> None:
    root = _create(tmp_path)
    path = root / STRESS_ROWS
    contents = path.read_bytes()
    path.write_bytes(contents.replace(b"neutral_adult", b"neutran_adult", 1))
    assert any("SHA-256" in item for item in verify_stress_manifest(root))


def test_stale_header_bytes_and_wrong_counts_are_detected(tmp_path: Path) -> None:
    root = _create(tmp_path)
    _rewrite_header(root, {"manifest_bytes": 0})
    assert any("byte length" in item for item in verify_stress_manifest(root))
    _rewrite_header(root, {"manifest_bytes": (root / STRESS_ROWS).stat().st_size})
    _rewrite_header(root, {"count": 99})
    assert verify_stress_manifest(root)


@pytest.mark.parametrize("field,replacement", [
    ("source_id", "other"),
    ("licence", "unknown"),
    ("test_only", False),
    ("train_allowed", True),
    ("age_min", 0),
    ("age_max", 120),
    ("schema", "wrong"),
    ("manifest_file", "../escape"),
])
def test_header_provenance_and_schema_tampering_rejected(
    tmp_path: Path, field: str, replacement: object,
) -> None:
    root = _create(tmp_path)
    _rewrite_header(root, {field: replacement})
    assert verify_stress_manifest(root)


def test_row_tag_tampering_detected_even_with_recomputed_checksum(tmp_path: Path) -> None:
    root = _create(tmp_path)
    rows = list(iter_stress_rows(root))
    rows[2]["tags"]["fitzpatrick"] = "I"
    _rewrite_rows(root, rows)
    assert verify_stress_manifest(root)


def test_row_group_invention_rejected_even_after_digest_recomputation(tmp_path: Path) -> None:
    root = _create(tmp_path)
    rows = list(iter_stress_rows(root))
    rows[0]["lane_g_groups"] = ["Unknown Outside Group"]
    _rewrite_rows(root, rows)
    assert verify_stress_manifest(root)


def test_duplicate_case_and_missing_last_case_rejected(tmp_path: Path) -> None:
    root = _create(tmp_path)
    rows = list(iter_stress_rows(root))
    rows[1] = rows[0]
    _rewrite_rows(root, rows)
    assert verify_stress_manifest(root)


def test_extra_files_are_refused_without_reading_them(tmp_path: Path) -> None:
    root = _create(tmp_path)
    (root / "unauthorized.txt").write_text("not permitted", encoding="utf-8")
    assert any("unexpected stress artifact" in item for item in verify_stress_manifest(root))


def test_manifest_rejects_noncanonical_jsonl_even_with_new_checksum(tmp_path: Path) -> None:
    root = _create(tmp_path)
    data = (root / STRESS_ROWS).read_bytes().replace(b'"age_years":', b'"age_years" :', 1)
    (root / STRESS_ROWS).write_bytes(data)
    _rewrite_header(root, {
        "manifest_sha256": hashlib.sha256(data).hexdigest(),
        "manifest_bytes": len(data),
    })
    assert verify_stress_manifest(root)


def test_symlinked_root_and_manifest_artifact_are_rejected(tmp_path: Path) -> None:
    root = _create(tmp_path)
    alias = tmp_path / "alias"
    alias.symlink_to(root, target_is_directory=True)
    assert verify_stress_manifest(alias)
    payload = root / STRESS_ROWS
    copy = tmp_path / "copy.jsonl"
    copy.write_bytes(payload.read_bytes())
    payload.unlink()
    payload.symlink_to(copy)
    assert verify_stress_manifest(root)


def test_manifest_refuses_removed_info_file(tmp_path: Path) -> None:
    root = _create(tmp_path)
    (root / STRESS_INFO).unlink()
    assert verify_stress_manifest(root)


def test_manifest_refuses_unexpected_columns(tmp_path: Path) -> None:
    root = _create(tmp_path)
    rows = list(iter_stress_rows(root))
    rows[0]["image_path"] = "secret.png"
    _rewrite_rows(root, rows)
    assert verify_stress_manifest(root)


def test_stress_row_external_groups_are_only_from_supplied_bridge() -> None:
    case = StressSchedule(seed=9, count=40).at(2)
    bridge = SliceBridge({"age_band=30-39": "Observed age group"})
    row = stress_row(case, bridge)
    assert set(row["lane_g_groups"]).issubset({"Observed age group"})
    assert stress_row(case)["lane_g_groups"] == []
