"""Protected slices survive or are reported blocked after exclusion.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_provenance import ProvenanceRecord
from lab.synth_diversity.stress_provenance_fixtures import fixture_records
from lab.synth_diversity.stress_provenance_slices import BLOCKED, RETAINED, slice_audit
from lab.synth_diversity.types import TraitTags


def inventory(copies: int = 2) -> tuple[tuple[ProvenanceRecord, ...], dict[str, TraitTags]]:
    base = fixture_records()[0]
    records: list[ProvenanceRecord] = []
    tags: dict[str, TraitTags] = {}
    for index in range(len(ALL_PROFILES) * copies):
        record = replace(base, record_id=f"own-s{index:04d}", content_sha256=f"{index:064x}")
        records.append(record)
        tags[record.record_id] = ALL_PROFILES[index % len(ALL_PROFILES)].tags()
    return tuple(records), tags


def test_everything_retained_when_nothing_is_excluded() -> None:
    records, tags = inventory()
    audit = slice_audit(records, tags, {record.record_id for record in records})
    assert audit.raw == audit.eligible
    assert all(audit.status(name) == RETAINED for name in audit.raw if audit.raw[name])


def test_excluding_one_copy_keeps_slices_when_a_second_copy_remains() -> None:
    records, tags = inventory(copies=2)
    keep = {record.record_id for record in records[len(ALL_PROFILES):]}
    audit = slice_audit(records, tags, keep)
    assert all(audit.eligible[name] * 2 == audit.raw[name] for name in audit.raw)


def test_excluding_every_deep_vitiligo_record_blocks_that_slice() -> None:
    records, tags = inventory()
    keep = {record_id for record_id, value in tags.items()
            if not (value["fitzpatrick"] == "VI" and value["vitiligo"] != "none")}
    audit = slice_audit(records, tags, keep)
    assert audit.status("fitzpatrick=VI&vitiligo=focal") == BLOCKED
    assert audit.status("fitzpatrick=VI&vitiligo=generalised") == BLOCKED
    assert audit.status("fitzpatrick=III") == RETAINED
    assert "fitzpatrick=VI&vitiligo=focal" in audit.blocked()


def test_higher_minimum_marks_thin_slices_blocked() -> None:
    records, tags = inventory(copies=1)
    audit = slice_audit(records, tags, {record.record_id for record in records},
                        minimum_eligible=2)
    assert audit.status("head_covering=kippah") == BLOCKED
    assert audit.to_dict()["fairness_status"] == "NOT_EVALUATED"
