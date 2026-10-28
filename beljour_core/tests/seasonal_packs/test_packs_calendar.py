"""Calendar tests: every dating rule, table loading, missing years, suggestions.

Known dates are public calendar facts (Easter tables, national holiday rules).
Author: John Khan.
"""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from plumb_api.seasonal.packs import (
    OCCASION_IDS,
    PackRegistry,
    get_pack,
    next_occurrence,
    occurrences_between,
    suggest,
)
from plumb_api.seasonal.packs.calendar import (
    DEFAULT_REGION,
    CalendarError,
    gregorian_easter,
    julian_to_gregorian,
    nth_weekday,
    occurrence_in_year,
    orthodox_easter,
    thanksgiving_day,
)
from plumb_api.seasonal.packs.lunar_table import (
    TABLE,
    TABLE_CSV,
    TABLE_YEARS,
    UNVERIFIED,
    TableError,
    load_table,
    table_row,
    table_years,
)
from plumb_api.seasonal.packs.occasions import OCCASIONS, DateRule

WESTERN_EASTER = {
    1818: date(1818, 3, 22),
    1943: date(1943, 4, 25),
    2000: date(2000, 4, 23),
    2008: date(2008, 3, 23),
    2011: date(2011, 4, 24),
    2019: date(2019, 4, 21),
    2024: date(2024, 3, 31),
    2025: date(2025, 4, 20),
    2026: date(2026, 4, 5),
    2027: date(2027, 3, 28),
    2038: date(2038, 4, 25),
    2285: date(2285, 3, 22),
}
ORTHODOX_EASTER = {
    2010: date(2010, 4, 4),
    2021: date(2021, 5, 2),
    2023: date(2023, 4, 16),
    2024: date(2024, 5, 5),
    2025: date(2025, 4, 20),
    2026: date(2026, 4, 12),
    2027: date(2027, 5, 2),
}


@pytest.mark.parametrize(("year", "expected"), sorted(WESTERN_EASTER.items()))
def test_gregorian_computus(year: int, expected: date) -> None:
    assert gregorian_easter(year) == expected
    assert expected.weekday() == 6


@pytest.mark.parametrize(("year", "expected"), sorted(ORTHODOX_EASTER.items()))
def test_julian_computus(year: int, expected: date) -> None:
    assert orthodox_easter(year) == expected
    assert expected.weekday() == 6


def test_easter_stays_in_its_window() -> None:
    # The Julian offset is 13 days for 1900-2099; the window is for that span.
    for year in range(1900, 2100):
        assert date(year, 3, 22) <= gregorian_easter(year) <= date(year, 4, 25)
        assert date(year, 4, 4) <= orthodox_easter(year) <= date(year, 5, 8)


def test_julian_to_gregorian_offsets() -> None:
    assert julian_to_gregorian(2026, 12, 25) == date(2027, 1, 7)
    assert julian_to_gregorian(1900, 3, 1) == date(1900, 3, 14)
    assert julian_to_gregorian(1582, 10, 5) == date(1582, 10, 15)


@pytest.mark.parametrize(
    ("year", "canada", "united_states"),
    [
        (2023, date(2023, 10, 9), date(2023, 11, 23)),
        (2024, date(2024, 10, 14), date(2024, 11, 28)),
        (2025, date(2025, 10, 13), date(2025, 11, 27)),
        (2026, date(2026, 10, 12), date(2026, 11, 26)),
        (2027, date(2027, 10, 11), date(2027, 11, 25)),
    ],
)
def test_thanksgiving_rules(year: int, canada: date, united_states: date) -> None:
    assert thanksgiving_day(year, "CA") == canada
    assert thanksgiving_day(year, "US") == united_states
    assert canada.weekday() == 0 and united_states.weekday() == 3


def test_thanksgiving_needs_a_supported_region() -> None:
    with pytest.raises(CalendarError):
        thanksgiving_day(2026, "UK")
    with pytest.raises(CalendarError, match="CA, US"):
        next_occurrence("thanksgiving", date(2026, 1, 1), "UK")
    assert occurrence_in_year("thanksgiving", 2026, "GLOBAL") is None


def test_default_region_is_canada() -> None:
    assert DEFAULT_REGION == "CA"
    found = next_occurrence("thanksgiving", date(2026, 9, 1))
    assert found.start == date(2026, 10, 12)


def test_nth_weekday() -> None:
    assert nth_weekday(2026, 10, 0, 1) == date(2026, 10, 5)
    assert nth_weekday(2026, 2, 6, 4) == date(2026, 2, 22)


