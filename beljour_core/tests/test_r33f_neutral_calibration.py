"""R33F neutral-card checks on drawn scenes: no photos, devices or models.

Pass definition (synthetic): a card is used only when confirmed as neutral, when
enough unclipped, opaque pixels remain in both halves, and when the halves agree
within the committed W6 zone distance; mixed lighting refuses; a usable card
restores a unit-luminance cast. Shared with web/test/r33f-neutral-calibration.test.mjs.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.shade.finder import thresholds
from plumb_api.engines.shade.neutral_calibration import inspect_neutral_card, neutral_photo_options
from tests.r33f_shade_scenes import COOL, WARM, card, scene


@pytest.mark.parametrize("cast,gains", [
    (WARM, (0.889251, 1.015163, 1.28038)),
    (COOL, (1.150902, 0.984681, 0.811559)),
])
def test_confirmed_even_card_gives_neutral_gains(cast: np.ndarray, gains: tuple[float, ...]) -> None:
    found = inspect_neutral_card(scene(cast=cast), card(), confirmed=True)
    assert found.usable and found.reason is None
    assert (found.card_pixels, found.usable_pixels) == (256, 256)
    assert found.upper_lower_distance == pytest.approx(0.0, abs=1e-9)
    assert found.white is not None and found.white.mode == "neutral"
    np.testing.assert_allclose(found.white.gains, gains, atol=1e-6)
    np.testing.assert_allclose(found.white.gains, 1 / cast, rtol=0.02)
    assert neutral_photo_options(found)["neutral_mask"].sum() == 256


def test_unconfirmed_card_is_never_used() -> None:
    found = inspect_neutral_card(scene(cast=WARM), card(), confirmed=False)
    assert (found.usable, found.reason) == (False, "not_confirmed")
    assert neutral_photo_options(found) == {}
    with pytest.raises(ValueError):
        inspect_neutral_card(scene(), card(), confirmed=1)  # type: ignore[arg-type]


def test_mixed_lighting_across_the_card_refuses() -> None:
    found = inspect_neutral_card(scene(lower_rgb=170), card(), confirmed=True)
    assert found.reason == "mixed_lighting"
    assert found.upper_lower_distance == pytest.approx(13.7873, abs=1e-3)
    assert found.upper_lower_distance > thresholds()["confidence"]["zone_delta_e_ok"]
    assert found.white is None and found.mask is None


def test_clipped_and_transparent_cards_are_left_out() -> None:
    clipped = inspect_neutral_card(scene(card_rgb=255), card(), confirmed=True)
    assert (clipped.reason, clipped.usable_pixels) == ("card_clipped", 0)
    rgba = np.dstack([scene(), np.full(scene().shape[:2], 255, dtype=np.uint8)])
    rgba[4:20, 4:20, 3] = 0
    transparent = inspect_neutral_card(rgba, card(), confirmed=True)
    assert transparent.reason == "card_clipped"


def test_half_clipped_card_counts_only_its_usable_pixels() -> None:
    image = scene()
    image[4:12, 4:20] = 2
    found = inspect_neutral_card(image, card(), confirmed=True)
    assert (found.reason, found.usable_pixels) == ("card_clipped", 128)


def test_small_card_is_too_small() -> None:
    assert inspect_neutral_card(scene(), card(4), confirmed=True).reason == "card_too_small"


def test_public_summary_has_no_mask_and_is_not_clinical() -> None:
    public = inspect_neutral_card(scene(cast=WARM), card(), confirmed=True).public()
    assert "mask" not in public and public["clinical"] is False
    assert public["white"]["mode"] == "neutral"


def test_mask_must_match_the_photo() -> None:
    with pytest.raises(ValueError):
        inspect_neutral_card(scene(), np.ones((10, 10), dtype=bool), confirmed=True)
