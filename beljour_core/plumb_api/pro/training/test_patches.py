"""Masked-patch geometry on synthetic arrays only. Author: John Khan."""

from __future__ import annotations

from typing import Any

import numpy as np
import pytest

from .patches import (
    MaskedTargets,
    PatchPlan,
    image_patches,
    masked_example,
    patch_masks,
    patch_positions,
    visible_context_baseline,
)

IMAGE = "a" * 64
OTHER = "b" * 64


def _pixels(plan: PatchPlan, seed: int = 3) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return rng.random(plan.image_size * plan.image_size * 3).astype(np.float32)


@pytest.mark.parametrize("change", [
    {"image_size": 48}, {"patch_edge": 3}, {"hidden_dim": 2},
    {"masked_fraction": 0.05}, {"masked_fraction": 0.95}, {"masked_fraction": float("nan")},
    {"masked_fraction": True}, {"seed": -1}, {"seed": 2**32}, {"hidden_dim": 513},
])
def test_invalid_plans_are_refused(change: dict[str, Any]) -> None:
    with pytest.raises(ValueError):
        PatchPlan(**change).validate()


def test_plan_digest_is_stable_and_sensitive() -> None:
    assert PatchPlan().sha256() == PatchPlan().sha256()
    digests = {plan.sha256() for plan in (
        PatchPlan(hidden_dim=16), PatchPlan(patch_edge=8), PatchPlan(masked_fraction=0.4),
        PatchPlan(seed=1),
    )}
    assert len(digests | {PatchPlan().sha256()}) == 5


def test_derived_sizes() -> None:
    plan = PatchPlan(image_size=32, patch_edge=4, masked_fraction=0.5)
    assert (plan.patch_pixels, plan.patch_width, plan.patches_per_image) == (16, 48, 64)
    assert plan.hidden_pixels == 8
    # Rounding never hides a whole patch or nothing at all.
    assert PatchPlan(patch_edge=2, masked_fraction=0.9).hidden_pixels == 3
    assert PatchPlan(patch_edge=2, masked_fraction=0.1).hidden_pixels == 1


def test_masks_are_image_bound_phase_specific_and_exact() -> None:
    plan = PatchPlan()
    first = patch_masks(IMAGE, plan, phase="train")
    assert np.array_equal(first, patch_masks(IMAGE, plan, phase="train"))
    assert not np.array_equal(first, patch_masks(OTHER, plan, phase="train"))
    assert not np.array_equal(first, patch_masks(IMAGE, plan, phase="eval"))
    assert not np.array_equal(first, patch_masks(IMAGE, PatchPlan(seed=7), phase="train"))
    assert first.shape == (plan.patches_per_image, plan.patch_pixels)
    assert set(first.sum(axis=1).tolist()) == {plan.hidden_pixels}


@pytest.mark.parametrize("digest", ["A" * 64, "a" * 63, "g" * 64, ""])
def test_masks_need_a_real_lowercase_digest(digest: str) -> None:
    with pytest.raises(ValueError):
        patch_masks(digest, PatchPlan(), phase="train")


def test_unknown_phase_is_refused() -> None:
    with pytest.raises(ValueError, match="phase"):
        patch_masks(IMAGE, PatchPlan(), phase="test")


def test_patches_tile_the_image_exactly() -> None:
    plan = PatchPlan(image_size=32, patch_edge=8)
    pixels = _pixels(plan)
    patches = image_patches(pixels, plan)
    image = pixels.reshape(32, 32, 3)
    assert np.array_equal(patches[0].reshape(8, 8, 3), image[:8, :8])
    assert np.array_equal(patches[1].reshape(8, 8, 3), image[:8, 8:16])
    assert np.array_equal(patches[4].reshape(8, 8, 3), image[8:16, :8])
    assert np.isclose(patches.sum(), pixels.sum(), rtol=1e-6)


def test_patching_rejects_wrong_shape_and_nonfinite_values() -> None:
    plan = PatchPlan()
    with pytest.raises(ValueError):
        image_patches(np.zeros(10, dtype=np.float32), plan)
    broken = _pixels(plan)
    broken[5] = np.inf
    with pytest.raises(ValueError):
        image_patches(broken, plan)


def test_positions_are_patch_centres() -> None:
    positions = patch_positions(PatchPlan(image_size=32, patch_edge=8))
    assert positions.shape == (16, 2)
    assert np.allclose(positions[0], [0.125, 0.125])
    assert np.allclose(positions[5], [0.375, 0.375])


def test_example_fills_hidden_values_with_visible_patch_means() -> None:
    plan = PatchPlan()
    pixels = _pixels(plan)
    inputs, targets = masked_example(pixels, IMAGE, plan, phase="eval")
    assert inputs.shape == (plan.patches_per_image, plan.patch_width + 2)
    assert np.array_equal(targets.values, image_patches(pixels, plan))
    hidden = targets.weights > 0
    filled = inputs[:, :plan.patch_width]
    assert np.array_equal(filled[~hidden], targets.values[~hidden])
    first = targets.values[0].reshape(-1, 3)
    shown = ~hidden[0].reshape(-1, 3)[:, 0]
    expected = first[shown].mean(axis=0)
    assert np.allclose(filled[0].reshape(-1, 3)[~shown], expected, atol=1e-6)
    assert np.array_equal(inputs[:, plan.patch_width:], patch_positions(plan))


def test_baseline_uses_targets_and_matches_the_filled_inputs() -> None:
    plan = PatchPlan()
    inputs, targets = masked_example(_pixels(plan, 9), IMAGE, plan, phase="train")
    baseline = visible_context_baseline(targets, plan)
    assert np.allclose(baseline, inputs[:, :plan.patch_width], atol=1e-6)
    hidden = targets.weights > 0
    assert np.array_equal(baseline[~hidden], targets.values[~hidden])


def test_baseline_on_a_hand_made_patch() -> None:
    plan = PatchPlan(image_size=32, patch_edge=2, masked_fraction=0.5)
    values = np.array([[0.2, 0.4, 0.6, 0.4, 0.6, 0.8, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0]],
                      dtype=np.float32)
    weights = np.array([[0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]], dtype=np.float32)
    baseline = visible_context_baseline(MaskedTargets(values, weights), plan)
    assert np.allclose(baseline[0, 6:], [0.3, 0.5, 0.7, 0.3, 0.5, 0.7])
