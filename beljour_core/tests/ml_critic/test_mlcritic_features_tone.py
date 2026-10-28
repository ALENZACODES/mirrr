"""Texture, noise and tone features on drawn fixtures with and without each artifact.

Fixtures are drawn in code (gradients, discs, seeded grain); no photos.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest
from numpy.typing import NDArray

from lab.ml.critic import make_pair
from lab.ml.critic.features_tone import (
    colour_banding,
    colour_shift_untouched,
    hf_energy_ratio,
    noise_inconsistency,
    noise_sigma,
    plastic_skin,
    step_peakiness,
)
from lab.ml.critic.images import blur

SIZE = 96


def textured(seed: int, grain: float = 0.01) -> NDArray[np.float64]:
    """A soft two-colour gradient with fine blurred texture and pixel grain."""
    rng = np.random.default_rng(seed)
    ramp = np.linspace(0.3, 0.7, SIZE)[None, :, None]
    base = np.ones((SIZE, SIZE, 3)) * ramp * np.array([1.0, 0.85, 0.75])
    texture = blur(rng.normal(0.0, 1.0, (SIZE, SIZE)), 0.8)[:, :, None] * 0.03
    noisy = base + texture + rng.normal(0.0, grain, base.shape)
    return np.asarray(np.clip(noisy, 0.0, 1.0), dtype=np.float64)


def disc(radius: float = 28.0) -> NDArray[np.bool_]:
    yy, xx = np.mgrid[0:SIZE, 0:SIZE]
    return np.asarray((yy - SIZE / 2) ** 2 + (xx - SIZE / 2) ** 2 <= radius**2)


def smooth_ramp() -> NDArray[np.float64]:
    """A gentle diagonal ramp with faint grain: the case where banding shows."""
    rng = np.random.default_rng(3)
    yy, xx = np.mgrid[0:SIZE, 0:SIZE].astype(np.float64)
    value = 0.35 + 0.3 * (xx + yy) / (2 * SIZE)
    image = np.repeat(value[:, :, None], 3, axis=2)
    return np.clip(image + rng.normal(0.0, 0.002, image.shape), 0.0, 1.0)


def test_hf_energy_flags_oversharpening_only() -> None:
    before = textured(1)
    sharp = np.clip(before + 2.5 * (before - blur(before, 1.0)), 0.0, 1.0)
    tinted = np.clip(before + 0.03, 0.0, 1.0)
    assert hf_energy_ratio(make_pair(before, before)) == 0.0
    assert hf_energy_ratio(make_pair(before, tinted)) < 0.05
    assert hf_energy_ratio(make_pair(before, sharp)) > 1.0


def test_hf_energy_ignores_detail_loss() -> None:
    before = textured(2)
    assert hf_energy_ratio(make_pair(before, blur(before, 2.0))) == 0.0


def test_hf_energy_grows_with_gain() -> None:
    before = textured(4)
    detail = before - blur(before, 1.0)
    values = [
        hf_energy_ratio(make_pair(before, np.clip(before + gain * detail, 0.0, 1.0)))
        for gain in (0.5, 1.5, 3.0)
    ]
    assert values[0] < values[1] < values[2]


def test_plastic_skin_detects_smoothing_inside_mask() -> None:
    before = textured(5)
    mask = disc()
    after = before.copy()
    after[mask] = blur(before, 2.5)[mask]
    assert plastic_skin(make_pair(before, after, mask)) > 1.0
    assert plastic_skin(make_pair(before, before, mask)) == 0.0


def test_plastic_skin_ignores_tint_and_added_texture() -> None:
    before = textured(6)
    mask = disc()
    tinted = before.copy()
    tinted[mask] = np.clip(tinted[mask] * 1.05, 0.0, 1.0)
    rng = np.random.default_rng(0)
    grainy = np.clip(before + rng.normal(0.0, 0.02, before.shape), 0.0, 1.0)
    assert plastic_skin(make_pair(before, tinted, mask)) < 0.1
    assert plastic_skin(make_pair(before, grainy, mask)) == 0.0


def test_noise_sigma_estimates_known_grain() -> None:
    rng = np.random.default_rng(11)
    flat = np.full((128, 128), 0.5) + rng.normal(0.0, 0.02, (128, 128))
    region = np.ones((128, 128), dtype=np.bool_)
    assert noise_sigma(flat, region) == pytest.approx(0.02, rel=0.1)


def test_noise_inconsistency_flags_grain_added_inside_only() -> None:
    before = textured(7)
    mask = disc()
    rng = np.random.default_rng(1)
    after = before.copy()
    after[mask] = np.clip(after[mask] + rng.normal(0.0, 0.04, after[mask].shape), 0.0, 1.0)
    uniform = np.clip(before + rng.normal(0.0, 0.0, before.shape), 0.0, 1.0)
    assert noise_inconsistency(make_pair(before, after, mask)) > 0.7
    assert noise_inconsistency(make_pair(before, uniform, mask)) < 0.02


def test_noise_inconsistency_needs_a_partial_mask() -> None:
    before = textured(8)
    after = np.clip(before + np.random.default_rng(2).normal(0.0, 0.05, before.shape), 0, 1)
    assert noise_inconsistency(make_pair(before, after)) == 0.0
    full = np.ones((SIZE, SIZE), dtype=np.bool_)
    assert noise_inconsistency(make_pair(before, after, full)) == 0.0


def test_noise_inconsistency_flags_denoised_edit() -> None:
    before = textured(9, grain=0.02)
    mask = disc()
    after = before.copy()
    after[mask] = blur(before, 1.5)[mask]
    assert noise_inconsistency(make_pair(before, after, mask)) > 0.7


def test_step_peakiness_separates_ramp_from_bands() -> None:
    yy, xx = np.mgrid[0:40, 0:200].astype(np.float64)
    ramp = 0.2 + 0.6 * (xx + yy) / 240.0
    bands = np.round(ramp * 6) / 6
    region = np.ones(ramp.shape, dtype=np.bool_)
    assert step_peakiness(ramp, region) < 1.2
    assert step_peakiness(bands, region) > 10.0


def test_colour_banding_flags_posterised_gradient() -> None:
    before = smooth_ramp()
    banded = np.round(before * 10) / 10
    assert colour_banding(make_pair(before, banded)) > 1.0
    assert colour_banding(make_pair(before, before)) == 0.0


def test_colour_banding_ignores_gentle_tint_and_fine_quantisation() -> None:
    before = smooth_ramp()
    tinted = np.clip(before + 0.02, 0.0, 1.0)
    fine = np.round(before * 255) / 255
    assert colour_banding(make_pair(before, tinted)) < 0.2
    assert colour_banding(make_pair(before, fine)) < 0.5


def test_colour_banding_skips_busy_texture() -> None:
    rng = np.random.default_rng(4)
    busy = rng.uniform(0.0, 1.0, (SIZE, SIZE, 3))
    assert colour_banding(make_pair(busy, np.round(busy * 4) / 4)) == 0.0


def test_colour_shift_flags_change_outside_mask() -> None:
    before = textured(10)
    mask = disc(20.0)
    cast = before.copy()
    cast[~mask] = np.clip(cast[~mask] + np.array([0.06, 0.0, -0.05]), 0.0, 1.0)
    inside_only = before.copy()
    inside_only[mask] = np.clip(inside_only[mask] + 0.08, 0.0, 1.0)
    assert colour_shift_untouched(make_pair(before, cast, mask)) > 3.0
    assert colour_shift_untouched(make_pair(before, inside_only, mask)) < 0.5


def test_colour_shift_needs_a_mask() -> None:
    before = textured(12)
    after = np.clip(before + 0.1, 0.0, 1.0)
    assert colour_shift_untouched(make_pair(before, after)) == 0.0
