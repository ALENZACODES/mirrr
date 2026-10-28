"""Input-coverage counters and missing-trait gates, never efficacy claims.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.stress_coverage import count_stress_inputs, coverage_gate
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_spec import ADULT_AGE_BANDS
from lab.synth_diversity.types import TRAIT_VALUES, SyntheticInputError


def test_mandatory_schedule_covers_all_supported_adult_parameter_values() -> None:
    schedule = StressSchedule(seed=7, count=len(ALL_PROFILES))
    counts = count_stress_inputs(schedule.cases())
    assert counts.total == len(ALL_PROFILES)
    assert coverage_gate(counts) == []
    assert counts.required_missing() == {}
    assert counts.missing_profiles() == ()
    for family, values in TRAIT_VALUES.items():
        required = ADULT_AGE_BANDS if family == "age_band" else values
        assert all(counts.families[family][value] >= 1 for value in required)


def test_stress_counts_are_exact_and_stable_between_iterations() -> None:
    schedule = StressSchedule(seed=55, count=131)
    first = count_stress_inputs(schedule.cases())
    second = count_stress_inputs(schedule.cases())
    assert first == second
    assert sum(first.families["fitzpatrick"].values()) == 131
    assert sum(first.families["vitiligo"].values()) == 131
    assert sum(first.families["albinism"].values()) == 131
    assert sum(first.adult_ages.values()) == 131
    assert sum(first.profiles.values()) == 131
    assert min(first.adult_ages) >= 18
    assert max(first.adult_ages) <= 80


def test_cross_trait_intersections_exist_in_fixed_stress_anchors() -> None:
    schedule = StressSchedule(seed=22, count=len(ALL_PROFILES))
    coverage = count_stress_inputs(schedule.cases())
    for name in (
        "deep_skin", "deep_vitiligo", "deep_acne", "deep_rosacea",
        "deep_birthmark", "deep_freckles", "albinism", "head_covering_with_glasses",
    ):
        assert coverage.intersections[name] > 0, name


def test_coverage_report_is_explicitly_synthetic_not_a_fairness_pass() -> None:
    coverage = count_stress_inputs(StressSchedule(seed=2, count=41).cases())
    report = coverage.to_dict()
    assert report["evidence_level"] == "SYNTHETIC_INPUT_COVERAGE_ONLY"
    assert report["real_face_evaluation"] == "UNPROVEN"
    assert report["test_only"] is True
    assert report["train_allowed"] is False
    assert "images" not in report
    assert "file_paths" not in report
    assert "fairness_pass" not in report


def test_coverage_uses_only_supplied_external_group_name_mapping() -> None:
    mapping = {"fitzpatrick=VI": "Deep Tone G", "vitiligo=focal": "Focal G"}
    coverage = count_stress_inputs(StressSchedule(seed=3, count=65).cases(), mapping)
    assert set(coverage.lane_g_groups).issubset(set(mapping.values()))
    assert coverage.lane_g_groups["Deep Tone G"] > 0
    assert "skin_tone_v" not in coverage.lane_g_groups
    assert coverage.unmapped_local_slices


def test_empty_coverage_fails_the_input_gate_with_missing_values() -> None:
    coverage = count_stress_inputs(())
    reasons = coverage_gate(coverage)
    assert reasons
    assert "fitzpatrick" in coverage.required_missing()
    assert len(coverage.missing_profiles()) == len(ALL_PROFILES)


def test_coverage_cannot_silently_count_duplicate_case_identifiers() -> None:
    case = StressSchedule(seed=4, count=40).at(0)
    with pytest.raises(SyntheticInputError, match="duplicate"):
        count_stress_inputs((case, case))


def test_coverage_counts_do_not_guess_lane_g_group_names() -> None:
    counts = count_stress_inputs(StressSchedule(seed=9, count=48).cases())
    assert counts.lane_g_groups == {}
    assert "fitzpatrick=VI" in counts.unmapped_local_slices
    assert "albinism=true" in counts.unmapped_local_slices
    assert "age_band=70+" in counts.unmapped_local_slices
