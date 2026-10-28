"""Frozen trait parameters, adult-age boundaries and portable case rows.
Author: John Khan.
"""

from __future__ import annotations

import copy

import pytest

from lab.synth_diversity.plan import derived_seed
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_spec import (
    ADULT_AGE_BANDS,
    PROVENANCE,
    STRESS_FORMAT,
    StressCase,
    age_to_band,
    canonical_bytes,
    canonical_value,
    declared_labels,
    digest_bytes,
    local_label,
    parameter_inventory,
    safe_token,
    stress_case_from_row,
)
from lab.synth_diversity.types import TRAIT_VALUES, SyntheticInputError, TraitPlan


@pytest.mark.parametrize("age,expected", [
    (18, "10-19"),
    (19, "10-19"),
    (20, "20-29"),
    (29, "20-29"),
    (30, "30-39"),
    (39, "30-39"),
    (40, "40-49"),
    (50, "50-59"),
    (60, "60-69"),
    (69, "60-69"),
    (70, "70+"),
    (79, "70+"),
    (80, "70+"),
])
def test_adult_age_boundaries(age: int, expected: str) -> None:
    assert age_to_band(age) == expected
    assert expected in ADULT_AGE_BANDS


@pytest.mark.parametrize("invalid", [-1, 0, 17, 81, 100, True, 18.0, "18", None])
def test_adult_age_refuses_outside_contract(invalid: object) -> None:
    with pytest.raises(SyntheticInputError, match="age_years|adult ages"):
        age_to_band(invalid)  # type: ignore[arg-type]


def test_stress_cases_carry_all_declared_parameters() -> None:
    schedule = StressSchedule(seed=102, count=48)
    for case in schedule.cases():
        assert set(case.parameters) == set(TRAIT_VALUES) | {"vitiligo_coverage", "age_years"}
        assert case.parameters["age_years"] == case.age_years
        assert case.plan.tags["age_band"] == age_to_band(case.age_years)
        assert case.parameters["vitiligo_coverage"] == case.plan.tags["vitiligo_coverage"]
        assert set(case.plan.tags) == set(TRAIT_VALUES) | {"vitiligo_coverage"}
        assert isinstance(case.parameters["albinism"], bool)
        assert case.base_source_id == "S02"
        assert case.identity.startswith("S21-")


def test_manifest_row_round_trips_without_pixels() -> None:
    case = StressSchedule(seed=9, count=45).at(8)
    row = case.manifest_row()
    recreated = stress_case_from_row(row)
    assert recreated == case
    assert recreated.identity == case.identity
    assert row["format"] == STRESS_FORMAT
    assert row["local_slice_labels"] == list(declared_labels(case.plan.tags))
    assert row["lane_g_groups"] == []
    assert all(row[key] == value for key, value in PROVENANCE.items())
    assert not set(row) & {"image", "image_path", "pixel_data", "landmarks", "mask"}
    assert isinstance(canonical_bytes(row), bytes)


def test_case_identity_stable_under_dict_insertion_order() -> None:
    case = StressSchedule(seed=13, count=42).at(3)
    reordered = dict(reversed(list(case.plan.tags.items())))
    another = StressCase(
        ordinal=case.ordinal,
        study_seed=case.study_seed,
        base_id=case.base_id,
        base_source_id=case.base_source_id,
        profile=case.profile,
        age_years=case.age_years,
        plan=TraitPlan(seed=case.plan.seed, tags=reordered),
    )
    assert another.identity == case.identity
    assert canonical_bytes(another.manifest_row()) == canonical_bytes(case.manifest_row())


@pytest.mark.parametrize("name,value", [
    ("fitzpatrick", "IV"),
    ("vitiligo", "generalised"),
    ("albinism", True),
    ("birthmark", "cafe_au_lait"),
    ("age_band", "70+"),
])
def test_local_label_uses_canonical_vocabulary(name: str, value: str | bool) -> None:
    assert local_label(name, value) == f"{name}={canonical_value(value)}"


@pytest.mark.parametrize("name,value", [
    ("appearance", "dark"),
    ("age_band", "80+"),
    ("birthmark", "port-wine"),
    ("albinism", "True"),
])
def test_local_label_refuses_unregistered_values(name: str, value: str) -> None:
    with pytest.raises(SyntheticInputError):
        local_label(name, value)


@pytest.mark.parametrize("token", ["../images", "john smith", "", "a" * 65, "a\\b", "é"])
def test_safe_identifier_excludes_paths_and_uncontrolled_text(token: str) -> None:
    with pytest.raises(SyntheticInputError):
        safe_token(token)


@pytest.mark.parametrize("field,replacement", [
    ("source_id", "S10"),
    ("licence", "Unlicensed"),
    ("test_only", False),
    ("train_allowed", True),
    ("case_id", "S21-wrong"),
    ("format", 1),
    ("age_years", 12),
    ("plan_seed", 7),
    ("base_id", "../escape"),
])
def test_manifest_rejects_changed_identity_and_provenance(
    field: str, replacement: object,
) -> None:
    row = copy.deepcopy(StressSchedule(seed=6, count=42).at(0).manifest_row())
    row[field] = replacement
    with pytest.raises(SyntheticInputError):
        stress_case_from_row(row)


@pytest.mark.parametrize("field,value", [
    ("vitiligo_coverage", 0.75),
    ("age_band", "70+"),
    ("albinism", "false"),
])
def test_manifest_rejects_trait_parameter_mismatch(field: str, value: object) -> None:
    row = copy.deepcopy(StressSchedule(seed=19, count=41).at(0).manifest_row())
    row["parameters"][field] = value
    with pytest.raises(SyntheticInputError):
        stress_case_from_row(row)


def test_stress_row_rejects_extra_and_missing_fields() -> None:
    row = StressSchedule(seed=32, count=41).at(1).manifest_row()
    extra = dict(row, image="source.png")
    with pytest.raises(SyntheticInputError):
        stress_case_from_row(extra)
    missing = dict(row)
    missing.pop("parameters")
    with pytest.raises(SyntheticInputError):
        stress_case_from_row(missing)


def test_distinct_ordinals_and_sources_change_identity() -> None:
    schedule = StressSchedule(seed=91, count=43)
    assert schedule.at(1).identity != schedule.at(2).identity
    alt = StressSchedule(seed=91, count=43, base_id="another_drawn_face")
    assert schedule.at(1).identity != alt.at(1).identity
    assert derived_seed(91, "stress", 1) == schedule.at(1).plan.seed


def test_parameter_inventory_refuses_mislabelled_adult() -> None:
    case = StressSchedule(seed=80, count=41).at(0)
    with pytest.raises(SyntheticInputError):
        parameter_inventory(case.plan.tags, 80 if case.age_years != 80 else 18)


def test_canonical_digest_is_repeatable() -> None:
    payload = {"alpha": 1, "tags": ["V", "VI"]}
    assert canonical_bytes(payload) == b'{"alpha":1,"tags":["V","VI"]}'
    assert len(digest_bytes(canonical_bytes(payload))) == 64
    assert digest_bytes(canonical_bytes(payload)) == digest_bytes(canonical_bytes(payload))
    with pytest.raises(SyntheticInputError):
        canonical_bytes({"bad": float("nan")})
