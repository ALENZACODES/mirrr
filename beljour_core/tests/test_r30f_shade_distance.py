"""Checked CIEDE2000 and never-lighter ranking over the shared catalogues.

Sharma, Wu and Dalal (2005) published pairs plus synthetic Lab readings only.
Author: John Khan.
"""
from __future__ import annotations

import csv
import random
from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines import shade
from plumb_api.engines.hair_palette import suggest
from plumb_api.engines.shade import finder
from plumb_api.engines.shade.distance import (
    MATCH_NOTE,
    delta_e,
    delta_e_pairs,
    distance_to_shade,
    nearest_shade,
    rank_shades,
)
from plumb_api.engines.shade.loaders import load_hair_shades, load_reference_shades, shade_by_id

ROOT = Path(__file__).resolve().parents[2]
SHARMA = ROOT / "lab/bqa_shade/data/sharma2005_pairs.csv"


def sharma_rows() -> list[dict[str, str]]:
    with SHARMA.open(encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def test_all_34_published_sharma_pairs() -> None:
    rows = sharma_rows()
    assert len(rows) == 34
    pairs = [((float(r["l1"]), float(r["a1"]), float(r["b1"])), (float(r["l2"]), float(r["a2"]), float(r["b2"])))
             for r in rows]
    got = delta_e_pairs(pairs)
    for value, row in zip(got, rows, strict=True):
        assert abs(value - float(row["de00"])) < 1e-4, row["pair"]
    # Symmetric, and the package export is the same function.
    assert delta_e_pairs((b, a) for a, b in pairs) == pytest.approx(got, abs=1e-12)
    assert shade.delta_e is delta_e and shade.delta_e_pairs is delta_e_pairs


def test_float64_arrays_are_accepted_and_identical_colours_are_zero() -> None:
    lab = np.array([55.0, 12.5, 18.25])
    assert delta_e(lab, lab.tolist()) == 0.0
    assert delta_e(np.array([50.0, 2.6772, -79.7751]), (50, 0, -82.7485)) == pytest.approx(2.0425, abs=1e-4)


@pytest.mark.parametrize("bad", [(1, 2), (1, 2, 3, 4), (float("inf"), 0, 0), (-1, 0, 0), (50, 0, -130),
                                 (False, 0, 0), ("50", 0, 0), None])
def test_bad_lab_is_refused_never_clipped(bad: object) -> None:
    with pytest.raises(ValueError):
        delta_e(bad, (50, 0, 0))  # type: ignore[arg-type]


def test_pairs_refuse_as_a_whole() -> None:
    with pytest.raises(ValueError):
        delta_e_pairs([((50, 0, 0), (60, 0, 0)), ((50, 0, 0),)])  # type: ignore[list-item]
    with pytest.raises(ValueError):
        delta_e_pairs([((50, 0, 0), (60, 0, 0)), ((50, 0, 0), (float("nan"), 0, 0))])
    assert delta_e_pairs([]) == ()


def test_skin_ranking_matches_the_w6_matcher() -> None:
    rng = random.Random(30)
    table = finder.extended_reference_table()
    for _ in range(60):
        lab = (rng.uniform(18, 84), rng.uniform(0, 22), rng.uniform(2, 30))
        expected = finder.match_shades(lab, table)
        got = rank_shades(lab, "reference")
        assert [m.record.id for m in got] == [row["id"] for row in expected]
        for match, row in zip(got, expected, strict=True):
            assert match.delta_e == pytest.approx(row["delta_e"], abs=1e-12)
            assert match.lighter_by == pytest.approx(row["lighter_by"], abs=1e-12)
            assert match.lighter_by <= 1.0 and match.measured_level is None


def test_hair_ranking_matches_the_palette_suggestion() -> None:
    rng = random.Random(31)
    for _ in range(40):
        lab = (rng.uniform(5, 80), rng.uniform(-3, 25), rng.uniform(-8, 35))
        expected = suggest(lab, count=5)
        got = rank_shades(lab, "hair", limit=5)
        assert [m.record.id for m in got] == [s.shade.id for s in expected]
        assert all(m.record.level <= m.measured_level for m in got if m.measured_level is not None)


def test_allow_lighter_is_an_explicit_choice() -> None:
    lab = (25.4, 7.23, 3.96)
    held = nearest_shade(lab, "hair")
    lifted = nearest_shade(lab, "hair", allow_lighter=True)
    assert held is not None and lifted is not None
    assert held.record.level <= held.measured_level  # type: ignore[operator]
    assert lifted.record.level > lifted.measured_level  # type: ignore[operator]
    assert lifted.delta_e < held.delta_e
    with pytest.raises(ValueError):
        rank_shades(lab, "hair", allow_lighter=1)  # type: ignore[arg-type]


def test_too_deep_reading_gets_no_shade() -> None:
    assert nearest_shade((10, 5, 5)) is None
    assert rank_shades((10, 5, 5), "base") == ()
    deepest = nearest_shade((21, 5, 5))
    assert deepest is not None and deepest.record.id == "LG-24N"


def test_limit_custom_tables_and_public_form() -> None:
    lab = (60, 12, 18)
    ranked = rank_shades(lab, "base", limit=2)
    assert [m.record.id for m in ranked] == ["LG-08N", "LG-09N"]
    mixed = (shade_by_id("LG-08N"), *load_hair_shades()[:3])
    assert {m.record.surface for m in rank_shades(lab, mixed, allow_lighter=True)} == {"skin", "hair"}
    body = ranked[0].public()
    assert body["shade"]["id"] == "LG-08N" and body["note"] == MATCH_NOTE
    assert distance_to_shade(lab, ranked[0].record) == ranked[0].delta_e
    for bad in (0, -1, 1.5, True):
        with pytest.raises(ValueError):
            rank_shades(lab, limit=bad)  # type: ignore[arg-type]
    for table in ((), (load_reference_shades()[0], load_reference_shades()[0]), ("LG-01C",)):
        with pytest.raises(ValueError):
            rank_shades(lab, table)  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        distance_to_shade(lab, {"lab": [50, 0, 0]})  # type: ignore[arg-type]
