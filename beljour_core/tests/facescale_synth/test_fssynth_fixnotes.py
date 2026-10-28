"""Tests for fix notes and the numbers-only export: content, lanes and the no-leak rules.

Rows are synthetic; the hashes in them are SHA-256 of small integers.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

import pytest

from lab.facescale_synth import policy
from lab.facescale_synth.fairness.export import (
    EXPORT_FORMAT,
    build_export,
    export_problems,
    string_ok,
    write_export,
)
from lab.facescale_synth.fairness.fixnotes import (
    UNOWNED,
    load_lane_map,
    load_reason_map,
    note_problems,
    notes_by_lane,
    notes_markdown,
    write_box_only_hashes,
    write_notes,
)
from lab.facescale_synth.fairness.report import FairnessReport, Thresholds, build_report
from lab.facescale_synth.fairness.rows import Joined, JoinedRow
from lab.facescale_synth.fairness.traits import parse_tags, tag_values

LANES = {"filters": "B", "regions": "A"}
REASONS = {
    "halo": "api/plumb_api/filters/ edge feathering",
    "landmark_miss": "api/plumb_api/quality/ landmark checks",
}
HASH = re.compile(r"[0-9a-f]{16,}")


def _hash(i: int) -> str:
    return hashlib.sha256(str(i).encode()).hexdigest()


def _joined() -> Joined:
    joined = Joined()
    i = 0
    plan = [
        ("filters", "skin_mask", "VI", 300, 210, ["halo", "halo", "colour_shift", "edge", "halo"]),
        ("filters", "skin_mask", "I", 300, 297, ["halo"]),
        ("regions", "eyes", "III", 200, 198, ["landmark_miss"]),
        ("crop", "main", "IV", 200, 100, ["cut_chin"]),
    ]
    for module, check, band, n, passed, reasons in plan:
        values = tag_values(parse_tags({"fitzpatrick": band, "age_band": "20-29"}))
        for k in range(n):
            ok = k < passed
            reason = None if ok else reasons[k % len(reasons)]
            joined.rows.append(JoinedRow(module, check, ok, reason, values, _hash(i)))
            i += 1
    return joined


def _report() -> FairnessReport:
    return build_report(_joined(), Thresholds(0.9), families=["fitzpatrick"], parity_limit=0.05)


def test_one_note_per_fail_and_flag_with_lanes() -> None:
    notes = write_notes(_report(), LANES, REASONS)
    fails = [n for n in notes if n.kind == "fail"]
    flags = [n for n in notes if n.kind == "parity"]
    assert {(n.module, n.slice[0][1]) for n in fails} == {("filters", "VI"), ("crop", "IV")}
    assert [(n.module, n.slice[0][1], n.best_value) for n in flags] == [("filters", "VI", "I")]
    lanes = {n.module: n.lane for n in notes}
    assert lanes == {"filters": "B", "crop": UNOWNED}
    assert set(notes_by_lane(notes)) == {"B", UNOWNED}


def test_note_fields_reasons_and_places() -> None:
    note = next(
        n
        for n in write_notes(_report(), LANES, REASONS)
        if n.kind == "fail" and n.module == "filters"
    )
    assert note.n == 300 and note.rate == pytest.approx(0.7)
    assert note.ci_low < 0.7 < note.ci_high < 0.9
    assert note.threshold == 0.9
    assert [code for code, _ in note.top_reasons] == ["halo", "colour_shift", "edge"]
    assert note.top_reasons[0][1] == 54
    assert note.look_at == [REASONS["halo"]]
    text = note.to_text()
    assert "Lane B" in text and "threshold 0.900" in text and "halo x54" in text


def test_notes_carry_no_hashes_or_image_paths() -> None:
    notes = write_notes(_report(), LANES, REASONS)
    markdown = notes_markdown(notes)
    assert HASH.search(markdown) is None
    assert ".jpg" not in markdown and ".png" not in markdown
    for note in notes:
        assert note_problems(note) == []
    note = notes[0]
    note.look_at = ["/box/sets/images/000000001.jpg"]
    assert any("path" in p for p in note_problems(note))
    note.look_at = [_hash(1)]
    assert any("hash" in p for p in note_problems(note))


def test_poisoned_reason_map_is_refused() -> None:
    with pytest.raises(ValueError, match="image path"):
        write_notes(_report(), LANES, {"halo": "see /box/face_0001.png"})


def test_empty_report_gives_empty_notes() -> None:
    report = build_report(Joined(), Thresholds(0.9))
    assert write_notes(report, LANES, REASONS) == []
    assert "No FAIL cells" in notes_markdown([])


def test_maps_load_with_format_check(tmp_path: Path) -> None:
    lanes = tmp_path / "lanes.json"
    lanes.write_text(json.dumps({"format": "beljour-lane-map/1", "modules": LANES}))
    assert load_lane_map(lanes) == LANES
    reasons = tmp_path / "reasons.json"
    reasons.write_text(json.dumps({"format": "beljour-reason-map/1", "reasons": REASONS}))
    assert load_reason_map(reasons) == REASONS
    with pytest.raises(ValueError):
        load_lane_map(reasons)


def test_box_only_hash_file(tmp_path: Path) -> None:
    joined = _joined()
    notes = write_notes(
        build_report(joined, Thresholds(0.9), families=["fitzpatrick"]), LANES, REASONS
    )
    target = tmp_path / "box" / "hashes.json"
    count = write_box_only_hashes(target, notes, joined.rows)
    body = json.loads(target.read_text())
    assert body["box_only"] is True
    by_module = {n.module: n.note_id for n in notes if n.kind == "fail"}
    assert len(body["notes"][by_module["filters"]]) == 90
    assert len(body["notes"][by_module["crop"]]) == 100
    assert count >= 190
    with pytest.raises(policy.UsageRefused):
        write_box_only_hashes(policy.REPO_ROOT / "docs" / "hashes.json", notes, joined.rows)


def test_export_is_numbers_ids_codes_values_and_statuses_only(tmp_path: Path) -> None:
    report = _report()
    notes = write_notes(report, LANES, REASONS)
    document = build_export(report, notes)
    assert document["format"] == EXPORT_FORMAT
    assert export_problems(document) == []
    text = json.dumps(document)
    assert HASH.search(text) is None
    assert "/" not in text.replace(EXPORT_FORMAT, "")
    path = write_export(tmp_path / "out" / "fairness.json", document)
    assert json.loads(path.read_text()) == document
    with pytest.raises(policy.UsageRefused):
        write_export(policy.REPO_ROOT / "docs" / "fairness.json", document)


@pytest.mark.parametrize(
    "bad",
    [
        {"note": "this sentence explains things"},
        {"path": "images/0001.jpg"},
        {"hash": hashlib.sha256(b"x").hexdigest()},
        {"Bad Key": 1},
        {"nested": [{"ok": "PASS"}, {"x": "/abs/path"}]},
        {"object": {1, 2}},
    ],
)
def test_export_checker_catches_leaks(bad: dict[str, object]) -> None:
    assert export_problems(bad) != []
    with pytest.raises(ValueError):
        write_export(Path("/nonexistent/out.json"), bad)


def test_allowed_strings() -> None:
    for word in ("PASS", "FLAG", "fitzpatrick", "VI", "70+", "<10%", "port-wine", "B", "F0001"):
        assert string_ok(word), word
    for word in ("Fitzpatrick VI", "a/b", "deadbeefdeadbeef", "x.png", ""):
        assert not string_ok(word), word
