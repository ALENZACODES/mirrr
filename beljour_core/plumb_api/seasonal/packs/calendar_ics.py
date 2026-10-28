"""iCalendar (RFC 5545) export of occasion dates, standard library only.

Lets the app offer "remind me" for upcoming occasions: all-day events with
the occasion name, the dating rule and, for table dates not yet checked, a
note that the date may move. Text is escaped and long lines are folded at 75
octets as the standard requires. DTSTAMP is passed in, so output is
deterministic and easy to test.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime, timedelta

from .calendar import CalendarError, Occurrence
from .occasions import OCCASIONS

PRODUCT_ID = "-//BELJOUR//Seasonal packs//EN"
LINE_OCTETS = 75


def escape_text(value: str) -> str:
    """Escape backslash, semicolon, comma and newlines for a TEXT value."""
    return (
        value.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
    )


def fold(line: str) -> list[str]:
    """Split a content line into 75-octet pieces; continuations start with a space."""
    pieces: list[str] = []
    current = ""
    limit = LINE_OCTETS
    for char in line:
        if len((current + char).encode("utf-8")) > limit:
            pieces.append(current)
            current = " "
            limit = LINE_OCTETS
        current += char
    pieces.append(current)
    return pieces


def _event(occurrence: Occurrence, stamp: str) -> list[str]:
    name = OCCASIONS[occurrence.occasion].name
    description = f"Dated by: {occurrence.rule}."
    if occurrence.note:
        description += f" Note: {occurrence.note}."
    if not occurrence.verified:
        description += " This date is not yet checked against its source and may move."
    end = occurrence.end + timedelta(days=1)
    return [
        "BEGIN:VEVENT",
        f"UID:{occurrence.occasion}-{occurrence.start.isoformat()}@seasonal-packs",
        f"DTSTAMP:{stamp}",
        f"DTSTART;VALUE=DATE:{occurrence.start.strftime('%Y%m%d')}",
        f"DTEND;VALUE=DATE:{end.strftime('%Y%m%d')}",
        f"SUMMARY:{escape_text(name)}",
        f"DESCRIPTION:{escape_text(description)}",
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
    ]


def occurrences_ics(occurrences: Sequence[Occurrence], stamp: datetime) -> str:
    """A VCALENDAR document with one all-day VEVENT per occurrence."""
    if stamp.tzinfo is None:
        raise CalendarError("the DTSTAMP time must carry a time zone")
    utc = stamp.astimezone(UTC).strftime("%Y%m%dT%H%M%SZ")
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", f"PRODID:{PRODUCT_ID}", "CALSCALE:GREGORIAN"]
    for occurrence in occurrences:
        lines.extend(_event(occurrence, utc))
    lines.append("END:VCALENDAR")
    folded: list[str] = []
    for line in lines:
        folded.extend(fold(line))
    return "\r\n".join(folded) + "\r\n"
