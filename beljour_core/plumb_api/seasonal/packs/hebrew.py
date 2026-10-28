"""The fixed arithmetic Hebrew calendar, enough to date Hanukkah (25 Kislev).

This is the standard rule-based calendar: a 19-year cycle with leap years 3,
6, 8, 11, 14, 17 and 19, the molad of Tishrei counted in parts (1080 to the
hour), and the four postponement rules. Dates convert to and from Python
proleptic Gregorian ordinals; the epoch, 1 Tishrei of year 1, is ordinal -1373427.
Month numbers start at Nisan = 1, so Tishrei = 7, Kislev = 9 and, in a leap
year, Adar I = 12 and Adar II = 13.
Author: John Khan.
"""

from __future__ import annotations

from datetime import date
from functools import lru_cache

NISAN = 1
TISHREI = 7
HESHVAN = 8
KISLEV = 9
ADAR = 12
ADAR_II = 13
# Ordinal of 1 Tishrei AM 1 on the Python date.toordinal scale.
EPOCH = -1373427
PARTS_PER_HOUR = 1080
PARTS_PER_DAY = 24 * PARTS_PER_HOUR
HANUKKAH_DAY = 25
HANUKKAH_DAYS = 8


class HebrewDateError(ValueError):
    """A Hebrew date that does not exist."""


def is_leap(year: int) -> bool:
    """True for the seven leap years of each 19-year cycle."""
    return (7 * year + 1) % 19 < 7


def months_in_year(year: int) -> int:
    """12 in a common year, 13 in a leap year."""
    return 13 if is_leap(year) else 12


@lru_cache(maxsize=4096)
def elapsed_days(year: int) -> int:
    """Days from the epoch to 1 Tishrei of a year, after the postponements."""
    months = (235 * year - 234) // 19
    parts = 12084 + 13753 * months
    day = 29 * months + parts // 25920
    # Postponement: the new year may not start on Sunday, Wednesday or Friday.
    if (3 * (day + 1)) % 7 < 3:
        day += 1
    return day


@lru_cache(maxsize=4096)
def year_delay(year: int) -> int:
    """Extra days that keep year lengths within the allowed set."""
    before, current, after = elapsed_days(year - 1), elapsed_days(year), elapsed_days(year + 1)
    if after - current == 356:
        return 2
    if current - before == 382:
        return 1
    return 0


def new_year_ordinal(year: int) -> int:
    """Ordinal of 1 Tishrei of a Hebrew year."""
    return EPOCH + elapsed_days(year) + year_delay(year)


def days_in_year(year: int) -> int:
    """353-355 in a common year, 383-385 in a leap year."""
    return new_year_ordinal(year + 1) - new_year_ordinal(year)


def long_heshvan(year: int) -> bool:
    """Heshvan has 30 days in a complete year."""
    return days_in_year(year) % 10 == 5


def short_kislev(year: int) -> bool:
    """Kislev has 29 days in a deficient year."""
    return days_in_year(year) % 10 == 3


def days_in_month(year: int, month: int) -> int:
    """Length of a Hebrew month."""
    if not 1 <= month <= months_in_year(year):
        raise HebrewDateError(f"year {year} has no month {month}")
    if month in (2, 4, 6, 10, ADAR_II):
        return 29
    if month == ADAR:
        return 30 if is_leap(year) else 29
    if month == HESHVAN:
        return 30 if long_heshvan(year) else 29
    if month == KISLEV:
        return 29 if short_kislev(year) else 30
    return 30


def to_ordinal(year: int, month: int, day: int) -> int:
    """Gregorian ordinal of a Hebrew date."""
    if year < 1:
        raise HebrewDateError("Hebrew years start at 1")
    if not 1 <= day <= days_in_month(year, month):
        raise HebrewDateError(f"month {month} of {year} has no day {day}")
    ordinal = new_year_ordinal(year) + day - 1
    if month < TISHREI:
        for m in range(TISHREI, months_in_year(year) + 1):
            ordinal += days_in_month(year, m)
        for m in range(NISAN, month):
            ordinal += days_in_month(year, m)
    else:
        for m in range(TISHREI, month):
            ordinal += days_in_month(year, m)
    return ordinal


def to_gregorian(year: int, month: int, day: int) -> date:
    """Gregorian date of a Hebrew date (the daytime, after the evening it begins)."""
    return date.fromordinal(to_ordinal(year, month, day))


def from_gregorian(when: date) -> tuple[int, int, int]:
    """Hebrew (year, month, day) of a Gregorian date."""
    ordinal = when.toordinal()
    year = (when.year + 3760) + 1
    while new_year_ordinal(year) > ordinal:
        year -= 1
    start = NISAN if ordinal >= to_ordinal(year, NISAN, 1) else TISHREI
    month = start
    while ordinal > to_ordinal(year, month, days_in_month(year, month)):
        month = month + 1 if month < months_in_year(year) else 1
    return (year, month, ordinal - to_ordinal(year, month, 1) + 1)


def hebrew_year_for_hanukkah(gregorian_year: int) -> int:
    """The Hebrew year whose Kislev falls in the given Gregorian year's late autumn."""
    return gregorian_year + 3761


def hanukkah_start(gregorian_year: int) -> date:
    """First full day of Hanukkah (25 Kislev) in a Gregorian year.

    The first candle is lit on the evening before this date.
    """
    return to_gregorian(hebrew_year_for_hanukkah(gregorian_year), KISLEV, HANUKKAH_DAY)
