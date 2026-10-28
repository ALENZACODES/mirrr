"""Heldout masked scoring: totals, PSNR and the visible-context baseline.

Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import replace

import numpy as np
import pytest

from .audit import CorpusAudit, validate_corpus
from .masked_train import _examples, _rows, evaluate, psnr
from .patch_model import initial_weights
from .patches import PatchPlan, visible_context_baseline
from .test_support import DrawnCorpus, make_corpus


@pytest.fixture(scope="module")
def setting(tmp_path_factory: pytest.TempPathFactory) -> tuple[DrawnCorpus, CorpusAudit]:
    corpus = make_corpus(tmp_path_factory.mktemp("eval-corpus"))
    return corpus, validate_corpus(corpus.approved, corpus.photos, corpus.plan)


def test_scores_cover_exactly_the_audited_heldout_split(
    setting: tuple[DrawnCorpus, CorpusAudit],
) -> None:
    corpus, audit = setting
    rows = _rows(corpus.approved, corpus.photos, corpus.plan, "eval")
    result = evaluate(rows, PatchPlan(), initial_weights(PatchPlan()), audit)
    plan = PatchPlan()
    per_image = plan.patches_per_image * plan.hidden_pixels * 3
    assert result["images"] == audit.eval_count == len(rows)
    assert result["masked_values"] == per_image * len(rows)
    assert {name: row["images"] for name, row in result["by_source"].items()} == audit.eval_sources
    assert sum(row["masked_values"] for row in result["by_source"].values()) == result["masked_values"]
    pooled = sum(
        row["masked_mse"] * row["masked_values"] for row in result["by_source"].values()
    ) / result["masked_values"]
    assert pooled == pytest.approx(result["masked_mse"], abs=1e-8)
    assert result["masked_psnr"] == pytest.approx(10 * math.log10(1 / result["masked_mse"]), abs=1e-5)
    assert result["human_quality"] == "NOT_RUN"


def test_baseline_score_is_independent_of_the_model(
    setting: tuple[DrawnCorpus, CorpusAudit],
) -> None:
    corpus, audit = setting
    rows = _rows(corpus.approved, corpus.photos, corpus.plan, "eval")
    plain = evaluate(rows, PatchPlan(), initial_weights(PatchPlan()), audit)
    other = evaluate(rows, PatchPlan(), initial_weights(PatchPlan(seed=99)), audit)
    assert plain["baseline_mse"] == other["baseline_mse"]
    assert plain["masked_mse"] != other["masked_mse"]


def test_baseline_value_is_recomputable_by_hand(setting: tuple[DrawnCorpus, CorpusAudit]) -> None:
    corpus, audit = setting
    rows = _rows(corpus.approved, corpus.photos, corpus.plan, "eval")
    total, count = 0.0, 0
    for row in rows:
        _, targets = _examples((row,), PatchPlan(), phase="eval")
        guess = visible_context_baseline(targets, PatchPlan())
        hidden = targets.weights > 0
        total += float(np.sum((guess[hidden].astype(np.float64) - targets.values[hidden]) ** 2))
        count += int(hidden.sum())
    result = evaluate(rows, PatchPlan(), initial_weights(PatchPlan()), audit)
    assert result["baseline_mse"] == pytest.approx(total / count, abs=1e-9)


def test_untrained_model_does_not_claim_to_beat_the_baseline(
    setting: tuple[DrawnCorpus, CorpusAudit],
) -> None:
    corpus, audit = setting
    rows = _rows(corpus.approved, corpus.photos, corpus.plan, "eval")
    result = evaluate(rows, PatchPlan(), initial_weights(PatchPlan()), audit)
    assert result["beats_baseline"] is (result["masked_mse"] < result["baseline_mse"])
    assert result["beats_baseline"] is False


def test_population_that_differs_from_the_audit_is_refused(
    setting: tuple[DrawnCorpus, CorpusAudit],
) -> None:
    corpus, audit = setting
    rows = _rows(corpus.approved, corpus.photos, corpus.plan, "eval")
    model = initial_weights(PatchPlan())
    with pytest.raises(ValueError, match="Heldout population"):
        evaluate(rows[:-1], PatchPlan(), model, audit)
    with pytest.raises(ValueError, match="Heldout population"):
        evaluate(_rows(corpus.approved, corpus.photos, corpus.plan, "train"), PatchPlan(), model, audit)
    relabelled = [replace(rows[0], source="government" if rows[0].source != "government" else "fairface"),
                  *rows[1:]]
    with pytest.raises(ValueError, match="Heldout population"):
        evaluate(relabelled, PatchPlan(), model, audit)


def test_psnr_definition() -> None:
    assert psnr(0.01) == pytest.approx(20.0)
    assert psnr(1.0) == 0.0
    assert psnr(0.0) is None


def test_changed_image_bytes_stop_scoring(tmp_path_factory: pytest.TempPathFactory) -> None:
    corpus = make_corpus(tmp_path_factory.mktemp("eval-tamper"), size=18)
    audit = validate_corpus(corpus.approved, corpus.photos, corpus.plan)
    rows = _rows(corpus.approved, corpus.photos, corpus.plan, "eval")
    rows[0].path.write_bytes(rows[0].path.read_bytes() + b"\x00")
    with pytest.raises(ValueError, match="changed"):
        evaluate(rows, PatchPlan(), initial_weights(PatchPlan()), audit)
