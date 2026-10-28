"""Editorial Shade Book audit of the 90 original hair swatches.

Authored catalogue values only. Author: John Khan.
"""
from __future__ import annotations

import dataclasses

import pytest

from plumb_api.engines.hair_palette import catalogue
from plumb_api.engines.hair_palette.book_audit import audit_book, folio_numbers


def test_catalogue_passes_the_audit_with_the_measured_values() -> None:
    audit = audit_book()
    assert audit.ok and audit.count == 90
    assert audit.duplicate_ids == () and audit.duplicate_names == ()
    assert 0 < audit.max_lab_error <= 0.0001 and audit.max_lch_error <= 0.0001
    assert round(audit.min_separation, 4) == 1.7262
    assert audit.closest_pair == ("golden-08-c", "golden-08-n")
    assert audit.folios_contiguous
    body = audit.public()
    assert body["format"] == "beljour-shade-book-audit/1" and "not physical dye" in body["note"]


def test_folios_follow_source_order() -> None:
    folios = folio_numbers()
    assert folios[0] == (1, catalogue()[0].id) and folios[-1] == (90, catalogue()[-1].id)


def test_duplicates_and_bad_folios_fail() -> None:
    rows = list(catalogue())
    copied = dataclasses.replace(rows[1], id=rows[0].id, name=rows[0].name)
    audit = audit_book([rows[0], copied, *rows[2:]])
    assert not audit.ok and audit.duplicate_ids == (rows[0].id,) and audit.duplicate_names == (rows[0].name,)
    skipped = [(n + (n > 10), i) for n, i in folio_numbers()]
    assert not audit_book(folios=skipped).folios_contiguous
    swapped = [(1, rows[1].id), (2, rows[0].id), *folio_numbers()[2:]]
    assert not audit_book(folios=swapped).ok


def test_reconstruction_error_and_close_colours_fail() -> None:
    rows = list(catalogue())
    drifted = dataclasses.replace(rows[0], lab=(rows[0].lab[0] + 0.01, rows[0].lab[1], rows[0].lab[2]))
    audit = audit_book([drifted, *rows[1:]])
    assert not audit.ok and audit.max_lab_error >= 0.0099
    near = dataclasses.replace(rows[1], lab=rows[0].lab, lch=rows[0].lch, rgb=rows[0].rgb)
    close = audit_book([rows[0], near, *rows[2:]])
    assert close.min_separation == 0.0 and not close.ok


def test_needs_two_swatches() -> None:
    with pytest.raises(ValueError):
        audit_book(catalogue()[:1])
    with pytest.raises(ValueError):
        audit_book([{"id": "x"}, {"id": "y"}])  # type: ignore[list-item]
