"""Preview sheet tests and drawn-fixture sanity checks.

Author: John Khan.
"""

from __future__ import annotations

import xml.etree.ElementTree as ElementTree

import numpy as np
import pytest

from plumb_api.seasonal.packs import PackError, get_pack
from plumb_api.seasonal.packs.preview import (
    GAP,
    LABEL_HEIGHT,
    all_sheets,
    contact_sheet,
    motif_gallery_svg,
    pack_sheet,
    preview_tiles,
)
from plumb_api.seasonal.packs.synthetic import SKIN_TONES, background, pair, single


def test_preview_has_original_plus_every_look() -> None:
    pack = get_pack("halloween")
    tiles = preview_tiles(pack, 128)
    assert [title for title, _ in tiles] == ["Original"] + [look.title for look in pack.looks]
    original = tiles[0][1]
    assert all(not np.array_equal(original, image) for _, image in tiles[1:])


def test_contact_sheet_layout() -> None:
    tile = np.zeros((100, 120, 3), np.uint8)
    sheet = contact_sheet([("a", tile)] * 5, columns=3)
    assert sheet.shape == (2 * (100 + LABEL_HEIGHT + GAP) + GAP, 3 * (120 + GAP) + GAP, 3)


def test_contact_sheet_errors() -> None:
    with pytest.raises(PackError, match="at least one"):
        contact_sheet([])
    with pytest.raises(PackError, match="same size"):
        contact_sheet(
            [("a", np.zeros((10, 10, 3), np.uint8)), ("b", np.zeros((9, 10, 3), np.uint8))]
        )
    with pytest.raises(PackError, match="96-1024"):
        preview_tiles(get_pack("easter"), 50)


def test_sheets_for_every_pack() -> None:
    sheets = all_sheets(96)
    assert set(sheets) == {"halloween", "christmas", "thanksgiving", "new_year", "easter"}
    for sheet in sheets.values():
        assert sheet.dtype == np.uint8 and sheet.ndim == 3
    single_sheet = pack_sheet(get_pack("new_year"), 96, columns=8)
    assert single_sheet.shape[1] == 8 * (96 + GAP) + GAP


def test_drawn_fixture_is_deterministic_and_has_a_face() -> None:
    first, target = single(200)
    again, _ = single(200)
    assert np.array_equal(first, again)
    box = target.box
    face = first[int(box.y) : int(box.y + box.height), int(box.x) : int(box.x + box.width)]
    assert face.std() > 10


def test_skin_tones_span_a_wide_range() -> None:
    sums = [sum(int(tone[i : i + 2], 16) for i in (1, 3, 5)) for tone in SKIN_TONES]
    assert sums == sorted(sums, reverse=True)
    assert sums[0] - sums[-1] > 400


def test_pair_regions_do_not_overlap() -> None:
    image, left, right = pair()
    lx0, _, lx1, _ = left.region_bounds(image.shape[1], image.shape[0])
    rx0, _, rx1, _ = right.region_bounds(image.shape[1], image.shape[0])
    assert lx1 < rx0


def test_background_is_seeded() -> None:
    assert np.array_equal(background(64, 48, 3), background(64, 48, 3))
    assert not np.array_equal(background(64, 48, 3), background(64, 48, 4))


def test_motif_gallery_is_one_svg_document() -> None:
    svg = motif_gallery_svg(size=48)
    root = ElementTree.fromstring(svg)
    assert root.tag.endswith("svg")
    groups = [child for child in root if child.tag.endswith("g")]
    assert len(groups) == 25
    labels = [child.text for child in root if child.tag.endswith("text")]
    assert labels == ["halloween", "christmas", "thanksgiving", "new_year", "easter"]
    assert "href" not in svg and "<script" not in svg


def test_motif_gallery_for_chosen_occasions_and_limits() -> None:
    svg = motif_gallery_svg(["easter"], size=32)
    assert svg.count('data-occasion="easter"') == 5
    assert "halloween" not in svg
    with pytest.raises(PackError, match="16-512"):
        motif_gallery_svg(size=8)
