"""Editorial Shade Book presentation data for the 90 original in-house hair swatches.

Each swatch gets a stable folio number (its order in catalogue.json), an authored
display name, its exact source Lab and LCh values as labels, an undertone note, a
movement note and three presentation colours: the source RGB, a glint for the
shine band and a shadow for the strand illustration. Glint and shadow are integer
sRGB arithmetic (round half up), so the browser reproduces them exactly.

Folio numbers are presentation order, not a manufacturer's shade code. Movement
and shine are artistic illustration, not measured reflection or hair motion, and
the swatches are digital estimates, not physical dye products. Choosing a folio
applies no edit. Mirrored in web/src/commerce/editorial-shade-model.ts and checked
against parity/editorial-shade-book-r33f.json. Author: John Khan.
"""
from __future__ import annotations

import json
import sys
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from .catalogue import HairShade, catalogue

PAGE_SIZE = 12
PARITY = Path(__file__).resolve().parents[4] / "parity" / "editorial-shade-book-r33f.json"
FORMAT = "beljour-editorial-shade-book/1"
NOTE = ("Digital in-house swatches with artistic movement and shine; not physical dye products "
        "or measured hair motion. Choosing a folio applies no edit.")

LEVEL_WORDS = {1: "Ink", 2: "Espresso", 3: "Cocoa", 4: "Walnut", 5: "Chestnut",
               6: "Toffee", 7: "Honey", 8: "Wheat", 9: "Linen", 10: "Pearl"}
FAMILY_WORDS = {"natural": "Natural", "ash": "Ash", "golden": "Gilt", "copper": "Copper",
                "red": "Garnet", "violet": "Plum", "mahogany": "Mahogany", "fashion": "Prism",
                "grey": "Slate", "silver": "Silver", "white": "Frost"}
UNDERTONE_NOTES = {
    "warm": "Warm: reads golden to copper beside the skin.",
    "neutral": "Neutral: neither golden nor ashy on screen.",
    "cool": "Cool: reads ashy to blue-violet beside the skin.",
}
# (movement phrase, wave height in illustration pixels); artistic, not measured.
FAMILY_MOVEMENT = {
    "natural": ("a soft bend", 4), "ash": ("a cool, even fall", 3), "golden": ("a lifted wave", 6),
    "copper": ("a loose spiral", 7), "red": ("a swept wave", 6), "violet": ("a ribboned wave", 5),
    "mahogany": ("a deep S-wave", 5), "fashion": ("a ribboned curl", 8), "grey": ("a straight fall", 2),
    "silver": ("a glassy fall", 2), "white": ("an airy wisp", 3),
}
GLINT_SHARE = 35   # percent of the way from each channel to white
SHADOW_SHARE = 62  # percent of each channel kept


def _depth(level: int) -> str:
    return "Deep" if level <= 3 else "Mid" if level <= 6 else "Light"


def fixed4(value: float) -> str:
    """Exactly four decimals from the integer ten-thousandths, the same in the browser."""
    scaled = round(value * 10000)
    sign = "-" if scaled < 0 else ""
    whole, part = divmod(abs(scaled), 10000)
    return f"{sign}{whole}.{part:04d}"


def _hex(rgb: Sequence[int]) -> str:
    return "#" + "".join(f"{channel:02x}" for channel in rgb)


