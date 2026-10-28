"""Checkpoint integrity: edited, noncanonical, foreign or linked files fail.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance import document_digest
from lab.synth_diversity.stress_provenance_checkpoint import (
    CHECKPOINT_NAME,
    CheckpointStore,
    checkpoint_from_bytes,
)
from lab.synth_diversity.stress_provenance_resume_fixtures import fixture_receipts, fixture_spec
from lab.synth_diversity.types import SyntheticInputError

SPEC = fixture_spec()


def committed(tmp_path: Path) -> Path:
    CheckpointStore(tmp_path, SPEC).commit(list(fixture_receipts(SPEC, 3)), None)
    return tmp_path / CHECKPOINT_NAME


def edit(path: Path, **change: object) -> None:
    data = json.loads(path.read_text())
    data.update(change)
    path.write_text(json.dumps(data, sort_keys=True, separators=(",", ":")) + "\n")


def test_valid_checkpoint_round_trips(tmp_path: Path) -> None:
    path = committed(tmp_path)
    assert checkpoint_from_bytes(path.read_bytes()).sequence == 0


@pytest.mark.parametrize("change", (
    {"sequence": 5}, {"attestation": "CLEARED_FOR_TRAINING"}, {"previous_sha256": "1" * 64},
    {"checkpoint_sha256": "2" * 64}, {"extra": True},
))
def test_edited_fields_fail_digest_or_schema(tmp_path: Path, change: dict[str, object]) -> None:
    path = committed(tmp_path)
    edit(path, **change)
    with pytest.raises(SyntheticInputError):
        CheckpointStore(tmp_path, SPEC).read()


def test_dropped_receipt_with_recomputed_digest_is_still_bound_to_plan(tmp_path: Path) -> None:
    path = committed(tmp_path)
    data = json.loads(path.read_text())
    data["receipts"] = [data["receipts"][1]]
    checkpoint_body = {key: value for key, value in data.items() if key != "checkpoint_sha256"}
    data["checkpoint_sha256"] = document_digest(checkpoint_body)
    path.write_text(json.dumps(data, sort_keys=True, separators=(",", ":")) + "\n")
    with pytest.raises(SyntheticInputError, match="reordered or skipped"):
        CheckpointStore(tmp_path, SPEC).read()


def test_pretty_printed_checkpoint_is_refused(tmp_path: Path) -> None:
    path = committed(tmp_path)
    path.write_text(json.dumps(json.loads(path.read_text()), indent=1))
    with pytest.raises(SyntheticInputError, match="noncanonical"):
        CheckpointStore(tmp_path, SPEC).read()


def test_checkpoint_for_another_plan_is_refused(tmp_path: Path) -> None:
    committed(tmp_path)
    with pytest.raises(SyntheticInputError, match="different corpus plan"):
        CheckpointStore(tmp_path, fixture_spec(seed=8)).read()


def test_symlinked_checkpoint_is_refused(tmp_path: Path) -> None:
    path = committed(tmp_path)
    moved = tmp_path / "elsewhere.json"
    path.rename(moved)
    path.symlink_to(moved)
    with pytest.raises(SyntheticInputError, match="linked"):
        CheckpointStore(tmp_path, SPEC).read()


def test_garbage_bytes_are_refused(tmp_path: Path) -> None:
    (tmp_path / CHECKPOINT_NAME).write_bytes(b"\x00\xff not json")
    with pytest.raises(SyntheticInputError):
        CheckpointStore(tmp_path, SPEC).read()
