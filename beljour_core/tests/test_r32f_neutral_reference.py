"""R32F explicit neutral reference on a drawn face under coloured light: synthetic only.

Pass definition: a supplied neutral card takes precedence over any background
and over the grey-world estimate; under a unit-luminance warm or cool cast it
restores the untinted reference; a card too small to measure is not used and is
not reported as a correction. Shared with web/test/r32f-neutral-card.test.mjs.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade.finder import zone_masks
from plumb_api.engines.shade.reference_study import CASTS
from plumb_api.engines.shade.skin_accuracy import assess_skin_photo

WIDTH, HEIGHT = 160, 192
POINTS = symmetric_face(WIDTH, HEIGHT, face_width=88, face_length=126)
SKIN = (63.0, 13.29, 17.64)  # LG-07N
CARD = (slice(4, 20), slice(4, 20))


def lit(cast: np.ndarray, background: tuple[int, int, int] = (128, 128, 128)) -> np.ndarray:
    image = np.empty((HEIGHT, WIDTH, 3), dtype=np.uint8)
    image[:] = background
    image[CARD] = 128
    for mask in zone_masks(POINTS, HEIGHT, WIDTH).values():
        image[mask] = cs.to_bytes(cs.lab_to_srgb(np.asarray(SKIN)))
    return cs.to_bytes(cs.encode(cs.decode(image) * cast))


def card(size: int = 16) -> np.ndarray:
    mask = np.zeros((HEIGHT, WIDTH), dtype=np.bool_)
    mask[4:4 + size, 4:4 + size] = True
    return mask


@pytest.mark.parametrize("condition", sorted(CASTS))
def test_neutral_card_restores_the_reference_under_coloured_light(condition: str) -> None:
    cast = CASTS[condition]
    found = assess_skin_photo(lit(cast), POINTS, neutral_mask=card())
    assert found.background == "explicit_neutral"
    assert found.reading.white.mode == "neutral"
    np.testing.assert_allclose(found.reading.white.gains, 1 / cast, rtol=0.02)
    assert found.accepted and found.reference_id == "LG-07N"


def test_neutral_card_wins_over_a_tinted_background_mask() -> None:
    cast = CASTS["warm_light_checked_neutral"]
    image = lit(cast, background=(170, 110, 90))
    background = np.ones((HEIGHT, WIDTH), dtype=np.bool_)
    background[CARD] = False
    with_card = assess_skin_photo(image, POINTS, neutral_mask=card(), background_mask=background)
    without = assess_skin_photo(image, POINTS, background_mask=background)
    assert with_card.reading.white.mode == "neutral" and with_card.reference_id == "LG-07N"
    assert without.reading.white.mode == "grey_world"
    assert without.reference_id != "LG-07N"


def test_too_small_card_is_not_reported_as_a_correction() -> None:
    found = assess_skin_photo(lit(CASTS["cool_light_checked_neutral"]), POINTS, neutral_mask=card(3))
    assert found.background == "explicit_neutral"
    assert found.reading.white.mode == "none"
    assert found.public()["reading"]["white"]["mode"] == "none"


def test_without_a_card_the_default_estimate_is_labelled() -> None:
    found = assess_skin_photo(lit(CASTS["warm_light_checked_neutral"]), POINTS)
    assert found.background == "grey_world_estimate"
    assert found.reading.white.mode == "grey_world"
