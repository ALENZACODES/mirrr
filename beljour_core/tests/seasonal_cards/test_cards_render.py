"""Renderer tests: SVG and raster place the photo and text in the same boxes.

Author: John Khan.
"""

from __future__ import annotations

import re
import xml.etree.ElementTree as ET

import numpy as np
import pytest
from PIL import Image

from plumb_api.seasonal.cards import OCCASION_IDS
from plumb_api.seasonal.cards.compose import compose
from plumb_api.seasonal.cards.geometry import Box
from plumb_api.seasonal.cards.grammar import design_from_seed
from plumb_api.seasonal.cards.occasions import LAYOUT_IDS
from plumb_api.seasonal.cards.photo import fit_photo
from plumb_api.seasonal.cards.render_raster import pixel_box, render_raster
from plumb_api.seasonal.cards.render_svg import render_svg
from plumb_api.seasonal.cards.text import CardText

NS = {"s": "http://www.w3.org/2000/svg"}
TEXT = CardText("Sam", "Alex", "Wishing you a bright night", "Happy Halloween")
MAGENTA = (255, 0, 255)


def _solid(colour: tuple[int, int, int], size: tuple[int, int] = (400, 500)) -> Image.Image:
    return Image.new("RGB", size, colour)


def _design_for_layout(layout_id: str, occasion: str = "halloween") -> int:
    for seed in range(5000):
        if design_from_seed(occasion, seed).layout.layout_id == layout_id:
            return seed
    raise AssertionError(layout_id)


def _photo_pixels(canvas: Image.Image) -> tuple[int, int, int, int]:
    arr = np.asarray(canvas).astype(int)
    hit = (np.abs(arr - np.array(MAGENTA)).sum(axis=2) < 6)
    ys, xs = np.nonzero(hit)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


@pytest.mark.parametrize("layout_id", LAYOUT_IDS)
def test_photo_box_matches_between_svg_and_raster(layout_id: str) -> None:
    design = design_from_seed("halloween", _design_for_layout(layout_id))
    comp = compose(design, TEXT)
    root = ET.fromstring(render_svg(comp, "data:image/png;base64,AAAA"))
    image = root.find(".//s:g[@data-layer='photo']/s:image", NS)
    assert image is not None
    svg_box = Box(float(image.get("x", "0")), float(image.get("y", "0")),
                  float(image.get("width", "0")), float(image.get("height", "0")))
    assert svg_box == comp.photo_box
    canvas = render_raster(comp, _solid(MAGENTA), 1080)
    x0, y0, x1, y1 = _photo_pixels(canvas)
    expected = pixel_box(comp.photo_box, 1.0)
    # Masks soften the edge; shapes with curved masks touch every side at least once.
    assert abs(x0 - expected[0]) <= 2 and abs(y0 - expected[1]) <= 2
    assert abs(x1 - expected[2]) <= 2 and abs(y1 - expected[3]) <= 2


def test_text_lines_match_between_svg_and_raster() -> None:
    design = design_from_seed("diwali", 21)
    comp = compose(design, TEXT)
    root = ET.fromstring(render_svg(comp))
    nodes = root.findall(".//s:g[@data-layer='text']/s:text", NS)
    assert [n.text for n in nodes] == [line.text for line in comp.text.lines]
    for node, line in zip(nodes, comp.text.lines, strict=True):
        assert float(node.get("x", "nan")) == pytest.approx(line.x, abs=0.01)
        assert float(node.get("y", "nan")) == pytest.approx(line.baseline, abs=0.01)
        assert int(node.get("font-size", "0")) == line.size
    plain = render_raster(compose(design, CardText("", "", "", " ")), None, 1080)
    full = render_raster(comp, None, 1080)
    diff = np.abs(np.asarray(full).astype(int) - np.asarray(plain).astype(int)).sum(axis=2)
    ys, xs = np.nonzero(diff > 30)
    bounds = comp.text.bounds.inset(-8)
    inside = ((xs >= bounds.x) & (xs <= bounds.right) & (ys >= bounds.y) & (ys <= bounds.bottom))
    assert inside.mean() > 0.97


def test_photo_pixels_are_not_altered_inside_a_rect_mask() -> None:
    for seed in range(3000):
        design = design_from_seed("christmas", seed)
        if design.layout.photo_shape == "rect" and design.frame.style == "none":
            break
    comp = compose(design, TEXT)
    x0, y0, x1, y1 = pixel_box(comp.photo_box, 1.0)
    rng = np.random.default_rng(1)
    noise = Image.fromarray(rng.integers(0, 256, (y1 - y0, x1 - x0, 3), dtype=np.uint8))
    canvas = render_raster(comp, noise, 1080)
    region = np.asarray(canvas)[y0:y1, x0:x1]
    expected = np.asarray(fit_photo(noise, x1 - x0, y1 - y0).convert("RGB"))
    assert np.array_equal(region, expected)


@pytest.mark.parametrize("width", [108, 540, 1080, 2160])
def test_raster_size_follows_width_and_keeps_aspect(width: int) -> None:
    comp = compose(design_from_seed("easter", 3), TEXT)
    canvas = render_raster(comp, _solid((10, 200, 10)), width)
    assert canvas.size == (width, round(width * 1350 / 1080))
    assert canvas.mode == "RGB"


@pytest.mark.parametrize("occasion_id", OCCASION_IDS)
def test_svg_is_well_formed_and_self_contained(occasion_id: str) -> None:
    svg = render_svg(compose(design_from_seed(occasion_id, 8), TEXT), "data:image/jpeg;base64,AA")
    root = ET.fromstring(svg)
    assert root.get("viewBox") == "0 0 1080 1350"
    assert "<script" not in svg
    hrefs = re.findall(r'href="([^"]*)"', svg)
    assert hrefs == ["data:image/jpeg;base64,AA"]
    assert "http://" not in svg.replace("http://www.w3.org/2000/svg", "")
    assert "@" not in re.sub(r"<text[^>]*>.*?</text>", "", svg)
    assert "Author: John Khan." in svg


def test_svg_without_photo_draws_the_grey_stand_in() -> None:
    svg = render_svg(compose(design_from_seed("holi", 2), TEXT))
    assert 'fill="#808080"' in svg
    assert "<image" not in svg


def test_plate_sits_under_the_text_when_required() -> None:
    for seed in range(400):
        design = design_from_seed("gurpurab", seed)
        if design.palette.plate:
            break
    else:
        raise AssertionError("gurpurab palettes should need a plate sometimes")
    comp = compose(design, TEXT)
    assert comp.plate_box is not None
    assert comp.plate_box.contains(comp.text.bounds)
    svg = render_svg(comp)
    assert svg.index('data-layer="plate"') < svg.index('data-layer="text"')
