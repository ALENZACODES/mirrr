"""Rights-gated ingest: per-image filters, reason-only logs and subject splits.

All images are drawn by `test_support`. Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

import pytest

from .pipeline import TrainingPlan, ingest, manifest_digest, manifest_digest_files, partition
from .test_support import FIXTURE_PLAN, draw_record, write_review


def _admit(tmp_path: Path, rows: list[dict[str, Any]], plan: TrainingPlan = FIXTURE_PLAN) -> Any:
    source = tmp_path / "source.jsonl"
    source.write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")
    return ingest(source, tmp_path / "photos", tmp_path / "rights", tmp_path / "approved", plan=plan)


def _rows(tmp_path: Path, count: int) -> list[dict[str, Any]]:
    return [draw_record(tmp_path / "photos", tmp_path / "rights", index) for index in range(count)]


def test_cleared_rows_are_split_by_subject_and_digest_bound(tmp_path: Path) -> None:
    rows = _rows(tmp_path, 24)
    report = _admit(tmp_path, rows)
    assert (report.scanned, report.accepted, report.rejected) == (24, 24, 0)
    approved = tmp_path / "approved"
    placed: dict[str, str] = {}
    for split in ("train", "eval"):
        for line in (approved / f"{split}.jsonl").read_text().splitlines():
            record = json.loads(line)
            assert partition(record["subject_key"], FIXTURE_PLAN.seed, FIXTURE_PLAN.holdout_fraction) == split
            placed[record["sha256"]] = split
    assert len(placed) == 24 and set(placed.values()) == {"train", "eval"}
    assert report.manifest_sha256 == manifest_digest_files(approved / "train.jsonl", approved / "eval.jsonl")
    summary = json.loads((approved / "summary.json").read_text())
    assert summary["manifest_sha256"] == report.manifest_sha256
    assert summary["plan_sha256"] == FIXTURE_PLAN.digest()


def test_same_subject_never_straddles_splits(tmp_path: Path) -> None:
    shared = hashlib.sha256(b"one-drawn-subject").hexdigest()
    rows = [
        draw_record(tmp_path / "photos", tmp_path / "rights", index, subject_key=shared)
        for index in range(6)
    ]
    _admit(tmp_path, rows)
    populated = [
        split for split in ("train", "eval")
        if (tmp_path / "approved" / f"{split}.jsonl").read_text()
    ]
    assert len(populated) == 1


@pytest.mark.parametrize(("change", "reason"), [
    ({"licence": "CC-BY-4.0"}, "unapproved_licence"),
    ({"source": "scraped_web"}, "unapproved_source"),
    ({"adult_confirmed": False}, "adult_unproven"),
    ({"commercial_training": "yes"}, "commercial_rights_unproven"),
    ({"model_distribution": False}, "commercial_rights_unproven"),
    ({"image": "../outside.png"}, "invalid_path"),
    ({"image": "drawn-00000.gif"}, "invalid_type"),
    ({"group": "Not A Label"}, "invalid_group"),
    ({"sha256": "0" * 64}, "rights_mismatch"),
    ({"unexpected": True}, "invalid_schema"),
])
def test_each_failed_check_is_a_reason_only_rejection(
    tmp_path: Path, change: dict[str, object], reason: str,
) -> None:
    row = _rows(tmp_path, 1)[0]
    row.update(change)
    report = _admit(tmp_path, [row])
    assert report.accepted == 0
    assert report.reason_counts == {reason: 1}
    logged = (tmp_path / "approved" / "rejected.jsonl").read_text()
    assert json.loads(logged) == {"row": 1, "reason": reason}


def test_changed_image_or_review_bytes_are_rejected(tmp_path: Path) -> None:
    rows = _rows(tmp_path, 3)
    with (tmp_path / "photos" / rows[0]["image"]).open("ab") as photo:
        photo.write(b"\0")
    (tmp_path / "rights" / f"{rows[1]['evidence_sha256']}.json").write_bytes(b"{}")
    (tmp_path / "photos" / rows[2]["image"]).unlink()
    report = _admit(tmp_path, rows)
    assert report.reason_counts == {
        "image_hash_mismatch": 1, "changed_rights_review": 1, "missing_image": 1,
    }


def test_review_must_be_operator_approved_for_this_source(tmp_path: Path) -> None:
    row = _rows(tmp_path, 1)[0]
    row["evidence_sha256"] = write_review(
        tmp_path / "rights", source="government", licence="PUBLIC-DOMAIN", image_sha256=row["sha256"],
    )
    assert _admit(tmp_path, [row]).reason_counts == {"rights_mismatch": 1}


def test_duplicates_and_malformed_lines_never_reach_manifests(tmp_path: Path) -> None:
    rows = _rows(tmp_path, 2)
    source = tmp_path / "source.jsonl"
    source.write_text(
        json.dumps(rows[0]) + "\n" + json.dumps(rows[0]) + "\n{not json\n" + json.dumps(rows[1]) + "\n",
    )
    report = ingest(source, tmp_path / "photos", tmp_path / "rights", tmp_path / "approved", plan=FIXTURE_PLAN)
    assert report.accepted == 2
    assert report.reason_counts == {"duplicate_image": 1, "invalid_json": 1}
    rejected = (tmp_path / "approved" / "rejected.jsonl").read_text()
    for private in (rows[0]["image"], rows[0]["sha256"], rows[0]["subject_key"]):
        assert private not in rejected


def test_row_limit_stops_ingest_without_publishing(tmp_path: Path) -> None:
    rows = _rows(tmp_path, 3)
    source = tmp_path / "source.jsonl"
    source.write_text("".join(json.dumps(row) + "\n" for row in rows))
    with pytest.raises(ValueError, match="maximum item count"):
        ingest(source, tmp_path / "photos", tmp_path / "rights", tmp_path / "approved",
               plan=FIXTURE_PLAN, max_rows=2)
    assert not (tmp_path / "approved" / "train.jsonl").exists()
    assert not [item for item in (tmp_path / "approved").iterdir() if item.name.startswith(".ingest-")]


def test_destination_inside_source_images_is_refused(tmp_path: Path) -> None:
    rows = _rows(tmp_path, 1)
    source = tmp_path / "source.jsonl"
    source.write_text(json.dumps(rows[0]) + "\n")
    with pytest.raises(ValueError, match="outside source images"):
        ingest(source, tmp_path / "photos", tmp_path / "rights", tmp_path / "photos" / "out", plan=FIXTURE_PLAN)


@pytest.mark.skipif(os.name == "nt", reason="POSIX permission bits")
def test_published_ingest_files_are_owner_only(tmp_path: Path) -> None:
    _admit(tmp_path, _rows(tmp_path, 4))
    approved = tmp_path / "approved"
    assert approved.stat().st_mode & 0o077 == 0
    for name in ("train.jsonl", "eval.jsonl", "rejected.jsonl", "summary.json"):
        assert (approved / name).stat().st_mode & 0o777 == 0o600


def test_split_digest_is_ordered_and_length_separated() -> None:
    assert manifest_digest(b"ab", b"c") != manifest_digest(b"a", b"bc")
    assert manifest_digest(b"a", b"b") != manifest_digest(b"b", b"a")
    assert manifest_digest(b"", b"") == manifest_digest(b"", b"")


@pytest.mark.parametrize("change", [
    {"image_size": 48}, {"latent_dim": 100}, {"batch_size": 0}, {"steps": 0},
    {"learning_rate": 0.5}, {"learning_rate": float("nan")}, {"holdout_fraction": 0.9},
    {"seed": -1},
])
def test_training_plan_bounds(change: dict[str, Any]) -> None:
    values = {**FIXTURE_PLAN.__dict__, **change}
    with pytest.raises(ValueError):
        TrainingPlan(**values).validate()
