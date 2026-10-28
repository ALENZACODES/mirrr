"""Analytic memory admission for one training step. Author: John Khan."""

from __future__ import annotations

import pytest

from .patches import PatchPlan
from .pipeline import TrainingPlan
from .resources import SAFETY_FACTOR, admit_resources, estimate_step_bytes


def test_estimate_counts_every_named_float32_array() -> None:
    patch = PatchPlan(image_size=32, patch_edge=4, hidden_dim=32)
    training = TrainingPlan(image_size=32, batch_size=4)
    rows, parameters, named = estimate_step_bytes(patch, training)
    assert rows == 4 * 64
    assert parameters == 50 * 32 + 32 + 32 * 48 + 48
    per_row = 50 + 2 * 48 + 2 * 32 + 2 * 48
    assert named == 4 * (4 * 32 * 32 * 3 + rows * per_row + 3 * parameters)


def test_estimate_grows_with_batch_and_width() -> None:
    patch = PatchPlan()
    small = estimate_step_bytes(patch, TrainingPlan(batch_size=4))[2]
    assert estimate_step_bytes(patch, TrainingPlan(batch_size=8))[2] > small
    assert estimate_step_bytes(PatchPlan(hidden_dim=128), TrainingPlan(batch_size=4))[2] > small


def test_admission_reports_an_unmeasured_estimate() -> None:
    estimate = admit_resources(PatchPlan(), TrainingPlan(batch_size=4), 64 * 1024 * 1024)
    public = estimate.public()
    assert public["basis"] == "ANALYTIC_ESTIMATE_NOT_MEASURED"
    assert public["reserved_bytes"] == SAFETY_FACTOR * public["named_array_bytes"]
    assert public["budget_bytes"] == 64 * 1024 * 1024


def test_over_budget_configuration_is_refused() -> None:
    training = TrainingPlan(image_size=128, batch_size=256)
    patch = PatchPlan(image_size=128, patch_edge=2, hidden_dim=512)
    with pytest.raises(ValueError, match="memory budget"):
        admit_resources(patch, training, 64 * 1024 * 1024)


@pytest.mark.parametrize("budget", [0, 1024, 2**40, 1.5, True])
def test_invalid_budgets(budget: object) -> None:
    with pytest.raises(ValueError, match="budget"):
        admit_resources(PatchPlan(), TrainingPlan(), budget)  # type: ignore[arg-type]


def test_mismatched_image_sizes() -> None:
    with pytest.raises(ValueError, match="dimensions"):
        admit_resources(PatchPlan(image_size=64), TrainingPlan(image_size=32), 2**30)
