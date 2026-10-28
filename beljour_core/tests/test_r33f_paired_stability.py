"""R33F two-capture repeatability on drawn scenes: no photos or models.

Pass definition (synthetic): a shade is suggested only for two different photos
that each clear the existing W6 limits and name the same reference; the same
photo twice, an unreadable capture, a refused reading or disagreeing references
never suggest a shade; reports carry no photo bytes or digests. Shared with
web/test/r33f-paired-stability.test.mjs. Author: John Khan.
"""
from __future__ import annotations

import pytest

from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade.paired_stability import ShadeCapture, clears_limits, compare_shade_captures
from tests.r33f_shade_scenes import COOL, NEXT_SKIN, POINTS, SKIN, WARM, ZONES, card, scene


def test_two_lit_photos_with_a_checked_card_agree() -> None:
    found = compare_shade_captures(ShadeCapture(scene(cast=WARM), POINTS, card()),
                                   ShadeCapture(scene(cast=COOL), POINTS, card()))
    assert found.suggested and found.reason is None
    assert found.reference_id == found.first_reference_id == found.second_reference_id == "LG-07N"
    assert found.reading_distance == pytest.approx(0.189, abs=1e-3)
    assert found.confidences == (pytest.approx(1.0), pytest.approx(1.0))


def test_the_same_photo_twice_is_not_a_second_reading() -> None:
    found = compare_shade_captures(ShadeCapture(scene(), POINTS), ShadeCapture(scene(), POINTS))
    assert (found.suggested, found.reason) == (False, "same_photo")
    assert found.first_reference_id is None and found.reading_distance is None


def test_different_references_are_not_suggested() -> None:
    found = compare_shade_captures(ShadeCapture(scene(SKIN), POINTS), ShadeCapture(scene(NEXT_SKIN), POINTS))
    assert (found.suggested, found.reason, found.reference_id) == (False, "references_differ", None)
    assert (found.first_reference_id, found.second_reference_id) == ("LG-07N", "LG-08N")
    assert found.reading_distance == pytest.approx(2.587, abs=1e-3)


def test_a_refused_reading_blocks_the_pair() -> None:
    refused = scene()
    refused[ZONES["cheek_left"]] = cs.to_bytes(cs.lab_to_srgb([43.0, 13.29, 17.64]))
    found = compare_shade_captures(ShadeCapture(scene(), POINTS), ShadeCapture(refused, POINTS))
    assert (found.suggested, found.reason) == (False, "second_refused")
    assert found.first_reference_id == "LG-07N" and found.second_reference_id is None


def test_unreadable_captures_are_coded() -> None:
    assert compare_shade_captures(ShadeCapture(scene(), None),
                                  ShadeCapture(scene(cast=WARM), POINTS)).reason == "first_invalid"
    assert compare_shade_captures(ShadeCapture(scene(), POINTS),
                                  ShadeCapture(scene(cast=WARM), POINTS[:10])).reason == "second_invalid"


def test_public_report_has_labels_and_measurements_only() -> None:
    public = compare_shade_captures(ShadeCapture(scene(cast=WARM), POINTS, card()),
                                    ShadeCapture(scene(cast=COOL), POINTS, card())).public()
    assert set(public) == {"suggested", "reason", "reference_id", "first_reference_id",
                           "second_reference_id", "reading_distance", "confidences", "note",
                           "tested_against_real_products"}
    assert len(repr(public)) < 600


def test_limits_are_the_existing_w6_limits() -> None:
    from dataclasses import replace

    from plumb_api.engines.shade.skin_accuracy import assess_skin_photo

    reading = assess_skin_photo(scene(), POINTS).reading
    assert clears_limits(reading)
    assert not clears_limits(replace(reading, refused=True))
    assert reading.best is not None
    assert not clears_limits(replace(reading, best={**reading.best, "lighter_by": 1.5}))
    assert not clears_limits(replace(reading, confidence={**reading.confidence, "overall": 0.4}))
