"""Cited date table for occasions that follow sighting or regional almanacs.

Eid al-Fitr and Eid al-Adha depend on moon sighting; Diwali, Holi, Gurpurab
and Bandi Chhor Divas follow lunisolar almanacs that can differ by region. No
rule gives one right answer, so dates come from a table with a source per row.

Every row has: occasion, date, source name, source URL and a checked field.
The checked field is a YYYY-MM-DD date when the source was opened and matched,
or UNVERIFIED when it could not be opened. The sandbox that built this table
could not reach the sources (the network policy refused the hosts), so every
row is UNVERIFIED and must be checked before launch (ASSUMED values, see the
assumptions log). Rows are plain CSV so they are easy to review and replace.
Author: John Khan.
"""

from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass
from datetime import date

from .occasions import DateRule, require_occasion

UNVERIFIED = "UNVERIFIED"
COLUMNS = ("occasion", "date", "source", "url", "checked")
TABLE_YEARS = range(2026, 2031)

_TAD = "timeanddate.com holiday listing"
_EIDF = "https://www.timeanddate.com/holidays/us/eid-al-fitr"
_EIDA = "https://www.timeanddate.com/holidays/us/eid-al-adha"
_DIWALI = "https://www.timeanddate.com/holidays/india/diwali"
_HOLI = "https://www.timeanddate.com/holidays/india/holi"
_GURPURAB = "https://www.timeanddate.com/holidays/india/guru-nanak-jayanti"
_BCD = "https://www.timeanddate.com/holidays/india/bandi-chhor-divas"

TABLE_CSV = f"""occasion,date,source,url,checked
eid_al_fitr,2026-03-20,{_TAD},{_EIDF},{UNVERIFIED}
eid_al_fitr,2027-03-09,{_TAD},{_EIDF},{UNVERIFIED}
eid_al_fitr,2028-02-26,{_TAD},{_EIDF},{UNVERIFIED}
eid_al_fitr,2029-02-14,{_TAD},{_EIDF},{UNVERIFIED}
eid_al_fitr,2030-02-04,{_TAD},{_EIDF},{UNVERIFIED}
eid_al_adha,2026-05-27,{_TAD},{_EIDA},{UNVERIFIED}
eid_al_adha,2027-05-16,{_TAD},{_EIDA},{UNVERIFIED}
eid_al_adha,2028-05-05,{_TAD},{_EIDA},{UNVERIFIED}
eid_al_adha,2029-04-24,{_TAD},{_EIDA},{UNVERIFIED}
eid_al_adha,2030-04-13,{_TAD},{_EIDA},{UNVERIFIED}
diwali,2026-11-08,{_TAD},{_DIWALI},{UNVERIFIED}
diwali,2027-10-29,{_TAD},{_DIWALI},{UNVERIFIED}
diwali,2028-10-17,{_TAD},{_DIWALI},{UNVERIFIED}
diwali,2029-11-05,{_TAD},{_DIWALI},{UNVERIFIED}
diwali,2030-10-26,{_TAD},{_DIWALI},{UNVERIFIED}
holi,2026-03-04,{_TAD},{_HOLI},{UNVERIFIED}
holi,2027-03-22,{_TAD},{_HOLI},{UNVERIFIED}
holi,2028-03-11,{_TAD},{_HOLI},{UNVERIFIED}
holi,2029-03-01,{_TAD},{_HOLI},{UNVERIFIED}
holi,2030-03-20,{_TAD},{_HOLI},{UNVERIFIED}
gurpurab,2026-11-24,{_TAD},{_GURPURAB},{UNVERIFIED}
gurpurab,2027-11-14,{_TAD},{_GURPURAB},{UNVERIFIED}
gurpurab,2028-11-02,{_TAD},{_GURPURAB},{UNVERIFIED}
gurpurab,2029-11-21,{_TAD},{_GURPURAB},{UNVERIFIED}
gurpurab,2030-11-10,{_TAD},{_GURPURAB},{UNVERIFIED}
bandi_chhor_divas,2026-11-08,{_TAD},{_BCD},{UNVERIFIED}
bandi_chhor_divas,2027-10-29,{_TAD},{_BCD},{UNVERIFIED}
bandi_chhor_divas,2028-10-17,{_TAD},{_BCD},{UNVERIFIED}
bandi_chhor_divas,2029-11-05,{_TAD},{_BCD},{UNVERIFIED}
bandi_chhor_divas,2030-10-26,{_TAD},{_BCD},{UNVERIFIED}
"""

CHECKED = re.compile(r"^(?:\d{4}-\d{2}-\d{2}|UNVERIFIED)$")


class TableError(ValueError):
    """The date table is malformed."""


@dataclass(frozen=True)
class TableRow:
    """One cited date."""

    occasion: str
    when: date
    source: str
    url: str
    checked: str

    @property
    def verified(self) -> bool:
        """True only when someone opened the source and recorded the day."""
        return self.checked != UNVERIFIED


def _parse_row(line: int, row: dict[str, str]) -> TableRow:
    try:
        info = require_occasion(row["occasion"])
    except KeyError as error:
        raise TableError(f"row {line}: unknown occasion {row.get('occasion')!r}") from error
    if info.rule is not DateRule.TABLE:
        raise TableError(f"row {line}: {info.id} is dated by rule, not by table")
    try:
        when = date.fromisoformat(row["date"])
    except ValueError as error:
        raise TableError(f"row {line}: bad date {row['date']!r}") from error
    if not row["source"].strip():
        raise TableError(f"row {line}: source name is required")
    if not row["url"].startswith("https://"):
        raise TableError(f"row {line}: source URL must be https")
    if not CHECKED.match(row["checked"]):
        raise TableError(f"row {line}: checked must be a date or {UNVERIFIED}")
    return TableRow(info.id, when, row["source"].strip(), row["url"], row["checked"])


def load_table(text: str = TABLE_CSV) -> dict[tuple[str, int], TableRow]:
    """Parse the CSV table keyed by (occasion, year); one row per occasion-year."""
    reader = csv.DictReader(io.StringIO(text))
    if tuple(reader.fieldnames or ()) != COLUMNS:
        raise TableError(f"table columns must be {', '.join(COLUMNS)}")
    rows: dict[tuple[str, int], TableRow] = {}
    for line, raw in enumerate(reader, start=2):
        if any(value is None for value in raw.values()) or None in raw:
            raise TableError(f"row {line}: expected {len(COLUMNS)} fields")
        row = _parse_row(line, {key: str(value).strip() for key, value in raw.items()})
        key = (row.occasion, row.when.year)
        if key in rows:
            raise TableError(f"row {line}: second date for {row.occasion} in {row.when.year}")
        rows[key] = row
    return rows


TABLE: dict[tuple[str, int], TableRow] = load_table()


def table_row(occasion: str, year: int) -> TableRow | None:
    """The cited row for an occasion and year, or None when the table has no row."""
    return TABLE.get((occasion, year))


def table_years(occasion: str) -> tuple[int, ...]:
    """Years the table covers for an occasion."""
    return tuple(sorted(year for (name, year) in TABLE if name == occasion))
