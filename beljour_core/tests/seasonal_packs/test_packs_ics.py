"""iCalendar export tests: structure, escaping, folding and all-day ends.

Author: John Khan.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta, timezone

import pytest

from plumb_api.seasonal.packs import next_occurrence, occurrences_between
from plumb_api.seasonal.packs.calendar import CalendarError
from plumb_api.seasonal.packs.calendar_ics import (
    LINE_OCTETS,
    PRODUCT_ID,
    escape_text,
    fold,
    occurrences_ics,
)

STAMP = datetime(2026, 10, 25, 9, 30, tzinfo=UTC)


def unfold(text: str) -> list[str]:
    lines: list[str] = []
    for raw in text.split("\r\n"):
        if raw.startswith(" ") and lines:
            lines[-1] += raw[1:]
        elif raw:
            lines.append(raw)
    return lines


def test_document_structure() -> None:
    year = occurrences_between(date(2027, 1, 1), date(2027, 12, 31))
    text = occurrences_ics(year, STAMP)
    assert text.endswith("\r\n")
    lines = unfold(text)
    assert lines[0] == "BEGIN:VCALENDAR" and lines[-1] == "END:VCALENDAR"
    assert f"PRODID:{PRODUCT_ID}" in lines
    assert lines.count("BEGIN:VEVENT") == len(year) == lines.count("END:VEVENT")
    uids = [line for line in lines if line.startswith("UID:")]
    assert len(set(uids)) == len(uids)
    assert all(line == "DTSTAMP:20261025T093000Z" for line in lines if line.startswith("DTSTAMP"))


def test_all_day_end_is_exclusive() -> None:
    kwanzaa = next_occurrence("kwanzaa", date(2026, 12, 1))
    lines = unfold(occurrences_ics([kwanzaa], STAMP))
    assert "DTSTART;VALUE=DATE:20261226" in lines
    assert "DTEND;VALUE=DATE:20270102" in lines
    halloween = next_occurrence("halloween", date(2026, 10, 1))
    lines = unfold(occurrences_ics([halloween], STAMP))
    assert "DTEND;VALUE=DATE:20261101" in lines


def test_unverified_dates_say_so() -> None:
    diwali = next_occurrence("diwali", date(2026, 10, 1))
    text = "".join(unfold(occurrences_ics([diwali], STAMP)))
    assert "not yet checked" in text
    halloween = next_occurrence("halloween", date(2026, 10, 1))
    assert "not yet checked" not in "".join(unfold(occurrences_ics([halloween], STAMP)))


def test_escaping() -> None:
    assert escape_text("a,b;c\\d\ne") == "a\\,b\\;c\\\\d\\ne"


def test_long_lines_fold_at_75_octets() -> None:
    line = "DESCRIPTION:" + "é" * 100
    pieces = fold(line)
    assert len(pieces) > 1
    assert all(len(piece.encode("utf-8")) <= LINE_OCTETS for piece in pieces)
    assert all(piece.startswith(" ") for piece in pieces[1:])
    assert pieces[0] + "".join(piece[1:] for piece in pieces[1:]) == line


def test_every_raw_line_is_short() -> None:
    year = occurrences_between(date(2026, 1, 1), date(2026, 12, 31))
    for raw in occurrences_ics(year, STAMP).split("\r\n"):
        assert len(raw.encode("utf-8")) <= LINE_OCTETS


def test_stamp_needs_a_zone_and_is_converted_to_utc() -> None:
    with pytest.raises(CalendarError, match="time zone"):
        occurrences_ics([], datetime(2026, 1, 1, 12, 0))
    toronto = timezone(timedelta(hours=-4))
    text = occurrences_ics(
        [next_occurrence("halloween", date(2026, 1, 1))],
        datetime(2026, 10, 25, 5, 0, tzinfo=toronto),
    )
    assert "DTSTAMP:20261025T090000Z" in text


def test_empty_calendar_is_valid() -> None:
    assert unfold(occurrences_ics([], STAMP)) == [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        f"PRODID:{PRODUCT_ID}",
        "CALSCALE:GREGORIAN",
        "END:VCALENDAR",
    ]
