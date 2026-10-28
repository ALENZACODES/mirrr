"""Determinism, interrupted runs and crash recovery for masked training.

Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from .atomic import read_private_json, write_private_json
from .audit import validate_corpus
from .masked_train import (
    LATEST_NAME,
    MaskedCheckpoints,
    archive_bytes,
    checkpoint_binding,
    train_masked,
)
from .patch_model import initial_weights
from .patches import PatchPlan
from .test_support import DrawnCorpus, make_corpus


@pytest.fixture(scope="module")
def corpus(tmp_path_factory: pytest.TempPathFactory) -> DrawnCorpus:
    return make_corpus(tmp_path_factory.mktemp("reliability-corpus"))


def _archive(folder: Path, step: int) -> bytes:
    return (folder / f"patch-checkpoint-{step:08d}.npz").read_bytes()


def test_two_independent_runs_are_byte_identical(corpus: DrawnCorpus, tmp_path: Path) -> None:
    first = train_masked(corpus.approved, corpus.photos, tmp_path / "a", corpus.plan, PatchPlan())
    second = train_masked(corpus.approved, corpus.photos, tmp_path / "b", corpus.plan, PatchPlan())
    assert first == second
    assert _archive(tmp_path / "a", 4) == _archive(tmp_path / "b", 4)


def test_interrupted_run_equals_uninterrupted_run(corpus: DrawnCorpus, tmp_path: Path) -> None:
    whole = train_masked(corpus.approved, corpus.photos, tmp_path / "whole", corpus.plan, PatchPlan())
    parts = tmp_path / "parts"
    train_masked(corpus.approved, corpus.photos, parts, corpus.plan, PatchPlan(), steps_this_run=1)
    train_masked(corpus.approved, corpus.photos, parts, corpus.plan, PatchPlan(),
                 resume=True, steps_this_run=2)
    last = train_masked(corpus.approved, corpus.photos, parts, corpus.plan, PatchPlan(), resume=True)
    assert last["after"] == whole["after"]
    assert last["train_loss"] == whole["train_loss"]
    assert _archive(parts, 4) == _archive(tmp_path / "whole", 4)


def test_different_patch_seed_changes_the_result(corpus: DrawnCorpus, tmp_path: Path) -> None:
    base = train_masked(corpus.approved, corpus.photos, tmp_path / "a", corpus.plan, PatchPlan(),
                        steps_this_run=1)
    other = train_masked(corpus.approved, corpus.photos, tmp_path / "b", corpus.plan,
                         PatchPlan(seed=5), steps_this_run=1)
    assert base["after"]["masked_mse"] != other["after"]["masked_mse"]


def test_crash_before_the_pointer_moved_is_recoverable(corpus: DrawnCorpus, tmp_path: Path) -> None:
    """Step 2 was fully written but the pointer still names step 1: resuming
    recomputes step 2 identically and the immutable files are accepted."""
    folder = tmp_path / "run"
    train_masked(corpus.approved, corpus.photos, folder, corpus.plan, PatchPlan(), steps_this_run=1)
    pointer = read_private_json(folder / LATEST_NAME)
    train_masked(corpus.approved, corpus.photos, folder, corpus.plan, PatchPlan(),
                 resume=True, steps_this_run=1)
    stored = _archive(folder, 2)
    write_private_json(folder / LATEST_NAME, pointer)
    (folder / "patch-model-card-00000002.json").unlink()
    again = train_masked(corpus.approved, corpus.photos, folder, corpus.plan, PatchPlan(),
                         resume=True, steps_this_run=1)
    assert again["steps"] == 2
    assert _archive(folder, 2) == stored
    assert (folder / "patch-model-card-00000002.json").exists()


def test_a_different_leftover_step_is_never_overwritten(corpus: DrawnCorpus, tmp_path: Path) -> None:
    audit = validate_corpus(corpus.approved, corpus.photos, corpus.plan)
    store = MaskedCheckpoints(
        tmp_path, patch_plan=PatchPlan(),
        binding=checkpoint_binding(corpus.plan, PatchPlan(), audit),
    )
    store.save(1, initial_weights(PatchPlan()), train_loss=0.1)
    with pytest.raises(ValueError, match="different content"):
        store.save(1, initial_weights(PatchPlan(seed=3)), train_loss=0.1)
    assert store.load()[0] == 1


def test_archive_bytes_depend_only_on_weights() -> None:
    weights = initial_weights(PatchPlan())
    assert archive_bytes(weights) == archive_bytes(weights.copy())
    assert archive_bytes(weights) != archive_bytes(initial_weights(PatchPlan(seed=1)))
