"""Deterministic quota, pair and declared vocabulary acceptance tests.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.plan import (
    PairQuota,
    QuotaTable,
    counts_by_family,
    counts_by_pair,
    derived_seed,
    make_plan,
    make_plans,
)
from lab.synth_diversity.types import TRAIT_VALUES, SyntheticInputError, validate_tags


def test_balanced_default_families() -> None:
    plans = make_plans(240, seed=1234)
    for family in TRAIT_VALUES:
        counts = list(counts_by_family(plans, family).values())
        assert max(counts) - min(counts) <= 1


def test_pair_quota_balances_cells() -> None:
    pair = PairQuota("fitzpatrick", "vitiligo")
    plans = make_plans(240, seed=37, quota=QuotaTable(pairs=(pair,)))
    counts = list(counts_by_pair(plans, "fitzpatrick", "vitiligo").values())
    assert set(counts) == {10}
    assert all(sum(counts_by_family(plans, name).values()) == 240 for name in TRAIT_VALUES)


def test_explicit_weights_choose_only_allowed_strata() -> None:
    quotas = QuotaTable(
        traits={"glasses": {"none": 0.0, "clear": 0.0, "tinted": 1.0}},
        pairs=(PairQuota("fitzpatrick", "vitiligo", {"VI|generalised": 2}),),
    )
    plans = make_plans(20, 9, quotas)
    assert all(item.tags["glasses"] == "tinted" for item in plans)
    assert all(item.tags["fitzpatrick"] == "VI" for item in plans)
    assert all(item.tags["vitiligo"] == "generalised" for item in plans)


def test_round_trip_seed_exact() -> None:
    assert make_plans(25, 984) == make_plans(25, 984)
    assert make_plans(25, 984) != make_plans(25, 985)
    assert make_plan(7).seed == derived_seed(7, 0, "traits")


def test_pair_overlap_is_an_error() -> None:
    with pytest.raises(SyntheticInputError, match="overlapping pair"):
        QuotaTable(
            pairs=(
                PairQuota("fitzpatrick", "vitiligo"),
                PairQuota("fitzpatrick", "freckles"),
            )
        )


def test_quota_bad_inputs_fail_early() -> None:
    with pytest.raises(SyntheticInputError):
        QuotaTable(traits={"unknown": {"none": 1}})
    with pytest.raises(SyntheticInputError):
        QuotaTable(traits={"glasses": {"none": -1}})
    with pytest.raises(SyntheticInputError):
        QuotaTable.from_json({"unexpected": 1})
    with pytest.raises(SyntheticInputError):
        PairQuota("vitiligo", "vitiligo")
    with pytest.raises(SyntheticInputError):
        PairQuota("fitzpatrick", "vitiligo", {"VII|focal": 1})
    with pytest.raises(SyntheticInputError):
        make_plans(0, 3)


def test_coverage_is_canonical_and_declared() -> None:
    for item in make_plans(100, 99):
        validate_tags(item.tags)
        if item.tags["vitiligo"] == "none":
            assert item.tags["vitiligo_coverage"] == 0
        else:
            assert 0 < float(item.tags["vitiligo_coverage"]) <= 1
    changed = make_plan(50).tags
    changed["birthmark"] = "unknown"
    with pytest.raises(SyntheticInputError):
        validate_tags(changed)
