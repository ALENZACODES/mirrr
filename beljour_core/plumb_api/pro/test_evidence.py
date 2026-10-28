"""R24E evidence tests keep group results not-tested on synthetic inputs."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from plumb_api.pro.evidence import IDS, SLICES, GroupCount, read_all, read_definition, summary_rows, synthetic_rows


def test_all_written_definitions_are_immutable_sized_and_named() -> None:
    definitions = read_all()
    assert tuple(entry.name for entry in definitions) == IDS
    assert len({entry.sha256 for entry in definitions}) == len(IDS)
    assert all(entry.number_of_faces == 100_000 for entry in definitions)
    assert all(entry.slices == SLICES for entry in definitions)


def test_synthetic_report_has_rows_for_each_group_without_face_data() -> None:
    rows = synthetic_rows(read_all())
    assert len(rows) == len(IDS) * len(SLICES)
    assert all(row["status"] == "NOT_TESTED" for row in rows)
    safe = json.dumps(rows)
    assert '"pixels"' not in safe
    assert '"image"' not in safe
    assert '"filename"' not in safe


def test_report_refuses_double_counts_and_impossible_numbers() -> None:
    definitions = read_all()
    sample = GroupCount(IDS[0], "monk:unknown", 1, 1, "synthetic")
    with pytest.raises(ValueError):
        summary_rows(definitions, (sample, sample))
    with pytest.raises(ValueError):
        summary_rows(definitions, (GroupCount(IDS[0], "x", 2, 3, "synthetic"),))
    with pytest.raises(ValueError):
        summary_rows(definitions, (GroupCount(IDS[0], "x", 1, 1, "guessed"),))


def test_definition_changes_require_reregistration(tmp_path: Path) -> None:
    source = Path(__file__).resolve().parents[3] / "tests" / "realface" / "pass_definitions_r24e"
    raw = json.loads((source / "pro_masks.json").read_text())
    raw["face_set"]["number_of_faces"] = 5
    (tmp_path / "pro_masks.json").write_text(json.dumps(raw))
    with pytest.raises(ValueError):
        read_definition(tmp_path, "pro_masks")
