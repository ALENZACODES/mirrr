"""Checkerboard, JPEG blockiness and symmetry features on drawn fixtures.

JPEG fixtures are drawn images encoded in memory with Pillow; nothing is
downloaded or read from disk.
Author: John Khan.
"""

from __future__ import annotations

import io

import numpy as np
from numpy.typing import NDArray
from PIL import Image

from lab.ml.critic import FaceBox, make_pair
from lab.ml.critic.features_grid import (
    blockiness,
    checkerboard,
    jpeg_blockiness,
    nyquist_ratio,
    symmetry_break,
)
from lab.ml.critic.images import blur, bounding_box

SIZE = 96


def soft_scene(seed: int) -> NDArray[np.float64]:
    """Blobs of colour on a gradient, with grain: smooth content plus fine noise."""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:SIZE, 0:SIZE].astype(np.float64)
    image = np.zeros((SIZE, SIZE, 3))
    for _ in range(5):
        cy, cx = rng.uniform(10, SIZE - 10, 2)
        colour = rng.uniform(0.2, 0.8, 3)
        weight = np.exp(-((yy - cy) ** 2 + (xx - cx) ** 2) / (2 * 14.0**2))
        image += weight[:, :, None] * colour
    image = 0.25 + 0.6 * image / np.max(image)
    image += rng.normal(0.0, 0.006, image.shape)
    return np.asarray(np.clip(image, 0.0, 1.0))


def jpeg_round_trip(image: NDArray[np.float64], quality: int) -> NDArray[np.float64]:
    data = np.asarray(np.round(image * 255), dtype=np.uint8)
    buffer = io.BytesIO()
    Image.fromarray(data).save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    with Image.open(buffer) as handle:
        return np.asarray(handle.convert("RGB"), dtype=np.float64) / 255.0


def checker_pattern(amplitude: float) -> NDArray[np.float64]:
    yy, xx = np.mgrid[0:SIZE, 0:SIZE]
    grid = np.where((yy + xx) % 2 == 0, amplitude, -amplitude)
    return np.repeat(grid[:, :, None].astype(np.float64), 3, axis=2)


def test_nyquist_ratio_is_near_one_for_white_noise() -> None:
    noise = np.random.default_rng(0).normal(0.0, 1.0, (128, 128))
    assert 0.8 < nyquist_ratio(noise) < 1.25


def test_checkerboard_flags_period_two_grid() -> None:
    before = soft_scene(1)
    after = np.clip(before + checker_pattern(0.02), 0.0, 1.0)
    assert checkerboard(make_pair(before, after)) > 2.0
    assert checkerboard(make_pair(before, before)) == 0.0


def test_checkerboard_ignores_smooth_change_and_white_grain() -> None:
    before = soft_scene(2)
    tinted = np.clip(before + 0.05 * blur(before, 6.0), 0.0, 1.0)
    grainy = np.clip(before + np.random.default_rng(3).normal(0.0, 0.02, before.shape), 0, 1)
    assert checkerboard(make_pair(before, tinted)) < 0.5
    assert checkerboard(make_pair(before, grainy)) < 0.5


def test_checkerboard_reads_only_the_mask_box() -> None:
    before = soft_scene(4)
    mask = np.zeros((SIZE, SIZE), dtype=np.bool_)
    mask[8:40, 8:40] = True
    after = before.copy()
    after[50:90, 50:90] += checker_pattern(0.03)[50:90, 50:90]
    after = np.clip(after, 0.0, 1.0)
    assert checkerboard(make_pair(before, after, mask)) == 0.0
    assert checkerboard(make_pair(before, after)) > 1.0


def test_bounding_box_pads_and_clips() -> None:
    region = np.zeros((20, 30), dtype=np.bool_)
    region[2:5, 25:28] = True
    rows, cols = bounding_box(region, pad=4)
    assert (rows.start, rows.stop, cols.start, cols.stop) == (0, 9, 21, 30)


def test_blockiness_rises_after_heavy_jpeg() -> None:
    before = soft_scene(5)
    heavy = jpeg_round_trip(before, 8)
    light = jpeg_round_trip(before, 95)
    assert blockiness(before[:, :, 1]) < 0.3
    assert jpeg_blockiness(make_pair(before, heavy)) > 0.3
    assert jpeg_blockiness(make_pair(before, light)) < 0.15


def test_blockiness_finds_any_grid_phase() -> None:
    before = soft_scene(6)
    heavy = jpeg_round_trip(before, 8)
    shifted_before = before[3:, 5:]
    shifted_after = heavy[3:, 5:]
    assert jpeg_blockiness(make_pair(shifted_before, shifted_after)) > 0.3


def face_scene(seed: int) -> NDArray[np.float64]:
    """A symmetric drawn face: oval, two eyes, a mouth, on a flat backdrop."""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:SIZE, 0:SIZE].astype(np.float64)
    image = np.full((SIZE, SIZE, 3), 0.3)
    oval = ((xx - 48) / 26) ** 2 + ((yy - 50) / 34) ** 2 <= 1
    image[oval] = (0.8, 0.62, 0.5)
    for cx in (37, 59):
        image[((xx - cx) / 5) ** 2 + ((yy - 40) / 3) ** 2 <= 1] = (0.1, 0.08, 0.07)
    image[((xx - 48) / 10) ** 2 + ((yy - 66) / 3) ** 2 <= 1] = (0.55, 0.25, 0.25)
    return np.asarray(np.clip(image + rng.normal(0.0, 0.006, image.shape), 0.0, 1.0))


def test_symmetry_break_flags_one_sided_shift() -> None:
    before = face_scene(7)
    after = before.copy()
    after[:, 48:] = np.roll(before[:, 48:], 4, axis=0)
    box = FaceBox(22, 16, 52, 68)
    assert symmetry_break(make_pair(before, after, face=box)) > 2.0


def test_symmetry_break_ignores_symmetric_edits() -> None:
    before = face_scene(8)
    brighter = np.clip(before * 1.06, 0.0, 1.0)
    box = FaceBox(22, 16, 52, 68)
    assert symmetry_break(make_pair(before, brighter, face=box)) < 0.5
    assert symmetry_break(make_pair(before, before, face=box)) == 0.0
