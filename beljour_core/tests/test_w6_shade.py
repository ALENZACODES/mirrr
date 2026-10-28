"""W6 Foundation Shade Finder: drawn faces only (R5 symmetric mesh, flat skin plus seeded grain).

Pass definition (written before the run, synthetic only): undertone class correct on 10 drawn
patches of known Lab; CIEDE2000 agrees with the Sharma (2005) pairs and picks the nearest
shade in a known table; no shade more than 1 L* lighter than measured; the same skin under
three camera white balances gives the same undertone and a reading within 1.5 ΔE00 of the
neutral one; weak readings are refused. Not tested against real products or real faces.
Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.core import regions
from plumb_api.engines.core.colour import ciede2000
from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade import finder

W, H = 160, 192
POINTS = symmetric_face(W, H, face_width=W * 0.55, face_length=H * 0.66)
OVAL = regions.region_mask("face_oval", POINTS, H, W, normalized=False, supersample=2) >= 0.5


def lab_from(lightness: float, chroma: float, hue: float) -> np.ndarray:
    return np.array([lightness, chroma * math.cos(math.radians(hue)), chroma * math.sin(math.radians(hue))])


def drawn(lab: np.ndarray, *, gains: tuple[float, float, float] = (1.0, 1.0, 1.0), seed: int = 1,
          grain: float = 1.5) -> np.ndarray:
    rng = np.random.default_rng(seed)
    image = np.full((H, W, 3), 128.0)
    image[OVAL] = cs.lab_to_srgb(lab) + rng.normal(0, grain, (int(OVAL.sum()), 3))
    lin = cs.decode(np.clip(image, 0, 255)) * np.asarray(gains)
    return cs.to_bytes(cs.encode(lin))


BACKGROUND = (~OVAL).astype(np.float64)

# (lightness, chroma, hue) -> expected undertone. Hues sit inside each ASSUMED class band.
PATCHES = [
    ((74, 16, 38), "cool"), ((58, 22, 40), "cool"), ((33, 15, 42), "cool"),
    ((70, 18, 53), "neutral"), ((45, 22, 54), "neutral"),
    ((66, 20, 64), "warm"), ((50, 24, 66), "warm"), ((30, 16, 65), "warm"),
    ((60, 18, 79), "olive"), ((41, 18, 82), "olive"),
]

SHARMA = [
    ((50.0, 2.6772, -79.7751), (50.0, 0.0, -82.7485), 2.0425),
    ((50.0, 2.4900, -0.0010), (50.0, -2.4900, 0.0009), 7.1792),
    ((50.0, 2.5000, 0.0000), (73.0, 25.0, -18.0), 27.1492),
    ((60.2574, -34.0099, 36.2677), (60.4626, -34.1751, 39.4387), 1.2644),
    ((90.8027, -2.0831, 1.4410), (91.1528, -1.6435, 0.0447), 1.4441),
    ((2.0776, 0.0795, -1.1350), (0.9033, -0.0636, -0.5514), 0.9082),
]


@pytest.mark.parametrize("lch,expected", PATCHES)
def test_undertone_on_drawn_patches_of_known_lab(lch: tuple[float, float, float], expected: str) -> None:
    lab = lab_from(*lch)
    result = finder.find_shade(drawn(lab), POINTS, background_mask=BACKGROUND)
    assert result.undertone is not None
    assert result.undertone["undertone"] == expected
    assert result.measured_lab is not None
    assert ciede2000(result.measured_lab, lab) < 1.0
    assert result.label == "Shade estimate from your photo. Not tested against real products."
    assert result.to_json()["tested_against_real_products"] is False


def test_olive_is_first_class_not_folded_into_warm() -> None:
    assert finder.undertone_of(lab_from(60, 18, 80))["undertone"] == "olive"
    assert finder.undertone_of(lab_from(60, 18, 66))["undertone"] == "warm"
    assert {r["undertone"] for r in finder.reference_table()} == set(finder.UNDERTONES)
    olive = [r for r in finder.reference_table() if r["undertone"] == "olive"]
    assert len(olive) == len(finder.reference_table()) // 4


@pytest.mark.parametrize("a,b,expected", SHARMA)
def test_delta_e_used_for_matching_is_ciede2000(a, b, expected) -> None:
    assert ciede2000(a, b) == pytest.approx(expected, abs=1e-4)
    assert ciede2000(b, a) == pytest.approx(expected, abs=1e-4)


def test_nearest_match_on_a_known_table() -> None:
    table = [{"id": "A", "name": "A", "lab": [60.0, 12.0, 18.0]},
             {"id": "B", "name": "B", "lab": [59.0, 16.0, 14.0]},
             {"id": "C", "name": "C", "lab": [50.0, 12.0, 18.0]},
             {"id": "D", "name": "D", "lab": [75.0, 12.0, 18.0]}]
    measured = [60.0, 13.0, 17.5]
    matches = finder.match_shades(measured, table)
    expected = sorted((ciede2000(measured, r["lab"]), r["id"]) for r in table if r["lab"][0] - 60 <= 1)
    assert [m["id"] for m in matches] == [rid for _, rid in expected]
    assert matches[0]["id"] == "A"
    assert "D" not in [m["id"] for m in matches], "15 L* lighter is never offered"
    with pytest.raises(ValueError, match="twice"):
        finder.match_shades(measured, table + [table[0]])


@pytest.mark.parametrize("lightness", [79.5, 70.0, 61.2, 52.0, 43.3, 34.9, 27.0, 24.6])
def test_never_lighter_than_measured(lightness: float) -> None:
    for match in finder.match_shades([lightness, 11, 16]):
        assert match["lab"][0] <= lightness + 1.0 + 1e-12
        assert match["lighter_by"] <= 1.0 + 1e-12
    result = finder.find_shade(drawn(lab_from(lightness, 18, 56)), POINTS, background_mask=BACKGROUND)
    if not result.refused:
        assert result.best is not None
        assert result.best["lab"][0] <= result.measured_lab[0] + 1.0


def test_deeper_than_every_reference_refuses_instead_of_lightening() -> None:
    result = finder.find_shade(drawn(lab_from(15, 8, 50)), POINTS, background_mask=BACKGROUND)
    assert result.refused
    assert "deep enough" in str(result.reason)
    assert result.best is None and result.test_plan is None
    assert result.measured_lab is not None and result.measured_lab[0] < 20


@pytest.mark.parametrize("lch", [(68, 17, 50), (47, 22, 63), (31, 14, 76)])
def test_stable_under_three_white_balances(lch: tuple[float, float, float]) -> None:
    lab = lab_from(*lch)
    neutral = finder.find_shade(drawn(lab), POINTS, background_mask=BACKGROUND)
    assert not neutral.refused
    for gains in ((1.18, 1.0, 0.78), (0.84, 1.0, 1.22), (0.92, 1.08, 0.9)):
        cast = drawn(lab, gains=gains)
        raw = finder.find_shade(cast, POINTS)
        fixed = finder.find_shade(cast, POINTS, background_mask=BACKGROUND)
        assert fixed.white.mode == "grey_world" and not fixed.white.clamped
        assert fixed.undertone["undertone"] == neutral.undertone["undertone"]
        assert ciede2000(fixed.measured_lab, neutral.measured_lab) < 1.5
        assert ciede2000(fixed.measured_lab, neutral.measured_lab) < ciede2000(raw.measured_lab, neutral.measured_lab)
        # Normalising keeps luminance, so it never lightens the skin reading.
        assert fixed.measured_lab[0] <= neutral.measured_lab[0] + 1.0


def test_neutral_patch_is_preferred_over_grey_world() -> None:
    lab = lab_from(55, 20, 58)
    image = drawn(lab, gains=(1.15, 1.0, 0.8))
    patch = np.zeros((H, W))
    patch[2:14, 2:14] = 1
    result = finder.find_shade(image, POINTS, neutral_mask=patch, background_mask=BACKGROUND)
    assert result.white.mode == "neutral"
    assert result.confidence["lighting"] == 1.0


def test_strong_cast_is_clamped_and_lowers_confidence() -> None:
    white = finder.white_from_pixels(np.tile([[230.0, 120.0, 10.0]], (40, 1)), "grey_world")
    assert white.clamped
    assert max(white.gains) <= 2.0 and min(white.gains) >= 0.5
    zones = {name: np.tile(cs.lab_to_srgb(lab_from(60, 18, 58)), (200, 1)) for name in finder.ZONES}
    clamped = finder.find_from_pixels(zones, white)
    assert clamped.confidence["lighting"] == 0.6


def test_too_little_skin_is_refused() -> None:
    zones = {"cheek_right": np.full((5, 3), 180.0), "cheek_left": np.zeros((0, 3)), "forehead": np.full((4, 3), 170.0)}
    result = finder.find_from_pixels(zones)
    assert result.refused and "not enough visible skin" in str(result.reason)
    assert result.zones["cheek_right"]["pixels"] == 5


def test_noisy_uneven_reading_is_refused_not_guessed() -> None:
    rng = np.random.default_rng(4)
    base = cs.lab_to_srgb(lab_from(55, 20, 58))
    zones = {"cheek_right": np.clip(base + rng.normal(0, 40, (150, 3)), 0, 255),
             "cheek_left": np.clip(cs.lab_to_srgb(lab_from(40, 20, 58)) + rng.normal(0, 40, (150, 3)), 0, 255),
             "forehead": np.clip(cs.lab_to_srgb(lab_from(70, 10, 40)) + rng.normal(0, 40, (150, 3)), 0, 255)}
    result = finder.find_from_pixels(zones)
    assert result.refused
    assert result.confidence["overall"] < 0.45


def test_zones_stay_inside_the_skin_mask_and_off_the_features() -> None:
    zones = finder.zone_masks(POINTS, H, W)
    skin = regions.region_mask("skin", POINTS, H, W, normalized=False, supersample=2) >= 0.5
    lips = regions.region_mask("lips", POINTS, H, W, normalized=False, supersample=2) >= 0.5
    eyes = regions.region_mask("eyes", POINTS, H, W, normalized=False, supersample=2) >= 0.5
    for name, mask in zones.items():
        assert mask.sum() > 50, name
        assert not np.any(mask & ~skin) and not np.any(mask & (lips | eyes)), name
    assert np.all(np.nonzero(zones["forehead"])[0].max() < np.nonzero(zones["cheek_right"])[0].min())


def test_two_shade_plan_and_json_contract() -> None:
    result = finder.find_shade(drawn(lab_from(62, 19, 60)), POINTS, background_mask=BACKGROUND)
    data = result.to_json()
    assert not data["refused"]
    assert data["best"]["id"] != data["alternative"]["id"]
    assert data["best"]["name"] in data["test_plan"] and data["alternative"]["name"] in data["test_plan"]
    assert data["never_lighter"] is True
    assert data["depth_band_note"].startswith("ASSUMED")
    assert 1 <= data["depth_band"] <= 10
    assert 0 < data["confidence"]["overall"] <= 1


def test_deterministic_and_inputs_untouched() -> None:
    image = drawn(lab_from(50, 20, 60))
    copy, pts = image.copy(), POINTS.copy()
    a = finder.find_shade(image, POINTS, background_mask=BACKGROUND).to_json()
    b = finder.find_shade(image, POINTS, background_mask=BACKGROUND).to_json()
    assert a == b
    np.testing.assert_array_equal(image, copy)
    np.testing.assert_array_equal(POINTS, pts)


@pytest.mark.parametrize("bad", [np.zeros((H, W, 3), np.float32), np.zeros((H, W), np.uint8)])
def test_bad_photos_are_rejected(bad: np.ndarray) -> None:
    with pytest.raises(ValueError, match="uint8"):
        finder.find_shade(bad, POINTS)


def test_depth_bands_cover_the_range_in_order() -> None:
    bands = [finder.depth_band(v) for v in np.linspace(100, 0, 101)]
    assert bands[0] == 1 and bands[-1] == 10
    assert all(b2 >= b1 for b1, b2 in zip(bands, bands[1:], strict=False))
    assert set(bands) == set(range(1, 11))
    with pytest.raises(ValueError):
        finder.depth_band(float("nan"))


def test_reference_table_has_no_brand_names_and_spans_depths() -> None:
    rows = finder.reference_table()
    assert len(rows) == 80
    assert all(r["name"].startswith("Reference ") for r in rows)
    assert {r["depth"] for r in rows} == set(range(1, 11))
    lightness = sorted({r["lab"][0] for r in rows})
    assert lightness[0] <= 25 and lightness[-1] >= 80
