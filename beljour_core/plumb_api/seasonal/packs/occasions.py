"""The fourteen frozen occasion ids and their plain English defaults.

Ids are lower snake case and shared with the event cards. Greetings are
editable defaults only; they make no claim about the meaning of a day.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class DateRule(StrEnum):
    """How the calendar finds the date of an occasion."""

    FIXED = "fixed"
    COMPUTED = "computed"
    TABLE = "table"


@dataclass(frozen=True)
class OccasionInfo:
    """Display name, default greeting and dating rule of one occasion."""

    id: str
    name: str
    greeting: str
    rule: DateRule
    days: int


OCCASION_IDS: tuple[str, ...] = (
    "halloween",
    "christmas",
    "thanksgiving",
    "new_year",
    "easter",
    "kwanzaa",
    "hanukkah",
    "eid_al_fitr",
    "eid_al_adha",
    "diwali",
    "holi",
    "vaisakhi",
    "gurpurab",
    "bandi_chhor_divas",
)

OCCASIONS: dict[str, OccasionInfo] = {
    "halloween": OccasionInfo("halloween", "Halloween", "Happy Halloween", DateRule.FIXED, 1),
    "christmas": OccasionInfo("christmas", "Christmas", "Merry Christmas", DateRule.FIXED, 1),
    "thanksgiving": OccasionInfo(
        "thanksgiving", "Thanksgiving", "Happy Thanksgiving", DateRule.COMPUTED, 1
    ),
    "new_year": OccasionInfo("new_year", "New Year", "Happy New Year", DateRule.FIXED, 1),
    "easter": OccasionInfo("easter", "Easter", "Happy Easter", DateRule.COMPUTED, 1),
    "kwanzaa": OccasionInfo("kwanzaa", "Kwanzaa", "Happy Kwanzaa", DateRule.FIXED, 7),
    "hanukkah": OccasionInfo("hanukkah", "Hanukkah", "Happy Hanukkah", DateRule.COMPUTED, 8),
    "eid_al_fitr": OccasionInfo("eid_al_fitr", "Eid al-Fitr", "Eid Mubarak", DateRule.TABLE, 1),
    "eid_al_adha": OccasionInfo("eid_al_adha", "Eid al-Adha", "Eid Mubarak", DateRule.TABLE, 1),
    "diwali": OccasionInfo("diwali", "Diwali", "Happy Diwali", DateRule.TABLE, 1),
    "holi": OccasionInfo("holi", "Holi", "Happy Holi", DateRule.TABLE, 1),
    "vaisakhi": OccasionInfo("vaisakhi", "Vaisakhi", "Happy Vaisakhi", DateRule.FIXED, 1),
    "gurpurab": OccasionInfo("gurpurab", "Gurpurab", "Happy Gurpurab", DateRule.TABLE, 1),
    "bandi_chhor_divas": OccasionInfo(
        "bandi_chhor_divas",
        "Bandi Chhor Divas",
        "Happy Bandi Chhor Divas",
        DateRule.TABLE,
        1,
    ),
}


class UnknownOccasionError(KeyError):
    """Raised for an occasion id outside the frozen list."""

    def __str__(self) -> str:
        return f"unknown occasion id {self.args[0]!r}; expected one of {', '.join(OCCASION_IDS)}"


def require_occasion(occasion: str) -> OccasionInfo:
    """Return the info row for an occasion id or raise UnknownOccasionError."""
    info = OCCASIONS.get(occasion)
    if info is None:
        raise UnknownOccasionError(occasion)
    return info


def is_occasion(occasion: str) -> bool:
    """True when the id is one of the fourteen frozen occasion ids."""
    return occasion in OCCASIONS
