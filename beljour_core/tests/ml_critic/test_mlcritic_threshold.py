"""Cost-based threshold selection: the Bayes rule, the empirical scan, and the fallback.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.ml.critic.linear import sigmoid
from lab.ml.critic.threshold import (
    bayes_threshold,
    choose_threshold,
    cost_at,
    empirical_threshold,
)


def calibrated(rows: int, seed: int) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    probs = sigmoid(rng.normal(0.0, 2.0, rows))
    labels = (rng.uniform(0.0, 1.0, rows) < probs).astype(np.float64)
    return labels, probs


def test_bayes_threshold_follows_costs() -> None:
    assert bayes_threshold(1.0, 1.0) == pytest.approx(0.5)
    assert bayes_threshold(5.0, 1.0) == pytest.approx(1 / 6)
    assert bayes_threshold(1.0, 3.0) == pytest.approx(0.75)
    with pytest.raises(ValueError, match="positive"):
        bayes_threshold(0.0, 1.0)


def test_cost_counts_both_mistakes() -> None:
    labels = np.array([1.0, 1.0, 0.0, 0.0])
    probs = np.array([0.9, 0.3, 0.6, 0.1])
    assert cost_at(labels, probs, 0.5, 5.0, 1.0) == (6.0, 1, 1)


def test_empirical_threshold_is_the_cheapest() -> None:
    labels, probs = calibrated(400, 1)
    choice = empirical_threshold(labels, probs, 5.0, 1.0)
    for value in np.linspace(0.0, 1.0, 101):
        total, _, _ = cost_at(labels, probs, float(value), 5.0, 1.0)
        assert choice.total_cost <= total + 1e-9


def test_empirical_threshold_is_near_bayes_on_calibrated_data() -> None:
    labels, probs = calibrated(20000, 2)
    choice = empirical_threshold(labels, probs, 5.0, 1.0)
    assert choice.artifact_threshold == pytest.approx(1 / 6, abs=0.05)
    assert choice.realism_threshold == pytest.approx(1.0 - choice.artifact_threshold)


def test_ties_take_the_lowest_threshold() -> None:
    labels = np.array([0.0, 1.0])
    probs = np.array([0.2, 0.8])
    choice = empirical_threshold(labels, probs, 1.0, 1.0)
    assert choice.total_cost == 0.0
    assert choice.artifact_threshold == pytest.approx(0.8)


def test_higher_false_pass_cost_lowers_the_threshold() -> None:
    labels, probs = calibrated(2000, 3)
    cheap = empirical_threshold(labels, probs, 1.0, 1.0)
    dear = empirical_threshold(labels, probs, 10.0, 1.0)
    assert dear.artifact_threshold < cheap.artifact_threshold
    assert dear.false_passes <= cheap.false_passes


def test_rule_falls_back_to_bayes_on_small_sets() -> None:
    labels = np.array([0.0, 1.0, 1.0])
    probs = np.array([0.1, 0.7, 0.9])
    choice = choose_threshold(labels, probs)
    assert choice.method == "bayes"
    assert choice.artifact_threshold == pytest.approx(1 / 6)
    labels, probs = calibrated(200, 4)
    assert choose_threshold(labels, probs).method == "empirical"


def test_empirical_checks_inputs() -> None:
    with pytest.raises(ValueError, match="non-empty"):
        empirical_threshold(np.zeros(0), np.zeros(0))
