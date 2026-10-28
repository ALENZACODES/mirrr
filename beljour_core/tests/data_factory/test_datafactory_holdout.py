"""Holdout leak guard against synthetic frozen locks written in tmp_path.

The frozen locks here are built by the test in the frozen format; no real
frozen set is read or changed.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from plumb_api.data_factory.holdout import (
    FROZEN_LOCK_FORMAT,
    HoldoutError,
    HoldoutGuard,
    find_frozen_locks,
    frozen_faces_hash,
    load_frozen_lock,
)
from plumb_api.data_factory.manifest import write_manifest
from plumb_api.data_factory.synthetic import fake_hash, fake_records


def frozen_lock(folder: Path, hashes: list[str]) -> Path:
    faces = [{"face_id": f"f{index:05d}", "sha256": digest, "rel_path": f"img/{index}.png"}
             for index, digest in enumerate(hashes)]
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / "frozen.lock"
    path.write_text(json.dumps({"format": FROZEN_LOCK_FORMAT, "version": 1, "faces": faces,
                                "faces_sha256": frozen_faces_hash(faces)}))
    return path


def test_leaks_are_found_by_content_and_original_hash(tmp_path: Path) -> None:
    records = list(fake_records(20, seed=1))
    frozen_lock(tmp_path / "frozen" / "set-1000", [records[3].content_sha256, fake_hash(999)])
    frozen_lock(tmp_path / "frozen" / "set-10000", [records[3].content_sha256, fake_hash(77)])
    guard = HoldoutGuard.from_paths([tmp_path / "frozen"])
    assert guard.hash_count == 3
    items: list[tuple[str, list[str]]] = [(r.content_sha256, []) for r in records]
    items.append((fake_hash(1), [fake_hash(77)]))
    report = guard.check(items)
    assert report.checked == 21
    assert [leak.content_sha256 for leak in report.leaks] == sorted(
        [records[3].content_sha256, fake_hash(1)])
    by_hash = {leak.content_sha256: leak for leak in report.leaks}
    assert by_hash[records[3].content_sha256].frozen_sets == ("set-1000", "set-10000")
    assert by_hash[fake_hash(1)].matched_hash == fake_hash(77)
    with pytest.raises(HoldoutError, match="2 training records"):
        guard.assert_clean(report)
    assert report.to_dict()["leak_count"] == 2


def test_clean_manifest_passes(tmp_path: Path) -> None:
    lock = frozen_lock(tmp_path / "f" / "set-a", [fake_hash(5, "elsewhere")])
    manifest = tmp_path / "train.jsonl"
    write_manifest(manifest, [(r, {}) for r in fake_records(30, seed=2)], shards=2)
    guard = HoldoutGuard.from_paths([lock])
    report = guard.check_manifest(manifest)
    assert report.clean and report.checked == 30
    guard.assert_clean(report)


def test_manifest_original_hash_annotation(tmp_path: Path) -> None:
    records = list(fake_records(5, seed=4))
    secret = fake_hash(1, "upload")
    lock = frozen_lock(tmp_path / "f" / "s", [secret])
    manifest = tmp_path / "train.jsonl"
    rows = [(r, {"original_sha256": secret if i == 2 else fake_hash(i, "o")})
            for i, r in enumerate(records)]
    write_manifest(manifest, rows, shards=2)
    report = HoldoutGuard.from_paths([lock]).check_manifest(manifest)
    assert [leak.content_sha256 for leak in report.leaks] == [records[2].content_sha256]


@pytest.mark.parametrize("content", [
    "not json",
    json.dumps({"format": "beljour-data-lock/1", "faces": []}),
    json.dumps({"format": FROZEN_LOCK_FORMAT, "faces": []}),
    json.dumps({"format": FROZEN_LOCK_FORMAT, "faces": [{"face_id": "a"}]}),
    json.dumps({"format": FROZEN_LOCK_FORMAT,
                "faces": [{"face_id": "a", "sha256": "XYZ", "rel_path": "a.png"}]}),
])
def test_bad_frozen_locks_fail_closed(tmp_path: Path, content: str) -> None:
    path = tmp_path / "frozen.lock"
    path.write_text(content)
    with pytest.raises(HoldoutError):
        load_frozen_lock(path)


def test_edited_face_list_fails(tmp_path: Path) -> None:
    path = frozen_lock(tmp_path / "s", [fake_hash(1), fake_hash(2)])
    lock = json.loads(path.read_text())
    lock["faces"][1]["sha256"] = fake_hash(3)
    path.write_text(json.dumps(lock))
    with pytest.raises(HoldoutError, match="faces_sha256"):
        load_frozen_lock(path)


def test_folder_discovery(tmp_path: Path) -> None:
    with pytest.raises(HoldoutError):
        find_frozen_locks(tmp_path / "missing")
    (tmp_path / "empty").mkdir()
    with pytest.raises(HoldoutError, match="no frozen.lock"):
        HoldoutGuard.from_paths([tmp_path / "empty"])
    real = frozen_lock(tmp_path / "sets" / "a", [fake_hash(1)])
    link_dir = tmp_path / "sets" / "b"
    link_dir.mkdir()
    (link_dir / "frozen.lock").symlink_to(real)
    with pytest.raises(HoldoutError, match="symlink"):
        find_frozen_locks(tmp_path / "sets")


def test_frozen_lock_is_not_modified(tmp_path: Path) -> None:
    path = frozen_lock(tmp_path / "keep", [fake_hash(9)])
    before = path.read_bytes()
    HoldoutGuard.from_paths([path]).check([(fake_hash(9), [])])
    assert path.read_bytes() == before
