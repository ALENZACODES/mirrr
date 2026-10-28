"""Download set tests: contents, determinism and privacy of the ZIP bundle.

Author: John Khan.
"""

from __future__ import annotations

import io
import json
import zipfile

from PIL import Image

from plumb_api.seasonal.cards import make_card
from plumb_api.seasonal.cards.bundle import BUNDLE_NAMES, FIXED_TIME, export_bundle_zip
from plumb_api.seasonal.cards.export import check_payload
from plumb_api.seasonal.cards.synthetic import encode_with_metadata, synthetic_portrait


def _photo() -> bytes:
    return encode_with_metadata(synthetic_portrait(300, 375, seed=6)[0])


def test_bundle_holds_every_file_in_order() -> None:
    card = make_card("halloween", _photo(), to="Mia", sender="Dad", seed=21)
    with zipfile.ZipFile(io.BytesIO(export_bundle_zip(card))) as archive:
        assert tuple(archive.namelist()) == BUNDLE_NAMES
        assert archive.testzip() is None
        for info in archive.infolist():
            assert info.date_time == FIXED_TIME
        payload = json.loads(archive.read("card.json"))
        assert payload["design"]["fingerprint"] == card.fingerprint
        assert check_payload(payload) == []
        with Image.open(io.BytesIO(archive.read("card.png"))) as image:
            assert image.size == (1080, 1350)
        with Image.open(io.BytesIO(archive.read("gift-tag.png"))) as tag:
            assert tag.mode == "RGBA"
        readme = archive.read("README.txt").decode()
        assert card.fingerprint in readme and "Author: John Khan" in readme
        assert archive.read("card.svg").startswith(b"<svg")


def test_bundle_is_deterministic_and_leaks_no_source_metadata() -> None:
    photo = _photo()
    a = export_bundle_zip(make_card("diwali", photo, to="Asha", seed=5))
    b = export_bundle_zip(make_card("diwali", photo, to="Asha", seed=5))
    assert a == b
    with zipfile.ZipFile(io.BytesIO(a)) as archive:
        for name in archive.namelist():
            assert b"metadata-that-must-not-survive" not in archive.read(name)
