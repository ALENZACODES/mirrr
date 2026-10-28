"""Every reachable adult trait value can be joined to provenance records.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

from lab.synth_diversity.stress_profiles import ALL_PROFILES, missing_required_values
from lab.synth_diversity.stress_provenance import ProvenanceRecord
from lab.synth_diversity.stress_provenance_fixtures import fixture_records
from lab.synth_diversity.stress_provenance_resume_fixtures import tags_for
from lab.synth_diversity.stress_provenance_slices import (
    DEEP_TONE_INTERSECTIONS,
    PROTECTED_INTERSECTIONS,
    RETAINED,
    slice_audit,
)
from lab.synth_diversity.stress_similarity_gate import adult_labels


def anchor_inventory() -> tuple[ProvenanceRecord, ...]:
    base = fixture_records()[0]
    return tuple(replace(base, record_id=f"own-a{i:03d}", content_sha256=f"{i:064x}")
                 for i in range(len(ALL_PROFILES)))


def test_anchor_profiles_reach_every_adult_value() -> None:
    assert missing_required_values() == {}
    records = anchor_inventory()
    audit = slice_audit(records, tags_for(records), {record.record_id for record in records})
    assert all(audit.raw[label] > 0 for label in adult_labels())
    assert all(audit.status(label) == RETAINED for label in adult_labels())


def test_protected_intersections_include_deep_tone_conditions() -> None:
    assert ("fitzpatrick=VI", "vitiligo=generalised") in DEEP_TONE_INTERSECTIONS
    assert ("fitzpatrick=V", "albinism=true") in DEEP_TONE_INTERSECTIONS
    assert len(set(PROTECTED_INTERSECTIONS)) == len(PROTECTED_INTERSECTIONS)


def test_anchor_inventory_reaches_known_deep_tone_corners() -> None:
    records = anchor_inventory()
    audit = slice_audit(records, tags_for(records), ())
    for pair in (("fitzpatrick=VI", "vitiligo=focal"), ("fitzpatrick=V", "albinism=true"),
                 ("fitzpatrick=VI", "freckles=dense")):
        assert audit.raw["&".join(pair)] >= 1


def test_label_counts_sum_to_twelve_per_record() -> None:
    records = anchor_inventory()
    audit = slice_audit(records, tags_for(records), ())
    assert sum(audit.raw[label] for label in adult_labels()) == 12 * len(records)
