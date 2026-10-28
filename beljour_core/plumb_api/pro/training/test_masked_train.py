"""Masked-patch reference training end to end on drawn images. Author: John Khan."""

from __future__ import annotations

import json
import stat
from pathlib import Path

import numpy as np
import pytest

from .atomic import read_private_json
from .audit import validate_corpus
from .masked_train import (
    LATEST_NAME,
    MaskedCheckpoints,
    checkpoint_binding,
    score_masked_checkpoint,
    train_masked,
)
from .model_card import verify_model_card
from .patch_model import initial_weights
from .patches import PatchPlan
from .test_support import DrawnCorpus, make_corpus


@pytest.fixture(scope="module")
def corpus(tmp_path_factory: pytest.TempPathFactory) -> DrawnCorpus:
    return make_corpus(tmp_path_factory.mktemp("masked-corpus"))


def test_run_reports_aggregates_and_writes_numeric_checkpoint(
    corpus: DrawnCorpus, tmp_path: Path,
) -> None:
    folder = tmp_path / "checkpoints"
    report = train_masked(corpus.approved, corpus.photos, folder, corpus.plan, PatchPlan())
    assert report["steps"] == corpus.plan.steps
    assert report["release_gate"] == "NOT_RUN"
    assert report["persisted"] == "NUMERIC_ARRAYS_ONLY"
    assert report["before"]["images"] == report["after"]["images"] == 16
    assert report["after"]["human_quality"] == "NOT_RUN"
    assert report["resource_estimate"]["basis"] == "ANALYTIC_ESTIMATE_NOT_MEASURED"
    names = sorted(item.name for item in folder.iterdir())
    assert names == [
        "patch-checkpoint-00000004.json", "patch-checkpoint-00000004.npz",
        LATEST_NAME, "patch-model-card-00000004.json",
    ]
    for item in folder.iterdir():
        assert stat.S_IMODE(item.stat().st_mode) == 0o600
    text = json.dumps(report)
    for record in corpus.records:
        assert record["subject_key"] not in text and record["sha256"] not in text
        assert record["image"] not in text


def test_model_card_matches_the_saved_step(corpus: DrawnCorpus, tmp_path: Path) -> None:
    report = train_masked(
        corpus.approved, corpus.photos, tmp_path, corpus.plan, PatchPlan(), steps_this_run=1,
    )
    card = verify_model_card(read_private_json(tmp_path / "patch-model-card-00000001.json"))
    assert card["checkpoint_sha256"] == report["checkpoint_sha256"]
    assert card["evaluation"]["masked_mse"] == report["after"]["masked_mse"]
    assert card["human_assessment"] == "NOT_RUN"


def test_resume_continues_and_scoring_reproduces_the_report(
    corpus: DrawnCorpus, tmp_path: Path,
) -> None:
    first = train_masked(
        corpus.approved, corpus.photos, tmp_path, corpus.plan, PatchPlan(), steps_this_run=1,
    )
    assert first["steps"] == 1
    second = train_masked(
        corpus.approved, corpus.photos, tmp_path, corpus.plan, PatchPlan(),
        resume=True, steps_this_run=2,
    )
    assert second["steps"] == 3
    assert second["before"] == first["after"]
    scored = score_masked_checkpoint(corpus.approved, corpus.photos, tmp_path, corpus.plan, PatchPlan())
    assert scored["step"] == 3
    assert scored["evaluation"] == second["after"]


def test_fresh_run_over_existing_checkpoints_is_refused(corpus: DrawnCorpus, tmp_path: Path) -> None:
    train_masked(corpus.approved, corpus.photos, tmp_path, corpus.plan, PatchPlan(), steps_this_run=1)
    with pytest.raises(ValueError, match="already exists"):
        train_masked(corpus.approved, corpus.photos, tmp_path, corpus.plan, PatchPlan())


def test_completed_run_cannot_be_extended(corpus: DrawnCorpus, tmp_path: Path) -> None:
    train_masked(corpus.approved, corpus.photos, tmp_path, corpus.plan, PatchPlan())
    with pytest.raises(ValueError, match="completed"):
        train_masked(corpus.approved, corpus.photos, tmp_path, corpus.plan, PatchPlan(), resume=True)


@pytest.mark.parametrize("steps", [0, -2])
def test_invalid_run_lengths(corpus: DrawnCorpus, tmp_path: Path, steps: int) -> None:
    with pytest.raises(ValueError, match="step count"):
        train_masked(corpus.approved, corpus.photos, tmp_path, corpus.plan, PatchPlan(),
                     steps_this_run=steps)


def test_memory_budget_is_enforced_before_any_file(corpus: DrawnCorpus, tmp_path: Path) -> None:
    folder = tmp_path / "never"
    with pytest.raises(ValueError, match="memory budget"):
        train_masked(corpus.approved, corpus.photos, folder, corpus.plan,
                     PatchPlan(hidden_dim=512), memory_budget_bytes=1024 * 1024)
    assert not folder.exists()


def test_size_mismatch_is_refused(corpus: DrawnCorpus, tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="dimensions"):
        train_masked(corpus.approved, corpus.photos, tmp_path, corpus.plan, PatchPlan(image_size=64))


def test_store_round_trip_and_immutable_steps(corpus: DrawnCorpus, tmp_path: Path) -> None:
    audit = validate_corpus(corpus.approved, corpus.photos, corpus.plan)
    store = MaskedCheckpoints(
        tmp_path, patch_plan=PatchPlan(), binding=checkpoint_binding(corpus.plan, PatchPlan(), audit),
    )
    weights = initial_weights(PatchPlan())
    store.save(2, weights, train_loss=0.5)
    step, restored, metadata = store.load()
    assert step == 2 and metadata["train_loss"] == 0.5
    for name, value in weights.members().items():
        assert np.array_equal(value, restored.members()[name])
    with pytest.raises(ValueError, match="already exists"):
        store.save(2, weights, train_loss=0.4)
    with pytest.raises(ValueError, match="loss"):
        store.save(3, weights, train_loss=float("nan"))
