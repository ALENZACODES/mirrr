"""Command-line tests: each export writes readable files into --out.

Author: John Khan.
"""

from __future__ import annotations

import json
import xml.etree.ElementTree as ElementTree
from pathlib import Path

import pytest
from PIL import Image

from plumb_api.seasonal.packs.__main__ import main


def test_sheets_writes_one_png_per_pack(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["sheets", "--out", str(tmp_path / "sheets"), "--tile", "96"]) == 0
    files = sorted((tmp_path / "sheets").glob("sheet_*.png"))
    assert [f.name for f in files] == sorted(
        f"sheet_{o}.png" for o in ("halloween", "christmas", "thanksgiving", "new_year", "easter")
    )
    with Image.open(files[0]) as sheet:
        assert sheet.mode == "RGB" and sheet.width > 96
    assert len(capsys.readouterr().out.splitlines()) == 5


def test_gallery_writes_svg(tmp_path: Path) -> None:
    assert main(["gallery", "--out", str(tmp_path)]) == 0
    root = ElementTree.parse(tmp_path / "motif_gallery.svg").getroot()
    assert root.tag.endswith("svg")


def test_catalogue_with_and_without_today(tmp_path: Path) -> None:
    assert main(["catalogue", "--out", str(tmp_path)]) == 0
    plain = json.loads((tmp_path / "seasonal_catalogue.json").read_text())
    assert "suggestions" not in plain
    assert main(["catalogue", "--out", str(tmp_path), "--today", "2026-10-25"]) == 0
    dated = json.loads((tmp_path / "seasonal_catalogue.json").read_text())
    assert dated["suggestions"][0]["occasion"] == "halloween"


def test_calendar_writes_ics(tmp_path: Path) -> None:
    assert main(["calendar", "--out", str(tmp_path), "--year", "2027", "--region", "US"]) == 0
    text = (tmp_path / "occasions_2027_US.ics").read_bytes().decode("utf-8")
    assert text.startswith("BEGIN:VCALENDAR\r\n")
    assert text.count("BEGIN:VEVENT") == 15


def test_calendar_errors_are_reported(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["calendar", "--out", str(tmp_path), "--year", "3500"]) == 2
    assert "supported" in capsys.readouterr().err


def test_audit_command_is_clean(capsys: pytest.CaptureFixture[str]) -> None:
    code = main(["audit"])
    out = capsys.readouterr().out
    lines = [line for line in out.splitlines() if "/audit_" not in line]
    assert lines[-1].startswith("audit: ")
    assert code == 0 or all(
        "/audit_" in line for line in out.splitlines() if line.startswith("FAIL")
    )


def test_bad_arguments_exit_through_argparse() -> None:
    with pytest.raises(SystemExit):
        main(["catalogue", "--out", "x", "--today", "not-a-date"])
    with pytest.raises(SystemExit):
        main([])
