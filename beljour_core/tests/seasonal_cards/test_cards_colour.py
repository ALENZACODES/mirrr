"""Colour maths tests: WCAG contrast, CIELAB, colour-vision simulation, palette contrast.

Author: John Khan.
"""

from __future__ import annotations

import random

import pytest

from plumb_api.seasonal.cards import OCCASIONS
from plumb_api.seasonal.cards.colour import (
    MACHADO_2009,
    WCAG_AA_TEXT,
    best_ink,
    contrast_ratio,
    cvd_pair_report,
    delta_e,
    linear_to_srgb,
    mix,
    parse_hex,
    relative_luminance,
    simulate_cvd,
    srgb_to_linear,
    to_hex,
    to_lab,
)
from plumb_api.seasonal.cards.grammar import arrange_palette


def test_parse_and_format_round_trip() -> None:
    assert parse_hex("#FF8000") == (255, 128, 0)
    assert to_hex((255, 128, 0)) == "#ff8000"
    for bad in ("ff8000", "#ff800", "#gg0000", "#ff80001", ""):
        with pytest.raises(ValueError):
            parse_hex(bad)


def test_wcag_reference_values() -> None:
    assert contrast_ratio((0, 0, 0), (255, 255, 255)) == pytest.approx(21.0)
    assert contrast_ratio((255, 255, 255), (255, 255, 255)) == pytest.approx(1.0)
    # #767676 on white is the well-known lightest grey that passes AA (4.54:1).
    assert contrast_ratio(parse_hex("#767676"), (255, 255, 255)) == pytest.approx(4.54, abs=0.01)
    assert contrast_ratio(parse_hex("#777777"), (255, 255, 255)) < WCAG_AA_TEXT
    assert relative_luminance((255, 255, 255)) == pytest.approx(1.0)


def test_contrast_is_symmetric() -> None:
    rng = random.Random(4)
    for _ in range(200):
        a = (rng.randrange(256), rng.randrange(256), rng.randrange(256))
        b = (rng.randrange(256), rng.randrange(256), rng.randrange(256))
        assert contrast_ratio(a, b) == pytest.approx(contrast_ratio(b, a))
        assert 1.0 <= contrast_ratio(a, b) <= 21.0


def test_linear_round_trip_is_exact_for_every_byte() -> None:
    for value in range(256):
        assert linear_to_srgb(srgb_to_linear(value)) == value


def test_best_ink_always_reaches_large_text_contrast() -> None:
    rng = random.Random(9)
    for _ in range(500):
        bg = (rng.randrange(256), rng.randrange(256), rng.randrange(256))
        assert contrast_ratio(best_ink(bg), bg) >= 3.0


def test_mix_end_points() -> None:
    assert mix((0, 0, 0), (200, 100, 50), 0.0) == (0, 0, 0)
    assert mix((0, 0, 0), (200, 100, 50), 1.0) == (200, 100, 50)
    assert mix((0, 0, 0), (200, 100, 50), 0.5) == (100, 50, 25)


def test_lab_reference_white_and_black() -> None:
    white = to_lab((255, 255, 255))
    assert white[0] == pytest.approx(100.0, abs=0.01)
    assert abs(white[1]) < 0.01 and abs(white[2]) < 0.01
    assert to_lab((0, 0, 0))[0] == pytest.approx(0.0, abs=0.01)
    assert delta_e((10, 20, 30), (10, 20, 30)) == 0.0


def test_cvd_matrices_keep_greys_grey() -> None:
    # Rows of each published matrix sum to about 1, so neutral greys stay neutral.
    for kind, matrix in MACHADO_2009.items():
        for row in matrix:
            assert sum(row) == pytest.approx(1.0, abs=0.002), kind
        for level in (0, 64, 128, 200, 255):
            out = simulate_cvd((level, level, level), kind)
            assert max(out) - min(out) <= 2


def test_cvd_confuses_red_and_green_for_dichromats() -> None:
    red, green = (200, 40, 40), (40, 160, 40)
    typical = delta_e(red, green)
    assert delta_e(simulate_cvd(red, "deuteranopia"), simulate_cvd(green, "deuteranopia")) < \
        typical / 2
    assert delta_e(simulate_cvd(red, "protanopia"), simulate_cvd(green, "protanopia")) < \
        typical / 2
    with pytest.raises(ValueError):
        simulate_cvd(red, "monochrome")


def test_cvd_pair_report_has_all_four_visions() -> None:
    rows = cvd_pair_report((20, 20, 20), (250, 250, 250))
    assert [r.vision for r in rows] == ["typical", "protanopia", "deuteranopia", "tritanopia"]
    assert all(r.contrast > 15 for r in rows)


@pytest.mark.parametrize("occasion_id", sorted(OCCASIONS))
def test_every_palette_arrangement_meets_aa_for_text(occasion_id: str) -> None:
    for look in OCCASIONS[occasion_id].looks:
        for seed in range(60):
            spec = arrange_palette(look, random.Random(seed))
            roles = {k: parse_hex(v) for k, v in spec.roles}
            surface = roles["plate"] if spec.plate else roles["background"]
            assert contrast_ratio(roles["ink"], surface) >= WCAG_AA_TEXT, (look.id, seed)
            assert len(set(spec.order)) == len(spec.order)
