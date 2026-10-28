"""Tests for the trait-tag schema, validation, records and the TraitSource protocol.

Tags here are written by hand; no images are involved.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
from collections.abc import Iterator
from pathlib import Path

import pytest

from lab.facescale_synth.fairness.traits import (
    AGE_BAND,
    FITZPATRICK,
    TRAIT_TAG_SCHEMA,
    TraitError,
    TraitRecord,
    TraitSource,
    TraitTags,
    collect,
    coverage_bucket,
    family_values,
    parse_tags,
    read_records,
    tag_problems,
    tag_values,
    write_records,
)
from lab.facescale_synth.stress.trait_source import StressTraitSource


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def test_minimal_tags_take_defaults() -> None:
    tags = parse_tags({"fitzpatrick": "VI", "age_band": "70+"})
    assert tags.vitiligo == "none" and tags.vitiligo_coverage == 0.0
    assert tags.head_covering == "none" and tags.beard == "none"
    assert tags.glasses is False


def test_every_problem_is_listed_at_once() -> None:
    problems = tag_problems(
        {
            "fitzpatrick": "VII",
            "vitiligo": "focal",
            "glasses": "yes",
            "hair": "red",
        }
    )
    text = "\n".join(problems)
    assert "unknown trait 'hair'" in text
    assert "age_band" in text and "required" in text
    assert "fitzpatrick='VII'" in text
    assert "glasses must be true or false" in text
    assert "needs a coverage share" in text
    with pytest.raises(TraitError) as caught:
        parse_tags({"fitzpatrick": "VII"})
    assert len(str(caught.value).splitlines()) == 2


@pytest.mark.parametrize(
    "raw",
    [
        {"fitzpatrick": "I", "age_band": "20-29", "vitiligo_coverage": 0.2},
        {"fitzpatrick": "I", "age_band": "20-29", "vitiligo": "focal", "vitiligo_coverage": 1.5},
        {"fitzpatrick": "I", "age_band": "0-9", "beard": "full"},
        {"fitzpatrick": "I", "age_band": "20-29", "vitiligo_coverage": True},
        {"fitzpatrick": "I", "age_band": "20-29", "birthmark": "mole"},
    ],
)
def test_invalid_combinations_are_refused(raw: dict[str, object]) -> None:
    with pytest.raises(TraitError):
        parse_tags(raw)


def test_dataclass_validates_on_construction() -> None:
    with pytest.raises(TraitError):
        TraitTags(fitzpatrick="III", age_band="100+")


def test_values_and_families() -> None:
    tags = parse_tags(
        {
            "fitzpatrick": "IV",
            "age_band": "30-39",
            "vitiligo": "segmental",
            "vitiligo_coverage": 0.15,
        }
    )
    values = tag_values(tags)
    assert values["fitzpatrick"] == "IV"
    assert values["vitiligo_coverage"] == "10-30%"
    assert values["glasses"] == "no"
    families = family_values()
    assert set(values) == set(families)
    for family, value in values.items():
        assert value in families[family]
    assert families["fitzpatrick"] == FITZPATRICK and families["age_band"] == AGE_BAND
    assert coverage_bucket(0.0) == "0" and coverage_bucket(0.05) == "<10%"
    assert coverage_bucket(0.5) == ">30%" and coverage_bucket(1.0) == ">30%"


def test_json_schema_mirrors_the_rules() -> None:
    schema = TRAIT_TAG_SCHEMA
    assert schema["required"] == ["fitzpatrick", "age_band"]
    assert schema["additionalProperties"] is False
    properties = schema["properties"]
    assert isinstance(properties, dict)
    assert properties["fitzpatrick"] == {"enum": list(FITZPATRICK)}
    assert properties["glasses"] == {"type": "boolean"}
    assert set(properties) == set(TraitTags.__dataclass_fields__)


def test_record_validation() -> None:
    tags = parse_tags({"fitzpatrick": "II", "age_band": "40-49"})
    TraitRecord(_hash("a"), "S21", tags, "trait-applied")
    with pytest.raises(TraitError):
        TraitRecord("abc", "S21", tags, "trait-applied")
    with pytest.raises(TraitError):
        TraitRecord(_hash("a"), "lane-s", tags, "trait-applied")
    with pytest.raises(TraitError):
        TraitRecord(_hash("a"), "S21", tags, "photo")


class ListSource:
    """A minimal TraitSource like Lane S or C11 would provide."""

    def __init__(self, source_id: str, records: list[TraitRecord]) -> None:
        self.source_id = source_id
        self._records = records

    def trait_records(self) -> Iterator[TraitRecord]:
        yield from self._records


def test_collect_merges_and_catches_conflicts() -> None:
    light = parse_tags({"fitzpatrick": "I", "age_band": "20-29"})
    deep = parse_tags({"fitzpatrick": "VI", "age_band": "20-29"})
    lane_s = ListSource("S21", [TraitRecord(_hash("1"), "S21", light, "trait-applied")])
    c11 = ListSource("S22", [TraitRecord(_hash("2"), "S22", deep, "illustrated")])
    assert isinstance(lane_s, TraitSource)
    merged = collect([lane_s, c11])
    assert set(merged) == {_hash("1"), _hash("2")}
    clash = ListSource("S22", [TraitRecord(_hash("1"), "S22", deep, "illustrated")])
    with pytest.raises(TraitError, match="conflicting"):
        collect([lane_s, clash])
    liar = ListSource("S21", [TraitRecord(_hash("3"), "S22", deep, "illustrated")])
    with pytest.raises(TraitError, match="handed over"):
        collect([liar])


def test_records_round_trip_through_jsonl(tmp_path: Path) -> None:
    tags = parse_tags({"fitzpatrick": "V", "age_band": "60-69", "freckles": True})
    records = [TraitRecord(_hash(str(i)), "S20", tags, "stress approximation") for i in range(5)]
    path = tmp_path / "tags.jsonl"
    assert write_records(path, records) == 5
    assert list(read_records(path)) == records
    path.write_text(path.read_text() + '{"content_hash": "x", "tags": {}}\n')
    with pytest.raises(TraitError, match="line 6"):
        list(read_records(path))


def test_stress_source_satisfies_the_protocol() -> None:
    source = StressTraitSource(manifests=())
    assert isinstance(source, TraitSource)
    assert list(source.trait_records()) == []
