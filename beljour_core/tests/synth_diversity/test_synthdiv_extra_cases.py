"""Optional rare-intersection anchors stay test-only and outside the pinned manifest.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_extra_cases import (
    EXTRA_PROFILES,
    extra_cases,
    extra_label_counts,
    extra_schedule,
)
from lab.synth_diversity.stress_manifest import write_stress_manifest
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_spec import declared_labels
from lab.synth_diversity.types import SyntheticInputError


def labels(seed: int = 3) -> list[set[str]]:
    return [set(declared_labels(case.plan.tags)) for case in extra_cases(seed)]


def test_inventory_has_24_unique_unpinned_anchors() -> None:
    names = [profile.name for profile in EXTRA_PROFILES]
    assert len(names) == len(set(names)) == 24
    assert not set(names) & {profile.name for profile in ALL_PROFILES}


@pytest.mark.parametrize("required", (
    {"fitzpatrick=VI", "vitiligo=focal", "freckles=dense"},
    {"fitzpatrick=VI", "vitiligo=generalised", "acne=moderate"},
    {"albinism=true", "scar=hypertrophic"},
    {"birthmark=port_wine", "head_covering=turban"},
    {"birthmark=cafe_au_lait", "head_covering=kippah"},
    {"beard=full", "glasses=tinted"},
    {"age_band=10-19", "fitzpatrick=VI", "acne=moderate"},
    {"age_band=70+", "vitiligo=generalised"},
))
def test_named_rare_intersections_are_declared(required: set[str]) -> None:
    assert any(required <= row for row in labels())


def test_age_boundaries_18_and_80_are_both_anchored() -> None:
    ages = {case.age_years for case in extra_cases(3)}
    assert {18, 80} <= ages
    assert all(18 <= age <= 80 for age in ages)


def test_anchor_cases_cover_every_extra_profile_once() -> None:
    profiles = [case.profile for case in extra_cases(11)]
    assert sorted(profiles) == sorted(profile.name for profile in EXTRA_PROFILES)


def test_cases_keep_full_parameter_inventory_and_provenance() -> None:
    for case in extra_cases(5):
        row = case.manifest_row()
        assert row["test_only"] is True and row["train_allowed"] is False
        assert row["source_id"] == "S21"
        assert set(row["parameters"]) >= {"fitzpatrick", "age_years", "vitiligo_coverage"}


def test_schedule_is_seed_deterministic() -> None:
    first = [case.identity for case in extra_cases(8, 40)]
    assert first == [case.identity for case in extra_cases(8, 40)]
    assert first != [case.identity for case in extra_cases(9, 40)]


def test_label_counts_sum_to_twelve_labels_per_case() -> None:
    counts = extra_label_counts(3, 30)
    assert sum(counts.values()) == 30 * 12


def test_portable_manifest_writer_still_refuses_extra_profiles(tmp_path: Path) -> None:
    with pytest.raises(SyntheticInputError, match="pinned"):
        write_stress_manifest(tmp_path / "plan", extra_schedule(1))


def test_schedule_requires_room_for_every_anchor() -> None:
    with pytest.raises(SyntheticInputError):
        extra_schedule(1, 10)
