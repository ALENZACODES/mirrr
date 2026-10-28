"""Analytic CPU memory admission for one masked-patch minibatch.

The estimate counts the float32 arrays the reference trainer allocates for one
step (decoded images, patch inputs and targets, activations, gradients and two
copies of the weights) and multiplies by a safety factor for NumPy temporaries.
It is a planning bound computed from shapes, not a measured process peak, and
says nothing about GPU memory or throughput. Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .patches import PatchPlan
from .pipeline import TrainingPlan

FLOAT_BYTES = 4
# ASSUMED: NumPy expression temporaries roughly double the named arrays.
SAFETY_FACTOR = 2
MIN_BUDGET = 1024 * 1024
MAX_BUDGET = 256 * 1024 * 1024 * 1024


@dataclass(frozen=True)
class ResourceEstimate:
    batch_rows: int
    parameters: int
    named_bytes: int
    reserved_bytes: int
    budget_bytes: int

    def public(self) -> dict[str, Any]:
        return {
            "schema": "beljour-training-resources/1",
            "batch_rows": self.batch_rows,
            "parameters": self.parameters,
            "named_array_bytes": self.named_bytes,
            "reserved_bytes": self.reserved_bytes,
            "budget_bytes": self.budget_bytes,
            "basis": "ANALYTIC_ESTIMATE_NOT_MEASURED",
        }


def estimate_step_bytes(patch: PatchPlan, training: TrainingPlan) -> tuple[int, int, int]:
    """Return (rows per step, parameter count, bytes of named float32 arrays)."""
    patch.validate()
    training.validate()
    rows = training.batch_size * patch.patches_per_image
    width, hidden = patch.patch_width, patch.hidden_dim
    parameters = (width + 2) * hidden + hidden + hidden * width + width
    image_values = training.batch_size * patch.image_size * patch.image_size * 3
    per_row = (
        (width + 2)        # inputs
        + 2 * width        # target values and hidden-value weights
        + 2 * hidden       # tanh activations and their backward signal
        + 2 * width        # output and weighted residual
    )
    values = image_values + rows * per_row + 3 * parameters  # model, gradients, update
    return rows, parameters, values * FLOAT_BYTES


def admit_resources(
    patch: PatchPlan, training: TrainingPlan, memory_budget_bytes: int,
) -> ResourceEstimate:
    """Refuse a configuration whose reserved estimate exceeds the stated budget."""
    if type(memory_budget_bytes) is not int or not MIN_BUDGET <= memory_budget_bytes <= MAX_BUDGET:
        raise ValueError("Invalid training memory budget")
    if training.image_size != patch.image_size:
        raise ValueError("Training and patch dimensions differ")
    rows, parameters, named = estimate_step_bytes(patch, training)
    reserved = named * SAFETY_FACTOR
    if reserved > memory_budget_bytes:
        raise ValueError("Training step exceeds the memory budget")
    return ResourceEstimate(rows, parameters, named, reserved, memory_budget_bytes)
