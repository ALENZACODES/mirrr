"""Seam, halo, fringing and ghosting features on drawn fixtures.

Each test draws a scene with sharp shapes, then builds the artifact by hand so
the expected direction is known exactly. No photos.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from lab.ml.critic import make_pair
from lab.ml.critic.features_edges import (
    correlate,
    edge_fringing,
    ghosting,
    halo_strength,
    overshoot,
    padded_size,
    seam_strength,
    spectrum,
)
from lab.ml.critic.images import blur

SIZE = 96


def shapes_scene(seed: int) -> NDArray[np.float64]:
    """Grey field with grain, a dark bar, a bright square and thin dark strands."""
    rng = np.random.default_rng(seed)
    image = np.full((SIZE, SIZE, 3), 0.55) * np.array([1.0, 0.9, 0.8])
    image[20:76, 30:42] = (0.15, 0.12, 0.1)
    image[30:60, 55:80] = (0.9, 0.85, 0.8)
    for column in range(10, 90, 7):
        image[5:18, column] = (0.1, 0.08, 0.06)
    image += blur(rng.normal(0.0, 1.0, (SIZE, SIZE)), 0.8)[:, :, None] * 0.02
    image += rng.normal(0.0, 0.006, image.shape)
    return np.asarray(np.clip(image, 0.0, 1.0))


def box_mask(top: int = 24, left: int = 24, size: int = 48) -> NDArray[np.bool_]:
    mask = np.zeros((SIZE, SIZE), dtype=np.bool_)
    mask[top:top + size, left:left + size] = True
    return mask


def feathered(mask: NDArray[np.bool_], sigma: float) -> NDArray[np.float64]:
    return blur(mask.astype(np.float64), sigma)[:, :, None]


def test_seam_flags_hard_paste_not_feathered_edit() -> None:
    before = shapes_scene(1)
    mask = box_mask(21, 19, 50)
    offset = np.array([0.08, 0.05, 0.03])
    hard = np.clip(before + mask[:, :, None] * offset, 0.0, 1.0)
    soft = np.clip(before + feathered(mask, 6.0) * offset, 0.0, 1.0)
    hard_value = seam_strength(make_pair(before, hard, mask))
    soft_value = seam_strength(make_pair(before, soft, mask))
    assert hard_value > 0.3
    assert soft_value < 0.1
    assert hard_value > 4 * soft_value


def test_seam_needs_a_mask_and_a_change() -> None:
    before = shapes_scene(2)
    after = np.clip(before + 0.05, 0.0, 1.0)
    assert seam_strength(make_pair(before, after)) == 0.0
    assert seam_strength(make_pair(before, before, box_mask())) == 0.0


def test_overshoot_is_zero_inside_local_range() -> None:
    before = np.tile(np.linspace(0.0, 1.0, 32), (32, 1))
    assert float(np.max(overshoot(before, before, 5))) == 0.0
    spiked = before.copy()
    spiked[10, 10] = 1.5
    assert float(overshoot(spiked, before, 5)[10, 10]) > 0.5


def test_halo_flags_unsharp_mask_rings() -> None:
    before = shapes_scene(3)
    haloed = np.clip(before + 1.5 * (before - blur(before, 3.0)), 0.0, 1.0)
    tinted = np.clip(before * 1.03, 0.0, 1.0)
    assert halo_strength(make_pair(before, haloed)) > 1.0
    assert halo_strength(make_pair(before, tinted)) < 0.3
    assert halo_strength(make_pair(before, before)) == 0.0


def test_halo_ignores_uniform_noise() -> None:
    before = shapes_scene(4)
    noisy = np.clip(before + np.random.default_rng(0).normal(0.0, 0.01, before.shape), 0, 1)
    assert halo_strength(make_pair(before, noisy)) < 0.3


def test_halo_without_edges_is_zero() -> None:
    flat = np.full((SIZE, SIZE, 3), 0.5)
    assert halo_strength(make_pair(flat, flat + 0.01)) == 0.0


def shift_channels(image: NDArray[np.float64], reach: int) -> NDArray[np.float64]:
    out = image.copy()
    out[:, :, 0] = np.roll(image[:, :, 0], reach, axis=1)
    out[:, :, 2] = np.roll(image[:, :, 2], -reach, axis=1)
    return out


def test_fringing_flags_split_colour_channels() -> None:
    before = shapes_scene(5)
    fringed = shift_channels(before, 2)
    assert edge_fringing(make_pair(before, fringed)) > 0.3
    assert edge_fringing(make_pair(before, before)) == 0.0


def test_fringing_ignores_plain_recolouring() -> None:
    before = shapes_scene(6)
    warmer = np.clip(before * np.array([1.05, 1.0, 0.95]), 0.0, 1.0)
    assert edge_fringing(make_pair(before, warmer)) < 0.1


def test_fringing_grows_with_split() -> None:
    before = shapes_scene(7)
    one = edge_fringing(make_pair(before, shift_channels(before, 1)))
    three = edge_fringing(make_pair(before, shift_channels(before, 3)))
    assert three > one > 0.0


def test_correlate_finds_positive_and_negative_shifts() -> None:
    rng = np.random.default_rng(8)
    first = rng.normal(0.0, 1.0, (32, 32))
    moved = np.zeros_like(first)
    moved[3:, :-2] = first[:-3, 2:]
    size = padded_size(first.shape, 8)
    assert size[0] >= 40 and size[1] >= 40
    table = correlate(spectrum(moved, size), spectrum(first, size))
    peak = np.unravel_index(int(np.argmax(table)), table.shape)
    assert (int(peak[0]), int(peak[1])) == (3, size[1] - 2)


def test_ghosting_flags_misaligned_blend() -> None:
    before = shapes_scene(9)
    copy = np.roll(before, (2, 5), axis=(0, 1))
    ghosted = 0.7 * before + 0.3 * copy
    assert ghosting(make_pair(before, ghosted)) > 0.4


def test_ghosting_ignores_smoothing_and_tint() -> None:
    before = shapes_scene(10)
    smooth = blur(before, 1.5)
    tinted = np.clip(before + 0.04, 0.0, 1.0)
    assert ghosting(make_pair(before, smooth)) < 0.2
    assert ghosting(make_pair(before, tinted)) == 0.0
    assert ghosting(make_pair(before, before)) == 0.0


def test_ghosting_needs_room_inside_the_mask() -> None:
    before = shapes_scene(11)
    ghosted = 0.6 * before + 0.4 * np.roll(before, 4, axis=1)
    tiny = box_mask(40, 40, 10)
    assert ghosting(make_pair(before, ghosted, tiny)) == 0.0
