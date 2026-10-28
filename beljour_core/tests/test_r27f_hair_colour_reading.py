"""Hair colour reading: optional neutral card, lighting and transparency refusals, no lightening.

Drawn colour patches only. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.hair_palette.reading import LABEL, HairColourReading, ReadingRefusal, read_hair_colour
from plumb_api.engines.shade.distance import delta_e
from tests.r27f_fixtures import colour_patch

HAIR = (70, 50, 40)


def reading(*args: object, **kwargs: object) -> HairColourReading:
    found = read_hair_colour(*args, **kwargs)  # type: ignore[arg-type]
    assert isinstance(found, HairColourReading)
    return found


def test_a_neutral_card_corrects_a_warm_cast() -> None:
    day = reading(*colour_patch(HAIR)[:2], neutral_mask=colour_patch(HAIR)[2])
    image, hair, card = colour_patch(HAIR, cast=(1.2, 1.0, 0.75))
    warm = reading(image, hair, neutral_mask=card)
    raw = reading(image, hair)
    assert warm.corrected and not raw.corrected
    assert delta_e(warm.reading.lab, day.reading.lab) < 1.0 < delta_e(raw.reading.lab, day.reading.lab)
    assert warm.public()["label"] == LABEL


def test_suggestions_never_go_above_the_measured_level() -> None:
    found = reading(*colour_patch(HAIR)[:2])
    assert 1 <= len(found.suggestions) <= 3
    assert all(s.shade.level <= found.level and s.no_lightening for s in found.suggestions)
    assert found.public()["no_auto_lightening"] is True


def test_mixed_lighting_on_the_hair_refuses() -> None:
    image, hair, card = colour_patch(HAIR)
    image[5:35, 42:55, :3] = (150, 70, 40)
    found = read_hair_colour(image, hair, neutral_mask=card)
    assert isinstance(found, ReadingRefusal) and found.code == "mixed_lighting"
    assert found.separation is not None and found.separation > 10


def test_an_inconsistent_neutral_card_refuses() -> None:
    image, hair, card = colour_patch(HAIR)
    image[20:35, 2:20, :3] = (200, 150, 100)
    found = read_hair_colour(image, hair, neutral_mask=card)
    assert isinstance(found, ReadingRefusal) and found.code == "inconsistent_neutral"
    tiny = np.zeros_like(card)
    tiny[5:8, 2:5] = True
    assert read_hair_colour(image, hair, neutral_mask=tiny).code == "inconsistent_neutral"  # type: ignore[union-attr]


def test_transparent_pixels_are_left_out_and_counted() -> None:
    image, hair, _ = colour_patch(HAIR)
    image[5:35, 25:40, 3] = 120
    found = reading(image, hair)
    assert found.excluded_transparent == 30 * 15 and found.reading.pixels == 30 * 15
    image[..., 3] = 0
    gone = read_hair_colour(image, hair)
    assert isinstance(gone, ReadingRefusal) and gone.code == "transparent_source"
    empty = read_hair_colour(colour_patch(HAIR)[0], np.zeros_like(hair))
    assert isinstance(empty, ReadingRefusal) and empty.code == "no_hair"


def test_primary_box_clips_the_mask_and_bad_inputs_raise() -> None:
    image, hair, _ = colour_patch(HAIR)
    clipped = reading(image, hair, primary_box=(25, 5, 40, 35))
    assert clipped.reading.pixels == 30 * 15
    with pytest.raises(ValueError):
        read_hair_colour(image[..., 0], hair)
    with pytest.raises(ValueError):
        read_hair_colour(image, hair.astype(np.float64) * 2)
