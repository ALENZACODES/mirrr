"""The Holiday Engine's browser calendar is exactly what the Python seasonal calendar says now.

Author: John Khan.
"""
from __future__ import annotations

import importlib.util
import json
from datetime import date
from pathlib import Path
from types import ModuleType

from plumb_api.seasonal.packs import calendar
from plumb_api.seasonal.packs.occasions import OCCASION_IDS

ROOT = Path(__file__).resolve().parents[2]


def sync() -> ModuleType:
    spec = importlib.util.spec_from_file_location("sync_holidays", ROOT / "scripts/sync_holidays.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_generated_calendar_and_checks_are_current() -> None:
    s = sync()
    for path, text in s.outputs().items():
        assert path.read_text(encoding="utf-8") == text, f"{path} drifted; run python scripts/sync_holidays.py"


def test_every_row_is_the_calendar_answer_for_its_year_region_and_variant() -> None:
    data = sync().build()
    assert data["format"] == "beljour-holiday-calendar/1"
    assert set(data["regions"]) == set(calendar.REGIONS)
    assert [o["id"] for o in data["occasions"]] == list(OCCASION_IDS)
    for region, rows in data["regions"].items():
        assert rows == sorted(rows, key=lambda r: (r[2], OCCASION_IDS.index(r[0]), r[1]))
        for occasion, variant, start, end, verified, *_ in rows:
            found = calendar.occurrence_in_year(occasion, int(start[:4]), region, variant or None)
            assert found is not None
            assert (found.start.isoformat(), found.end.isoformat(), found.verified) == (start, end, verified)
    assert not any(r[0] == "thanksgiving" for r in data["regions"]["UK"]), "no date where the calendar has none"
    table_years = {int(r[2][:4]) for r in data["regions"]["CA"] if r[0] == "diwali"}
    assert max(table_years) == 2030, "table dates stop where the cited table stops"


def test_checks_cover_dated_and_undated_days() -> None:
    checks = sync().checks()
    days = [date.fromisoformat(d) for d in checks["days"]]
    assert days[0] == date(2026, 1, 1) and days[-1] == date(2031, 12, 31)
    offsets = [o for *_, series in checks["series"] for o in series]
    assert any(o is None for o in offsets) and any(o is not None and o < 0 for o in offsets)
    assert json.loads(json.dumps(checks)) == checks


def test_browser_data_names_sources_without_urls() -> None:
    s = sync()
    text = s.calendar_ts()
    assert "http://" not in text and "https://" not in text, "the app never opens a citation; the URL stays in Python"
    diwali = next(r for r in s.build()["regions"]["CA"] if r[0] == "diwali")
    assert diwali[6] == "timeanddate.com holiday listing" and diwali[4] is False
