"""Heldout MSE/PSNR aggregation must match the audited heldout population.

Author: John Khan.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Any

import pytest

from .audit import CorpusAudit, validate_corpus
from .scoring import ScoreInvalid, compare_aggregates, psnr_db, score_aggregates
from .test_support import make_corpus
from .train import train


def _audit(eval_sources: dict[str, int], manifest: str = "d" * 64) -> CorpusAudit:
    return CorpusAudit(
        image_size=32, train_count=100, eval_count=sum(eval_sources.values()),
        source_counts=dict(eval_sources), train_sources={}, eval_sources=dict(eval_sources),
        manifest_sha256=manifest, train_sha256="e" * 64, eval_sha256="f" * 64,
        revocations_sha256=None,
    )


AUDIT = _audit({"cc0_stock": 30, "fairface": 10})


def _rows(cc0: float, fairface: float) -> list[dict[str, Any]]:
    return [
        {"source": "cc0_stock", "count": 30, "mse": cc0},
        {"source": "fairface", "count": 10, "mse": fairface},
    ]


def test_overall_score_weights_every_heldout_image_once() -> None:
    card = score_aggregates(AUDIT, _rows(0.01, 0.05))
    public = card.public()
    assert public["overall"]["count"] == 40
    assert public["overall"]["mse"] == pytest.approx((30 * 0.01 + 10 * 0.05) / 40)
    assert public["sources"]["cc0_stock"]["psnr_db"] == pytest.approx(20.0)
    assert public["population"] == "AUDITED_HELDOUT_EXACT"
    assert public["release_quality"] == "NOT_RUN"


def test_psnr_is_finite_for_a_perfect_reconstruction() -> None:
    assert psnr_db(0.001) == pytest.approx(30.0)
    assert math.isfinite(psnr_db(0.0)) and psnr_db(0.0) == pytest.approx(100.0)
    with pytest.raises(ScoreInvalid):
        psnr_db(float("nan"))


@pytest.mark.parametrize("rows", [
    [{"source": "cc0_stock", "count": 30, "mse": 0.01}],
    [*_rows(0.01, 0.02), {"source": "government", "count": 5, "mse": 0.01}],
    [{"source": "cc0_stock", "count": 29, "mse": 0.01}, {"source": "fairface", "count": 11, "mse": 0.01}],
    [{"source": "cc0_stock", "count": 15, "mse": 0.0}, *_rows(0.01, 0.02)[1:],
     {"source": "cc0_stock", "count": 15, "mse": 0.5}],
])
def test_scores_on_a_different_population_are_refused(rows: list[dict[str, Any]]) -> None:
    with pytest.raises(ScoreInvalid):
        score_aggregates(AUDIT, rows)


@pytest.mark.parametrize("bad", [
    {"source": "cc0_stock", "count": 30, "mse": float("nan")},
    {"source": "cc0_stock", "count": 30, "mse": -0.1},
    {"source": "cc0_stock", "count": 30, "mse": 1.5},
    {"source": "cc0_stock", "count": 30, "mse": True},
    {"source": "cc0_stock", "count": 30.0, "mse": 0.1},
    {"source": "cc0_stock", "count": True, "mse": 0.1},
    {"source": "cc0 stock", "count": 30, "mse": 0.1},
    {"source": "cc0_stock", "count": 30, "mse": 0.1, "subject": "a" * 64},
])
def test_malformed_or_impossible_rows_are_refused(bad: dict[str, Any]) -> None:
    with pytest.raises(ScoreInvalid):
        score_aggregates(AUDIT, [bad, _rows(0.01, 0.01)[1]])


def test_score_input_must_be_a_bounded_list() -> None:
    hostile: tuple[object, ...] = ({"rows": []}, [], [_rows(0.1, 0.1)[0]] * 65)
    for rows in hostile:
        with pytest.raises(ScoreInvalid):
            score_aggregates(AUDIT, rows)


@pytest.mark.parametrize(("before", "after", "status"), [
    ((0.02, 0.02), (0.01, 0.01), "IMPROVED"),
    ((0.01, 0.01), (0.02, 0.03), "REGRESSED"),
    ((0.02, 0.01), (0.01, 0.02), "MIXED"),
    ((0.02, 0.01), (0.02, 0.01), "UNCHANGED"),
])
def test_comparison_reports_direction_per_source(
    before: tuple[float, float], after: tuple[float, float], status: str,
) -> None:
    result = compare_aggregates(score_aggregates(AUDIT, _rows(*before)), score_aggregates(AUDIT, _rows(*after)))
    assert result["status"] == status
    assert result["sources"]["cc0_stock"]["mse_delta"] == pytest.approx(after[0] - before[0])
    assert result["release_quality"] == "NOT_RUN"


def test_comparison_across_different_corpora_is_refused() -> None:
    other = _audit({"cc0_stock": 30, "fairface": 10}, manifest="0" * 64)
    with pytest.raises(ScoreInvalid, match="comparison_population_mismatch"):
        compare_aggregates(score_aggregates(AUDIT, _rows(0.1, 0.1)), score_aggregates(other, _rows(0.1, 0.1)))


def test_reference_trainer_heldout_rows_score_the_audited_population(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "corpus")
    report = train(corpus.approved, corpus.photos, tmp_path / "checkpoints", corpus.plan)
    audit = validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)
    before = score_aggregates(audit, report["heldout_before"]["sources"])
    after = score_aggregates(audit, report["heldout_after"]["sources"])
    assert after.count == audit.eval_count
    assert after.public()["overall"]["mse"] == pytest.approx(report["heldout_after"]["mse"], abs=1e-9)
    assert compare_aggregates(before, after)["overall_mse_delta"] < 0
