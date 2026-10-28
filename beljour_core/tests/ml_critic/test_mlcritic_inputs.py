"""Input checking: bad pairs are rejected with a clear reason; odd but valid ones score.

Covers tiny images, single-colour images, mismatched sizes, wrong dtypes, NaN,
masks of the wrong size, and face boxes outside the frame.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.ml.critic import FEATURE_NAMES, FaceBox, ImageError, extract, extract_dict, make_pair
from lab.ml.critic.images import boundary_band, dilate, erode, masked_mean, to_image, to_mask


def test_uint8_and_float_inputs_agree() -> None:
    rng = np.random.default_rng(0)
    data = rng.integers(0, 256, (32, 40, 3), dtype=np.uint8)
    as_float = to_image(data.astype(np.float64) / 255.0)
    assert np.allclose(to_image(data), as_float)
    assert to_image(data).shape == (32, 40, 3)


def test_grey_and_rgba_inputs_become_rgb() -> None:
    grey = np.full((20, 20), 128, dtype=np.uint8)
    rgba = np.zeros((20, 20, 4), dtype=np.uint8)
    single = np.zeros((20, 20, 1), dtype=np.float64)
    assert to_image(grey).shape == (20, 20, 3)
    assert to_image(rgba).shape == (20, 20, 3)
    assert to_image(single).shape == (20, 20, 3)


@pytest.mark.parametrize(
    ("array", "message"),
    [
        (np.zeros((8, 8, 3)), "smaller than"),
        (np.zeros((20, 20, 2)), "shape"),
        (np.zeros((20, 20, 3, 1)), "shape"),
        (np.zeros((20, 20, 3), dtype=np.uint16), "uint8"),
        (np.zeros((20, 20, 3), dtype=np.bool_), "not numeric"),
        (np.full((20, 20, 3), 1.5), "[0, 1]"),
        (np.full((20, 20, 3), -0.5), "[0, 1]"),
        (np.full((20, 20, 3), np.nan), "NaN"),
    ],
)
def test_bad_images_are_rejected_with_reason(array: np.ndarray, message: str) -> None:
    with pytest.raises(ImageError, match=message.replace("[", r"\[").replace("]", r"\]")):
        to_image(array)


def test_mismatched_sizes_are_rejected() -> None:
    with pytest.raises(ImageError, match="same size"):
        make_pair(np.zeros((32, 32, 3)), np.zeros((32, 33, 3)))


def test_mask_size_and_type_are_checked() -> None:
    with pytest.raises(ImageError, match="does not match"):
        make_pair(np.zeros((32, 32, 3)), np.zeros((32, 32, 3)), np.zeros((30, 32)))
    with pytest.raises(ImageError, match="not"):
        to_mask(np.zeros((4, 4, 3, 2)), (4, 4))
    assert to_mask(None, (4, 4)) is None


def test_mask_thresholds_by_dtype() -> None:
    eight_bit = np.array([[0, 127], [128, 255]], dtype=np.uint8)
    floats = np.array([[0.0, 0.5], [0.51, 1.0]])
    expected = np.array([[False, False], [True, True]])
    assert np.array_equal(to_mask(eight_bit, (2, 2)), expected)
    assert np.array_equal(to_mask(floats, (2, 2)), expected)


def test_face_box_outside_frame_is_rejected_and_partial_box_is_clipped() -> None:
    image = np.zeros((32, 32, 3))
    with pytest.raises(ImageError, match="outside"):
        make_pair(image, image, face=FaceBox(40, 0, 10, 10))
    with pytest.raises(ImageError, match="no area"):
        make_pair(image, image, face=FaceBox(0, 0, 0, 10))
    pair = make_pair(image, image, face=FaceBox(-5, 20, 20, 30))
    assert pair.face == FaceBox(0, 20, 15, 12)


@pytest.mark.parametrize("level", [0.0, 0.5, 1.0])
def test_single_colour_images_score_zero_everywhere(level: float) -> None:
    flat = np.full((48, 48, 3), level)
    values = extract(make_pair(flat, flat))
    assert values.shape == (len(FEATURE_NAMES),)
    assert np.all(np.isfinite(values))
    assert float(np.abs(values).max()) == 0.0


def test_smallest_allowed_image_gives_finite_features() -> None:
    rng = np.random.default_rng(1)
    before = rng.uniform(0.0, 1.0, (16, 16, 3))
    after = rng.uniform(0.0, 1.0, (16, 16, 3))
    mask = np.zeros((16, 16), dtype=np.bool_)
    mask[4:12, 4:12] = True
    values = extract_dict(make_pair(before, after, mask))
    assert all(np.isfinite(v) and v >= 0.0 for v in values.values())


def test_random_pairs_never_give_negative_or_nan_features() -> None:
    rng = np.random.default_rng(2)
    for _ in range(12):
        height, width = (int(v) for v in rng.integers(16, 70, 2))
        before = rng.uniform(0.0, 1.0, (height, width, 3))
        after = np.clip(before + rng.normal(0.0, rng.uniform(0, 0.2), before.shape), 0, 1)
        mask = rng.uniform(0.0, 1.0, (height, width)) > rng.uniform(0.0, 1.0)
        values = extract(make_pair(before, after, mask))
        assert np.all(np.isfinite(values))
        assert float(np.min(values)) >= 0.0


def test_empty_or_full_mask_falls_back_to_whole_frame() -> None:
    image = np.full((24, 24, 3), 0.4)
    empty = make_pair(image, image, np.zeros((24, 24), dtype=np.bool_))
    full = make_pair(image, image, np.ones((24, 24), dtype=np.bool_))
    assert bool(empty.region().all())
    assert not empty.has_mask()
    assert not full.has_mask()


def test_morphology_helpers() -> None:
    mask = np.zeros((21, 21), dtype=np.bool_)
    mask[10, 10] = True
    assert int(dilate(mask, 2).sum()) > 1
    assert int(erode(dilate(mask, 3), 3).sum()) >= 1
    assert int(boundary_band(dilate(mask, 5), 1).sum()) > 0
    assert masked_mean(np.ones((21, 21)), np.zeros((21, 21), dtype=np.bool_)) == 0.0