def glint(rgb: Sequence[int]) -> tuple[int, int, int]:
    r, g, b = (c + ((255 - c) * GLINT_SHARE + 50) // 100 for c in rgb)
    return r, g, b


def shadow(rgb: Sequence[int]) -> tuple[int, int, int]:
    r, g, b = ((c * SHADOW_SHARE + 50) // 100 for c in rgb)
    return r, g, b


def display_name(shade: HairShade) -> str:
    """Authored folio name; fashion swatches keep their own colour word."""
    if shade.family == "fashion":
        return f"{shade.name.split()[0]} {FAMILY_WORDS['fashion']}"
    name = f"{LEVEL_WORDS[shade.level]} {FAMILY_WORDS[shade.family]}"
    return f"{name}, {shade.undertone}" if shade.id[-2:] in ("-n", "-w", "-c") else name


@dataclass(frozen=True, slots=True)
class Folio:
    number: int
    code: str
    shade_id: str
    name: str
    source_name: str
    family: str
    undertone: str
    level: int
    lab_label: str
    lch_label: str
    undertone_note: str
    movement_note: str
    wave: int
    shine: int
    rgb: str
    glint: str
    shadow: str

    def public(self) -> dict[str, Any]:
        return {name: getattr(self, name) for name in self.__slots__}

    def search_text(self) -> str:
        return " ".join((self.code, self.name, self.source_name, self.shade_id, self.family,
                         self.undertone, self.movement_note)).lower()


def _folio(number: int, shade: HairShade) -> Folio:
    L, a, b = shade.lab
    lch_l, chroma, hue = shade.lch
    phrase, wave = FAMILY_MOVEMENT[shade.family]
    return Folio(
        number=number, code=f"No. {number:02d}", shade_id=shade.id, name=display_name(shade),
        source_name=shade.name, family=shade.family, undertone=shade.undertone, level=shade.level,
        lab_label=f"L* {fixed4(L)} · a* {fixed4(a)} · b* {fixed4(b)}",
        lch_label=f"L {fixed4(lch_l)} · C {fixed4(chroma)} · h {fixed4(hue)}°",
        undertone_note=UNDERTONE_NOTES[shade.undertone],
        movement_note=f"{_depth(shade.level)} {FAMILY_WORDS[shade.family].lower()}, level {shade.level}, "
                      f"drawn with {phrase}.",
        wave=wave, shine=30 + 4 * shade.level,
        rgb=_hex(shade.rgb), glint=_hex(glint(shade.rgb)), shadow=_hex(shadow(shade.rgb)),
    )


@lru_cache(maxsize=1)
def folios() -> tuple[Folio, ...]:
    """All folios in catalogue order, numbered from 1; names and shades are unique."""
    rows = tuple(_folio(index, shade) for index, shade in enumerate(catalogue(), 1))
    if len({row.name for row in rows}) != len(rows) or len({row.shade_id for row in rows}) != len(rows):
        raise ValueError("editorial folios need unique names and shades")
    return rows


def folio(number: int) -> Folio:
    if type(number) is not int or not 1 <= number <= len(folios()):
        raise ValueError("unknown folio number")
    return folios()[number - 1]


def filter_folios(rows: Iterable[Folio] | None = None, *, family: str | None = None,
                  undertone: str | None = None, query: str = "") -> tuple[Folio, ...]:
    """Family and undertone facets plus a case-insensitive text search, in folio order."""
    if family is not None and family not in FAMILY_WORDS:
        raise ValueError("unknown hair family")
    if undertone is not None and undertone not in UNDERTONE_NOTES:
        raise ValueError("unknown undertone")
    if not isinstance(query, str) or len(query) > 80:
        raise ValueError("search text must be at most 80 characters")
    needle = query.strip().lower()
    return tuple(row for row in (folios() if rows is None else rows)
                 if (family is None or row.family == family)
                 and (undertone is None or row.undertone == undertone)
                 and (not needle or needle in row.search_text()))


def page(rows: Sequence[Folio], number: int = 1) -> dict[str, Any]:
    """One page of at most PAGE_SIZE folios; the page number is clamped to the range."""
    pages = max(1, -(-len(rows) // PAGE_SIZE))
    current = min(max(1, number), pages)
    start = (current - 1) * PAGE_SIZE
    return {"page": current, "pages": pages, "total": len(rows),
            "folios": tuple(rows[start:start + PAGE_SIZE])}


def parity_payload() -> dict[str, Any]:
    return {"format": FORMAT, "author": "John Khan", "synthetic": True, "note": NOTE,
            "page_size": PAGE_SIZE, "folios": [row.public() for row in folios()]}


def write_parity(path: Path = PARITY) -> None:
    path.write_text(json.dumps(parity_payload(), indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


def parity_in_sync(path: Path = PARITY) -> bool:
    return bool(json.loads(path.read_text(encoding="utf-8")) == parity_payload())


if __name__ == "__main__":
    if "--check" in sys.argv[1:]:
        if not parity_in_sync():
            raise SystemExit("editorial shade book parity is stale; run without --check")
        print("Editorial shade book parity in sync")
    else:
        write_parity()
        print(f"Wrote {PARITY}")
