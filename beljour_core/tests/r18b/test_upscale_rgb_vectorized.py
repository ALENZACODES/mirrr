"""R18B multi-channel cubic interpolation and engine parity tests. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.upscale.engine import upscale
from plumb_api.engines.upscale.kernels import cubic_resize, cubic_resize_image


def _channelwise(image: np.ndarray, scale: int) -> np.ndarray:
    return np.stack([cubic_resize(image[..., channel], scale) for channel in range(image.shape[2])], axis=2)


@pytest.mark.parametrize("channels", (3, 4))
@pytest.mark.parametrize("scale", (2, 4))
def test_image_resize_matches_independent_channel_resizes(channels: int, scale: int) -> None:
    rng = np.random.default_rng(1803 + channels + scale)
    image = rng.integers(0, 256, size=(17, 23, channels), dtype=np.uint8)
    expected = _channelwise(image, scale)
    actual = cubic_resize_image(image, scale)
    np.testing.assert_allclose(actual, expected, rtol=0, atol=1e-12)


def test_image_resize_reuses_cached_axis_taps() -> None:
    from plumb_api.engines.upscale import kernels

    kernels._axis_taps.cache_clear()
    image = np.zeros((20, 30, 3), dtype=np.uint8)
    cubic_resize_image(image, 2)
    first = kernels._axis_taps.cache_info()
    cubic_resize_image(image, 2)
    second = kernels._axis_taps.cache_info()
    assert first.misses == 2
    assert second.hits >= first.hits + 2


def test_image_resize_rejects_channel_count() -> None:
    with pytest.raises(ValueError, match="HxWx3"):
        cubic_resize_image(np.zeros((10, 10, 2), dtype=np.uint8), 2)


def test_upscale_rgba_alpha_uses_same_interpolated_image() -> None:
    rng = np.random.default_rng(1805)
    image = rng.integers(0, 256, size=(16, 18, 4), dtype=np.uint8)
    result = upscale(image, scale=2, detail=0.3)
    enlarged = cubic_resize_image(image, 2)
    expected_alpha = np.rint(enlarged[..., 3]).clip(0, 255).astype(np.uint8)
    np.testing.assert_array_equal(result[..., 3], expected_alpha)
