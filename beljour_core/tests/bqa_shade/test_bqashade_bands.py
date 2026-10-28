"""MST band and undertone rule tests (SKN-01 support).

Pass definition: the 10 MST hex values are exactly the published ones; each
reference colour is its own nearest step; steps map to the five reporting
bands; the one-step comparator and our undertone rule behave as documented;
every drawn skin cell stays nearest to its own step and reads as its own
undertone. No Fitzpatrick scale is used as a colour scale. Author: John Khan.
"""
from __future__ import annotations

import json

import numpy as np
import pytest

from lab.bqa_shade import bands, colour
from lab.bqa_shade.datafiles import DATA_DIR

PUBLISHED = ("#f6ede4", "#f3e7db", "#f7ead0", "#eadaba", "#d7bd96", "#a07e56", "#825c43",
             "#604134", "#3a312a", "#292420")


def test_mst_hex_values_are_the_published_scale() -> None:
    assert tuple(t.hex for t in bands.mst_tones()) == PUBLISHED
    assert tuple(t.step for t in bands.mst_tones()) == bands.STEPS


def test_mst_table_schema_and_licence_note() -> None:
    data = json.loads((DATA_DIR / "mst.json").read_text(encoding="utf-8"))
    assert data["format"] == "beljour-bqa-mst/1"
    assert "ASSUMED CC BY 4.0" in data["licence"]
    assert [b["band"] for b in data["reporting_bands"]] == list(bands.REPORTING_BANDS)


def test_lightness_falls_from_step_five_down() -> None:
    lightness = [t.lab[0] for t in bands.mst_tones()]
    assert all(a > b for a, b in zip(lightness[3:], lightness[4:], strict=False))
    assert lightness[0] > 90 and lightness[-1] < 20


def test_each_reference_is_its_own_nearest_step() -> None:
    steps = bands.nearest_steps(bands.mst_lab_array())
    assert list(steps) == list(bands.STEPS)


@pytest.mark.parametrize(("step", "band"), [(1, "1-2"), (2, "1-2"), (3, "3-4"), (6, "5-6"),
                                            (8, "7-8"), (9, "9-10"), (10, "9-10")])
def test_reporting_bands(step: int, band: str) -> None:
    assert bands.band_of_step(step) == band


@pytest.mark.parametrize("bad", [0, 11, True, 2.0])
def test_bad_steps_are_rejected(bad: object) -> None:
    with pytest.raises(ValueError):
        bands.band_of_step(bad)  # type: ignore[arg-type]


def test_within_one_step() -> None:
    assert bands.within_one_step(5, 5)
    assert bands.within_one_step(5, 6)
    assert bands.within_one_step(10, 9)
    assert not bands.within_one_step(3, 5)


@pytest.mark.parametrize(("hue", "expected"), [(40.0, "cool"), (200.0, "cool"),
                                               (52.0, "neutral"), (63.0, "warm"),
                                               (78.0, "olive")])
def test_undertone_rule_by_hue(hue: float, expected: str) -> None:
    lab = colour.lch_to_lab([55.0, 20.0, hue])
    assert bands.undertone_of(lab) == expected


def test_undertone_rule_edge_cases() -> None:
    assert bands.undertone_of([50.0, 1.0, 1.0]) == "neutral"
    low_b = colour.lch_to_lab([40.0, 5.5, 80.0])
    assert low_b[2] < 6.0
    assert bands.undertone_of(low_b) == "warm"


def test_drawn_cells_keep_their_step_and_undertone() -> None:
    grid = bands.skin_grid()
    assert len(grid) + len(bands.grid_gaps()) == 40
    for step, tone, lab in grid:
        assert bands.nearest_step(lab) == step
        assert bands.undertone_of(lab) == tone
    for band in bands.REPORTING_BANDS:
        assert any(bands.band_of_step(step) == band for step, _, _ in grid)


def test_gap_cells_refuse_to_draw() -> None:
    step, tone = bands.grid_gaps()[0]
    with pytest.raises(ValueError):
        bands.skin_lab(step, tone)
    with pytest.raises(ValueError):
        bands.skin_lab(5, "pink")


def test_nearest_steps_keeps_shape() -> None:
    lab = np.tile(bands.mst_lab_array()[4], (3, 2, 1))
    assert bands.nearest_steps(lab).shape == (3, 2)
    assert bands.band_of_lab(bands.mst_lab_array()[6]) == "7-8"


def test_no_fitzpatrick_colour_scale_in_data() -> None:
    for path in DATA_DIR.iterdir():
        text = path.read_text(encoding="utf-8").lower()
        assert "fitzpatrick" not in text or "not a fitzpatrick" in text
