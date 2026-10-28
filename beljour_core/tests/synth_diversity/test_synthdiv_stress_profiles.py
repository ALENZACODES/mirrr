"""Mandatory rare-trait profile reachability and adult-range checks.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.stress_profiles import (
    ALL_PROFILES,
    TARGETED_PROFILES,
    StressProfile,
    missing_required_values,
    reachable_values,
    validate_profiles,
)
from lab.synth_diversity.stress_spec import ADULT_AGE_BANDS, age_to_band
from lab.synth_diversity.types import TRAIT_VALUES, SyntheticInputError


def test_all_required_profiles_are_unique_and_use_synthetic_tags() -> None:
    validate_profiles()
    assert len(ALL_PROFILES) == len({profile.name for profile in ALL_PROFILES})
    assert len(TARGETED_PROFILES) >= 30
    assert all(profile.reason.strip() for profile in ALL_PROFILES)
    assert all(18 <= profile.age_years <= 80 for profile in ALL_PROFILES)
    assert all(set(profile.tags()) == set(TRAIT_VALUES) | {"vitiligo_coverage"}
               for profile in ALL_PROFILES)


def test_every_required_adult_trait_value_is_reachable() -> None:
    found = reachable_values()
    assert missing_required_values() == {}
    for family, choices in TRAIT_VALUES.items():
        wanted = set(ADULT_AGE_BANDS if family == "age_band" else choices)
        assert wanted.issubset(found[family]), family
    assert "0-9" not in found["age_band"]


@pytest.mark.parametrize("family", tuple(TRAIT_VALUES))
def test_each_trait_family_has_an_explicit_anchor(family: str) -> None:
    reached = reachable_values()
    assert reached[family]
    assert len(reached[family]) >= 2


@pytest.mark.parametrize("name,required", [
    ("deep_vi_focal", {"fitzpatrick": "VI", "vitiligo": "focal"}),
    ("deep_v_segmental", {"fitzpatrick": "V", "vitiligo": "segmental"}),
    ("deep_vi_generalised", {"fitzpatrick": "VI", "vitiligo": "generalised"}),
    ("light_albinism", {"albinism": True}),
    ("deep_vi_freckles", {"freckles": "dense", "fitzpatrick": "VI"}),
    ("deep_vi_cafe_au_lait", {"birthmark": "cafe_au_lait"}),
    ("linear_scar", {"scar": "linear"}),
    ("deep_vi_mild_acne", {"acne": "mild"}),
    ("deep_vi_rosacea", {"rosacea": "mild"}),
    ("hijab_clear", {"head_covering": "hijab"}),
    ("turban_full_beard", {"head_covering": "turban", "beard": "full"}),
    ("kippah_short_beard", {"head_covering": "kippah"}),
    ("clear_glasses", {"glasses": "clear"}),
    ("tinted_glasses", {"glasses": "tinted"}),
])
def test_named_corner_profiles_keep_intended_traits(
    name: str, required: dict[str, str | bool],
) -> None:
    profile = next(profile for profile in ALL_PROFILES if profile.name == name)
    tags = profile.tags()
    assert all(tags[key] == value for key, value in required.items())
    assert tags["age_band"] == age_to_band(profile.age_years)


def test_active_vitiligo_has_a_declared_nonzero_target_fraction() -> None:
    for profile in ALL_PROFILES:
        tags = profile.tags()
        if tags["vitiligo"] == "none":
            assert tags["vitiligo_coverage"] == 0.0
        else:
            assert 0 < float(tags["vitiligo_coverage"]) < 1


def test_profile_tags_are_new_dictionaries() -> None:
    profile = ALL_PROFILES[0]
    original = profile.tags()
    updated = profile.tags()
    original["fitzpatrick"] = "I"
    assert updated["fitzpatrick"] != original["fitzpatrick"]


@pytest.mark.parametrize("age", [17, 81])
def test_profiles_reject_children_and_out_of_range_ages(age: int) -> None:
    with pytest.raises(SyntheticInputError):
        StressProfile("invalid_age", (), age, "Out of range")


def test_profile_refuses_undeclared_traits() -> None:
    with pytest.raises(SyntheticInputError):
        StressProfile("unknown", (("hair_type", "curly"),), 35, "Invalid override")
    with pytest.raises(SyntheticInputError):
        StressProfile("ageoverride", (("age_band", "70+"),), 35, "Invalid override")


def test_profile_refuses_duplicate_traits() -> None:
    with pytest.raises(SyntheticInputError):
        StressProfile("dupe", (("freckles", "none"), ("freckles", "dense")), 30, "Duplicate")


def test_profile_refuses_empty_reason_or_unsafe_name() -> None:
    with pytest.raises(SyntheticInputError):
        StressProfile("ok", (), 30, " ")
    with pytest.raises(SyntheticInputError):
        StressProfile("../source", (), 30, "Unsafe")


def test_profile_set_refuses_duplicate_names() -> None:
    with pytest.raises(SyntheticInputError):
        validate_profiles((ALL_PROFILES[0], ALL_PROFILES[0]))


def test_missing_required_profile_values_is_explicit() -> None:
    missing = missing_required_values((ALL_PROFILES[0],))
    assert "vitiligo" in missing
    assert "head_covering" in missing
    assert "albinism" in missing
    assert "age_band" in missing
    assert "0-9" not in missing["age_band"]
