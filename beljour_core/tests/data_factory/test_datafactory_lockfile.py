"""Data locks pin a manifest and its config and fail closed on any drift.

Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from plumb_api.data_factory.hashing import hash_json, sha256_text
from plumb_api.data_factory.lockfile import (
    LOCK_FORMAT,
    LockError,
    assert_lock,
    build_lock,
    read_lock,
    structure_problems,
    verify_lock,
    write_lock,
)
from plumb_api.data_factory.manifest import write_manifest
from plumb_api.data_factory.synthetic import fake_records

CONFIG_HASH = hash_json({"stage": "test"})


def locked_set(tmp_path: Path, count: int = 40) -> tuple[Path, Path]:
    manifest = tmp_path / "manifest.jsonl"
    summary = write_manifest(manifest, [(r, {}) for r in fake_records(count, seed=8)], shards=4)
    lock = build_lock(summary, manifest.name, CONFIG_HASH, set_name="train-a")
    lock_path = tmp_path / "data.lock"
    write_lock(lock_path, lock)
    return manifest, lock_path


def edit_lock(path: Path, change: dict[str, Any], *, rehash: bool) -> None:
    lock = json.loads(path.read_text())
    lock.update(change)
    if rehash:
        lock["lock_sha256"] = hash_json({k: v for k, v in lock.items() if k != "lock_sha256"})
    path.write_text(json.dumps(lock))


def test_fresh_lock_verifies(tmp_path: Path) -> None:
    _, lock_path = locked_set(tmp_path)
    assert verify_lock(lock_path, filter_config_sha256=CONFIG_HASH) == []
    lock = assert_lock(lock_path)
    assert lock["format"] == LOCK_FORMAT
    assert lock["manifest"]["record_count"] == 40
    assert read_lock(lock_path) == lock


def test_lock_is_never_overwritten_in_place(tmp_path: Path) -> None:
    _, lock_path = locked_set(tmp_path)
    lock = read_lock(lock_path)
    with pytest.raises(LockError, match="already exists"):
        write_lock(lock_path, lock)
    write_lock(lock_path, lock, replace=True)


def test_manifest_drift_fails(tmp_path: Path) -> None:
    manifest, lock_path = locked_set(tmp_path)
    write_manifest(manifest, [(r, {}) for r in fake_records(41, seed=8)], shards=4)
    problems = verify_lock(lock_path)
    assert any("record count 41" in p for p in problems)
    assert any("file hash" in p for p in problems)
    assert any(p.startswith("shard ") for p in problems)
    with pytest.raises(LockError):
        assert_lock(lock_path)


def test_missing_or_broken_manifest_fails(tmp_path: Path) -> None:
    manifest, lock_path = locked_set(tmp_path)
    text = manifest.read_text().splitlines()
    manifest.write_text("\n".join(text[:-1]) + "\n")
    assert any("manifest invalid" in p for p in verify_lock(lock_path))
    manifest.unlink()
    assert any("is missing" in p for p in verify_lock(lock_path))


def test_config_and_tool_drift(tmp_path: Path) -> None:
    _, lock_path = locked_set(tmp_path)
    other = sha256_text("other config")
    assert any("filter config" in p for p in verify_lock(lock_path, filter_config_sha256=other))
    edit_lock(lock_path, {"tool_version": "0.0.1"}, rehash=True)
    assert any("tool version" in p for p in verify_lock(lock_path))
    assert verify_lock(lock_path, require_tool_version=False) == []
    edit_lock(lock_path, {"tool": "someone-else"}, rehash=True)
    assert any("written by" in p for p in verify_lock(lock_path, require_tool_version=False))


def test_hand_edits_fail_self_hash(tmp_path: Path) -> None:
    _, lock_path = locked_set(tmp_path)
    edit_lock(lock_path, {"set_name": "renamed"}, rehash=False)
    assert any("self hash" in p for p in verify_lock(lock_path))


@pytest.mark.parametrize("change", [
    {"format": "beljour-frozen-lock/1"},
    {"extra": 1},
    {"version": 0},
    {"set_name": " "},
    {"filter_config_sha256": "abc"},
    {"parent_lock_sha256": "abc"},
    {"manifest": {"file": "x"}},
    {"manifest": None},
])
def test_structure_problems(tmp_path: Path, change: dict[str, Any]) -> None:
    _, lock_path = locked_set(tmp_path)
    edit_lock(lock_path, change, rehash=True)
    assert verify_lock(lock_path) != []


def test_manifest_section_checks(tmp_path: Path) -> None:
    _, lock_path = locked_set(tmp_path)
    lock = read_lock(lock_path)
    some = next(iter(lock["manifest"]["shards"].values()))
    for key, value in (("file", "../escape.jsonl"), ("file_sha256", "x"), ("record_count", -1),
                       ("compressed", "no"), ("shards", {"0": {"count": 1}}),
                       ("record_count", 999), ("shards", {"x": some}), ("shards", {"07": some}),
                       ("shards", {"99": some}), ("shards", {"0": {**some, "count": "1"}})):
        broken = json.loads(json.dumps(lock))
        broken["manifest"][key] = value
        broken["lock_sha256"] = hash_json(
            {k: v for k, v in broken.items() if k != "lock_sha256"})
        assert structure_problems(broken), key
    assert structure_problems([1]) == ["lock must be a JSON object"]


def test_unreadable_lock(tmp_path: Path) -> None:
    path = tmp_path / "data.lock"
    path.write_text("{not json")
    assert verify_lock(path) == ["lock unreadable: data.lock"]
    assert verify_lock(tmp_path / "absent.lock") == ["lock unreadable: absent.lock"]


def test_build_lock_input_checks(tmp_path: Path) -> None:
    manifest = tmp_path / "m.jsonl"
    summary = write_manifest(manifest, [], shards=2)
    with pytest.raises(LockError):
        build_lock(summary, manifest.name, "bad", set_name="s")
    with pytest.raises(LockError):
        build_lock(summary, manifest.name, CONFIG_HASH, set_name="s", parent_lock_sha256="x")
    with pytest.raises(LockError):
        build_lock(summary, manifest.name, CONFIG_HASH, set_name="", version=1)
    empty = build_lock(summary, manifest.name, CONFIG_HASH, set_name="empty")
    write_lock(tmp_path / "empty.lock", empty)
    assert verify_lock(tmp_path / "empty.lock") == []
    with pytest.raises(LockError):
        write_lock(tmp_path / "bad.lock", {"format": LOCK_FORMAT})
