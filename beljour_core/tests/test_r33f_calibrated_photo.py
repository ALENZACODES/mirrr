"""R33F card-assisted photo reading on drawn scenes: no photos, providers or models.

Pass definition (synthetic): a confirmed, evenly lit card corrects coloured light
and reads the drawn reference through the cheek-consensus path; a missing mesh,
an invalid mesh or a rejected card never yields a usable shade and never falls
back to a background estimate. Shared with web/test/r33f-*.test.mjs. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.shade.calibrated_photo import assess_calibrated_photo
from plumb_api.engines.shade.finder import zone_masks
from tests.r33f_shade_scenes import COOL, HEIGHT, POINTS, WARM, WIDTH, card, scene


@pytest.mark.parametrize("cast", [WARM, COOL])
def test_checked_card_reads_the_reference_under_coloured_light(cast: np.ndarray) -> None:
    found = assess_calibrated_photo(scene(cast=cast), POINTS, card(), confirmed=True)
    assert found.usable and found.reason is None
    assert found.reference_id == "LG-07N"
    assert found.assessment is not None
    assert found.assessment.reading.white.mode == "neutral"
    assert found.assessment.background == "explicit_neutral"


def test_glare_is_recovered_through_the_consensus_path_with_the_card() -> None:
    image = scene(cast=WARM)
    forehead = zone_masks(POINTS, HEIGHT, WIDTH)["forehead"]
    image[forehead] = np.clip(image[forehead].astype(int) + 60, 0, 250).astype(np.uint8)
    found = assess_calibrated_photo(image, POINTS, card(), confirmed=True)
    assert found.assessment is not None and found.assessment.source == "cheek_consensus"
    assert found.reference_id == "LG-07N"


@pytest.mark.parametrize("kwargs,reason", [
    ({"confirmed": False}, "not_confirmed"),
    ({"confirmed": True, "lower_rgb": 170}, "mixed_lighting"),
    ({"confirmed": True, "card_rgb": 255}, "card_clipped"),
])
def test_rejected_cards_never_yield_a_shade(kwargs: dict[str, object], reason: str) -> None:
    confirmed = bool(kwargs.pop("confirmed"))
    image = scene(cast=WARM, **kwargs)  # type: ignore[arg-type]
    found = assess_calibrated_photo(image, POINTS, card(), confirmed=confirmed)
    assert (found.usable, found.reason, found.reference_id) == (False, "card_rejected", None)
    assert found.neutral is not None and found.neutral.reason == reason
    assert found.assessment is None


def test_missing_and_invalid_meshes_are_coded() -> None:
    assert assess_calibrated_photo(scene(), None, card(), confirmed=True).reason == "no_mesh"
    bad = assess_calibrated_photo(scene(), POINTS[:10], card(), confirmed=True)
    assert (bad.usable, bad.reason) == (False, "invalid_mesh")
    outside = assess_calibrated_photo(scene(), POINTS + 1000, card(), confirmed=True)
    assert not outside.usable and outside.reference_id is None


def test_public_summary_is_photo_free() -> None:
    public = assess_calibrated_photo(scene(cast=WARM), POINTS, card(), confirmed=True).public()
    assert public["format"] == "beljour-calibrated-photo/1"
    assert public["provider_calls"] == 0 and public["tested_against_real_products"] is False
    assert "mask" not in repr(public["neutral"])
