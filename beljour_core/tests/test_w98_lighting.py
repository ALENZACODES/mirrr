"""W98 Lighting Simulator: chromaticity maths, adaptation, re-lighting and a look that can fail.

Pass definition (written before the run, synthetic colours only): the locus formulas agree
with published reference chromaticities; Bradford adaptation maps the source white exactly to
the target white; daylight is the identity; a scene cast estimated from a grey patch is
removed (stored Lab is illuminant-free); a matched foundation holds while a nude lip close to
the skin loses contrast in dim light; every report carries the calibration caveat.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.core.colour import ciede2000
from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade import lighting as L


def test_planckian_and_daylight_locus_match_reference_points() -> None:
    # Reference chromaticities: CIE illuminant A (2856 K) and D65 (6504 K), CIE 15.
    assert L.planckian_xy(2856) == pytest.approx((0.44757, 0.40745), abs=1.5e-3)
    assert L.daylight_xy(6504) == pytest.approx((0.31271, 0.32902), abs=5e-4)
    assert L.daylight_xy(5003) == pytest.approx((0.34567, 0.35850), abs=5e-4)  # D50
    warm, cool = L.planckian_xy(2700), L.planckian_xy(6500)
    assert warm[0] > cool[0], "lower colour temperature is redder"
    with pytest.raises(ValueError):
        L.planckian_xy(1000)
    with pytest.raises(ValueError):
        L.daylight_xy(3000)


def test_duv_moves_green_and_keeps_temperature_side() -> None:
    base = L.planckian_xy(4100)
    green = L.with_duv(4100, 0.004)
    magenta = L.with_duv(4100, -0.004)
    assert green[1] > base[1] > magenta[1]
    assert L.with_duv(4100, 0.0) == base
    with pytest.raises(ValueError):
        L.with_duv(4100, 0.05)


def test_bradford_maps_white_to_white_and_degree_zero_is_identity() -> None:
    src = L.xy_to_white(*L.planckian_xy(2700))
    m = L.bradford(src, cs.WHITE, 1.0)
    np.testing.assert_allclose(m @ src, cs.WHITE, atol=1e-12)
    np.testing.assert_allclose(L.bradford(src, cs.WHITE, 0.0), np.eye(3), atol=1e-12)
    half = L.bradford(src, cs.WHITE, 0.5) @ src
    assert half[0] < src[0] and half[2] > src[2]
    with pytest.raises(ValueError):
        L.bradford(src, cs.WHITE, 1.5)


def test_daylight_is_the_reference_appearance() -> None:
    for lab in ([62, 14, 18], [30, 8, 12], [85, 2, 6]):
        np.testing.assert_allclose(L.relight_lab(lab, "daylight"), lab, atol=1e-9)
    image = np.arange(60, dtype=np.uint8).reshape(4, 5, 3) * 4
    np.testing.assert_array_equal(L.relight_image(image, "daylight"), image)


def test_warm_presets_warm_and_dim_presets_darken() -> None:
    skin = np.array([62.0, 14.0, 18.0])
    evening = L.relight_lab(skin, "evening")
    restaurant = L.relight_lab(skin, "dim_restaurant")
    flash = L.relight_lab(skin, "camera_flash")
    assert evening[2] > skin[2], "warm light pushes b* up"
    assert restaurant[0] < evening[0] < skin[0]
    assert flash[0] > skin[0]
    assert set(L.presets_data()["shown_first"]) == {"daylight", "office", "evening"}
    assert len(L.preset_ids()) == 8


def test_capture_normalisation_removes_a_scene_cast() -> None:
    lab = np.array([55.0, 16.0, 20.0])
    cast_white = L.xy_to_white(*L.planckian_xy(3000))
    seen = cs.xyz_to_lab(cs.lab_to_xyz(lab) @ L.bradford(cs.WHITE, cast_white, 1.0).T)
    assert ciede2000(seen, lab) > 5
    grey = cs.encode(cs.xyz_to_linear(cs.lab_to_xyz([60.0, 0.0, 0.0]) @ L.bradford(cs.WHITE, cast_white, 1.0).T))
    estimated = L.estimate_white(np.tile(grey, (30, 1)))
    assert estimated is not None
    np.testing.assert_allclose(estimated, cast_white, rtol=2e-3)
    assert ciede2000(L.neutralise_lab(seen, estimated), lab) < 0.3
    assert L.estimate_white(np.zeros((30, 3))) is None
    assert L.estimate_white(np.full((5, 3), 120.0)) is None


def test_relight_image_matches_relight_lab_and_keeps_alpha() -> None:
    lab = np.array([58.0, 12.0, 16.0])
    rgb = cs.to_bytes(cs.lab_to_srgb(lab))
    image = np.zeros((2, 2, 4), np.uint8)
    image[..., :3] = rgb
    image[..., 3] = [[10, 20], [30, 40]]
    out = L.relight_image(image, "office")
    np.testing.assert_array_equal(out[..., 3], image[..., 3])
    expected = L.relight_lab(cs.srgb_to_lab(rgb.astype(float)), "office")
    assert ciede2000(cs.srgb_to_lab(out[0, 0, :3].astype(float)), expected) < 0.6


def test_a_matched_foundation_holds_and_a_nude_lip_fails_in_dim_light() -> None:
    items = {"skin": [62, 14, 18], "foundation": [62.5, 13.5, 18.5], "nude lip": [56, 22, 16], "red lip": [45, 55, 35]}
    pairs = [{"a": "skin", "b": "foundation", "kind": "match"}, {"a": "skin", "b": "nude lip", "kind": "contrast"},
             {"a": "skin", "b": "red lip", "kind": "contrast"}]
    report = L.simulate_look(items, pairs, presets=L.preset_ids())
    data = report.to_json()
    assert not report.holds
    by_kind = {(p["a"], p["b"]): p for p in data["pairs"]}
    assert all(v["passed"] for v in by_kind[("skin", "foundation")]["by_preset"].values())
    assert all(v["passed"] for v in by_kind[("skin", "red lip")]["by_preset"].values())
    nude = by_kind[("skin", "nude lip")]["by_preset"]
    assert nude["daylight"]["passed"] and not nude["dim_restaurant"]["passed"]
    assert any("Dim restaurant" in f for f in data["failures"])
    assert data["caveat"] == L.CAVEAT and "not colour-calibrated" in data["caveat"]
    assert data["items"]["skin"]["by_preset"]["daylight"]["shift_delta_e"] == 0
    assert data["items"]["skin"]["by_preset"]["dim_restaurant"]["large_shift"] is True


def test_a_foundation_that_matches_only_by_luck_can_fail() -> None:
    items = {"skin": [60, 14, 18], "foundation": [57, 9, 24]}
    report = L.simulate_look(items, [{"a": "skin", "b": "foundation", "kind": "match"}])
    assert not report.holds
    assert report.to_json()["verdict"].startswith("fails:")


def test_bad_inputs_are_refused() -> None:
    with pytest.raises(ValueError, match="at least one item"):
        L.simulate_look({})
    with pytest.raises(ValueError, match="unknown lighting preset"):
        L.simulate_look({"skin": [60, 10, 15]}, presets=["moonlight"])
    with pytest.raises(ValueError, match="match or contrast"):
        L.simulate_look({"skin": [60, 10, 15]}, [{"a": "skin", "b": "lip", "kind": "match"}])
    with pytest.raises(ValueError, match="finite"):
        L.simulate_look({"skin": [60, float("nan"), 15]})
    with pytest.raises(ValueError, match="uint8"):
        L.relight_image(np.zeros((2, 2, 3)), "office")
