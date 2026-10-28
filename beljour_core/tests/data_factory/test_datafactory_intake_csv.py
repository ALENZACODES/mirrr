"""Contributor CSV to intake JSONL: parsing, defaults, problems and a full run.

Author: John Khan.
"""

from __future__ import annotations

import csv
import io
import json
from pathlib import Path

import pytest

from plumb_api.data_factory.cli import EXIT_FAILED, EXIT_OK, EXIT_USAGE, main
from plumb_api.data_factory.intake_csv import (
    IntakeError,
    batch_defaults,
    convert_csv,
    convert_row,
)
from plumb_api.data_factory.records import ImageRecord

HEADER = ["path", "commercial_use", "consent", "age_band", "lighting",
          "face_x", "face_y", "face_w", "face_h", "width", "height"]


def write_csv(path: Path, header: list[str], rows: list[list[str]]) -> Path:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        writer.writerows(rows)
    return path


def test_rows_convert_with_batch_defaults(tmp_path: Path) -> None:
    source = write_csv(tmp_path / "batch.csv", HEADER, [
        ["a.png", "yes", "Y", "20-29", "studio", "10", "10", "100", "120", "640", "480"],
        ["b.png", "1", "true", "", "", "", "", "", "", "", ""],
    ])
    out = tmp_path / "intake.jsonl"
    defaults = batch_defaults(source="north-shoot", licence="CC0-1.0")
    result = convert_csv(source, out, defaults=defaults)
    assert result.clean and result.written == 2
    rows = [json.loads(line) for line in out.read_text().splitlines()]
    assert rows[0]["face_box"] == [10, 10, 100, 120]
    assert rows[0]["width"] == 640 and rows[0]["commercial_use"] is True
    assert "age_band" not in rows[1]
    for row in rows:
        record = ImageRecord.from_dict(row, require_hash=False)
        assert record.source == "north-shoot" and record.attribution == ""


def test_problem_rows_are_reported_not_written(tmp_path: Path) -> None:
    source = write_csv(tmp_path / "batch.csv", HEADER, [
        ["a.png", "maybe", "yes", "", "", "", "", "", "", "", ""],
        ["b.png", "yes", "yes", "teen", "", "", "", "", "", "", ""],
        ["c.png", "yes", "yes", "", "", "1", "", "", "", "", ""],
        ["", "yes", "yes", "", "", "", "", "", "", "", ""],
        ["d.png", "yes", "yes", "", "", "", "", "", "", "wide", ""],
        ["e.png", "yes", "yes", "", "", "", "", "", "", "", ""],
        ["e.png", "yes", "yes", "", "", "", "", "", "", "", ""],
    ])
    out = tmp_path / "intake.jsonl"
    result = convert_csv(source, out, defaults={"source": "s", "licence": "MIT"})
    assert result.written == 1
    lines = {line for line, _ in result.problems}
    assert lines == {2, 3, 4, 5, 6, 8}
    text = " ".join(problem for _, problem in result.problems)
    assert "commercial_use: must be true or false" in text
    assert "age_band: must be one of" in text
    assert "face box needs all" in text
    assert "path: missing" in text
    assert "width: must be a positive integer" in text
    assert "path repeats line 7" in text


def test_unknown_and_missing_columns(tmp_path: Path) -> None:
    bad = write_csv(tmp_path / "bad.csv", ["path", "licnece"], [["a.png", "MIT"]])
    with pytest.raises(IntakeError, match="licnece"):
        convert_csv(bad, tmp_path / "out.jsonl")
    ok = convert_csv(bad, tmp_path / "out.jsonl", ignore_columns=["licnece"])
    assert ok.written == 0 and ok.problems
    no_path = write_csv(tmp_path / "np.csv", ["source"], [["s"]])
    with pytest.raises(IntakeError, match="path column"):
        convert_csv(no_path, tmp_path / "out.jsonl")


def test_convert_row_keeps_explicit_values_over_defaults() -> None:
    row, problems = convert_row({"path": "a.png", "source": "own", "commercial_use": "no",
                                 "consent": "yes", "licence": "CC0-1.0"},
                                {"source": "batch", "commercial_use": True})
    assert problems == []
    assert row["source"] == "own" and row["commercial_use"] is False


def test_intake_command(tmp_path: Path) -> None:
    source = write_csv(tmp_path / "batch.csv", ["path"], [["a.png"], ["b.png"]])
    out = io.StringIO()
    code = main(["intake", "--csv", str(source), "--out", str(tmp_path / "i.jsonl"),
                 "--source", "north", "--licence", "CC0-1.0", "--commercial-use", "yes",
                 "--consent", "yes"], out)
    assert code == EXIT_OK and "wrote 2 row(s), 0 problem(s)" in out.getvalue()
    failing = io.StringIO()
    code = main(["intake", "--csv", str(source), "--out", str(tmp_path / "j.jsonl")], failing)
    assert code == EXIT_FAILED and "line 2:" in failing.getvalue()
    bad = write_csv(tmp_path / "bad.csv", ["path", "colour"], [["a.png", "red"]])
    assert main(["intake", "--csv", str(bad), "--out", str(tmp_path / "k.jsonl")],
                io.StringIO()) == EXIT_USAGE
