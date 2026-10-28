"""R32F checked photo entry on a drawn symmetric face: no real photos or models.

Pass definition (synthetic): an untouched drawn face reads as the historical W6
path does; a glared forehead with agreeing cheeks is recovered to the same
reference; disagreeing cheeks refuse; the default background is the shared
grey-world estimate; nothing private reaches the public summary. The literal
values are shared with web/test/r32f-photo-session.test.mjs. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade.finder import zone_masks
from plumb_api.engines.shade.measurement import background_from_face, measure_shade
from plumb_api.engines.shade.skin_accuracy import assess_skin_photo

WIDTH, HEIGHT = 160, 192
POINTS = symmetric_face(WIDTH, HEIGHT, face_width=88, face_length=126)
ZONES = zone_masks(POINTS, HEIGHT, WIDTH)
SKIN = (63.0, 13.29, 17.64)  # LG-07N
GLARE = (75.0, 13.29 * 0.7, 17.64 * 0.7)


def drawn(forehead: tuple[float, float, float] = SKIN,
          left: tuple[float, float, float] = SKIN) -> np.ndarray:
    image = np.full((HEIGHT, WIDTH, 3), 128, dtype=np.uint8)
    for name, lab in (("cheek_right", SKIN), ("cheek_left", left), ("forehead", forehead)):
        image[ZONES[name]] = cs.to_bytes(cs.lab_to_srgb(np.asarray(lab)))
    return image


def test_drawn_zone_sizes_match_the_browser_fixture() -> None:
    assert {name: int(mask.sum()) for name, mask in ZONES.items()} == {
        "cheek_right": 189, "cheek_left": 189, "forehead": 278}


def test_untouched_face_reads_like_the_historical_entry() -> None:
    image = drawn()
    found = assess_skin_photo(image, POINTS)
    historical = measure_shade(image, POINTS)
    assert found.accepted and found.source == "baseline"
    assert historical.best is not None
    assert found.reference_id == historical.best["id"] == "LG-07N"
    assert found.reading.to_json() == historical.to_json()
    assert found.background == "grey_world_estimate"


def test_default_background_is_the_shared_grey_world_estimate() -> None:
    estimate = background_from_face(drawn(), POINTS)
    assert (estimate.reason, estimate.candidate_pixels, estimate.usable_pixels) == (
        "grey_world_estimate", 7224, 7224)


def test_glared_forehead_with_agreeing_cheeks_is_recovered() -> None:
    found = assess_skin_photo(drawn(forehead=GLARE), POINTS)
    assert found.baseline.refused
    assert found.accepted and found.source == "cheek_consensus"
    assert found.reference_id == "LG-07N"
    assert found.consensus is not None and found.consensus.forehead_excluded
    assert found.consensus.forehead_distances == pytest.approx((10.132, 10.132), abs=1e-3)
    assert dict(found.consensus.zone_sizes) == {"cheek_right": 148, "cheek_left": 148, "forehead": 218}


def test_disagreeing_cheeks_refuse_on_the_photo() -> None:
    found = assess_skin_photo(drawn(left=(43.0, 13.29, 17.64)), POINTS)
    assert not found.accepted and found.source == "refused"
    assert found.reference_id is None
    assert found.consensus is not None and found.consensus.reason == "cheeks_disagree"
    assert found.consensus.cheek_distance == pytest.approx(19.3483, abs=1e-3)


def test_public_summary_has_no_pixels_masks_or_landmarks() -> None:
    public = assess_skin_photo(drawn(forehead=GLARE), POINTS).public()
    text = repr(public)
    assert public["format"] == "beljour-skin-accuracy/1"
    assert public["tested_against_real_products"] is False
    assert "points" not in text and "mask" not in text
    assert len(text) < 4000


def test_photo_and_mesh_are_not_modified() -> None:
    image, points = drawn(forehead=GLARE), POINTS.copy()
    before = image.copy()
    assess_skin_photo(image, points)
    np.testing.assert_array_equal(image, before)
    np.testing.assert_array_equal(points, POINTS)


@pytest.mark.parametrize("bad", [np.zeros((10, 2)), np.full((478, 2), np.nan), POINTS + 1000])
def test_invalid_meshes_are_refused_not_guessed(bad: np.ndarray) -> None:
    with pytest.raises(ValueError):
        assess_skin_photo(drawn(), bad)


def test_non_byte_photo_is_refused() -> None:
    with pytest.raises(ValueError):
        assess_skin_photo(drawn().astype(np.float64), POINTS)


def test_shade_session_reads_through_the_consensus_path() -> None:
    from plumb_api.engines.shade.session import ShadeSession

    session = ShadeSession()
    glare = session.prepare(drawn(forehead=GLARE), POINTS)
    assert glare.source == "cheek_consensus"
    assert not glare.reading.refused and glare.reading.best is not None
    assert glare.reading.best["id"] == "LG-07N"
    assert glare.public()["consensus"]["forehead_excluded"] is True
    applied = session.apply(drawn(forehead=GLARE), glare, 3.0)
    assert applied.simulated and applied.public()["provider_calls"] == 0
    plain = session.prepare(drawn(), POINTS)
    assert plain.source == "baseline" and plain.public()["consensus"] is None
    refused = session.prepare(drawn(left=(43.0, 13.29, 17.64)), POINTS)
    assert refused.source == "refused" and refused.reading.refused
    with pytest.raises(ValueError):
        session.apply(drawn(left=(43.0, 13.29, 17.64)), refused, 3.0)
