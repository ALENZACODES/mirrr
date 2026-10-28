"""Fix notes per lane from a merged report: counts and codes only.

Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.facescale import fixnotes as FN
from lab.facescale import merge as MG
from lab.facescale.metrics import FACE_CHECK, FAIL, PASS, Accumulator
from lab.facescale.results import RunMeta, build_result

META = RunMeta("fs-9", "plan", 1, 256, "core", ("gender", "regions"), "fake")


def _report() -> dict[str, object]:
    acc = Accumulator(failure_cap=50)
    for n in range(200):
        gender = FAIL if n % 4 == 0 else PASS
        rows = [("gender", FACE_CHECK, gender, 0.1, "skin_shift" if gender else ""),
                ("gender", "identity", gender, 0.1, "skin_shift" if gender else ""),
                ("regions", FACE_CHECK, PASS, 0.1, "")]
        acc.add_item(f"{n:064x}", "S01", f"g{n % 2}", rows)
    shard = build_result(META, 0, "m", acc.result(), acc.failure_list(), acc.faces,
                         planned=200, complete=True)
    thresholds = MG.load_thresholds({"format": MG.THRESHOLD_FORMAT,
                                     "modules": {"gender": 0.95, "regions": 0.9}})
    return MG.report(MG.merge_results([shard]), thresholds)


def test_one_note_per_lane_with_open_modules(tmp_path: Path) -> None:
    lanes = FN.load_lane_map({"format": FN.LANE_FORMAT, "modules": {"gender": "C"},
                              "default": "A"})
    notes = FN.lane_notes(_report(), lanes)
    assert list(notes) == ["C"]
    text = notes["C"]
    assert "gender: FAIL" in text and "skin_shift x" in text
    assert "never shown or trained on" in text
    assert "0000000000000000" not in text
    paths = FN.write_notes(tmp_path, notes)
    assert [p.name for p in paths] == ["fix-note-lane-C.md"]


def test_unmapped_modules_go_to_the_default_lane() -> None:
    lanes = FN.load_lane_map({"format": FN.LANE_FORMAT, "modules": {}})
    assert list(FN.lane_notes(_report(), lanes)) == [FN.UNASSIGNED]


@pytest.mark.parametrize("data", [
    {"modules": {}},
    {"format": FN.LANE_FORMAT, "modules": {"a": 1}},
    {"format": FN.LANE_FORMAT, "modules": {}, "default": ""},
])
def test_bad_lane_maps(data: dict[str, object]) -> None:
    with pytest.raises(FN.FixNoteError):
        FN.load_lane_map(data)
