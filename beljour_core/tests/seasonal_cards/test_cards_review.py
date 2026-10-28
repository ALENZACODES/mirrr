"""Regression tests for defects found in the independent code reviews.

Author: John Khan.
"""

from __future__ import annotations

import base64
import io
import sqlite3
from pathlib import Path

import numpy as np
import pytest
from PIL import Image, ImageCms

from plumb_api.seasonal.cards import DesignStore, DesignStoreError
from plumb_api.seasonal.cards.fingerprint import design_key
from plumb_api.seasonal.cards.glyphs import drawable_form, undrawable
from plumb_api.seasonal.cards.grammar import design_from_seed
from plumb_api.seasonal.cards.handlers import handle_another, handle_make
from plumb_api.seasonal.cards.photo import load_photo
from plumb_api.seasonal.cards.synthetic import encode_with_metadata, synthetic_portrait
from plumb_api.seasonal.cards.text import make_text, text_width

PHOTO = base64.b64encode(encode_with_metadata(synthetic_portrait(200, 250, seed=3)[0])).decode()


def test_joiners_and_bidi_marks_are_not_drawn_as_boxes() -> None:
    for mark in ("‌", "‍", "‎", "‏", "؜"):
        assert drawable_form(f"a{mark}b")[0] == "ab"
        assert text_width(f"a{mark}b", 40) == text_width("ab", 40)
    assert make_text("Anna‎", "", "", None, "Hi").to == "Anna‎"


def test_precomposed_letters_with_special_bases_are_drawable() -> None:
    for ch in ("ǿ", "ǽ", "Ǿ"):
        assert undrawable(ch) == []
        base, marks = drawable_form(ch)
        assert base in ("o", "ae", "O") and [m.kind for m in marks][-1] == "acute"


def test_duplicate_add_releases_the_write_lock(tmp_path: Path) -> None:
    path = tmp_path / "store.sqlite"
    with DesignStore(path) as a, DesignStore(path) as b:
        key = design_key(design_from_seed("easter", 1))
        assert a.add(key, "easter", "x", 1)
        assert not a.add(key, "easter", "x", 1)
        with b.exclusive():
            assert b.add(design_key(design_from_seed("easter", 2)), "easter", "x", 2)
        with a.exclusive():
            pass
        assert len(a) == 2


def test_batch_inside_exclusive_joins_it_and_rolls_back_together() -> None:
    store = DesignStore()
    with pytest.raises(RuntimeError):
        with store.exclusive():
            with store.batch():
                store.add(design_key(design_from_seed("holi", 1)), "holi", "x", 1)
            raise RuntimeError("boom")
    assert len(store) == 0
    with pytest.raises(RuntimeError):
        with store.batch():
            store.add(design_key(design_from_seed("holi", 2)), "holi", "x", 2)
            raise RuntimeError("boom")
    assert len(store) == 0


def test_busy_store_is_a_typed_error_and_a_handler_error(tmp_path: Path) -> None:
    path = tmp_path / "busy.sqlite"
    DesignStore(path).close()
    holder = sqlite3.connect(path, timeout=0.1)
    holder.execute("BEGIN IMMEDIATE")
    try:
        store = DesignStore(path)
        store._db.execute("PRAGMA busy_timeout = 100")
        with pytest.raises(DesignStoreError):
            with store.exclusive():
                pass
        response = handle_make({"occasion": "halloween", "photo_b64": PHOTO, "seed": 1}, store)
        assert response["ok"] is False
        assert response["error"]["code"] == "store_unavailable"
    finally:
        holder.rollback()
        holder.close()


@pytest.mark.parametrize("request_value", [None, [], "text", 5])
def test_non_object_requests_are_refused(request_value: object) -> None:
    for handler in (handle_make, handle_another):
        response = handler(request_value, DesignStore())  # type: ignore[arg-type]
        assert response["ok"] is False and response["error"]["code"] == "bad_option"


def test_state_with_infinite_generation_or_string_lock_is_refused() -> None:
    store = DesignStore()
    state = handle_make({"occasion": "diwali", "photo_b64": PHOTO, "seed": 3}, store)["state"]
    for change in ({"generation": float("inf")}, {"look_locked": "false"}):
        response = handle_another({"state": {**state, **change}, "photo_b64": PHOTO}, store)
        assert response["ok"] is False and response["error"]["code"] == "bad_option"


def test_colour_key_transparency_survives_an_icc_profile() -> None:
    srgb = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
    image = Image.new("RGB", (40, 40), (1, 2, 3))
    image.putpixel((0, 0), (200, 0, 0))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", transparency=(1, 2, 3), icc_profile=srgb)
    clean = load_photo(buffer.getvalue())
    assert clean.mode == "RGBA"
    assert np.asarray(clean)[5, 5, 3] == 0 and np.asarray(clean)[0, 0, 3] == 255


def test_sixteen_bit_grey_keeps_its_transparency_key() -> None:
    values = np.full((40, 40), 1000, dtype=np.uint16)
    values[0, 0] = 50000
    buffer = io.BytesIO()
    Image.fromarray(values).save(buffer, format="PNG", transparency=1000)
    clean = load_photo(buffer.getvalue())
    assert clean.mode == "RGBA"
    assert np.asarray(clean)[5, 5, 3] == 0 and np.asarray(clean)[0, 0, 3] == 255
