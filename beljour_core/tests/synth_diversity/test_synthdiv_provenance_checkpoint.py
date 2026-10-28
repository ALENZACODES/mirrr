"""Atomic resume checkpoints: prior-checksum chaining, extension and locking.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_checkpoint import (
    CHECKPOINT_NAME,
    LOCK_NAME,
    CheckpointStore,
)
from lab.synth_diversity.stress_provenance_resume_fixtures import fixture_receipts, fixture_spec
from lab.synth_diversity.types import SyntheticInputError

SPEC = fixture_spec()


def store(tmp_path: Path) -> CheckpointStore:
    return CheckpointStore(tmp_path, SPEC)


def test_empty_store_has_no_checkpoint(tmp_path: Path) -> None:
    assert store(tmp_path).read() is None


def test_commits_chain_by_previous_digest(tmp_path: Path) -> None:
    receipts = list(fixture_receipts(SPEC))
    first, state = store(tmp_path).commit(receipts[:2], None)
    assert first.sequence == 0 and first.previous_sha256 is None and state.completed == 2
    second, state = store(tmp_path).commit(receipts[:4], first.digest)
    assert second.sequence == 1 and second.previous_sha256 == first.digest
    assert state.completed == 4
    assert store(tmp_path).read() == second


def test_wrong_prior_checksum_is_refused(tmp_path: Path) -> None:
    receipts = list(fixture_receipts(SPEC))
    first, _ = store(tmp_path).commit(receipts[:1], None)
    with pytest.raises(SyntheticInputError, match="precondition"):
        store(tmp_path).commit(receipts[:2], None)
    with pytest.raises(SyntheticInputError, match="precondition"):
        store(tmp_path).commit(receipts[:2], "0" * 64)
    assert store(tmp_path).read() == first


def test_rewind_and_edit_of_acknowledged_jobs_are_refused(tmp_path: Path) -> None:
    receipts = list(fixture_receipts(SPEC))
    first, _ = store(tmp_path).commit(receipts[:3], None)
    with pytest.raises(SyntheticInputError, match="rewind"):
        store(tmp_path).commit(receipts[:2], first.digest)
    other = list(fixture_receipts(fixture_spec(seed=99)))
    with pytest.raises(SyntheticInputError, match="changed"):
        store(tmp_path).commit([other[0], *receipts[1:4]], first.digest)


def test_same_prefix_recommit_is_idempotent_in_content(tmp_path: Path) -> None:
    receipts = list(fixture_receipts(SPEC))
    first, _ = store(tmp_path).commit(receipts[:2], None)
    again, _ = store(tmp_path).commit(receipts[:2], first.digest)
    assert again.receipts == first.receipts and again.sequence == 1


def test_held_lock_blocks_a_second_writer(tmp_path: Path) -> None:
    (tmp_path / LOCK_NAME).write_text("12345")
    with pytest.raises(SyntheticInputError, match="lock"):
        store(tmp_path).commit(list(fixture_receipts(SPEC, 1)), None)
    assert not (tmp_path / CHECKPOINT_NAME).exists()


def test_lock_is_released_after_a_failed_commit(tmp_path: Path) -> None:
    with pytest.raises(SyntheticInputError):
        store(tmp_path).commit(list(fixture_receipts(fixture_spec(seed=3), 1)), None)
    assert not (tmp_path / LOCK_NAME).exists()
    assert store(tmp_path).commit(list(fixture_receipts(SPEC, 1)), None)[1].completed == 1


def test_store_must_be_outside_repository_and_real(tmp_path: Path) -> None:
    with pytest.raises(SyntheticInputError, match="repo"):
        CheckpointStore(Path(__file__).resolve().parent, SPEC)
    with pytest.raises(SyntheticInputError):
        CheckpointStore(tmp_path / "missing", SPEC)


def test_no_temporary_files_remain(tmp_path: Path) -> None:
    store(tmp_path).commit(list(fixture_receipts(SPEC, 2)), None)
    assert sorted(child.name for child in tmp_path.iterdir()) == [CHECKPOINT_NAME]
