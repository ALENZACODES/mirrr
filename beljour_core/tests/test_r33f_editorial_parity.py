"""R33F Editorial Shade Book data: the committed parity file stays in sync with Python.

The browser model is checked against the same file in web/test/r33f-editorial-parity.test.mjs.
Pass definition: 90 folios in catalogue order with unique names, exact source Lab/LCh
labels, and integer glint/shadow colours; no product claim. Author: John Khan.
"""
from __future__ import annotations

import pytest

from plumb_api.engines.hair_palette import editorial
from plumb_api.engines.hair_palette.catalogue import catalogue


def test_parity_file_is_in_sync() -> None:
    assert editorial.parity_in_sync()


def test_ninety_folios_follow_catalogue_order_with_unique_names() -> None:
    rows = editorial.folios()
    assert [row.shade_id for row in rows] == [shade.id for shade in catalogue()]
    assert [row.number for row in rows] == list(range(1, 91))
    assert len({row.name for row in rows}) == 90
    assert rows[0].code == "No. 01" and rows[-1].code == "No. 90"


def test_labels_carry_the_exact_source_values() -> None:
    for row, shade in zip(editorial.folios(), catalogue(), strict=True):
        numbers = [float(part.split()[-1].rstrip("°")) for part in row.lab_label.split(" · ")]
        assert numbers == pytest.approx(list(shade.lab), abs=5e-5)
        assert row.lch_label.endswith("°")
    assert editorial.fixed4(-0.5062) == "-0.5062" and editorial.fixed4(3.076) == "3.0760"


def test_presentation_colours_are_integer_arithmetic() -> None:
    assert editorial.glint((0, 128, 255)) == (89, 172, 255)
    assert editorial.shadow((0, 128, 255)) == (0, 79, 158)
    row = editorial.folio(1)
    assert (row.rgb, row.glint, row.shadow) == ("#130f11", "#666364", "#0c090b")


def test_facets_search_and_pages() -> None:
    assert len(editorial.filter_folios(family="fashion")) == 15
    assert all(row.undertone == "cool" for row in editorial.filter_folios(undertone="cool"))
    assert [row.shade_id for row in editorial.filter_folios(query="ocean")] == ["fashion-ocean"]
    page = editorial.page(editorial.folios(), 8)
    assert (page["page"], page["pages"], len(page["folios"])) == (8, 8, 6)
    assert editorial.page(editorial.folios(), 99)["page"] == 8
    with pytest.raises(ValueError):
        editorial.filter_folios(family="neon")
    with pytest.raises(ValueError):
        editorial.folio(91)
