"""Patch model initialisation, analytic gradients and learning on synthetic batches.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from .patch_model import (
    MAX_GRADIENT_NORM,
    PatchWeights,
    initial_weights,
    masked_squared_error,
    reconstruct,
    trained_step,
)
from .patches import MaskedTargets, PatchPlan, masked_example

SMALL = PatchPlan(image_size=32, patch_edge=2, hidden_dim=6, masked_fraction=0.5)


def _batch(plan: PatchPlan, images: int = 2, seed: int = 5) -> tuple[np.ndarray, MaskedTargets]:
    rng = np.random.default_rng(seed)
    rows, values, weights = [], [], []
    for index in range(images):
        pixels = rng.random(plan.image_size * plan.image_size * 3).astype(np.float32)
        inputs, targets = masked_example(pixels, f"{index:064x}", plan, phase="train")
        rows.append(inputs)
        values.append(targets.values)
        weights.append(targets.weights)
    return np.concatenate(rows), MaskedTargets(np.concatenate(values), np.concatenate(weights))


def _loss(inputs: np.ndarray, targets: MaskedTargets, model: PatchWeights) -> float:
    hidden = np.tanh(inputs.astype(np.float64) @ model.encoder + model.encoder_bias)
    output = inputs[:, :SMALL.patch_width] + hidden @ model.decoder + model.decoder_bias
    residual = (output - targets.values) * targets.weights
    return float(np.sum(residual ** 2) / np.count_nonzero(targets.weights))


def test_initial_weights_are_seeded_and_shaped() -> None:
    plan = PatchPlan()
    first, again = initial_weights(plan), initial_weights(plan)
    for name, value in first.members().items():
        assert value.dtype == np.float32
        assert np.array_equal(value, again.members()[name])
    assert first.encoder.shape == (plan.patch_width + 2, plan.hidden_dim)
    assert first.decoder.shape == (plan.hidden_dim, plan.patch_width)
    assert not np.array_equal(first.encoder, initial_weights(PatchPlan(seed=1)).encoder)
    assert first.parameter_count() == (50 * 32) + 32 + (32 * 48) + 48


def test_untrained_model_starts_next_to_the_visible_baseline() -> None:
    inputs, targets = _batch(SMALL)
    model = initial_weights(SMALL)
    error, count = masked_squared_error(reconstruct(inputs, model), targets)
    baseline, _ = masked_squared_error(inputs[:, :SMALL.patch_width], targets)
    assert count == int(targets.weights.sum())
    assert abs(error - baseline) / baseline < 0.05


def test_analytic_gradient_matches_finite_differences() -> None:
    inputs, targets = _batch(SMALL, images=1)
    model = initial_weights(SMALL)
    rate = 1e-4
    updated, loss = trained_step(inputs, targets, model, SMALL, rate)
    assert loss == pytest.approx(_loss(inputs, targets, model), rel=1e-5)
    analytic = (model.encoder.astype(np.float64) - updated.encoder) / rate
    rng = np.random.default_rng(1)
    for _ in range(6):
        row, column = int(rng.integers(0, 14)), int(rng.integers(0, 6))
        plus, minus = model.copy(), model.copy()
        plus.encoder[row, column] += 1e-2
        minus.encoder[row, column] -= 1e-2
        numeric = (_loss(inputs, targets, plus) - _loss(inputs, targets, minus)) / 2e-2
        assert analytic[row, column] == pytest.approx(numeric, rel=0.05, abs=2e-4)


def test_training_learns_structure_the_baseline_misses() -> None:
    # Smooth drawn ramps: hidden values follow from their neighbours, which a
    # patch mean cannot capture but the network can learn.
    rows, cols = np.mgrid[0:32, 0:32] / 31.0
    pixels = np.stack((cols, rows, cols * rows), axis=-1).astype(np.float32).reshape(-1)
    inputs, targets = masked_example(pixels, "1" * 64, SMALL, phase="train")
    model = initial_weights(SMALL)
    losses = []
    for _ in range(300):
        model, loss = trained_step(inputs, targets, model, SMALL, 0.2)
        losses.append(loss)
    baseline, count = masked_squared_error(inputs[:, :SMALL.patch_width], targets)
    assert losses[-1] < 0.25 * losses[0]
    assert losses[-1] < 0.25 * baseline / count
    assert all(np.isfinite(losses))


def test_step_is_pure_and_deterministic() -> None:
    inputs, targets = _batch(SMALL)
    model = initial_weights(SMALL)
    before = model.copy()
    first = trained_step(inputs, targets, model, SMALL, 0.01)
    second = trained_step(inputs, targets, model, SMALL, 0.01)
    for name, value in model.members().items():
        assert np.array_equal(value, before.members()[name])
    assert first[1] == second[1]
    assert np.array_equal(first[0].decoder, second[0].decoder)


def test_update_size_is_clipped() -> None:
    inputs, targets = _batch(SMALL)
    shifted = MaskedTargets(targets.values + np.float32(50.0), targets.weights)
    model = initial_weights(SMALL)
    updated, _ = trained_step(inputs, shifted, model, SMALL, 0.5)
    change = np.sqrt(sum(
        float(np.sum((after.astype(np.float64) - before) ** 2))
        for after, before in zip(updated.members().values(), model.members().values(), strict=True)
    ))
    assert change <= 0.5 * MAX_GRADIENT_NORM * 1.0001


def test_reconstruction_stays_in_pixel_range() -> None:
    inputs, _ = _batch(SMALL)
    model = initial_weights(SMALL)
    model.decoder_bias[:] = 5.0
    output = reconstruct(inputs, model)
    assert output.min() >= 0.0 and output.max() <= 1.0


@pytest.mark.parametrize("damage", ["nan_input", "bad_weights", "no_hidden", "wrong_width", "float64"])
def test_invalid_batches_are_refused(damage: str) -> None:
    inputs, targets = _batch(SMALL)
    if damage == "nan_input":
        inputs[0, 0] = np.nan
    elif damage == "bad_weights":
        targets = MaskedTargets(targets.values, targets.weights * 0.5)
    elif damage == "no_hidden":
        targets = MaskedTargets(targets.values, np.zeros_like(targets.weights))
    elif damage == "wrong_width":
        inputs = inputs[:, 1:]
    else:
        inputs = inputs.astype(np.float64)
    with pytest.raises(ValueError):
        trained_step(inputs, targets, initial_weights(SMALL), SMALL, 0.01)


def test_weights_verify_shapes_dtypes_and_finiteness() -> None:
    model = initial_weights(SMALL)
    with pytest.raises(ValueError, match="shape"):
        model.verify(PatchPlan(image_size=32, patch_edge=2, hidden_dim=7))
    wrong = model.copy()
    wrong.decoder = wrong.decoder.astype(np.float64)
    with pytest.raises(ValueError, match="dtype"):
        wrong.verify(SMALL)
    broken = model.copy()
    broken.encoder_bias[0] = np.inf
    with pytest.raises(ValueError, match="Nonfinite"):
        broken.verify(SMALL)


@pytest.mark.parametrize("rate", [0.0, -0.1, 1.0, float("nan")])
def test_learning_rate_bounds(rate: float) -> None:
    inputs, targets = _batch(SMALL)
    with pytest.raises(ValueError, match="learning rate"):
        trained_step(inputs, targets, initial_weights(SMALL), SMALL, rate)
