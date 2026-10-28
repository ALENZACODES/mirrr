"""Arithmetic Hebrew calendar tests against published dates.

Known dates: first day of Hanukkah (25 Kislev; the first candle is lit the
evening before), Rosh Hashanah (1 Tishrei) and the first day of Passover
(15 Nisan), as listed by hebcal.com (https://www.hebcal.com/holidays/) and
timeanddate.com. The values were not re-opened from the build sandbox (its
network policy refused those hosts); see the assumptions log.
Author: John Khan.
"""

from __future__ import annotations

from datetime import date

import pytest

from plumb_api.seasonal.packs.hebrew import (
    KISLEV,
    NISAN,
    TISHREI,
    HebrewDateError,
    days_in_month,
    days_in_year,
    from_gregorian,
    hanukkah_start,
    is_leap,
    months_in_year,
    to_gregorian,
)

HANUKKAH = {
    2020: date(2020, 12, 11),
    2021: date(2021, 11, 29),
    2022: date(2022, 12, 19),
    2023: date(2023, 12, 8),
    2024: date(2024, 12, 26),
    2025: date(2025, 12, 15),
    2026: date(2026, 12, 5),
    2027: date(2027, 12, 25),
    2028: date(2028, 12, 13),
    2029: date(2029, 12, 2),
    2030: date(2030, 12, 21),
}
ROSH_HASHANAH = {
    5784: date(2023, 9, 16),
    5785: date(2024, 10, 3),
    5786: date(2025, 9, 23),
    5787: date(2026, 9, 12),
}
PASSOVER = {
    5784: date(2024, 4, 23),
    5785: date(2025, 4, 13),
    5786: date(2026, 4, 2),
}


@pytest.mark.parametrize(("year", "expected"), sorted(HANUKKAH.items()))
def test_hanukkah_first_day(year: int, expected: date) -> None:
    assert hanukkah_start(year) == expected


@pytest.mark.parametrize(("year", "expected"), sorted(ROSH_HASHANAH.items()))
def test_rosh_hashanah(year: int, expected: date) -> None:
    assert to_gregorian(year, TISHREI, 1) == expected


@pytest.mark.parametrize(("year", "expected"), sorted(PASSOVER.items()))
def test_passover(year: int, expected: date) -> None:
    assert to_gregorian(year, NISAN, 15) == expected


def test_new_year_never_on_sunday_wednesday_or_friday() -> None:
    for year in range(5600, 6000):
        weekday = to_gregorian(year, TISHREI, 1).weekday()
        assert weekday not in (6, 2, 4)


def test_year_lengths_are_valid() -> None:
    for year in range(5600, 6000):
        length = days_in_year(year)
        if is_leap(year):
            assert length in (383, 384, 385)
        else:
            assert length in (353, 354, 355)
        months = sum(days_in_month(year, m) for m in range(1, months_in_year(year) + 1))
        assert months == length


def test_leap_years_follow_the_19_year_cycle() -> None:
    cycle = [year % 19 for year in range(5701, 5720) if is_leap(year)]
    assert sorted(cycle) == sorted([3, 6, 8, 11, 14, 17, 0])
    assert months_in_year(5784) == 13
    assert months_in_year(5785) == 12


def test_round_trip_every_day_of_three_years() -> None:
    start = to_gregorian(5785, TISHREI, 1).toordinal()
    end = to_gregorian(5788, TISHREI, 1).toordinal()
    for ordinal in range(start, end):
        when = date.fromordinal(ordinal)
        year, month, day = from_gregorian(when)
        assert to_gregorian(year, month, day) == when


def test_kislev_25_is_always_late_november_or_december() -> None:
    for year in range(1900, 2101):
        start = hanukkah_start(year)
        assert date(year, 11, 27) <= start <= date(year, 12, 27)
        assert from_gregorian(start)[1:] == (KISLEV, 25)


def test_bad_dates_are_rejected() -> None:
    with pytest.raises(HebrewDateError):
        to_gregorian(5785, 13, 1)
    with pytest.raises(HebrewDateError):
        to_gregorian(5785, NISAN, 31)
    with pytest.raises(HebrewDateError):
        to_gregorian(0, NISAN, 1)
    with pytest.raises(HebrewDateError):
        days_in_month(5785, 0)