@pytest.mark.parametrize(
    ("occasion", "start", "end"),
    [
        ("halloween", date(2026, 10, 31), date(2026, 10, 31)),
        ("christmas", date(2026, 12, 25), date(2026, 12, 25)),
        ("new_year", date(2027, 1, 1), date(2027, 1, 1)),
        ("kwanzaa", date(2026, 12, 26), date(2027, 1, 1)),
        ("vaisakhi", date(2027, 4, 14), date(2027, 4, 14)),
        ("easter", date(2027, 3, 28), date(2027, 3, 28)),
        ("hanukkah", date(2026, 12, 5), date(2026, 12, 12)),
    ],
)
def test_rule_dates_from_late_october_2026(occasion: str, start: date, end: date) -> None:
    found = next_occurrence(occasion, date(2026, 10, 25))
    assert (found.start, found.end) == (start, end)
    assert found.verified and found.source == "rule"


def test_occurrence_on_the_day_counts() -> None:
    found = next_occurrence("halloween", date(2026, 10, 31))
    assert found.start == date(2026, 10, 31)
    after = next_occurrence("halloween", date(2026, 11, 1))
    assert after.start == date(2027, 10, 31)


def test_ongoing_kwanzaa_is_returned_across_the_new_year() -> None:
    found = next_occurrence("kwanzaa", date(2027, 1, 1))
    assert found.start == date(2026, 12, 26)
    assert found.contains(date(2027, 1, 1))
    later = next_occurrence("kwanzaa", date(2027, 1, 2))
    assert later.start == date(2027, 12, 26)


def test_ongoing_hanukkah_is_returned() -> None:
    found = next_occurrence("hanukkah", date(2026, 12, 9))
    assert found.start == date(2026, 12, 5)
    assert "evening before" in found.note


def test_regional_variants() -> None:
    assert next_occurrence("christmas", date(2026, 12, 26), variant="orthodox").start == date(
        2027, 1, 7
    )
    assert next_occurrence("new_year", date(2026, 10, 25), "UK", variant="eve").start == date(
        2026, 12, 31
    )
    assert next_occurrence("easter", date(2027, 4, 1), variant="orthodox").start == date(2027, 5, 2)
    with pytest.raises(CalendarError, match="no variant"):
        next_occurrence("halloween", date(2026, 1, 1), variant="eve")


def test_vaisakhi_note_mentions_april_13() -> None:
    found = next_occurrence("vaisakhi", date(2027, 1, 1))
    assert "Apr 13" in found.note


def test_unknown_region_is_rejected() -> None:
    with pytest.raises(CalendarError, match="region"):
        next_occurrence("halloween", date(2026, 1, 1), "MARS")
    with pytest.raises(CalendarError, match="region"):
        suggest(date(2026, 1, 1), "MARS")


def test_table_covers_2026_to_2030_for_every_table_occasion() -> None:
    table_occasions = [o for o, info in OCCASIONS.items() if info.rule is DateRule.TABLE]
    assert sorted(table_occasions) == sorted(
        ["eid_al_fitr", "eid_al_adha", "diwali", "holi", "gurpurab", "bandi_chhor_divas"]
    )
    for occasion in table_occasions:
        assert table_years(occasion) == tuple(TABLE_YEARS)


def test_table_rows_carry_source_url_and_checked_field() -> None:
    for row in TABLE.values():
        assert row.source
        assert row.url.startswith("https://")
        assert row.checked == UNVERIFIED or len(row.checked) == 10
        if row.checked == UNVERIFIED:
            assert not row.verified


def test_unverified_rows_are_flagged_on_the_occurrence() -> None:
    found = next_occurrence("diwali", date(2026, 10, 25))
    assert found.start == date(2026, 11, 8)
    assert found.rule == "table"
    assert not found.verified
    assert "unverified" in found.note
    assert "timeanddate.com" in found.source


def test_table_missing_year_raises_a_clear_error() -> None:
    with pytest.raises(CalendarError, match="covers 2026-2030"):
        next_occurrence("holi", date(2031, 6, 1))
    assert table_row("holi", 2031) is None
    assert occurrence_in_year("diwali", 2025) is None


def test_table_loader_rejects_bad_rows() -> None:
    header = "occasion,date,source,url,checked\n"
    good = "diwali,2026-11-08,src,https://example.org/a,UNVERIFIED\n"
    assert len(load_table(header + good)) == 1
    cases = {
        "unknown occasion": "summer,2026-11-08,src,https://example.org,UNVERIFIED\n",
        "dated by rule": "halloween,2026-10-31,src,https://example.org,UNVERIFIED\n",
        "bad date": "diwali,2026-13-08,src,https://example.org,UNVERIFIED\n",
        "source name": "diwali,2026-11-08, ,https://example.org,UNVERIFIED\n",
        "https": "diwali,2026-11-08,src,http://example.org,UNVERIFIED\n",
        "checked must": "diwali,2026-11-08,src,https://example.org,maybe\n",
        "expected 5": "diwali,2026-11-08,src\n",
    }
    for message, row in cases.items():
        with pytest.raises(TableError, match=message):
            load_table(header + row)
    with pytest.raises(TableError, match="second date"):
        load_table(header + good + good)
    with pytest.raises(TableError, match="columns"):
        load_table("occasion,date\n")


