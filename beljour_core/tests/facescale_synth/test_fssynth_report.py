"""Tests for the per-trait fairness report with synthetic rows whose true rates are set.

Rows and tags are written in code; there are no images.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from lab.facescale_synth.fairness.report import (
    Thresholds,
    build_report,
    load_thresholds,
    status_for,
)
from lab.facescale_synth.fairness.rows import (
    Joined,
    JoinedRow,
    ResultRow,
    RowError,
    join,
    read_rows,
    row_from_json,
)
from lab.facescale_synth.fairness.traits import TraitRecord, parse_tags, tag_values


def _hash(i: int) -> str:
    return hashlib.sha256(str(i).encode()).hexdigest()


def _rows(spec: dict[str, tuple[int, int]], module: str = "regions", check: str = "eyes") -> Joined:
    """``spec`` maps a Fitzpatrick band to (n, passed)."""
    out = Joined()
    i = 0
    for band, (n, passed) in spec.items():
        values = tag_values(parse_tags({"fitzpatrick": band, "age_band": "30-39"}))
        for k in range(n):
            ok = k < passed
            out.rows.append(
                JoinedRow(module, check, ok, None if ok else "landmark_miss", values, _hash(i))
            )
            i += 1
    return out


def test_status_rules() -> None:
    assert status_for(19, 19, 0.5) == "UNPROVEN"
    assert status_for(380, 400, 0.9) == "PASS"
    assert status_for(280, 400, 0.9) == "FAIL"
    assert status_for(36, 40, 0.9) == "UNPROVEN"
    assert status_for(20, 20, 0.95, min_n=20) == "UNPROVEN"


def test_report_sets_statuses_from_true_rates() -> None:
    joined = _rows({"I": (400, 380), "VI": (400, 280), "III": (10, 2), "IV": (40, 36)})
    report = build_report(joined, Thresholds(0.9), families=["fitzpatrick"])
    statuses = {cell.slice[0][1]: cell.status for cell in report.cells}
    assert statuses == {"I": "PASS", "III": "UNPROVEN", "IV": "UNPROVEN", "VI": "FAIL"}
    vi = next(c for c in report.cells if c.slice == (("fitzpatrick", "VI"),))
    assert vi.n == 400 and vi.passed == 280 and vi.rate == pytest.approx(0.7)
    assert vi.top_reasons() == [("landmark_miss", 120)]
    assert [c.slice[0][1] for c in report.cells] == ["I", "III", "IV", "VI"]


def test_parity_flags_the_gap_with_its_interval() -> None:
    joined = _rows({"I": (400, 392), "V": (400, 300), "VI": (400, 380)})
    report = build_report(joined, Thresholds(0.5), families=["fitzpatrick"], parity_limit=0.05)
    by_value = {row.value: row for row in report.parity}
    assert set(by_value) == {"V", "VI"}
    assert by_value["V"].status == "FLAG" and by_value["V"].best_value == "I"
    assert by_value["V"].gap == pytest.approx(0.23)
    assert by_value["V"].gap_low > 0.05
    assert by_value["VI"].status in ("OK", "WATCH")
    assert report.flagged() == [by_value["V"]]


def test_small_groups_are_left_out_of_parity() -> None:
    joined = _rows({"I": (400, 392), "II": (10, 0)})
    report = build_report(joined, Thresholds(0.5), families=["fitzpatrick"])
    assert report.parity == []


def test_holm_turns_borderline_fails_into_unproven() -> None:
    spec = {band: (60, 48) for band in ("I", "II", "III", "IV", "V", "VI")}
    joined = _rows(spec)
    plain = build_report(joined, Thresholds(0.89), families=["fitzpatrick"])
    corrected = build_report(
        joined, Thresholds(0.89), families=["fitzpatrick"], holm_correction=True
    )
    assert all(c.status == "FAIL" for c in plain.cells)
    assert all(c.status == "UNPROVEN" for c in corrected.cells)
    assert all(c.p_adjusted is not None for c in corrected.cells)
    strong = build_report(
        _rows({"I": (400, 280)}), Thresholds(0.9), families=["fitzpatrick"], holm_correction=True
    )
    assert strong.cells[0].status == "FAIL"


def test_pairs_and_minimum_cell_rule() -> None:
    joined = Joined()
    for i in range(200):
        tags = parse_tags(
            {
                "fitzpatrick": "VI" if i % 2 else "I",
                "age_band": "30-39",
                "head_covering": "hijab" if i < 30 else "none",
            }
        )
        joined.rows.append(
            JoinedRow("crop", "main", i % 3 > 0, "cut_chin", tag_values(tags), _hash(i))
        )
    report = build_report(
        joined,
        Thresholds(0.5),
        families=["fitzpatrick"],
        pairs=[("fitzpatrick", "head_covering")],
        min_cell=20,
    )
    pair_cells = [c for c in report.cells if len(c.slice) == 2]
    assert {c.slice for c in pair_cells} == {
        (("fitzpatrick", "I"), ("head_covering", "none")),
        (("fitzpatrick", "VI"), ("head_covering", "none")),
    }
    assert report.suppressed_cells == 2
    assert sum(c.n for c in pair_cells) == 170


def test_unknown_family_is_refused() -> None:
    with pytest.raises(ValueError, match="unknown trait family"):
        build_report(Joined(), Thresholds(0.5), families=["eye_colour"])


def test_thresholds_file_and_precedence(tmp_path: Path) -> None:
    path = tmp_path / "t.json"
    path.write_text(
        json.dumps(
            {
                "format": "beljour-thresholds/1",
                "default": 0.9,
                "thresholds": {"filters": 0.95, "filters/skin_mask": 0.8},
            }
        )
    )
    loaded = load_thresholds(path)
    assert loaded.lookup("filters", "skin_mask") == 0.8
    assert loaded.lookup("filters", "other") == 0.95
    assert loaded.lookup("regions", "eyes") == 0.9
    path.write_text(json.dumps({"format": "x"}))
    with pytest.raises(ValueError):
        load_thresholds(path)
    with pytest.raises(ValueError):
        Thresholds(1.5)


def test_markdown_and_json_outputs() -> None:
    report = build_report(
        _rows({"I": (100, 99), "VI": (100, 60)}), Thresholds(0.9), families=["fitzpatrick"]
    )
    text = report.to_markdown()
    assert "## regions / eyes" in text
    assert "| fitzpatrick=VI | 100 | 0.600 |" in text and "FAIL" in text
    assert "## Parity" in text
    body = report.to_json()
    assert body["rows"] == 200
    cells = body["cells"]
    assert isinstance(cells, list) and cells[1]["status"] == "FAIL"
    json.dumps(body)


def test_row_parsing_both_shapes(tmp_path: Path) -> None:
    rows = [
        {"content_hash": _hash(1), "module": "filters", "check": "skin", "passed": True},
        {"sha256": _hash(2), "module": "filters", "check": "skin", "pass": False, "reason": "halo"},
    ]
    jsonl = tmp_path / "rows.jsonl"
    jsonl.write_text("\n".join(json.dumps(r) for r in rows) + "\n")
    shard = tmp_path / "shard.json"
    shard.write_text(json.dumps({"format": "c13-shard", "results": rows}))
    for path in (jsonl, shard):
        parsed = list(read_rows(path))
        assert [r.passed for r in parsed] == [True, False]
        assert parsed[1].reason == "halo"


@pytest.mark.parametrize(
    "bad",
    [
        {"content_hash": "x", "module": "filters", "check": "skin", "passed": True},
        {"content_hash": _hash(1), "module": "web/src/filters", "check": "skin", "passed": True},
        {"content_hash": _hash(1), "module": "filters", "check": "skin", "passed": "yes"},
        {
            "content_hash": _hash(1),
            "module": "filters",
            "check": "s",
            "passed": False,
            "reason": "/a.jpg",
        },
    ],
)
def test_bad_rows_are_refused(bad: dict[str, object]) -> None:
    with pytest.raises(RowError):
        row_from_json(bad)


def test_join_counts_untagged_rows() -> None:
    tags = parse_tags({"fitzpatrick": "II", "age_band": "50-59"})
    records = {_hash(1): TraitRecord(_hash(1), "S20", tags, "stress approximation")}
    rows = [
        ResultRow(_hash(1), "regions", "eyes", True),
        ResultRow(_hash(2), "regions", "eyes", False),
    ]
    joined = join(rows, records)
    assert len(joined.rows) == 1 and joined.untagged == 1
    assert joined.rows[0].values["fitzpatrick"] == "II"
