"""Animated card tests: loop length, still photo, moving ornaments, determinism.

Author: John Khan.
"""

from __future__ import annotations

import io

import numpy as np
import pytest
from PIL import Image, ImageSequence

from plumb_api.seasonal.cards import Card, make_card
from plumb_api.seasonal.cards.animate import MAX_FRAMES, export_animated, frames
from plumb_api.seasonal.cards.render_raster import pixel_box
from plumb_api.seasonal.cards.synthetic import synthetic_portrait


def _card(seed: int = 12) -> Card:
    return make_card("halloween", synthetic_portrait(300, 375, seed=4)[0], to="Mia",
                     sender="Dad", seed=seed)


def test_photo_is_identical_in_every_frame_and_ornaments_move() -> None:
    card = _card()
    images = frames(card, 6, 270)
    assert len(images) == 6
    x0, y0, x1, y1 = pixel_box(card.design.layout.photo_box.inset(4), 270 / 1080)
    first = np.asarray(images[0])
    for image in images[1:]:
        pixels = np.asarray(image)
        assert np.array_equal(pixels[y0:y1, x0:x1], first[y0:y1, x0:x1])
    assert any(not np.array_equal(np.asarray(im), first) for im in images[1:])


def test_frame_count_limits() -> None:
    with pytest.raises(ValueError):
        frames(_card(), 1)
    with pytest.raises(ValueError):
        frames(_card(), MAX_FRAMES + 1)
    with pytest.raises(ValueError):
        export_animated(_card(), fmt="WEBM")


@pytest.mark.parametrize("fmt", ["PNG", "GIF"])
def test_animation_file_loops_with_all_frames(fmt: str) -> None:
    data = export_animated(_card(), fmt=fmt, count=4, width=216)
    with Image.open(io.BytesIO(data)) as image:
        assert image.format == fmt
        assert getattr(image, "n_frames", 1) == 4
        assert image.info.get("loop") == 0
        sizes = {frame.size for frame in ImageSequence.Iterator(image)}
        assert sizes == {(216, 270)}
        if fmt == "PNG":
            assert image.info["Author"] == "John Khan"


def test_animation_is_deterministic() -> None:
    assert export_animated(_card(3), count=3, width=108) == \
        export_animated(_card(3), count=3, width=108)