def test_table_accepts_a_checked_date() -> None:
    text = "occasion,date,source,url,checked\ndiwali,2026-11-08,src,https://e.org,2026-10-25\n"
    row = load_table(text)[("diwali", 2026)]
    assert row.verified


def test_embedded_table_parses_cleanly() -> None:
    assert load_table(TABLE_CSV) == TABLE
    assert len(TABLE) == 30


def test_every_occasion_has_a_date_in_2027() -> None:
    for occasion in OCCASION_IDS:
        found = next_occurrence(occasion, date(2027, 1, 1))
        assert date(2027, 1, 1) <= found.end <= date(2028, 1, 1)


def test_suggest_window_and_order() -> None:
    today = date(2026, 10, 25)
    found = suggest(today, window_days=45)
    occasions = [item.occasion for item in found]
    assert occasions[0] == "halloween"
    assert "christmas" not in occasions
    assert [item.days_until for item in found] == sorted(item.days_until for item in found)
    assert all(item.days_until <= 45 for item in found)
    assert found[0].has_pack
    assert found[0].days_until == 6


def test_suggest_zero_window_returns_only_today() -> None:
    assert [s.occasion for s in suggest(date(2026, 10, 31), window_days=0)] == ["halloween"]
    assert suggest(date(2026, 8, 1), window_days=0) == ()


def test_suggest_includes_ongoing_occasions() -> None:
    found = suggest(date(2026, 12, 30), window_days=3)
    kwanzaa = [item for item in found if item.occasion == "kwanzaa"]
    assert kwanzaa and kwanzaa[0].days_until == 0
    assert "new_year" in [item.occasion for item in found]


def test_suggest_respects_region_for_thanksgiving() -> None:
    canada = [s.occasion for s in suggest(date(2026, 10, 1), "CA", 30)]
    states = [s.occasion for s in suggest(date(2026, 11, 1), "US", 30)]
    britain = [s.occasion for s in suggest(date(2026, 10, 1), "UK", 60)]
    assert "thanksgiving" in canada
    assert "thanksgiving" in states
    assert "thanksgiving" not in britain


def test_suggest_marks_packs_from_a_given_registry() -> None:
    empty = PackRegistry()
    found = suggest(date(2026, 10, 25), window_days=10, registry=empty)
    assert found and not any(item.has_pack for item in found)
    assert get_pack("halloween").occasion == "halloween"


def test_suggest_variants() -> None:
    found = suggest(date(2026, 12, 28), window_days=5, variants={"new_year": "eve"})
    eve = [item for item in found if item.occasion == "new_year"]
    assert eve and eve[0].occurrence.start == date(2026, 12, 31)


def test_suggest_rejects_bad_windows() -> None:
    for window in (-1, 401):
        with pytest.raises(CalendarError):
            suggest(date(2026, 1, 1), window_days=window)
    with pytest.raises(CalendarError):
        suggest(date(2026, 1, 1), window_days=True)


def test_suggest_skips_years_past_the_table() -> None:
    found = suggest(date(2031, 2, 1), window_days=365)
    names = {item.occasion for item in found}
    assert "diwali" not in names
    assert "halloween" in names
    assert all(item.occurrence.start - date(2031, 2, 1) <= timedelta(days=365) for item in found)


def test_year_view_lists_every_dated_occasion_in_order() -> None:
    year = occurrences_between(date(2027, 1, 1), date(2027, 12, 31))
    names = [item.occasion for item in year]
    starts = [item.start for item in year]
    assert starts == sorted(starts)
    assert set(names) == set(OCCASION_IDS)
    # Kwanzaa 2026 runs into Jan 1 2027 and Kwanzaa 2027 starts in December.
    assert names.count("kwanzaa") == 2
    assert names[0] == "kwanzaa" and year[0].start == date(2026, 12, 26)


def test_year_view_respects_region_and_variants() -> None:
    us = occurrences_between(date(2026, 11, 1), date(2026, 11, 30), "US")
    assert [o.start for o in us if o.occasion == "thanksgiving"] == [date(2026, 11, 26)]
    uk = occurrences_between(date(2026, 1, 1), date(2026, 12, 31), "UK")
    assert "thanksgiving" not in {o.occasion for o in uk}
    eve = occurrences_between(date(2026, 12, 30), date(2027, 1, 2), variants={"new_year": "eve"})
    assert [o.start for o in eve if o.occasion == "new_year"] == [date(2026, 12, 31)]


def test_year_view_limits() -> None:
    with pytest.raises(CalendarError, match="before start"):
        occurrences_between(date(2027, 1, 2), date(2027, 1, 1))
    with pytest.raises(CalendarError, match="three years"):
        occurrences_between(date(2026, 1, 1), date(2030, 1, 1))
    assert occurrences_between(date(2026, 8, 1), date(2026, 8, 2)) == ()
