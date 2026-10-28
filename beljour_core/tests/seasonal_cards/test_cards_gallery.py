"""Contact sheet and design store robustness tests.

Author: John Khan.
"""

from __future__ import annotations

import io
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from plumb_api.seasonal.cards import (
    CardError,
    DesignStore,
    DesignStoreError,
    make_card,
)
from plumb_api.seasonal.cards.fingerprint import design_key, perceptual_scope
from plumb_api.seasonal.cards.gallery import (
    MAX_VARIANTS,
    SHEET_BACKGROUND,
    contact_sheet,
    export_contact_sheet_png,
    variants,
)
from plumb_api.seasonal.cards.grammar import design_from_seed
from plumb_api.seasonal.cards.synthetic import synthetic_portrait
from plumb_api.seasonal.cards.uniqueness import UniquenessEngine


def test_variants_are_all_different_designs() -> None:
    card = make_card("halloween", synthetic_portrait(240, 300, seed=2)[0], seed=8)
    cards = variants(card, 7)
    assert len({c.fingerprint for c in cards}) == 7
    assert cards[0] is card
    with pytest.raises(ValueError):
        variants(card, 0)
    with pytest.raises(ValueError):
        variants(card, MAX_VARIANTS + 1)


def test_contact_sheet_grid_geometry() -> None:
    card = make_card("diwali", synthetic_portrait(240, 300, seed=3)[0], seed=4)
    sheet, cards = contact_sheet(card, count=5, columns=3, thumb_width=120, gap=10)
    assert len(cards) == 5
    assert sheet.size == (3 * 120 + 4 * 10, 2 * 150 + 3 * 10)
    pixels = np.asarray(sheet)
    assert tuple(pixels[5, 5]) == SHEET_BACKGROUND
    last_slot = pixels[10 + 150 + 10 + 75, 10 + 2 * 130 + 60]
    assert tuple(last_slot) == SHEET_BACKGROUND, "sixth slot stays empty"
    with pytest.raises(ValueError):
        contact_sheet(card, columns=0)


def test_contact_sheet_png_metadata() -> None:
    card = make_card("easter", synthetic_portrait(240, 300, seed=5)[0], seed=1)
    with Image.open(io.BytesIO(export_contact_sheet_png(card, count=2, columns=2))) as image:
        assert image.info == {"Author": "John Khan", "Software": "BELJOUR"}


def test_corrupt_store_file_raises_a_typed_error(tmp_path: Path) -> None:
    path = tmp_path / "broken.sqlite"
    path.write_bytes(b"this is not a database file at all" * 100)
    with pytest.raises(DesignStoreError):
        DesignStore(path)
    assert issubclass(DesignStoreError, CardError)


def test_two_handles_on_one_file_see_each_others_designs(tmp_path: Path) -> None:
    path = tmp_path / "shared.sqlite"
    with DesignStore(path) as first, DesignStore(path) as second:
        a = UniquenessEngine(first).reserve("holi", 5)
        assert a.phash is not None
        assert second.has_fingerprint(a.key.fingerprint)
        assert second.nearest_phash("holi", perceptual_scope(a.design), a.phash) == 0
        b = UniquenessEngine(second).reserve("holi", 5)
        assert b.key.fingerprint != a.key.fingerprint
        assert b.phash is not None
        assert first.nearest_phash("holi", perceptual_scope(b.design), b.phash) == 0


def test_insert_race_is_reported_not_raised() -> None:
    store = DesignStore()
    design = design_from_seed("kwanzaa", 3)
    key = design_key(design)
    assert store.add(key, "kwanzaa", design.look, 3)
    assert not store.add(key, "kwanzaa", design.look, 3)
    assert len(store) == 1
