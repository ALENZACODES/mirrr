"""Declared-label-to-group adapter rejects invented identifiers.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_slices import (
    BRIDGE_FORMAT,
    MAX_BRIDGE_BYTES,
    SliceBridge,
    allowed_local_labels,
    group_metadata,
)
from lab.synth_diversity.stress_spec import declared_labels
from lab.synth_diversity.types import TRAIT_VALUES, SyntheticInputError


def test_allowed_local_labels_cover_every_registered_family_cell() -> None:
    labels = allowed_local_labels()
    assert len(labels) == sum(len(values) for values in TRAIT_VALUES.values())
    assert len(labels) == len(set(labels))
    assert labels[0] == "fitzpatrick=I"
    assert "albinism=true" in labels
    assert "head_covering=hijab" in labels
    assert "age_band=70+" in labels


def test_no_external_group_name_is_claimed_when_mapping_is_missing() -> None:
    case = StressSchedule(seed=2, count=45).at(0)
    metadata = group_metadata(None, case.plan.tags)
    assert metadata["lane_g_groups"] == []
    assert metadata["group_alignment"] == "UNMAPPED"
    assert metadata["unmapped_local_slices"] == list(declared_labels(case.plan.tags))


def test_explicit_bridge_uses_verbatim_supplied_names_not_generated_names() -> None:
    case = StressSchedule(seed=2, count=45).at(0)
    labels = declared_labels(case.plan.tags)
    bridge = SliceBridge({labels[0]: "Tone Group V", labels[-1]: "Age 30–39"})
    metadata = group_metadata(bridge, case.plan.tags)
    assert metadata["lane_g_groups"] == ["Tone Group V", "Age 30–39"]
    assert len(metadata["unmapped_local_slices"]) == len(labels) - 2
    assert metadata["group_alignment"] == "PARTIAL"
    assert bridge.resolve(case.plan.tags) == ("Tone Group V", "Age 30–39")


def test_complete_bridge_sets_complete_mapping_status() -> None:
    case = StressSchedule(seed=6, count=40).at(0)
    labels = declared_labels(case.plan.tags)
    bridge = SliceBridge({label: "G " + str(index) for index, label in enumerate(labels)})
    metadata = group_metadata(bridge, case.plan.tags)
    assert metadata["group_alignment"] == "MAPPED"
    assert metadata["unmapped_local_slices"] == []
    assert len(metadata["lane_g_groups"]) == len(labels)


def test_multiple_local_cells_can_map_to_one_external_group() -> None:
    case = StressSchedule(seed=12, count=40).at(0)
    labels = declared_labels(case.plan.tags)
    bridge = SliceBridge({labels[0]: "combined", labels[1]: "combined"})
    assert bridge.resolve(case.plan.tags) == ("combined",)


def test_bridge_checksum_is_deterministic_under_json_key_order() -> None:
    a = SliceBridge({"fitzpatrick=VI": "deep", "vitiligo=focal": "vit_patch"})
    b = SliceBridge({"vitiligo=focal": "vit_patch", "fitzpatrick=VI": "deep"})
    assert a.digest == b.digest
    assert a.as_dict() == b.as_dict()
    assert len(a.digest) == 64
    assert a.digest != SliceBridge({"fitzpatrick=VI": "deep_else"}).digest


def test_bridge_round_trip_through_bounded_local_json(tmp_path: Path) -> None:
    original = SliceBridge({"fitzpatrick=V": "Tone Group Five", "albinism=true": "pigment"})
    path = tmp_path / "g_groups.json"
    path.write_text(json.dumps(original.as_dict()), encoding="utf-8")
    result = SliceBridge.from_file(path)
    assert result.mappings == original.mappings
    assert result.digest == original.digest


@pytest.mark.parametrize("value", [
    {},
    {"format": 0, "source": "lane_g", "labels": {"glasses=clear": "G"}},
    {"format": 1, "source": "unknown", "labels": {"glasses=clear": "G"}},
    {"format": 1, "source": "lane_g", "labels": ["bad"]},
    {"format": 1, "source": "lane_g", "labels": {"unknown=yes": "G"}},
])
def test_bridge_document_refuses_invalid_roots(value: dict[str, object]) -> None:
    with pytest.raises(SyntheticInputError):
        SliceBridge.from_document(value)


@pytest.mark.parametrize("name", ["", "\\path", "bad/name", "bad\nname", " x ", "x" * 129])
def test_bridge_refuses_unsafe_external_names(name: str) -> None:
    with pytest.raises(SyntheticInputError):
        SliceBridge({"fitzpatrick=VI": name})


def test_bridge_rejects_unregistered_local_group_cell() -> None:
    with pytest.raises(SyntheticInputError):
        SliceBridge({"skin_tone=deep": "tone"})


def test_bridge_refuses_oversized_and_symlink_file(tmp_path: Path) -> None:
    real = tmp_path / "real.json"
    real.write_text("x" * (MAX_BRIDGE_BYTES + 1), encoding="utf-8")
    with pytest.raises(SyntheticInputError):
        SliceBridge.from_file(real)
    target = tmp_path / "ordinary.json"
    target.write_text('{"format":1,"source":"lane_g","labels":{"glasses=clear":"clear"}}')
    link = tmp_path / "link.json"
    link.symlink_to(target)
    with pytest.raises(SyntheticInputError):
        SliceBridge.from_file(link)


def test_bridge_root_uses_defined_schema_version() -> None:
    bridge = SliceBridge({"glasses=tinted": "test group"})
    assert bridge.as_dict()["format"] == BRIDGE_FORMAT
    assert bridge.as_dict()["source"] == "lane_g"


def test_bridge_validates_nonobject_local_file(tmp_path: Path) -> None:
    path = tmp_path / "not-object.json"
    path.write_text("[]", encoding="utf-8")
    with pytest.raises(SyntheticInputError):
        SliceBridge.from_file(path)
    path.write_text("broken", encoding="utf-8")
    with pytest.raises(SyntheticInputError):
        SliceBridge.from_file(path)
