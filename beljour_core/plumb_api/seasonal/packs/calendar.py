"""Occasion calendar: when is the next one, and which packs to suggest now.

Dates come from exact rules wherever a rule exists: fixed days, Kwanzaa
(Dec 26 - Jan 1), Western Easter (Gregorian computus), Orthodox Easter (Julian
computus), Thanksgiving for Canada and the United States, and Hanukkah from
the arithmetic Hebrew calendar. Sighting or almanac dates come from the cited
table in lunar_table.py. Vaisakhi is April 14 by the Nanakshahi calendar
(ASSUMED; some years and places observe April 13).
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from .hebrew import HANUKKAH_DAYS, hanukkah_start
from .lunar_table import table_row, table_years
from .occasions import OCCASION_IDS, DateRule, require_occasion
from .registry import DEFAULT_REGISTRY, PackRegistry

REGIONS = ("CA", "US", "UK", "GLOBAL")
# ASSUMED: the app's home market is Canada, so Canadian Thanksgiving is the default.
DEFAULT_REGION = "CA"
THANKSGIVING_REGIONS = ("CA", "US")
VARIANTS: dict[str, tuple[str, ...]] = {
    "easter": ("western", "orthodox"),
    "christmas": ("western", "orthodox"),
    "new_year": ("day", "eve"),
}
MAX_WINDOW = 400
# Rule dates are exact well beyond this span; it keeps Hanukkah (25 Kislev) inside
# its own Gregorian year and every date inside Python's date range.
MIN_YEAR = 1600
MAX_YEAR = 2999


class CalendarError(ValueError):
    """A date cannot be given for this occasion, region or year."""


@dataclass(frozen=True)
class Occurrence:
    """One dated occurrence of an occasion; single-day occasions have start == end."""

    occasion: str
    start: date
    end: date
    rule: str
    source: str
    verified: bool
    note: str = ""

    def contains(self, day: date) -> bool:
        """True when the day falls inside the occurrence."""
        return self.start <= day <= self.end


@dataclass(frozen=True)
class Suggestion:
    """An occasion coming up (or under way) within the suggestion window."""

    occurrence: Occurrence
    days_until: int
    has_pack: bool

    @property
    def occasion(self) -> str:
        """The occasion id."""
        return self.occurrence.occasion


def gregorian_easter(year: int) -> date:
    """Western Easter Sunday by the anonymous Gregorian computus."""
    a = year % 19
    b, c = divmod(year, 100)
    d, e = divmod(b, 4)
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = divmod(c, 4)
    el = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * el) // 451
    month, day = divmod(h + el - 7 * m + 114, 31)
    return date(year, month, day + 1)


def julian_to_gregorian(year: int, month: int, day: int) -> date:
    """Gregorian date of a Julian calendar date, by Julian day number."""
    a = (14 - month) // 12
    y = year + 4800 - a
    m = month + 12 * a - 3
    jdn = day + (153 * m + 2) // 5 + 365 * y + y // 4 - 32083
    return date.fromordinal(jdn - 1721425)


def orthodox_easter(year: int) -> date:
    """Orthodox Easter Sunday: Julian computus, returned as a Gregorian date."""
    a = year % 4
    b = year % 7
    c = year % 19
    d = (19 * c + 15) % 30
    e = (2 * a + 4 * b - d + 34) % 7
    month, day = divmod(d + e + 114, 31)
    return julian_to_gregorian(year, month, day + 1)


def nth_weekday(year: int, month: int, weekday: int, n: int) -> date:
    """The n-th given weekday (Monday = 0) of a month."""
    first = date(year, month, 1)
    offset = (weekday - first.weekday()) % 7
    return first + timedelta(days=offset + 7 * (n - 1))


def thanksgiving_day(year: int, region: str) -> date:
    """Canada: second Monday of October. United States: fourth Thursday of November."""
    if region == "CA":
        return nth_weekday(year, 10, 0, 2)
    if region == "US":
        return nth_weekday(year, 11, 3, 4)
    raise CalendarError(f"Thanksgiving is dated for {', '.join(THANKSGIVING_REGIONS)} only")


def _check_region(region: str) -> str:
    if region not in REGIONS:
        raise CalendarError(f"unknown region {region!r}; expected one of {', '.join(REGIONS)}")
    return region


def _check_year(year: int) -> None:
    if not MIN_YEAR <= year <= MAX_YEAR:
        raise CalendarError(f"dates are supported for {MIN_YEAR}-{MAX_YEAR}, not {year}")


def _years(first: int, last: int) -> range:
    """Years first..last inclusive, clipped to the supported span."""
    return range(max(MIN_YEAR, first), min(MAX_YEAR, last) + 1)


def _check_variants(variants: dict[str, str] | None) -> dict[str, str]:
    chosen = dict(variants or {})
    for occasion, variant in chosen.items():
        require_occasion(occasion)
        _check_variant(occasion, variant)
    return chosen


def _check_variant(occasion: str, variant: str | None) -> str | None:
    if variant is None:
        return None
    allowed = VARIANTS.get(occasion, ())
    if variant not in allowed:
        raise CalendarError(f"{occasion} has no variant {variant!r}")
    return variant


def _ruled(occasion: str, start: date, rule: str, days: int = 1, note: str = "") -> Occurrence:
    return Occurrence(occasion, start, start + timedelta(days=days - 1), rule, "rule", True, note)


def occurrence_in_year(
    occasion: str,
    year: int,
    region: str = DEFAULT_REGION,
    variant: str | None = None,
) -> Occurrence | None:
    """The occurrence that starts in a Gregorian year, or None when no date is known."""
    info = require_occasion(occasion)
    _check_region(region)
    _check_year(year)
    variant = _check_variant(occasion, variant)
    if info.rule is DateRule.TABLE:
        row = table_row(occasion, year)
        if row is None:
            return None
        note = "" if row.verified else "date from an unverified table row"
        return Occurrence(
            occasion, row.when, row.when, "table", f"{row.source} {row.url}", row.verified, note
        )
    if occasion == "halloween":
        return _ruled(occasion, date(year, 10, 31), "fixed Oct 31")
    if occasion == "christmas":
        if variant == "orthodox":
            return _ruled(occasion, date(year, 1, 7), "fixed Jan 7 (Julian Dec 25)")
        return _ruled(occasion, date(year, 12, 25), "fixed Dec 25")
    if occasion == "new_year":
        if variant == "eve":
            return _ruled(occasion, date(year, 12, 31), "fixed Dec 31 (eve)")
        return _ruled(occasion, date(year, 1, 1), "fixed Jan 1")
    if occasion == "kwanzaa":
        return _ruled(occasion, date(year, 12, 26), "fixed Dec 26 - Jan 1", days=info.days)
    if occasion == "vaisakhi":
        return _ruled(
            occasion, date(year, 4, 14), "Nanakshahi Apr 14", note="some years observe Apr 13"
        )
    if occasion == "easter":
        if variant == "orthodox":
            return _ruled(occasion, orthodox_easter(year), "Julian computus")
        return _ruled(occasion, gregorian_easter(year), "Gregorian computus")
    if occasion == "thanksgiving":
        if region not in THANKSGIVING_REGIONS:
            return None
        rule = "second Monday of October" if region == "CA" else "fourth Thursday of November"
        return _ruled(occasion, thanksgiving_day(year, region), rule)
    if occasion == "hanukkah":
        return _ruled(
            occasion,
            hanukkah_start(year),
            "25 Kislev, arithmetic Hebrew calendar",
            days=HANUKKAH_DAYS,
            note="first candle the evening before",
        )
    raise CalendarError(f"no dating rule for {occasion}")


def next_occurrence(
    occasion: str,
    from_date: date,
    region: str = DEFAULT_REGION,
    *,
    variant: str | None = None,
) -> Occurrence:
    """The first occurrence that has not ended by from_date (an ongoing one counts)."""
    info = require_occasion(occasion)
    _check_region(region)
    if occasion == "thanksgiving" and region not in THANKSGIVING_REGIONS:
        raise CalendarError(f"Thanksgiving is dated for {', '.join(THANKSGIVING_REGIONS)} only")
    _check_year(from_date.year)
    if info.rule is DateRule.TABLE:
        # Table dates are single days: a missing row for this year or the next
        # means the answer is unknown, never "skip ahead to a later row".
        for year in _years(from_date.year, from_date.year + 1):
            found = occurrence_in_year(occasion, year, region, variant)
            if found is None:
                years = table_years(occasion)
                span = f"{years[0]}-{years[-1]}" if years else "no years"
                raise CalendarError(
                    f"the date table for {occasion} covers {span}; {year} is missing"
                )
            if found.end >= from_date:
                return found
    for year in _years(from_date.year - 1, from_date.year + 1):
        found = occurrence_in_year(occasion, year, region, variant)
        if found is not None and found.end >= from_date:
            return found
    raise CalendarError(f"no occurrence of {occasion} found after {from_date}")


def suggest(
    today: date,
    region: str = DEFAULT_REGION,
    window_days: int = 45,
    *,
    registry: PackRegistry | None = None,
    variants: dict[str, str] | None = None,
) -> tuple[Suggestion, ...]:
    """Occasions under way or starting within window_days, soonest first.

    Occasions with no date (a region without Thanksgiving, a year missing from
    the table) are left out rather than guessed.
    """
    _check_region(region)
    if isinstance(window_days, bool) or not isinstance(window_days, int):
        raise CalendarError("window_days must be an integer")
    if not 0 <= window_days <= MAX_WINDOW:
        raise CalendarError(f"window_days must be 0-{MAX_WINDOW}")
    chosen = _check_variants(variants)
    _check_year(today.year)
    packs = registry or DEFAULT_REGISTRY
    found: list[Suggestion] = []
    for occasion in OCCASION_IDS:
        try:
            occurrence = next_occurrence(occasion, today, region, variant=chosen.get(occasion))
        except CalendarError:
            continue
        days_until = max(0, (occurrence.start - today).days)
        if days_until <= window_days:
            found.append(Suggestion(occurrence, days_until, packs.has(occasion)))
    found.sort(key=lambda item: (item.days_until, OCCASION_IDS.index(item.occasion)))
    return tuple(found)


def occurrences_between(
    start: date,
    end: date,
    region: str = DEFAULT_REGION,
    *,
    variants: dict[str, str] | None = None,
) -> tuple[Occurrence, ...]:
    """Every dated occurrence that overlaps start..end, in date order (a year view).

    Occasions with no date in a year (no table row, no Thanksgiving for the
    region) are left out for that year.
    """
    _check_region(region)
    if end < start:
        raise CalendarError("end must not be before start")
    if (end - start).days > 3 * 366:
        raise CalendarError("a range may span at most three years")
    _check_year(start.year)
    _check_year(end.year)
    chosen = _check_variants(variants)
    found: list[Occurrence] = []
    for occasion in OCCASION_IDS:
        for year in _years(start.year - 1, end.year):
            occurrence = occurrence_in_year(occasion, year, region, chosen.get(occasion))
            if occurrence is not None and occurrence.end >= start and occurrence.start <= end:
                found.append(occurrence)
    found.sort(key=lambda item: (item.start, OCCASION_IDS.index(item.occasion)))
    return tuple(found)
