"""Pillow raster renderer for event cards.

Paints the same Composition as the SVG renderer at any output width. The photo is cropped and
resampled into its box and masked; its pixels are otherwise untouched.
Author: John Khan.
"""

from __future__ import annotations

from PIL import Image, ImageChops, ImageDraw

from .colour import parse_hex
from .compose import Composition
from .geometry import Box
from .glyphs import draw_line
from .photo import FaceBox, fit_photo, is_opaque, mask_image
from .shapes import draw_shapes
from .text import font

PIL_ANCHORS = {"centre": "ms", "left": "ls", "right": "rs"}
PLACEHOLDER_GREY = (128, 128, 128, 255)


def pixel_box(box: Box, scale: float) -> tuple[int, int, int, int]:
    """Integer pixel rectangle (x0, y0, x1, y1) of a design-unit box at a scale."""
    x0 = int(round(box.x * scale))
    y0 = int(round(box.y * scale))
    x1 = int(round(box.right * scale))
    y1 = int(round(box.bottom * scale))
    return (x0, y0, max(x0 + 1, x1), max(y0 + 1, y1))


def render_raster(comp: Composition, photo: Image.Image | None, width: int,
                  face: FaceBox | None = None, fit: str = "cover") -> Image.Image:
    """Render the card as an RGB image width pixels wide (height keeps the card aspect)."""
    design = comp.design
    scale = width / design.width
    height = int(round(design.height * scale))
    roles = comp.roles
    canvas = Image.new("RGB", (width, height), parse_hex(roles["background"]))
    draw = ImageDraw.Draw(canvas, "RGBA")
    draw_shapes(draw, comp.background, roles, scale)
    x0, y0, x1, y1 = pixel_box(comp.photo_box, scale)
    pw, ph = x1 - x0, y1 - y0
    mask = mask_image(comp.photo_shape, pw, ph, comp.corner)
    if photo is not None:
        tile = fit_photo(photo, pw, ph, fit, face)
        if not is_opaque(tile):
            mask = ImageChops.multiply(mask, tile.getchannel("A"))
        canvas.paste(tile.convert("RGB"), (x0, y0), mask)
    else:
        canvas.paste(Image.new("RGB", (pw, ph), PLACEHOLDER_GREY[:3]), (x0, y0), mask)
    draw = ImageDraw.Draw(canvas, "RGBA")
    draw_shapes(draw, comp.frame, roles, scale)
    for art in comp.ornaments:
        draw_shapes(draw, art.shapes, roles, scale)
    draw_shapes(draw, comp.plate, roles, scale)
    if comp.text.lines:
        ink = parse_hex(roles["ink"])
        anchor = PIL_ANCHORS[design.layout.align]
        for line in comp.text.lines:
            size = max(6, int(round(line.size * scale)))
            # The built-in font has one weight; a thin same-colour stroke stands in for bold
            # so the headline matches the SVG's font-weight 700.
            bold = max(1, round(size * 0.025)) if line.role == "headline" else 0
            draw_line(draw, line.x * scale, line.baseline * scale, line.text, font(size), size,
                      ink, anchor, bold)
    return canvas

