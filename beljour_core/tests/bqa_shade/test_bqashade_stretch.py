"""Stretch tests: metamerism probe, undertone confusion, speed, shade card, range answers.

Pass definition: the spectral matching functions put Planck whites within 0.002
xy of the locus fit; the metamer pair is equal in daylight (CIEDE2000 < 0.01)
and visibly apart under the warm lamp; the confusion matrix keeps 'unsure' as
its own column; band assignment of 1,000,000 colours plus CIEDE2000 on
1,000,000 pairs finishes under 2 seconds (best of two runs) and float32 agrees with float64; the
shade card passes the COL-01 linter; range answers are sorted into kinds.
Drawn data only. Author: John Khan.
"""
from __future__ import annotations

import time
from pathlib import Path

import numpy as np
import pytest
from bqashade_synthetic import label_rows, write_csv

from lab.bqa_shade import (
    applied,
    bands,
    cards,
    colour,
    coverage,
    engine,
    importers,
    lights,
    metamerism,
    wording,
)


@pytest.mark.parametrize("kelvin", [2856.0, 4000.0, 6500.0])
def test_matching_functions_agree_with_the_locus(kelvin: float) -> None:
    white = metamerism.white_under(kelvin)
    x, y = white[0] / white.sum(), white[1] / white.sum()
    px, py = lights.planck_xy(kelvin)
    assert abs(x - px) < 0.002 and abs(y - py) < 0.002


def test_metamer_pair_matches_in_daylight_only() -> None:
    pair = metamerism.make_pair()
    assert pair.delta_e(metamerism.DAYLIGHT_K) < 0.01
    assert pair.delta_e(metamerism.WARM_K) > 2.0
    assert np.all((pair.second >= 0) & (pair.second <= 1))
    assert not np.allclose(pair.first, pair.second)


def test_engine_view_of_the_metamers() -> None:
    found = metamerism.probe(engine.ShadeEngine())
    assert found["engine_same_shade_daylight"] == "True"
    warm = found["engine_reading_de00_warm"]
    assert isinstance(warm, float) and warm > 1.0


def test_undertone_confusion_keeps_unsure(tmp_path: Path) -> None:
    path = tmp_path / "labels.csv"
    rows = label_rows(10, 1.0, 0.7, expert_unsure=2)
    rows[0]["product_undertone"] = None
    write_csv(path, [c.name for c in applied.LABEL_COLUMNS], rows)
    table = importers.read_csv(path, applied.LABEL_COLUMNS)
    matrix = applied.undertone_confusion(table.rows)
    assert set(matrix) == set(bands.REPORTING_BANDS)
    assert matrix["1-2"]["unsure"]["warm"] == 1 and matrix["1-2"]["unsure"]["none"] == 1
    assert matrix["5-6"]["warm"] == {"warm": 5, "cool": 3}
    flat = applied.confusion_measures(matrix)
    assert flat["confusion_5_6_warm_as_cool"] == 3
    assert all(not k.endswith("_warm_as_warm") for k in flat)


def test_million_colour_speed_and_agreement() -> None:
    rng = np.random.default_rng(11)
    lab = np.column_stack([rng.uniform(10, 95, 1_000_000), rng.uniform(-5, 30, 1_000_000),
                           rng.uniform(-5, 40, 1_000_000)])
    timings = []
    for _ in range(2):
        started = time.perf_counter()
        steps = bands.nearest_steps(lab, dtype=np.float32)
        differences = colour.ciede2000(lab, lab[::-1], dtype=np.float32)
        timings.append(time.perf_counter() - started)
    assert steps.shape == (1_000_000,) and differences.shape == (1_000_000,)
    # Best of two runs, so a busy machine does not decide the result.
    assert min(timings) < 2.0, f"{min(timings):.2f} s"
    sample = lab[:50_000]
    assert np.array_equal(bands.nearest_steps(sample), steps[:50_000])
    exact = colour.ciede2000(sample, lab[::-1][:50_000])
    assert np.max(np.abs(exact - differences[:50_000])) < 1e-3


def test_shade_card_passes_the_linter() -> None:
    table = engine.catalogue("extended")
    assert not isinstance(table, engine.Unavailable)
    targets = coverage.targets(include_mst=False)
    cells = coverage.coverage(table, targets, 3.0)
    card = cards.render_card(cells, [], 3.0)
    assert wording.lint_markdown(card) == []
    assert "| 9-10 | daylight |" in card and "Triage only" in card


def reading(refused: bool, reason: str) -> engine.Reading:
    return engine.Reading(refused=refused, reason=reason, measured_lab=None, undertone=None,
                          depth_band=None, best_id=None, best_lab=(50.0, 10.0, 10.0),
                          best_step=None, alternative_id=None, gains=(1.0, 1.0, 1.0),
                          white_mode="none", notes=(), lighting_usable=True,
                          overall_confidence=0.0)


def test_range_answers_are_sorted() -> None:
    far = coverage.Target(10, "warm", (14.0, 3.0, 6.0))
    table = (engine.CatalogueShade("SYN-1", (60.0, 10.0, 15.0), "warm", 1),)
    cell = coverage.coverage(table, [far], 3.0)[0]
    verdict = coverage.judge(cell, reading(True, "x"), 3.0)
    answers = {
        "named_range": reading(True, "no shade in our reference table is deep enough"),
        "user_blame": reading(True, "the reading is not reliable; try even daylight"),
        "other_refusal": reading(True, "something else"),
        "far_shade": reading(False, ""),
    }
    for kind, answer in answers.items():
        assert coverage.range_response(verdict, answer) == kind
