"""Catalogue tests: the picker JSON is complete, stable and parseable.

Author: John Khan.
"""

from __future__ import annotations

import json
from datetime import date

from plumb_api.seasonal.packs import PackRegistry, catalogue, catalogue_json, list_packs
from plumb_api.seasonal.packs.catalogue import CATALOGUE_VERSION, look_entry, pack_entry
from plumb_api.seasonal.packs.model import STRENGTH_MAX, STRENGTH_MIN


def test_catalogue_lists_every_pack_and_look() -> None:
    document = catalogue()
    assert document["version"] == CATALOGUE_VERSION
    packs = document["packs"]
    assert isinstance(packs, list)
    assert [p["occasion"] for p in packs if isinstance(p, dict)] == [
        pack.occasion for pack in list_packs()
    ]
    total = sum(len(pack.looks) for pack in list_packs())
    rows = []
    for entry in packs:
        assert isinstance(entry, dict)
        looks = entry["looks"]
        assert isinstance(looks, list)
        rows.extend(looks)
    assert len(rows) == total
    missing = document["missing_occasions"]
    assert isinstance(missing, list) and "diwali" in missing and len(missing) == 9
    assert "suggestions" not in document


def test_look_entry_fields() -> None:
    pack = list_packs()[0]
    witch = look_entry(pack.look("witch_hat"))
    assert witch["kind"] == "accessory"
    assert witch["needs_face"] is True
    strength = witch["strength"]
    assert isinstance(strength, dict)
    assert strength["min"] == STRENGTH_MIN and strength["max"] == STRENGTH_MAX
    assert strength["default"] == 5.0
    assert witch["animates"] is False and witch["loop_frames"] == 0
    grade = look_entry(pack.look("moonlit_grade"))
    assert grade["needs_face"] is False
    bats = look_entry(pack.look("floating_bats"))
    assert bats["animates"] is True and bats["loop_frames"] == 96


def test_pack_entry_palette_and_thumbnails() -> None:
    pack = list_packs()[1]
    plain = pack_entry(pack)
    assert "motif_svg" not in plain
    palette = plain["palette"]
    assert isinstance(palette, dict) and palette["primary"] == pack.palette.primary
    rich = pack_entry(pack, thumbnails=True)
    svgs = rich["motif_svg"]
    assert isinstance(svgs, dict)
    assert set(svgs) == set(pack.motifs)
    assert all(isinstance(svg, str) and svg.startswith("<g ") for svg in svgs.values())


def test_suggestions_included_with_a_date() -> None:
    document = catalogue(today=date(2026, 10, 25), window_days=10)
    assert document["today"] == "2026-10-25"
    assert document["region"] == "CA"
    rows = document["suggestions"]
    assert isinstance(rows, list) and rows
    first = rows[0]
    assert isinstance(first, dict)
    assert first["occasion"] == "halloween"
    assert first["has_pack"] is True
    assert first["start"] == "2026-10-31"


def test_json_is_stable_and_round_trips() -> None:
    text = catalogue_json(today=date(2026, 12, 1))
    assert text == catalogue_json(today=date(2026, 12, 1))
    parsed = json.loads(text)
    assert parsed["version"] == CATALOGUE_VERSION
    assert text.isascii()
    assert " " not in text.split('"packs"')[0]


def test_empty_registry_catalogue() -> None:
    document = catalogue(PackRegistry(), today=date(2026, 10, 25), window_days=7)
    assert document["packs"] == []
    rows = document["suggestions"]
    assert isinstance(rows, list)
    assert all(isinstance(r, dict) and r["has_pack"] is False for r in rows)


def test_unverified_table_dates_are_visible_to_the_ui() -> None:
    document = catalogue(today=date(2026, 10, 25), window_days=20)
    suggestions = document["suggestions"]
    assert isinstance(suggestions, list)
    rows = [r for r in suggestions if isinstance(r, dict)]
    diwali = [r for r in rows if r["occasion"] == "diwali"]
    assert diwali and diwali[0]["verified"] is False
