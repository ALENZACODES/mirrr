"""Exclusive shard writer and fail-closed unknown-artifact regression tests.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.plan import make_plans
from lab.synth_diversity.shards import (
    LOCK_SUFFIX,
    _json_bytes,
    verify_shards,
    write_shards,
)
from lab.synth_diversity.types import BaseFace, SyntheticInputError, TraitPlan


def _inputs() -> tuple[list[BaseFace], list[TraitPlan]]:
    """Construct a small, always-code-drawn source and deterministic plans."""
    face = make_drawn_face(seed=17, size=(96, 112))
    return [face], make_plans(3, seed=23)


def _ledger(folder: Path) -> dict[str, Any]:
    """Read a bounded locally produced ledger for assertions."""
    return json.loads((folder / "shards.json").read_text(encoding="utf-8"))


def _lock_file(folder: Path) -> Path:
    """Resolve the sibling lock name without opening a data artifact."""
    return folder.with_name(folder.name + LOCK_SUFFIX)


def test_writer_holds_exclusive_lock_during_callbacks(tmp_path: Path) -> None:
    faces, plans = _inputs()
    root = tmp_path / "locked"
    events: list[int] = []

    def attempt_second_writer(shard_number: int) -> None:
        events.append(shard_number)
        assert _lock_file(root).is_file()
        with pytest.raises(SyntheticInputError, match="holds the job lock"):
            write_shards(root, faces, plans, shard_size=2, resume=True)

    write_shards(root, faces, plans, shard_size=2, after_shard=attempt_second_writer)
    assert events == [0, 1]
    assert not _lock_file(root).exists()
    assert verify_shards(root) == []


def test_error_releases_lock_but_never_discards_completed_work(tmp_path: Path) -> None:
    faces, plans = _inputs()
    root = tmp_path / "recover"

    def fail_after_first(shard_number: int) -> None:
        if shard_number == 0:
            raise OSError("intentional stop")

    with pytest.raises(OSError, match="intentional"):
        write_shards(root, faces, plans, shard_size=2, after_shard=fail_after_first)
    assert not _lock_file(root).exists()
    original = (root / "shard-000000" / "manifest.jsonl").read_bytes()
    write_shards(root, faces, plans, shard_size=2, resume=True)
    assert (root / "shard-000000" / "manifest.jsonl").read_bytes() == original
    assert verify_shards(root) == []


def test_stale_job_lock_requires_manual_operator_clearance(tmp_path: Path) -> None:
    faces, plans = _inputs()
    root = tmp_path / "locked"
    lock = _lock_file(root)
    lock.write_bytes(b"a previous local owner\n")
    with pytest.raises(SyntheticInputError, match="holds the job lock"):
        write_shards(root, faces, plans)
    assert lock.read_bytes() == b"a previous local owner\n"
    assert not root.exists()
    lock.unlink()
    write_shards(root, faces, plans)
    assert verify_shards(root) == []


def test_symlinked_lock_is_not_followed_or_removed(tmp_path: Path) -> None:
    faces, plans = _inputs()
    root = tmp_path / "target"
    victim = tmp_path / "victim.txt"
    victim.write_text("never touch", encoding="utf-8")
    lock = _lock_file(root)
    lock.symlink_to(victim)
    with pytest.raises(SyntheticInputError, match="holds the job lock"):
        write_shards(root, faces, plans)
    assert victim.read_text(encoding="utf-8") == "never touch"
    assert lock.is_symlink()
    assert not root.exists()


def test_ledger_has_provenance_bound_aggregate_digest(tmp_path: Path) -> None:
    faces, plans = _inputs()
    root = tmp_path / "committed"
    write_shards(root, faces, plans, shard_size=2)
    ledger = _ledger(root)
    assert ledger["complete"] is True
    assert isinstance(ledger["aggregate_sha256"], str)
    assert len(ledger["aggregate_sha256"]) == 64
    assert ledger["plan_sha256"] != ledger["aggregate_sha256"]
    assert verify_shards(root) == []
    write_shards(root, faces, plans, shard_size=2, resume=True)
    assert _ledger(root)["aggregate_sha256"] == ledger["aggregate_sha256"]


def test_digest_tampering_is_detected_before_resume(tmp_path: Path) -> None:
    faces, plans = _inputs()
    root = tmp_path / "tampered"
    write_shards(root, faces, plans, shard_size=2)
    ledger = _ledger(root)
    ledger["shards"][0]["sample_count"] += 1
    (root / "shards.json").write_bytes(_json_bytes(ledger))
    assert "shard aggregate checksum mismatch" in verify_shards(root)
    with pytest.raises(SyntheticInputError, match="aggregate"):
        write_shards(root, faces, plans, shard_size=2, resume=True)


def test_extra_shard_root_folder_is_never_accepted(tmp_path: Path) -> None:
    faces, plans = _inputs()
    root = tmp_path / "extra"
    write_shards(root, faces, plans, shard_size=2)
    unexpected = root / "shard-000099"
    unexpected.mkdir()
    assert "unrecorded files or folders in shard root" in verify_shards(root)
    with pytest.raises(SyntheticInputError, match="unexpected root artifacts"):
        write_shards(root, faces, plans, shard_size=2, resume=True)
    assert unexpected.is_dir()


def test_surprise_artifact_within_committed_shard_is_refused(tmp_path: Path) -> None:
    faces, plans = _inputs()
    root = tmp_path / "extra_png"
    write_shards(root, faces, plans, shard_size=2)
    forbidden = root / "shard-000000" / "surprise.png"
    forbidden.write_bytes(b"not a fixture")
    assert any("unexpected artifacts" in error for error in verify_shards(root))
    with pytest.raises(SyntheticInputError, match="unexpected shard artifacts"):
        write_shards(root, faces, plans, shard_size=2, resume=True)
    assert forbidden.read_bytes() == b"not a fixture"


def test_abandoned_temporary_ledger_is_not_ignored(tmp_path: Path) -> None:
    faces, plans = _inputs()
    root = tmp_path / "orphan"
    write_shards(root, faces, plans, shard_size=2)
    temporary = root / ".ledger-incomplete.tmp"
    temporary.write_bytes(b"incomplete")
    assert "unrecorded files or folders in shard root" in verify_shards(root)
    with pytest.raises(SyntheticInputError, match="unexpected root artifacts"):
        write_shards(root, faces, plans, shard_size=2, resume=True)


def test_missing_aggregate_recovers_only_via_full_manifest_verification(tmp_path: Path) -> None:
    faces, plans = _inputs()
    root = tmp_path / "old_ledger"
    write_shards(root, faces, plans, shard_size=2)
    ledger = _ledger(root)
    del ledger["aggregate_sha256"]
    (root / "shards.json").write_bytes(_json_bytes(ledger))
    assert "shard aggregate checksum mismatch" in verify_shards(root)
    write_shards(root, faces, plans, shard_size=2, resume=True)
    assert verify_shards(root) == []
    assert len(_ledger(root)["aggregate_sha256"]) == 64
