"""Fictional palette provenance, colour mixing and input sanitization.
Author: John Khan.
"""
from __future__ import annotations

import pytest

from plumb_api.engines.women_styling.palette import (
    SWATCHES, checked_rgb, mix_rgb, pick_swatch, reference_from_outfit, suggested_palette,
)


def test_authored_colour_palette_has_no_brands_or_duplicates() -> None:
    assert len(SWATCHES) == 18
    assert len({s.key for s in SWATCHES}) == len(SWATCHES)
    assert len({s.rgb for s in SWATCHES}) == len(SWATCHES)
    assert len({s.name for s in SWATCHES}) == len(SWATCHES)
    for swatch in SWATCHES:
        assert all(type(c) is int and 0 <= c <= 255 for c in swatch.rgb)
        assert swatch.family in {"cool", "warm", "neutral"}
        assert swatch.depth in {"light", "medium", "deep"}
        assert swatch.key.isascii() and swatch.name.isascii()


@pytest.mark.parametrize("family", ["warm", "cool", "neutral"])
@pytest.mark.parametrize("depth", ["light", "medium", "deep"])
def test_user_selected_screen_palette_is_stable_and_bounded(family: str, depth: str) -> None:
    shade = pick_swatch(family, depth=depth)
    assert shade.family == family
    a = suggested_palette(family)
    b = suggested_palette(family)
    assert a == b
    assert len(a) == 4
    assert all(s in SWATCHES for s in a)
    assert all(s.family == family for s in a[:2])
    assert suggested_palette(family, (170, 145, 115)) == suggested_palette(family, (170, 145, 115))


@pytest.mark.parametrize("percent", [0, 1, 10, 33, 50, 67, 99, 100])
def test_colour_mix_endpoints_and_symmetry(percent: int) -> None:
    a = (12, 95, 231)
    b = (241, 189, 6)
    result = mix_rgb(a, b, percent)
    assert all(0 <= c <= 255 for c in result)
    assert result == mix_rgb(b, a, 100 - percent)
    if percent == 0:
        assert result == a
    if percent == 100:
        assert result == b


@pytest.mark.parametrize("mode", ["complement", "analogous", "muted"])
def test_outfit_harmony_is_a_function_of_only_the_selected_swatch(mode: str) -> None:
    first = reference_from_outfit((31, 170, 219), mode)
    second = reference_from_outfit((31, 170, 219), mode)
    assert first == second
    assert first != reference_from_outfit((215, 55, 80), mode)
    assert all(0 <= component <= 255 for component in first)


@pytest.mark.parametrize("wrong", ["#abcdef", None, (1, 2), (1, 2, 3, 4),
                                    (-1, 2, 3), (20, 256, 3), (1.0, 2, 3),
                                    (False, 2, 3), {"r": 1, "g": 2, "b": 3}])
def test_invalid_rgb_is_rejected_before_processing(wrong: object) -> None:
    with pytest.raises(ValueError):
        checked_rgb(wrong, name="reference_rgb")


def test_invalid_modes_depth_and_undertone_are_refused() -> None:
    with pytest.raises(ValueError):
        pick_swatch("measured")
    with pytest.raises(ValueError):
        pick_swatch("cool", depth="unknown")
    with pytest.raises(ValueError):
        reference_from_outfit((1, 2, 3), "brand")
    with pytest.raises(ValueError):
        mix_rgb((2, 3, 4), (3, 4, 5), -1)
