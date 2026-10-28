"""Rare trait-pair plan coverage and isolation on declared synthetic cases.
Author: John Khan.
"""

from __future__ import annotations

import json

import pytest

from lab.synth_diversity.plan import derived_seed
from lab.synth_diversity.strata import (
    CHALLENGE_STRATA,
    NEUTRAL_TAGS,
    ChallengeStratum,
    challenge_cases,
    count_challenges,
)
from lab.synth_diversity.types import TRAIT_VALUES, SyntheticInputError, validate_tags


@pytest.mark.parametrize("stratum", CHALLENGE_STRATA, ids=lambda spec: spec.name)
def test_all_strata_use_exact_declared_vocabulary(stratum: ChallengeStratum) -> None:
    tags = stratum.make_tags()
    validate_tags(tags)
    assert set(tags) == set(NEUTRAL_TAGS)
    assert stratum.reason.strip()
    assert tags["vitiligo_coverage"] == 0 or tags["vitiligo"] != "none"
    for name, value in tags.items():
        if name in TRAIT_VALUES and name != "albinism":
            assert value in TRAIT_VALUES[name]
    assert json.loads(json.dumps(tags, sort_keys=True)) == tags


def test_stratum_identifiers_unique_and_complete() -> None:
    names = [spec.name for spec in CHALLENGE_STRATA]
    assert len(names) == len(set(names))
    assert "deep_port_wine" in names
    assert "deep_atrophic_scar" in names
    assert "deep_moderate_acne" in names
    assert "deep_rosacea" in names
    assert "deep_dense_freckles" in names
    assert "covered_generalised" in names
    assert "youngest_band" in names
    assert "older_deep" in names


@pytest.mark.parametrize("seed", [0, 17, 2**63, 2**64 - 1])
def test_repetitions_are_deterministic_and_isolated(seed: int) -> None:
    first = challenge_cases(seed, repeats=2)
    second = challenge_cases(seed, repeats=2)
    assert first == second
    assert len(first) == 2 * len(CHALLENGE_STRATA)
    assert len({case.plan.seed for case in first}) == len(first)
    assert all(case.plan.parameters["train_allowed"] is False for case in first)
    assert all(case.plan.parameters["synthetic_only"] is True for case in first)
    assert all(case.plan.seed == derived_seed(seed, "challenge", case.name, case.replicate)
               for case in first)


def test_selection_order_cannot_change_seed_or_declared_traits() -> None:
    names = ("deep_rosacea", "covered_head_hijab", "adolescent_acne")
    forward = challenge_cases(45, repeats=3, include=names)
    backward = challenge_cases(45, repeats=3, include=tuple(reversed(names)))
    by_name = {(case.name, case.replicate): case.plan for case in forward}
    assert len(forward) == 9
    for case in backward:
        assert case.plan == by_name[(case.name, case.replicate)]
    assert challenge_cases(45, include=()) == ()


def test_pair_counts_report_rare_coverage_not_accuracy() -> None:
    cases = challenge_cases(23, repeats=3)
    summary = count_challenges(cases)
    assert summary.total == len(cases)
    assert sum(summary.family["fitzpatrick"].values()) == summary.total
    assert all(sum(labels.values()) == summary.total for labels in summary.family.values())
    assert summary.family["fitzpatrick"]["V"] > 0
    assert summary.family["fitzpatrick"]["VI"] > 0
    assert summary.family["vitiligo"]["generalised"] > 0
    assert summary.family["scar"]["atrophic"] > 0
    assert summary.family["birthmark"]["congenital_naevus"] > 0
    assert summary.family["head_covering"]["hijab"] > 0
    assert summary.family["head_covering"]["turban"] > 0
    assert summary.family["head_covering"]["kippah"] > 0
    assert summary.intersections["VI|birthmark|port_wine"] == 3
    assert summary.intersections["VI|rosacea|moderate"] == 3
    assert summary.intersections["VI|scar|atrophic"] == 3
    assert summary.intersections["V|vitiligo|focal"] == 3


def test_every_independent_trait_family_has_nondefault_cases() -> None:
    cases = challenge_cases(3)
    for family in ("vitiligo", "freckles", "birthmark", "scar", "acne", "rosacea",
                   "head_covering", "beard", "glasses"):
        assert any(case.plan.tags[family] != "none" for case in cases)
    for label in TRAIT_VALUES["age_band"]:
        assert any(case.plan.tags["age_band"] == label for case in cases)
    for label in TRAIT_VALUES["fitzpatrick"]:
        assert any(case.plan.tags["fitzpatrick"] == label for case in cases)
    assert any(case.plan.tags["albinism"] is True for case in cases)


def test_neutral_case_does_not_inherit_other_stratum_tags() -> None:
    target = challenge_cases(13, include=("deep_moderate_acne", "tone_v"))
    assert target[0].plan.tags["acne"] == "moderate"
    assert target[1].plan.tags["acne"] == "none"
    assert target[1].plan.tags["vitiligo_coverage"] == 0
    assert target[1].plan.tags["albinism"] is False


@pytest.mark.parametrize("bad_seed", [-1, 2**64, True, 1.5])
def test_invalid_challenge_seeds_rejected(bad_seed: int | float | bool) -> None:
    with pytest.raises(SyntheticInputError, match="seed"):
        challenge_cases(bad_seed)  # type: ignore[arg-type]


@pytest.mark.parametrize("bad_repeat", [0, 33, True, 1.1])
def test_invalid_repetitions_rejected(bad_repeat: float | bool) -> None:
    with pytest.raises(SyntheticInputError, match="repeats"):
        challenge_cases(1, repeats=bad_repeat)  # type: ignore[arg-type]


def test_duplicate_unknown_or_malformed_strata_rejected() -> None:
    with pytest.raises(SyntheticInputError, match="duplicate names"):
        challenge_cases(3, include=("tone_i", "tone_i"))
    with pytest.raises(SyntheticInputError, match="unknown names"):
        challenge_cases(3, include=("unregistered",))
    with pytest.raises(SyntheticInputError, match="duplicate"):
        ChallengeStratum("double", (("fitzpatrick", "V"), ("fitzpatrick", "VI")), "test")
    with pytest.raises(SyntheticInputError, match="unknown"):
        ChallengeStratum("bad", (("identity", "false"),), "test")
    with pytest.raises(SyntheticInputError):
        ChallengeStratum("bad space", (), "test")
    with pytest.raises(SyntheticInputError):
        ChallengeStratum("valid", (), " ")
    with pytest.raises(SyntheticInputError):
        ChallengeStratum("bad_combo", (("vitiligo", "none"),
                                     ("vitiligo_coverage", 0.2)), "test")


def test_duplicate_case_identity_rejected_without_pixel_inference() -> None:
    cases = challenge_cases(9, include=("deep_port_wine",))
    with pytest.raises(SyntheticInputError, match="duplicate"):
        count_challenges(cases + cases)
