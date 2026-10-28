"""Numerics of the critic models: scaling, logistic regression, Platt scaling, MLP.

Pure maths on seeded random data; runs in well under a second.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.ml.critic.linear import (
    Logistic,
    Platt,
    Standardiser,
    check_xy,
    log_loss,
    sigmoid,
    split_indices,
)
from lab.ml.critic.mlp import MLP, gradient_check


def separable(rows: int, seed: int) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    features = rng.normal(0.0, 1.0, (rows, 3))
    logits = 2.0 * features[:, 0] - 1.0 * features[:, 1] + 0.5
    labels = (rng.uniform(0.0, 1.0, rows) < sigmoid(logits)).astype(np.float64)
    return features, labels


def test_sigmoid_is_stable_at_extremes() -> None:
    values = sigmoid(np.array([-1000.0, 0.0, 1000.0]))
    assert values.tolist() == [0.0, 0.5, 1.0]
    assert np.all(np.isfinite(values))


def test_log_loss_of_perfect_and_uninformed_predictions() -> None:
    labels = np.array([0.0, 1.0, 1.0, 0.0])
    assert log_loss(labels, labels) < 1e-9
    assert log_loss(labels, np.full(4, 0.5)) == pytest.approx(np.log(2.0))


def test_standardiser_centres_logged_features() -> None:
    rng = np.random.default_rng(0)
    data = rng.exponential(1.0, (200, 4))
    data[:, 3] = 0.0
    scaler = Standardiser.fit(data)
    out = scaler.transform(data)
    assert np.allclose(out[:, :3].mean(axis=0), 0.0, atol=1e-9)
    assert np.allclose(out[:, :3].std(axis=0), 1.0, atol=1e-9)
    assert np.allclose(out[:, 3], 0.0)


def test_logistic_recovers_true_weights() -> None:
    features, labels = separable(4000, 1)
    model = Logistic.fit(features, labels, l2=1e-6)
    assert model.weights[0] == pytest.approx(2.0, abs=0.25)
    assert model.weights[1] == pytest.approx(-1.0, abs=0.2)
    assert abs(float(model.weights[2])) < 0.15
    assert model.bias == pytest.approx(0.5, abs=0.15)


def test_logistic_gradient_is_zero_at_the_fit() -> None:
    features, labels = separable(500, 2)
    l2 = 1e-2
    model = Logistic.fit(features, labels, l2=l2)
    probs = model.predict(features)
    grad_w = features.T @ (probs - labels) + l2 * features.shape[0] * model.weights
    grad_b = float((probs - labels).sum())
    assert float(np.abs(grad_w).max()) < 1e-6
    assert abs(grad_b) < 1e-6


def test_l2_shrinks_weights() -> None:
    features, labels = separable(300, 3)
    loose = Logistic.fit(features, labels, l2=1e-6)
    tight = Logistic.fit(features, labels, l2=1.0)
    assert float(np.linalg.norm(tight.weights)) < float(np.linalg.norm(loose.weights))


@pytest.mark.parametrize(
    ("features", "labels", "message"),
    [
        (np.zeros(5), np.zeros(5), "2-D"),
        (np.zeros((5, 2)), np.zeros(4), "does not match"),
        (np.full((2, 1), np.nan), np.array([0.0, 1.0]), "NaN"),
        (np.zeros((3, 1)), np.array([0.0, 1.0, 2.0]), "0 or 1"),
        (np.zeros((3, 1)), np.ones(3), "both"),
    ],
)
def test_training_data_is_checked(features: np.ndarray, labels: np.ndarray,
                                  message: str) -> None:
    with pytest.raises(ValueError, match=message):
        check_xy(features, labels)


def test_platt_corrects_overconfident_scores() -> None:
    rng = np.random.default_rng(4)
    truth = rng.normal(0.0, 1.0, 3000)
    labels = (rng.uniform(0.0, 1.0, 3000) < sigmoid(truth)).astype(np.float64)
    platt = Platt.fit(4.0 * truth, labels)
    assert platt.a == pytest.approx(0.25, abs=0.05)
    assert abs(platt.b) < 0.1
    assert np.allclose(Platt.identity().apply(np.array([0.0])), [0.5])


def test_split_indices_partition_rows() -> None:
    first, second = split_indices(10, 0.3, seed=1)
    assert sorted(first.tolist() + second.tolist()) == list(range(10))
    assert second.size == 3
    with pytest.raises(ValueError):
        split_indices(10, 1.0, seed=1)


def test_mlp_backprop_matches_finite_differences() -> None:
    features, labels = separable(20, 5)
    model = MLP.initialise(3, 4, seed=1)
    assert gradient_check(model, features, labels, l2=1e-2) < 1e-5


def test_mlp_learns_a_non_linear_boundary() -> None:
    rng = np.random.default_rng(6)
    features = rng.uniform(-1.0, 1.0, (600, 2))
    labels = ((features[:, 0] * features[:, 1]) > 0).astype(np.float64)
    model = MLP.fit(features, labels, hidden=8, epochs=1500, rate=0.05, seed=2)
    accuracy = float(((model.predict(features) > 0.5) == (labels > 0.5)).mean())
    linear = Logistic.fit(features, labels)
    linear_accuracy = float(((linear.predict(features) > 0.5) == (labels > 0.5)).mean())
    assert accuracy > 0.9
    assert linear_accuracy < 0.7


def test_mlp_loss_falls_during_training() -> None:
    features, labels = separable(200, 7)
    start = MLP.initialise(3, 6, seed=3)
    before, _ = start.loss_and_gradients(features, labels, 1e-3)
    trained = MLP.fit(features, labels, hidden=6, epochs=300, seed=3)
    after, _ = trained.loss_and_gradients(features, labels, 1e-3)
    assert after < before
