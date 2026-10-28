"""Data card and provenance register built from a locked demo set.

Author: John Khan.
"""

from __future__ import annotations

import csv
import io
import json
from pathlib import Path

import pytest

from plumb_api.data_factory.cli import EXIT_OK, main
from plumb_api.data_factory.config import load_config
from plumb_api.data_factory.datacard import card_facts, known_gaps, render_card, write_card
from plumb_api.data_factory.demo_set import OWN_SOURCE, write_demo_set
from plumb_api.data_factory.pipeline import run_pipeline
from plumb_api.data_factory.provenance_register import (
    COLUMNS,
    load_reviews,
    needs_review,
    register_rows,
    write_register,
)
from plumb_api.data_factory.report import build_report, write_report


@pytest.fixture(scope="module")
def locked(tmp_path_factory: pytest.TempPathFactory) -> tuple[Path, Path]:
    demo = write_demo_set(tmp_path_factory.mktemp("card") / "set", distinct=8, size=200)
    result = run_pipeline(load_config(demo.config_path))
    assert result.lock_path is not None
    report_json, _ = write_report(build_report(result), demo.root / "out")
    return result.lock_path, report_json


def test_card_facts(locked: tuple[Path, Path]) -> None:
    lock_path, report = locked
    facts = card_facts(lock_path, report)
    assert facts["author"] == "John Khan"
    assert facts["records"] == 8
    assert set(facts["sources"]) <= {OWN_SOURCE, "beljour-partner-batch"}
    assert sum(facts["licences"].values()) == 8
    assert sum(facts["declared"]["lighting"].values()) == 8
    stages = [item["stage"] for item in facts["filters"]]
    assert stages[0] == "ingest" and "near_dedup" in stages
    assert any(gap.startswith("age_band: no records for") or "skin_tone_group" in gap
               for gap in facts["gaps"])


def test_card_markdown_and_files(locked: tuple[Path, Path], tmp_path: Path) -> None:
    lock_path, report = locked
    md_path, json_path = write_card(lock_path, tmp_path, report)
    text = md_path.read_text()
    for heading in ("## Sources", "## Licences", "## Counts by slice", "## Filters applied",
                    "## Known gaps"):
        assert heading in text
    assert "Author: John Khan." in text
    assert json.loads(json_path.read_text())["schema"] == "beljour-data-card/1"
    without = render_card(card_facts(lock_path))
    assert "Not available without the run report." in without
    assert "no run report supplied" in without


def test_known_gaps_rules() -> None:
    assert known_gaps({}, 0, {}) == ["the set is empty"]
    declared = {"lighting": {"studio": 2, "undeclared": 8}}
    gaps = known_gaps(declared, 10, {"shortfall": [{"cell": "lighting=studio", "shortfall": 3,
                                                    "target": 5}]})
    assert "lighting: 8 of 10 records (80%) have no declared value" in gaps
    assert any(gap.startswith("lighting: no records for indoor") for gap in gaps)
    assert "slice lighting=studio: 3 short of its quota of 5" in gaps


def test_provenance_rows_and_reviews(locked: tuple[Path, Path], tmp_path: Path) -> None:
    lock_path, _ = locked
    rows = register_rows(lock_path)
    assert all(set(row) == set(COLUMNS) for row in rows)
    assert sum(row["records"] for row in rows) == 8
    assert needs_review(rows) == [row["source"] for row in rows]
    reviews_csv = tmp_path / "reviews.csv"
    with reviews_csv.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["source", "evidence_reference", "reviewed_by", "reviewed_on"])
        for row in rows:
            writer.writerow([row["source"], "release-forms-batch-1", "John Khan", "2026-10-25"])
    reviews = load_reviews(reviews_csv)
    reviewed = register_rows(lock_path, reviews)
    assert needs_review(reviewed) == []
    csv_path, json_path = write_register(lock_path, tmp_path, reviews)
    with csv_path.open(newline="") as handle:
        assert len(list(csv.DictReader(handle))) == len(rows)
    payload = json.loads(json_path.read_text())
    assert payload["author"] == "John Khan" and payload["rows"][0]["status"] == "reviewed"
    bad = tmp_path / "bad.csv"
    bad.write_text("name\nx\n")
    with pytest.raises(ValueError):
        load_reviews(bad)


def test_card_and_register_commands(locked: tuple[Path, Path], tmp_path: Path) -> None:
    lock_path, report = locked
    out = io.StringIO()
    assert main(["datacard", "--lock", str(lock_path), "--report", str(report),
                 "--out", str(tmp_path)], out) == EXIT_OK
    assert main(["provenance", "--lock", str(lock_path), "--out", str(tmp_path)],
                out) == EXIT_OK
    assert "need review" in out.getvalue()
    assert (tmp_path / "demo-set.datacard.md").is_file()
    assert (tmp_path / "demo-set.provenance.csv").is_file()
