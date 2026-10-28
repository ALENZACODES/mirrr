"""Range coverage tests (CAT-B2): range defects kept apart from algorithm defects.

Pass definition: on a synthetic catalogue with a deliberate gap, the gap's
targets are range defects; a reading that skips an existing good shade is an
algorithm defect; a range defect answered with a far shade or a user-side
excuse is a violation, while a refusal that names the table is not; the
engine's own reference tables load. Author: John Khan.
"""
from __future__ import annotations

import pytest

from lab.bqa_shade import coverage, engine

SYNTHETIC_CATALOGUE = (
    engine.CatalogueShade("SYN-1", (78.0, 12.0, 19.0), "neutral", 1),
    engine.CatalogueShade("SYN-2", (55.0, 15.0, 22.0), "neutral", 2),
)


def reading(*, refused: bool, reason: str = "",
            best: tuple[float, float, float] | None = None) -> engine.Reading:
    return engine.Reading(refused=refused, reason=reason, measured_lab=None, undertone=None,
                          depth_band=None, best_id="SYN-1" if best else None, best_lab=best,
                          best_step=1 if best else None, alternative_id=None,
                          gains=(1.0, 1.0, 1.0), white_mode="none", notes=(),
                          lighting_usable=True, overall_confidence=0.0)


def test_targets_cover_grid_and_mst() -> None:
    cells = coverage.targets()
    assert len(cells) == len(coverage.targets(include_mst=False)) + 10


def test_gap_targets_are_range_defects() -> None:
    cells = coverage.coverage(SYNTHETIC_CATALOGUE, coverage.targets(), 3.0)
    defects = coverage.range_defects(cells, 3.0)
    assert any(c.target.band == "9-10" for c in defects)
    summary = coverage.band_summary(cells, 3.0)
    assert summary["9-10"]["range_defects"] == summary["9-10"]["targets"]
    with pytest.raises(ValueError):
        coverage.coverage((), coverage.targets(), 3.0)


def test_judge_separates_range_from_algorithm() -> None:
    near = coverage.Target(5, "neutral", (77.5, 12.0, 19.0))
    far = coverage.Target(10, "neutral", (15.0, 3.0, 4.0))
    near_cell, far_cell = coverage.coverage(SYNTHETIC_CATALOGUE, [near, far], 3.0)
    good = coverage.judge(near_cell, reading(refused=False, best=(78.0, 12.0, 19.0)), 3.0)
    skipped = coverage.judge(near_cell, reading(refused=True, reason="x"), 3.0)
    gap = coverage.judge(far_cell, reading(refused=True, reason="no shade is deep enough"), 3.0)
    assert (good.kind, skipped.kind, gap.kind) == (coverage.COVERED, coverage.ALGORITHM,
                                                    coverage.RANGE)
    measured = coverage.as_measured([near_cell, far_cell], [good, skipped, gap], 3.0)
    assert measured["range_defect_readings"] == 1
    assert measured["algorithm_defect_readings"] == 1
    assert measured["band_9_10_range_defects"] == 1


def test_hiding_a_range_defect() -> None:
    far = coverage.Target(10, "neutral", (15.0, 3.0, 4.0))
    cell = coverage.coverage(SYNTHETIC_CATALOGUE, [far], 3.0)[0]
    named = reading(refused=True, reason="no shade in our reference table is deep enough")
    blamed = reading(refused=True, reason="the reading is not reliable; try even daylight")
    silent = reading(refused=False, best=(55.0, 15.0, 22.0))
    for case, hidden in ((named, False), (blamed, True), (silent, True)):
        verdict = coverage.judge(cell, case, 3.0)
        assert coverage.hides_range_defect(verdict, case) is hidden


def test_engine_reference_tables_load() -> None:
    base = engine.catalogue("base")
    extended = engine.catalogue("extended")
    assert not isinstance(base, engine.Unavailable)
    assert not isinstance(extended, engine.Unavailable)
    assert len(extended) > len(base) >= 20
    with pytest.raises(ValueError):
        engine.catalogue("other")
