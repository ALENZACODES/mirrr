"""Count-only fairness input slice audits without unverified outcome claims.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_audit import (
    PAIR_FAMILIES,
    REQUIRED_INTERSECTIONS,
    audit_schedule,
    audit_stress_manifest,
)
from lab.synth_diversity.stress_manifest import write_stress_manifest
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_slices import SliceBridge
from lab.synth_diversity.types import TRAIT_VALUES, SyntheticInputError


def test_every_pair_family_is_registered_in_frozen_vocabulary() -> None:
    assert len(PAIR_FAMILIES) == len(set(PAIR_FAMILIES))
    for first, second in PAIR_FAMILIES:
        assert first != second
        assert first in TRAIT_VALUES
        assert second in TRAIT_VALUES
    assert len(REQUIRED_INTERSECTIONS) >= 12


def test_audit_anchors_cover_all_required_intersections() -> None:
    schedule = StressSchedule(seed=17, count=40)
    report = audit_schedule(schedule)
    assert report.gaps() == ()
    assert report.count == 40
    assert len(report.required_pair_counts) == len(REQUIRED_INTERSECTIONS)
    assert all(value >= 1 for value in report.required_pair_counts.values())
    assert report.to_dict()["input_coverage_status"] == "COVERED"


@pytest.mark.parametrize("seed", [0, 5, 7, 100, 2**64 - 1])
def test_study_audit_is_seed_deterministic(seed: int) -> None:
    schedule = StressSchedule(seed=seed, count=75)
    left = audit_schedule(schedule)
    right = audit_schedule(schedule)
    assert left == right
    assert left.to_dict() == right.to_dict()
    assert all(value >= 1 for value in left.required_pair_counts.values())


def test_audit_slices_use_exclusively_declared_labels() -> None:
    report = audit_schedule(StressSchedule(seed=6, count=40))
    for label in report.pair_counts:
        left, right = label.split("|")
        assert "=" in left and "=" in right
        for value in (left, right):
            family, name = value.split("=", 1)
            assert family in TRAIT_VALUES
            assert name in TRAIT_VALUES[family]
    assert report.to_dict()["fairness_performance_status"] == "NOT_EVALUATED"
    assert report.to_dict()["real_face_quality_status"] == "UNPROVEN"


def test_no_lane_g_groups_are_invented_by_an_unmapped_audit() -> None:
    report = audit_schedule(StressSchedule(seed=7, count=46))
    metadata = report.to_dict()
    assert report.mapping_status == "UNMAPPED"
    assert report.mapping_digest is None
    assert metadata["lane_g_group_counts"] == {}
    assert metadata["unmapped_local_slices"]
    assert metadata["lane_g_mapping_status"] == "UNMAPPED"


def test_external_names_are_used_verbatim_from_a_supplied_bridge() -> None:
    bridge = SliceBridge({"fitzpatrick=VI": "External Deep VI", "glasses=tinted": "Tint G"})
    report = audit_schedule(StressSchedule(seed=7, count=46), bridge)
    assert report.mapping_status == "PARTIAL"
    assert report.mapping_digest == bridge.digest
    names = report.to_dict()["lane_g_group_counts"]
    assert set(names).issubset({"External Deep VI", "Tint G"})
    assert names["External Deep VI"] > 0


def test_equivalent_local_values_do_not_double_count_a_shared_g_group() -> None:
    bridge = SliceBridge({"fitzpatrick=VI": "Joint", "vitiligo=generalised": "Joint"})
    schedule = StressSchedule(seed=2, count=40)
    report = audit_schedule(schedule, bridge)
    cases = list(schedule.cases())
    count = sum(
        case.plan.tags["fitzpatrick"] == "VI"
        or case.plan.tags["vitiligo"] == "generalised"
        for case in cases
    )
    assert report.to_dict()["lane_g_group_counts"]["Joint"] == count


def test_manifest_audit_round_trip_matches_in_memory_schedule(tmp_path: Path) -> None:
    schedule = StressSchedule(seed=37, count=49)
    destination = tmp_path / "manifest"
    write_stress_manifest(destination, schedule)
    assert audit_stress_manifest(destination) == audit_schedule(schedule)


def test_manifest_audit_with_group_mapping_requires_original_bridge(tmp_path: Path) -> None:
    bridge = SliceBridge({"fitzpatrick=V": "Actual Group Name"})
    destination = tmp_path / "manifest"
    schedule = StressSchedule(seed=34, count=41)
    write_stress_manifest(destination, schedule, bridge)
    with pytest.raises(SyntheticInputError, match="manifest must verify"):
        audit_stress_manifest(destination)
    assert audit_stress_manifest(destination, bridge) == audit_schedule(schedule, bridge)


def test_tampered_manifest_refuses_audit_even_when_header_exists(tmp_path: Path) -> None:
    destination = tmp_path / "manifest"
    write_stress_manifest(destination, StressSchedule(seed=25, count=40))
    file = destination / "stress.jsonl"
    file.write_bytes(file.read_bytes().replace(b"test_only", b"testing_x", 1))
    with pytest.raises(SyntheticInputError):
        audit_stress_manifest(destination)


def test_audit_output_contains_no_image_locations_or_person_identifiers() -> None:
    payload = audit_schedule(StressSchedule(seed=1, count=41)).to_dict()
    assert not set(payload) & {
        "image", "image_sha256", "file_path", "face_id", "landmarks", "mask_data",
    }
    assert payload["test_only"] is True
    assert payload["train_allowed"] is False
    assert payload["source_id"] == "S21"
    assert payload["licence"] == "Own work, John Khan"


def test_pair_counts_are_case_bounded_and_cover_every_case_for_each_pair() -> None:
    report = audit_schedule(StressSchedule(seed=8, count=98))
    counts = report.pair_counts
    for first, second in PAIR_FAMILIES:
        prefix = first + "="
        middle = "|" + second + "="
        total = sum(count for label, count in counts.items()
                    if label.startswith(prefix) and middle in label)
        assert total == report.count
