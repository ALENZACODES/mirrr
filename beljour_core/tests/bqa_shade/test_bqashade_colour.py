"""Colour maths tests: published CIEDE2000 pairs, properties, conversions, engine formula.

Pass definition: all 34 Sharma, Wu and Dalal (2005) pairs within 1e-4; CIEDE2000
is zero on identical inputs, symmetric, non-negative and continuous across the
0/360 hue wrap; CIE 1994 never exceeds CIE 1976; sRGB, XYZ and Lab round trip
under D65 and D50; Bradford maps white to white; the engine's delta_e is
identified on 10,000 seeded pairs. Drawn numbers only. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from lab.bqa_shade import colour, engine, probe


def test_published_pairs_match_to_four_decimals() -> None:
    pairs = probe.published_pairs()
    assert len(pairs) == 34
    for pair in pairs:
        assert colour.ciede2000_one(pair.lab1, pair.lab2) == pytest.approx(pair.de00, abs=1e-4)


def test_vectorised_matches_scalar_on_published_pairs() -> None:
    pairs = probe.published_pairs()
    first = np.array([p.lab1 for p in pairs])
    second = np.array([p.lab2 for p in pairs])
    expected = np.array([p.de00 for p in pairs])
    assert np.allclose(colour.ciede2000(first, second), expected, atol=1e-4)


def test_ciede2000_properties_on_seeded_pairs() -> None:
    first, second = probe.random_pairs(2000, seed=3)
    forward = colour.ciede2000(first, second)
    backward = colour.ciede2000(second, first)
    assert np.all(forward >= 0)
    assert np.allclose(forward, backward, atol=1e-9)
    assert np.allclose(colour.ciede2000(first, first), 0.0, atol=1e-12)


def test_hue_angle_wrap_is_continuous() -> None:
    def at(hue: float) -> np.ndarray:
        return colour.lch_to_lab([60.0, 30.0, hue])

    across = colour.ciede2000_one(at(359.0), at(1.0))
    inside = colour.ciede2000_one(at(179.0), at(181.0))
    assert across == pytest.approx(colour.ciede2000_one(at(1.0), at(3.0)), rel=0.2)
    assert across < 2.0
    assert inside < 2.0


def test_cie94_never_exceeds_cie76() -> None:
    first, second = probe.random_pairs(2000, seed=5)
    assert np.all(colour.delta_e_94(first, second) <= colour.delta_e_76(first, second) + 1e-9)


def test_cie76_is_euclidean() -> None:
    assert float(colour.delta_e_76([50, 0, 0], [53, 4, 0])) == pytest.approx(5.0)


@pytest.mark.parametrize("illuminant", ["D65", "D50"])
def test_srgb_lab_round_trip(illuminant: str) -> None:
    rng = np.random.default_rng(7)
    rgb = rng.uniform(0.02, 0.98, (500, 3))
    lab = colour.srgb_to_lab(rgb, illuminant)
    assert np.allclose(colour.lab_to_srgb(lab, illuminant), rgb, atol=1e-6)


def test_white_is_lab_100_under_both_whites() -> None:
    for illuminant in ("D65", "D50"):
        lab = colour.srgb_to_lab([1.0, 1.0, 1.0], illuminant)
        assert np.allclose(lab, [100.0, 0.0, 0.0], atol=0.02)


def test_bradford_maps_source_white_to_target_white() -> None:
    adapted = colour.adapt(colour.WHITE_D65, colour.WHITE_D65, colour.WHITE_D50)
    assert np.allclose(adapted, colour.WHITE_D50, atol=1e-6)
    same = colour.bradford_matrix(colour.WHITE_D65, colour.WHITE_D65)
    assert np.allclose(same, np.eye(3), atol=1e-12)


def test_known_srgb_values() -> None:
    red = colour.srgb_to_lab([1.0, 0.0, 0.0])
    assert np.allclose(red, [53.24, 80.09, 67.20], atol=0.05)
    grey = colour.hex_to_lab("#777777")
    assert grey[0] == pytest.approx(50.03, abs=0.05)
    assert abs(grey[1]) < 0.01 and abs(grey[2]) < 0.01


def test_hex_round_trip_and_errors() -> None:
    for code in ("#f6ede4", "#292420", "#a07e56"):
        assert colour.lab_to_hex(colour.hex_to_lab(code)) == code
    for bad in ("#12345", "zzzzzz", "#1234567"):
        with pytest.raises(ValueError):
            colour.hex_to_srgb(bad)


def test_lch_round_trip_and_ita() -> None:
    lab = np.array([[62.0, 12.0, 18.0], [30.0, 8.0, 14.0]])
    assert np.allclose(colour.lch_to_lab(colour.lab_to_lch(lab)), lab)
    ita = colour.ita_degrees(lab)
    assert ita[0] == pytest.approx(np.degrees(np.arctan(12.0 / 18.0)))
    assert ita[1] < 0 < ita[0]


def test_bad_inputs_are_rejected() -> None:
    with pytest.raises(ValueError):
        colour.ciede2000([1.0, 2.0], [1.0, 2.0])
    with pytest.raises(ValueError):
        colour.srgb_to_lab([np.nan, 0.0, 0.0])
    with pytest.raises(ValueError):
        colour.white_point("D75")


def test_gamut_flag() -> None:
    assert bool(colour.lab_in_srgb_gamut([50.0, 0.0, 0.0]))
    assert not bool(colour.lab_in_srgb_gamut([50.0, -100.0, -100.0]))


def test_engine_delta_e_is_identified_on_ten_thousand_pairs() -> None:
    found = engine.engine_delta_e()
    assert not isinstance(found, engine.Unavailable)
    differences = probe.probe_formula(found, n=10_000, seed=18)
    assert probe.identify(differences) == "ciede2000"
    assert differences["cie76"] > 1.0


def test_identify_reports_unknown_for_other_formulas() -> None:
    def scaled(a: object, b: object) -> float:
        return 1.1 * colour.ciede2000_one(np.asarray(a), np.asarray(b))

    assert probe.identify(probe.probe_formula(scaled, n=200, seed=1)) == "unknown"
    assert probe.identify(probe.probe_formula(
        lambda a, b: float(colour.delta_e_76(np.asarray(a), np.asarray(b))), n=200)) == "cie76"
