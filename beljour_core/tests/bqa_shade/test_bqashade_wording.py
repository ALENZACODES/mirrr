"""COL-01 report linter tests and importer tests.

Pass definition: "looks close" without numbers is flagged, Delta E or a Lab
triple clears it; an accuracy figure needs a light condition unless its table
has a light column; code blocks are skipped. Importers read typed CSV rows,
reject names in place of pseudonymous ids, and read the manifest's provenance.
Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path

import pytest
from bqashade_synthetic import inputs_folder, write_csv

from lab.bqa_shade import importers, wording


def kinds(text: str) -> list[tuple[int, str]]:
    return [(f.line, f.kind) for f in wording.lint_markdown(text)]


def test_comparison_needs_numbers() -> None:
    assert kinds("The predicted shade looks close to the expert shade.") == [(1, "comparison")]
    assert kinds("The predicted shade is close to the expert shade (Delta E 2.1).") == []
    assert kinds("The swatch matches the render, CIEDE2000 1.8 in daylight.") == []
    assert kinds("Lab (62.1, 12.0, 18.3) versus Lab (60.0, 12.5, 18.0) for the shade.") == []
    assert kinds("Shade A is lighter than shade B, L* 64 against L* 60.") == []


def test_accuracy_needs_a_light() -> None:
    assert kinds("Top-1 acceptance was 82%.") == [(1, "accuracy")]
    assert kinds("Top-1 acceptance was 82% in daylight.") == []
    assert kinds("Accuracy 91% across all seven lights.") == []


def test_tables_with_a_light_column_pass() -> None:
    with_light = "| band | light | top-1 |\n|---|---|---|\n| 5-6 | daylight | 81% |\n"
    without = "| band | top-1 |\n|---|---|\n| 5-6 | 81% |\n"
    assert kinds(with_light) == []
    assert kinds(without) == [(3, "accuracy")]
    assert kinds(with_light + "\nTop-3 was 97%.\n") == [(5, "accuracy")]


def test_code_blocks_are_skipped() -> None:
    assert kinds("```\nshade looks close 90%\n```\n") == []
    assert kinds("    shade looks close 90%\n") == []


def test_lint_files_reports_names_only(tmp_path: Path) -> None:
    (tmp_path / "a.md").write_text("Top-1 was 80%.\n", encoding="utf-8")
    (tmp_path / "b.md").write_text("Delta E 1.2 for the shade match in daylight.\n",
                                   encoding="utf-8")
    found = wording.lint_files(tmp_path.glob("*.md"))
    assert set(found) == {"a.md", "b.md"}
    assert len(found["a.md"]) == 1 and found["b.md"] == []


def test_manifest_and_source(tmp_path: Path) -> None:
    assert importers.open_source(None).where is None
    assert not importers.open_source(tmp_path).real
    inputs_folder(tmp_path, "real", ["RB2-01"])
    source = importers.open_source(tmp_path)
    assert source.real and source.disclosed("RB2-01") and not source.disclosed("FND-01")
    inputs_folder(tmp_path, "made-up")
    with pytest.raises(ValueError):
        importers.open_source(tmp_path)


COLUMNS = (importers.Column("participant_id", "id", pattern=importers.PARTICIPANT),
           importers.Column("ok", "bool"),
           importers.Column("step", "int", required=False, low=1, high=10),
           importers.Column("light", "choice", choices=("daylight", "flash")))


def test_typed_rows_and_rejections(tmp_path: Path) -> None:
    path = tmp_path / "t.csv"
    write_csv(path, [c.name for c in COLUMNS], [
        {"participant_id": "P-0001", "ok": "yes", "step": 4, "light": "Daylight"},
        {"participant_id": "Jane Doe", "ok": "yes", "step": 4, "light": "daylight"},
        {"participant_id": "P-0002", "ok": "maybe", "step": 4, "light": "daylight"},
        {"participant_id": "P-0003", "ok": "no", "step": 14, "light": "daylight"},
        {"participant_id": "P-0004", "ok": "no", "step": None, "light": "flash"},
    ])
    table = importers.read_csv(path, COLUMNS)
    assert table.rejected == 3
    assert table.rows[0] == {"participant_id": "P-0001", "ok": True, "step": 4,
                             "light": "daylight"}
    assert table.rows[1]["step"] is None


def test_missing_columns_are_reported(tmp_path: Path) -> None:
    path = tmp_path / "t.csv"
    write_csv(path, ["participant_id"], [{"participant_id": "P-0001"}])
    table = importers.read_csv(path, COLUMNS)
    assert table.rows == [] and "missing columns" in table.problems[0]
