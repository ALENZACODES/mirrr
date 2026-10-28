"""R28F conservative hair-colour consultation on a drawn hair patch: no photographs.

Pass definition: suggestions need landmarks, a marked mask and a corrected reading;
uncorrected light and a missing mesh never suggest; lighter swatches need an explicit
choice; the bounded cache holds derived readings only and changes key with the photo
or brush. Literal values are shared with web/test/r28f-consultation.test.mjs.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.hair_palette.consultation import HairColourConsultation
from plumb_api.engines.shade import colourspace as cs
from tests.r31f_fibre_scene import HEAD

WIDTH, HEIGHT = 40, 30
WARM = (1.15, 1.0, 0.8)


def photo(cast: tuple[float, float, float] = WARM) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """(photo, hair mask, neutral card): a striped hair patch beside a grey card."""
    base = np.full((HEIGHT, WIDTH, 3), (92.0, 66.0, 48.0))
    xx, yy = np.meshgrid(np.arange(WIDTH), np.arange(HEIGHT))
    base += (((xx * 7 + yy * 3) % 9) - 4)[..., None]
    card = np.zeros((HEIGHT, WIDTH), dtype=bool)
    card[:, :12] = True
    base[card] = 150.0
    return cs.to_bytes(cs.encode(cs.decode(base) * np.asarray(cast))), ~card, card


def test_corrected_reading_gives_no_lighter_suggestions() -> None:
    image, hair, card = photo()
    found = HairColourConsultation().suggest(image, hair, HEAD, neutral_mask=card)
    assert found.usable and found.code is None
    assert found.reading is not None and found.reading.white_mode == "neutral"
    assert found.reading.pixels == 840
    np.testing.assert_allclose(found.reading.lab, (30.5738, 8.6751, 15.3616), atol=1e-3)
    assert found.measured_level == 5
    assert [s.shade.id for s in found.suggestions] == ["natural-05-w", "natural-05-n", "natural-05-c"]
    assert all(s.shade.level <= 5 for s in found.suggestions)


def test_lighter_swatches_need_an_explicit_choice() -> None:
    image, hair, card = photo()
    found = HairColourConsultation().suggest(image, hair, HEAD, neutral_mask=card, allow_lightening=True, count=5)
    assert [(s.shade.id, s.shade.level) for s in found.suggestions] == [
        ("natural-05-w", 5), ("natural-05-n", 5), ("natural-06-n", 6), ("natural-06-c", 6), ("natural-06-w", 6)]
    assert found.public()["allow_lightening"] is True


def test_unreliable_light_missing_mesh_and_bad_masks_never_suggest() -> None:
    image, hair, card = photo()
    session = HairColourConsultation()
    assert session.suggest(image, hair, HEAD).code == "unreliable_lighting"
    assert session.suggest(image, hair, None, neutral_mask=card).code == "no_mesh"
    assert session.suggest(image, np.ones((5, 5), dtype=bool), HEAD).code == "invalid_mask"
    assert session.suggest(image, hair, HEAD, primary_box=(0, 0, 12, 30)).code == "too_few_pixels"
    assert session.suggest(image, hair, HEAD, primary_box=(5, 5, 99, 9)).code == "invalid_mask"
    assert all(not session.suggest(image, hair, None).usable for _ in range(2))


def test_cache_holds_derived_readings_and_changes_with_photo_or_brush() -> None:
    image, hair, card = photo()
    session = HairColourConsultation(capacity=2)
    first = session.suggest(image, hair, HEAD, neutral_mask=card)
    again = session.suggest(image, hair, HEAD, neutral_mask=card, allow_lightening=True)
    assert (first.cached, again.cached, session.reading_computes) == (False, True, 1)
    brushed = hair.copy()
    brushed[0, 20] = False
    assert not session.suggest(image, brushed, HEAD, neutral_mask=card).cached
    other, _, _ = photo((1.0, 1.0, 1.0))
    assert not session.suggest(other, hair, HEAD, neutral_mask=card).cached
    assert len(session) == 2 and session.reading_computes == 3
    session.invalidate()
    assert len(session) == 0
    stored = list(session._readings.values())
    assert stored == []


def test_options_are_checked() -> None:
    image, hair, card = photo()
    with pytest.raises(ValueError):
        HairColourConsultation(capacity=0)
    with pytest.raises(ValueError):
        HairColourConsultation().suggest(image, hair, HEAD, neutral_mask=card, allow_lightening=1)  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        HairColourConsultation().suggest(image.astype(np.float64), hair, HEAD, neutral_mask=card)
