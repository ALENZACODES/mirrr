"""Highlight clipping and edit-leak features on drawn fixtures.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from lab.ml.critic import make_pair
from lab.ml.critic.features_region import edit_leak, highlight_clipping
from lab.ml.critic.images import blur, dilate

SIZE = 96


def skin_like(seed: int, level: float = 0.6) -> NDArray[np.float64]:
    """Mid-tone field with fine blurred texture and grain, away from both clip ends."""
    rng = np.random.default_rng(seed)
    base = np.full((SIZE, SIZE, 3), level) * np.array([1.0, 0.85, 0.72])
    texture = blur(rng.normal(0.0, 1.0, (SIZE, SIZE)), 0.8)[:, :, None] * 0.04
    return np.asarray(np.clip(base + texture + rng.normal(0.0, 0.01, base.shape), 0, 1))


def centre_mask(radius: float = 22.0) -> NDArray[np.bool_]:
    yy, xx = np.mgrid[0:SIZE, 0:SIZE]
    return np.asarray((yy - SIZE / 2) ** 2 + (xx - SIZE / 2) ** 2 <= radius**2)


def test_clipping_counts_newly_blown_pixels() -> None:
    before = skin_like(1)
    mask = centre_mask()
    after = before.copy()
    after[mask] = np.clip(after[mask] * 1.8, 0.0, 1.0)
    value = highlight_clipping(make_pair(before, after, mask))
    assert value > 50.0
    assert highlight_clipping(make_pair(before, before, mask)) == 0.0


def test_clipping_counts_crushed_shadows_too() -> None:
    before = skin_like(2, level=0.15)
    after = np.clip(before - 0.2, 0.0, 1.0)
    assert highlight_clipping(make_pair(before, after)) > 50.0


def test_clipping_already_in_the_photo_is_not_blamed() -> None:
    before = skin_like(3)
    before[:, :48] = 1.0
    after = before.copy()
    after[:, 48:] = np.clip(after[:, 48:] + 0.02, 0.0, 1.0)
    assert highlight_clipping(make_pair(before, after)) == 0.0


def test_clipping_with_no_headroom_anywhere_is_zero() -> None:
    white = np.ones((SIZE, SIZE, 3))
    assert highlight_clipping(make_pair(white, white)) == 0.0


def test_leak_flags_smoothing_that_spills_past_the_mask() -> None:
    before = skin_like(4)
    mask = centre_mask()
    spill = dilate(mask, 20)
    after = before.copy()
    after[spill] = blur(before, 2.0)[spill]
    assert edit_leak(make_pair(before, after, mask)) > 0.5


def test_leak_ignores_contained_edits_and_feathered_tints() -> None:
    before = skin_like(5)
    mask = centre_mask()
    contained = before.copy()
    contained[mask] = blur(before, 2.0)[mask]
    alpha = blur(mask.astype(np.float64), 5.0)[:, :, None]
    tinted = np.clip(before + alpha * np.array([0.03, 0.0, -0.02]), 0.0, 1.0)
    assert edit_leak(make_pair(before, contained, mask)) < 0.05
    assert edit_leak(make_pair(before, tinted, mask)) < 0.05


def test_leak_needs_a_mask_and_room_for_the_ring() -> None:
    before = skin_like(6)
    after = blur(before, 2.0)
    assert edit_leak(make_pair(before, after)) == 0.0
    nearly_full = np.ones((SIZE, SIZE), dtype=np.bool_)
    nearly_full[0, 0] = False
    assert edit_leak(make_pair(before, after, nearly_full)) == 0.0
