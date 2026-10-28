"""Slice balancing by declared attributes, deterministic and never inferring.

Author: John Khan.
"""

from __future__ import annotations

import random
from dataclasses import replace

import pytest

from plumb_api.data_factory.records import AGE_BANDS, LIGHTING, ImageRecord
from plumb_api.data_factory.slices import (
    UNDECLARED,
    SliceSpec,
    SliceSpecError,
    balance,
    cell_name,
    parse_cell,
    slice_counts,
)
from plumb_api.data_factory.synthetic import fake_records


@pytest.fixture(scope="module")
def pool() -> list[ImageRecord]:
    return list(fake_records(3000, seed=3, declared_share=0.8))


def test_per_cell_quotas_and_shortfall(pool: list[ImageRecord]) -> None:
    spec = SliceSpec(dimensions=("age_band", "lighting"), per_cell=30)
    result = balance(pool, spec)
    assert len(result.cells) == len(AGE_BANDS) * len(LIGHTING)
    for cell in result.cells:
        assert cell.selected == min(cell.target, cell.available)
        assert cell.shortfall == max(0, cell.target - cell.available)
    assert len(result.selected) == sum(cell.selected for cell in result.cells)
    assert result.undeclared == sum(1 for r in pool if r.age_band is None or r.lighting is None)
    assert result.outside_targets == result.undeclared
    big = balance(pool, replace(spec, per_cell=500))
    assert big.shortfall_total > 0
    assert all(cell.shortfall > 0 for cell in big.shortfalls())


def test_selection_ignores_input_order(pool: list[ImageRecord]) -> None:
    spec = SliceSpec(dimensions=("lighting",), per_cell=50, prefer="seeded")
    shuffled = list(pool)
    random.Random(9).shuffle(shuffled)
    first = [r.content_sha256 for r in balance(pool, spec).selected]
    second = [r.content_sha256 for r in balance(shuffled, spec).selected]
    assert first == second == sorted(first)
    other_seed = balance(pool, replace(spec, seed="another")).selected
    assert [r.content_sha256 for r in other_seed] != first


def test_quality_preference(pool: list[ImageRecord]) -> None:
    spec = SliceSpec(dimensions=("lighting",), targets={"lighting=studio": 5})
    studio = [r for r in pool if r.lighting == "studio"]
    scores = {r.content_sha256: 0.1 for r in studio}
    best = sorted(r.content_sha256 for r in studio)[:5]
    scores.update({digest: 0.99 for digest in best})
    result = balance(pool, spec, scores)
    assert sorted(r.content_sha256 for r in result.selected) == best
    assert result.outside_targets == len(pool) - len(studio)


def test_undeclared_cells_are_opt_in(pool: list[ImageRecord]) -> None:
    spec = SliceSpec(dimensions=("pose_bucket",), per_cell=10, include_undeclared=True)
    result = balance(pool, spec)
    names = [cell.cell for cell in result.cells]
    assert f"pose_bucket={UNDECLARED}" in names
    selected_undeclared = [r for r in result.selected if r.pose_bucket is None]
    assert len(selected_undeclared) == 10
    assert all(r.pose_bucket is None for r in selected_undeclared)


def test_balancing_never_fills_in_attributes(pool: list[ImageRecord]) -> None:
    spec = SliceSpec(dimensions=("skin_tone_group",), per_cell=1000, include_undeclared=True)
    result = balance(pool, spec)
    originals = {r.content_sha256: r for r in pool}
    for record in result.selected:
        assert record == originals[record.content_sha256]
        assert record.skin_tone_group == originals[record.content_sha256].skin_tone_group


def test_explicit_targets_parse_and_validate() -> None:
    dims = ("age_band", "lighting")
    name = cell_name(dims, ("20-29", "studio"))
    assert name == "age_band=20-29|lighting=studio"
    assert parse_cell(dims, name) == ("20-29", "studio")
    for bad in ("age_band=20-29", "lighting=studio|age_band=20-29",
                "age_band=teen|lighting=studio", "age_band20-29|lighting=studio"):
        with pytest.raises(SliceSpecError):
            parse_cell(dims, bad)


@pytest.mark.parametrize("raw", [
    {"dimensions": []},
    {"dimensions": ["mood"], "per_cell": 1},
    {"dimensions": ["lighting", "lighting"], "per_cell": 1},
    {"dimensions": ["lighting"]},
    {"dimensions": ["lighting"], "per_cell": 1, "targets": {"lighting=studio": 1}},
    {"dimensions": ["lighting"], "per_cell": -1},
    {"dimensions": ["lighting"], "targets": {"lighting=studio": -2}},
    {"dimensions": ["lighting"], "per_cell": 1, "prefer": "random"},
    {"dimensions": "lighting", "per_cell": 1},
    {"dimensions": ["lighting"], "per_cell": 1, "extra": True},
    {"dimensions": ["lighting"], "targets": ["lighting=studio"]},
])
def test_bad_specs(raw: dict[str, object]) -> None:
    with pytest.raises(SliceSpecError):
        SliceSpec.from_dict(raw)


def test_spec_round_trip_and_counts(pool: list[ImageRecord]) -> None:
    spec = SliceSpec.from_dict({"dimensions": ["lighting"], "targets": {"lighting=low-light": 3},
                                "seed": "x"})
    assert SliceSpec.from_dict(spec.to_dict()) == spec
    counts = slice_counts(pool, "lighting")
    assert sum(counts.values()) == len(pool)
    assert UNDECLARED in counts
    with pytest.raises(SliceSpecError):
        slice_counts(pool, "mood")
    result = balance(pool, spec)
    assert result.to_dict()["cells"][0]["selected"] == 3
