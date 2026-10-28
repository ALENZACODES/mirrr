"""One-hidden-layer masked-patch reconstruction model in plain NumPy.

Forward pass: ``hidden = tanh(inputs @ encoder + encoder_bias)`` and
``output = filled + hidden @ decoder + decoder_bias``, where ``filled`` is the
input patch with hidden values set to their visible-context mean. The network
therefore learns a correction to that baseline; with its small initial decoder
it starts close to the baseline. The loss is the mean squared error
over hidden (masked) values only. Gradients are analytic, the update is plain
gradient descent with a global gradient-norm clip, and every computation is
deterministic for a given plan, seed and batch. This is a small auditable
reference, not a foundation model. Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .checkpoint_guard import expected_member_shapes
from .patches import MaskedTargets, PatchPlan

# ASSUMED clip: keeps a single unlucky batch from producing a huge step while
# leaving normal updates for pixel values in 0..1 untouched.
MAX_GRADIENT_NORM = 1.0
MAX_BATCH_ROWS = 4_194_304
# ASSUMED: a decoder this small starts the correction near zero, so the first
# reported loss sits next to the visible-context baseline instead of far above it.
DECODER_INIT = 0.01

Array = NDArray[np.float32]


@dataclass
class PatchWeights:
    encoder: Array
    encoder_bias: Array
    decoder: Array
    decoder_bias: Array

    def members(self) -> dict[str, Array]:
        return {
            "encoder.npy": self.encoder, "encoder_bias.npy": self.encoder_bias,
            "decoder.npy": self.decoder, "decoder_bias.npy": self.decoder_bias,
        }

    def verify(self, plan: PatchPlan) -> None:
        """Exact float32 shapes for this plan and finite values only."""
        for name, shape in expected_member_shapes(plan).items():
            value = self.members()[name]
            if not isinstance(value, np.ndarray) or value.dtype != np.float32:
                raise ValueError("Unexpected patch model dtype")
            if value.shape != shape:
                raise ValueError("Unexpected patch model shape")
            if not np.all(np.isfinite(value)):
                raise ValueError("Nonfinite patch model weights")

    def copy(self) -> PatchWeights:
        return PatchWeights(
            self.encoder.copy(), self.encoder_bias.copy(),
            self.decoder.copy(), self.decoder_bias.copy(),
        )

    def parameter_count(self) -> int:
        return sum(int(value.size) for value in self.members().values())


def initial_weights(plan: PatchPlan) -> PatchWeights:
    """Seeded Glorot-uniform encoder, a small seeded decoder and zero biases."""
    plan.validate()
    rng = np.random.default_rng([plan.seed, 34])
    width, hidden = plan.patch_width + 2, plan.hidden_dim
    first = math.sqrt(6.0 / (width + hidden))
    weights = PatchWeights(
        rng.uniform(-first, first, size=(width, hidden)).astype(np.float32),
        np.zeros(hidden, dtype=np.float32),
        rng.uniform(-DECODER_INIT, DECODER_INIT, size=(hidden, plan.patch_width)).astype(np.float32),
        np.zeros(plan.patch_width, dtype=np.float32),
    )
    weights.verify(plan)
    return weights


def _checked_batch(inputs: Array, targets: MaskedTargets, plan: PatchPlan) -> None:
    rows = inputs.shape[0] if inputs.ndim == 2 else -1
    if (inputs.dtype != np.float32 or inputs.shape != (rows, plan.patch_width + 2)
            or not 1 <= rows <= MAX_BATCH_ROWS):
        raise ValueError("Unexpected patch model inputs")
    for part in (targets.values, targets.weights):
        if part.dtype != np.float32 or part.shape != (rows, plan.patch_width):
            raise ValueError("Unexpected patch model targets")
    if not (np.all(np.isfinite(inputs)) and np.all(np.isfinite(targets.values))):
        raise ValueError("Nonfinite patch model batch")
    if not np.all((targets.weights == 0) | (targets.weights == 1)) or not targets.weights.any():
        raise ValueError("Patch targets need at least one hidden value")


def reconstruct(inputs: Array, weights: PatchWeights) -> Array:
    """Model output clipped to the valid 0..1 pixel range."""
    return np.clip(_forward(inputs, weights)[1], 0.0, 1.0).astype(np.float32)


def _forward(inputs: Array, weights: PatchWeights) -> tuple[Array, Array]:
    width = weights.decoder.shape[1]
    hidden = np.tanh(inputs @ weights.encoder + weights.encoder_bias).astype(np.float32, copy=False)
    output = inputs[:, :width] + hidden @ weights.decoder + weights.decoder_bias
    return hidden, output.astype(np.float32, copy=False)


def masked_squared_error(prediction: Array, targets: MaskedTargets) -> tuple[float, int]:
    """Sum of squared errors over hidden values (float64) and their count."""
    difference = (prediction.astype(np.float64) - targets.values) * targets.weights
    return float(np.sum(difference * difference)), int(np.count_nonzero(targets.weights))


def trained_step(
    inputs: Array, targets: MaskedTargets, model: PatchWeights,
    plan: PatchPlan, learning_rate: float,
) -> tuple[PatchWeights, float]:
    """Return updated weights and the masked loss measured before the update.

    The input model is left unchanged, so a failed step cannot corrupt the
    last good weights.
    """
    model.verify(plan)
    _checked_batch(inputs, targets, plan)
    if not 0 < learning_rate < 1 or not math.isfinite(learning_rate):
        raise ValueError("Invalid learning rate")
    weights = targets.weights
    count = np.float32(np.count_nonzero(weights))
    hidden, output = _forward(inputs, model)
    residual = (output - targets.values) * weights
    loss = float(np.sum(residual.astype(np.float64) ** 2) / float(count))
    # d(loss)/d(output) for the mean over hidden values.
    upstream = (np.float32(2.0) / count) * residual
    backward = (upstream @ model.decoder.T) * (1.0 - hidden * hidden)
    gradients = [
        inputs.T @ backward, backward.sum(axis=0),
        hidden.T @ upstream, upstream.sum(axis=0),
    ]
    norm = math.sqrt(sum(float(np.sum(item.astype(np.float64) ** 2)) for item in gradients))
    if not math.isfinite(norm) or not math.isfinite(loss):
        raise ValueError("Nonfinite patch model gradient")
    scale = np.float32(learning_rate * min(1.0, MAX_GRADIENT_NORM / norm) if norm else 0.0)
    updated = PatchWeights(*(
        (current - scale * gradient).astype(np.float32)
        for current, gradient in zip(
            (model.encoder, model.encoder_bias, model.decoder, model.decoder_bias),
            gradients, strict=True,
        )
    ))
    updated.verify(plan)
    return updated, loss
