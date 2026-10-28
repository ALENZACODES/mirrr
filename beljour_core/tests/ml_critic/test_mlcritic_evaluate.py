"""Evaluation maths and the Markdown report.

ROC AUC is checked against a brute-force pair count; the report must carry the
scope note that rules out real-face claims.
Author: John Khan.
"""

from __future__ import annotations

import itertools

import numpy as np
import pytest

from lab.ml.critic import evaluate, markdown_report, roc_auc
from lab.ml.critic.evaluate import (
    SCOPE_NOTE,
    confusion,
    expected_calibration_error,
    per_kind,
    reliability,
    roc_curve,
)


def brute_auc(labels: np.ndarray, scores: np.ndarray) -> float:
    positives = scores[labels > 0.5]
    negatives = scores[labels < 0.5]
    total = 0.0
    for p, n in itertools.product(positives, negatives):
        total += 1.0 if p > n else 0.5 if p == n else 0.0
    return total / (positives.size * negatives.size)


def test_auc_matches_pair_counting_with_ties() -> None:
    rng = np.random.default_rng(0)
    labels = (rng.uniform(0, 1, 60) > 0.5).astype(np.float64)
    scores = np.round(rng.uniform(0, 1, 60) + 0.3 * labels, 1)
    assert roc_auc(labels, scores) == pytest.approx(brute_auc(labels, scores))


def test_auc_extremes_and_errors() -> None:
    labels = np.array([0.0, 0.0, 1.0, 1.0])
    assert roc_auc(labels, np.array([0.1, 0.2, 0.8, 0.9])) == 1.0
    assert roc_auc(labels, np.array([0.9, 0.8, 0.2, 0.1])) == 0.0
    assert roc_auc(labels, np.full(4, 0.5)) == 0.5
    with pytest.raises(ValueError, match="both classes"):
        roc_auc(np.ones(3), np.ones(3))


def test_roc_curve_runs_from_origin_to_corner() -> None:
    labels = np.array([0.0, 1.0, 0.0, 1.0, 1.0])
    scores = np.array([0.1, 0.9, 0.4, 0.6, 0.3])
    fpr, tpr, thresholds = roc_curve(labels, scores)
    assert (fpr[0], tpr[0]) == (0.0, 0.0)
    assert (fpr[-1], tpr[-1]) == (1.0, 1.0)
    assert np.all(np.diff(fpr) >= 0) and np.all(np.diff(tpr) >= 0)
    assert thresholds[0] == np.inf
    area = float(np.sum(np.diff(fpr) * (tpr[1:] + tpr[:-1]) / 2.0))
    assert area == pytest.approx(roc_auc(labels, scores))


def test_confusion_counts_and_rates() -> None:
    labels = np.array([1.0, 1.0, 1.0, 0.0, 0.0])
    probs = np.array([0.9, 0.6, 0.2, 0.7, 0.1])
    counts = confusion(labels, probs, 0.5)
    assert (counts.true_pos, counts.false_pos, counts.true_neg, counts.false_neg) == (2, 1, 1, 1)
    assert counts.precision == pytest.approx(2 / 3)
    assert counts.recall == pytest.approx(2 / 3)
    assert counts.false_pass_rate == pytest.approx(1 / 3)
    assert counts.false_fail_rate == pytest.approx(1 / 2)


def test_confusion_with_nothing_flagged() -> None:
    counts = confusion(np.array([0.0, 0.0]), np.array([0.1, 0.2]), 0.5)
    assert counts.precision == 1.0
    assert counts.recall == 1.0
    assert counts.false_pass_rate == 0.0


def test_reliability_of_a_calibrated_source_is_small() -> None:
    rng = np.random.default_rng(1)
    probs = rng.uniform(0, 1, 20000)
    labels = (rng.uniform(0, 1, 20000) < probs).astype(np.float64)
    table = reliability(labels, probs)
    assert len(table) == 10
    assert sum(item.count for item in table) == 20000
    assert expected_calibration_error(table) < 0.02


def test_reliability_of_an_overconfident_source_is_large() -> None:
    rng = np.random.default_rng(2)
    probs = rng.uniform(0, 1, 5000)
    labels = (rng.uniform(0, 1, 5000) < 0.5).astype(np.float64)
    assert expected_calibration_error(reliability(labels, probs)) > 0.2
    assert expected_calibration_error([]) == 0.0


def test_per_kind_splits_by_strength() -> None:
    kinds = [None, None, "seam", "seam", "halo"]
    strengths = np.array([0.0, 0.0, 0.3, 0.9, 0.7])
    probs = np.array([0.1, 0.6, 0.2, 0.9, 0.8])
    rows = {row.kind: row for row in per_kind(kinds, strengths, probs, 0.5)}
    assert list(rows) == ["clean", "halo", "seam"]
    assert rows["clean"].flagged_rate == 0.5
    assert np.isnan(rows["clean"].weak_flagged_rate)
    assert rows["seam"].weak_flagged_rate == 0.0
    assert rows["seam"].strong_flagged_rate == 1.0
    assert np.isnan(rows["halo"].weak_flagged_rate)


def test_markdown_report_has_scope_and_tables() -> None:
    labels = np.array([0.0, 0.0, 1.0, 1.0])
    probs = np.array([0.1, 0.4, 0.6, 0.95])
    result = evaluate(labels, probs, [None, None, "seam", "jpeg"], np.array([0, 0, 0.4, 0.8]))
    text = markdown_report(result)
    assert SCOPE_NOTE in text
    assert "real faces" in text
    assert "| seam |" in text and "| clean |" in text
    assert "ROC AUC (artifact vs clean): 1.0000" in text


def test_evaluate_checks_lengths() -> None:
    with pytest.raises(ValueError, match="same length"):
        evaluate(np.zeros(3), np.zeros(2), [None] * 3, np.zeros(3))
    with pytest.raises(ValueError, match="one artifact kind"):
        evaluate(np.array([0.0, 1.0]), np.zeros(2), [None], np.zeros(2))
