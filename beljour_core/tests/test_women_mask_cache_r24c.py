"""Count actual mask builds, not wall-clock timing, across slider movement.

Tests use arithmetic RGBA, never photographs. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.women_styling.preview_cache import WomenPreviewSession


def frame() -> np.ndarray:
    result = np.full((130, 96, 4), 83, dtype=np.uint8)
    result[..., 3] = 255
    return result


def simple_render(src: np.ndarray, mask: np.ndarray, strength: float) -> np.ndarray:
    output = src.copy()
    output[mask > 0, :3] = np.minimum(255, 83 + round(strength * 80))
    return output


class MaskSpy:
    def __init__(self) -> None:
        self.computations = 0

    def __call__(self, image: np.ndarray, effect: str) -> np.ndarray:
        self.computations += 1
        assert effect in ("W28", "W39")
        result = np.zeros(image.shape[:2], dtype=np.uint8)
        result[20:120, 10:85] = 255
        return result


def test_five_level_changes_compute_one_mask_per_photo_and_effect() -> None:
    spy = MaskSpy()
    session = WomenPreviewSession(spy)
    photo = frame()
    for level in (1, 2, 3, 4, 5):
        edited = session.render(photo, "W28", simple_render, level=level)
        assert edited.level == level
        assert edited.lock_level == 5.0
        assert edited.pixels.shape == photo.shape
    assert spy.computations == 1
    assert session.mask_computations == 1
    session.render(photo, "W28", simple_render, level=3)
    assert spy.computations == 1
    session.render(photo, "W39", simple_render, level=3)
    assert spy.computations == 2
    second = photo.copy()
    second[0, 0, 0] = 84
    session.render(second, "W28", simple_render, level=3)
    assert spy.computations == 3
    session.release()
    session.render(photo, "W28", simple_render, level=3)
    assert spy.computations == 4


def test_preview_scales_pixels_and_release_uses_full_resolution() -> None:
    session = WomenPreviewSession(MaskSpy())
    photo = frame()
    preview = session.render(photo, "W28", simple_render, level=4, preview_edge=52)
    released = session.render(photo, "W28", simple_render, level=4, preview_edge=None)
    assert max(preview.pixels.shape[:2]) <= 52
    assert released.pixels.shape == photo.shape
    np.testing.assert_array_equal(released.pixels[..., 3], photo[..., 3])
    assert session.mask_computations == 1


def test_cached_pixels_are_not_exposed_as_mutable_session_state() -> None:
    session = WomenPreviewSession(MaskSpy())
    source = frame()
    first = session.render(source, "W39", simple_render, level=4)
    expected = first.pixels.copy()
    first.pixels[:] = 0
    second = session.render(source, "W39", simple_render, level=4)
    np.testing.assert_array_equal(expected, second.pixels)
    assert session.mask_computations == 1


@pytest.mark.parametrize("bad", [0, -1, 8193])
def test_invalid_preview_dimensions_are_rejected(bad: int) -> None:
    session = WomenPreviewSession(MaskSpy())
    with pytest.raises(ValueError):
        session.render(frame(), "W28", simple_render, preview_edge=bad)

class CorrectableMaskSpy:
    """A local brush-selected region, revised without changing the photo."""

    def __init__(self) -> None:
        self.left = 10
        self.computations = 0

    def __call__(self, image: np.ndarray, effect: str) -> np.ndarray:
        assert effect in ("W28", "W39")
        self.computations += 1
        mask = np.zeros(image.shape[:2], dtype=np.uint8)
        mask[20:120, self.left:85] = 255
        return mask


def test_mask_correction_clears_same_photo_effect_but_preserves_other_effect() -> None:
    supplier = CorrectableMaskSpy()
    session = WomenPreviewSession(supplier)
    source = frame()
    old = session.render(source, "W28", simple_render, level=4, preview_edge=None)
    other = session.render(source, "W39", simple_render, level=4, preview_edge=None)
    assert supplier.computations == 2
    assert old.pixels[30, 12, 0] > source[30, 12, 0]

    supplier.left = 22
    cached = session.render(source, "W28", simple_render, level=4, preview_edge=None)
    np.testing.assert_array_equal(cached.pixels, old.pixels)
    assert supplier.computations == 2

    session.invalidate_mask(source, "W28")
    corrected = session.render(source, "W28", simple_render, preview_edge=None)
    assert corrected.level == 4.0
    assert corrected.pixels[30, 12, 0] == source[30, 12, 0]
    assert corrected.pixels[30, 30, 0] > source[30, 30, 0]
    assert supplier.computations == 3

    unchanged = session.render(source, "W39", simple_render, level=4, preview_edge=None)
    np.testing.assert_array_equal(unchanged.pixels, other.pixels)
    assert supplier.computations == 3


def test_recipe_replacement_invalidates_one_edit_across_multiple_photos() -> None:
    supplier = CorrectableMaskSpy()
    session = WomenPreviewSession(supplier)
    first = frame()
    second = frame()
    second[0, 0, 0] = 42
    for source in (first, second):
        session.render(source, "W28", simple_render, level=4)
        session.render(source, "W39", simple_render, level=2)
    assert supplier.computations == 4
    supplier.left = 35

    session.invalidate_edit("W28")
    for source in (first, second):
        rerender = session.render(source, "W28", simple_render)
        assert rerender.level == 4.0
        session.render(source, "W39", simple_render)
    assert supplier.computations == 6

    session.invalidate_edit("W39")
    for source in (first, second):
        refreshed = session.render(source, "W39", simple_render)
        assert refreshed.level == 2.0
    assert supplier.computations == 8


def test_photo_replacement_only_erases_affected_photo() -> None:
    supplier = CorrectableMaskSpy()
    session = WomenPreviewSession(supplier)
    first = frame()
    second = frame()
    second[0, 0, 0] = 42
    for source in (first, second):
        for edit in ("W28", "W39"):
            session.render(source, edit, simple_render, level=3)
    assert supplier.computations == 4

    session.invalidate_photo(first)
    for edit in ("W28", "W39"):
        session.render(second, edit, simple_render, level=3)
    assert supplier.computations == 4
    for edit in ("W28", "W39"):
        session.render(first, edit, simple_render, level=3)
    assert supplier.computations == 6


@pytest.mark.parametrize("method", ["invalidate_mask", "invalidate_edit"])
def test_invalid_edit_identifier_does_not_evict_cached_images(method: str) -> None:
    supplier = CorrectableMaskSpy()
    session = WomenPreviewSession(supplier)
    photo = frame()
    session.render(photo, "W28", simple_render, level=3)
    for wrong in ("", "X" * 65):
        with pytest.raises(ValueError):
            if method == "invalidate_mask":
                session.invalidate_mask(photo, wrong)
            else:
                session.invalidate_edit(wrong)
    session.render(photo, "W28", simple_render, level=3)
    assert supplier.computations == 1


def test_invalid_source_does_not_evict_photo_caches() -> None:
    supplier = CorrectableMaskSpy()
    session = WomenPreviewSession(supplier)
    photo = frame()
    session.render(photo, "W28", simple_render, level=3)
    with pytest.raises(ValueError):
        session.invalidate_photo(np.zeros((5, 5), dtype=np.uint8))
    session.render(photo, "W28", simple_render, level=3)
    assert supplier.computations == 1
