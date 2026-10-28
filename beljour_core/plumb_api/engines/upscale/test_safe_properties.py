"""Seeded property checks of the guarded upscale over random drawn inputs.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from .engine import upscale
from .safe import FaceSelection, blend, safe_upscale
from .safe_quality import inspect_safe_result


def _random_case(seed: int) -> tuple[np.ndarray, FaceSelection, float, float, int]:
    rng = np.random.default_rng(seed)
    height, width = int(rng.integers(12, 40)), int(rng.integers(12, 40))
    channels = int(rng.choice([3, 4]))
    image = rng.integers(0, 256, size=(height, width, channels), dtype=np.uint8)
    mask = np.zeros((height, width), np.uint8)
    top, left = int(rng.integers(0, height // 2)), int(rng.integers(0, width // 2))
    rows, cols = min(height // 3 + 1, height - top), min(width // 3 + 1, width - left)
    mask[top:top + rows, left:left + cols] = rng.integers(1, 256, size=(rows, cols), dtype=np.uint8)
    detail = int(rng.integers(10, 51)) / 10
    lock = int(rng.integers(10, 51)) / 10
    return image, FaceSelection(mask, True), detail, lock, int(rng.choice([2, 4]))


@pytest.mark.parametrize("seed", range(12))
def test_random_inputs_satisfy_every_invariant(seed: int) -> None:
    image, selection, detail, lock, scale = _random_case(seed)
    result = safe_upscale(image, selection, scale=scale, detail_level=detail, lock_level=lock)
    report = inspect_safe_result(image, selection, result)
    assert report["status"] == "INVARIANTS_HOLD", report["invariants"]


@pytest.mark.parametrize("seed", range(6))
def test_output_lies_between_engine_and_reference(seed: int) -> None:
    image, selection, detail, lock, scale = _random_case(100 + seed)
    result = safe_upscale(image, selection, scale=scale, detail_level=detail, lock_level=lock)
    engine = upscale(image, scale=scale, detail=(detail - 1) / 4).astype(int)
    reference = upscale(image, scale=scale, detail=0.0).astype(int)
    output = result.image[..., :3].astype(int)
    low = np.minimum(engine[..., :3], reference[..., :3])
    high = np.maximum(engine[..., :3], reference[..., :3])
    assert np.all((output >= low) & (output <= high))


def test_raising_the_lock_never_moves_a_face_pixel_away_from_the_reference() -> None:
    rng = np.random.default_rng(7)
    engine = rng.integers(0, 256, size=(20, 20, 4), dtype=np.uint8)
    reference = rng.integers(0, 256, size=(20, 20, 4), dtype=np.uint8)
    coverage = rng.integers(0, 256, size=(20, 20), dtype=np.uint8)
    previous = None
    for tenths in range(10, 51):
        gap = np.abs(blend(engine, reference, coverage, tenths)[..., :3].astype(int) - reference[..., :3])
        if previous is not None:
            assert np.all(gap <= previous)
        previous = gap


def test_blend_extremes_are_exact() -> None:
    rng = np.random.default_rng(3)
    engine = rng.integers(0, 256, size=(9, 9, 3), dtype=np.uint8)
    reference = rng.integers(0, 256, size=(9, 9, 3), dtype=np.uint8)
    zero = np.zeros((9, 9), np.uint8)
    full = np.full((9, 9), 255, np.uint8)
    assert np.array_equal(blend(engine, reference, zero, 50), engine)
    assert np.array_equal(blend(engine, reference, full, 50), reference)


def test_results_are_deterministic() -> None:
    image, selection, detail, lock, scale = _random_case(55)
    first = safe_upscale(image, selection, scale=scale, detail_level=detail, lock_level=lock)
    second = safe_upscale(image, selection, scale=scale, detail_level=detail, lock_level=lock)
    assert np.array_equal(first.image, second.image)
