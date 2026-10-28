"""Greeting overlays: an editable line of text on a soft banner.

Text is drawn with Pillow's built-in default font (no downloaded fonts). The
default comes from the pack, for example "Happy Halloween", and the user can
replace it. Input is cleaned to printable characters and capped in length.
Author: John Khan.
"""

from __future__ import annotations

import unicodedata
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .model import Look, PackError, Palette
from .motifs import motif_shapes
from .raster import ImageArray, Layer, composite, with_alpha
from .shapes import stamp

MAX_GREETING = 60
POSITIONS = ("bottom", "top")
FontType = ImageFont.FreeTypeFont | ImageFont.ImageFont


def clean_greeting(text: str) -> str:
    """Strip control characters and extra spaces; reject empty or long text."""
    if not isinstance(text, str):
        raise PackError("greeting must be text")
    spaced = "".join(" " if ch.isspace() else ch for ch in text)
    kept = "".join(ch for ch in spaced if not unicodedata.category(ch).startswith("C"))
    cleaned = " ".join(kept.split())
    if not cleaned:
        raise PackError("greeting must not be empty")
    if len(cleaned) > MAX_GREETING:
        raise PackError(f"greeting must be at most {MAX_GREETING} characters")
    return cleaned


@lru_cache(maxsize=32)
def default_font(size: int) -> FontType:
    """Pillow's bundled default font at a pixel size."""
    try:
        return ImageFont.load_default(size=size)
    except (TypeError, OSError):
        return ImageFont.load_default()


def _fit_font(text: str, max_width: int, start: int) -> tuple[FontType, tuple[int, int, int, int]]:
    probe = ImageDraw.Draw(Image.new("L", (1, 1)))
    size = max(8, start)
    while True:
        font = default_font(size)
        left, top, right, bottom = probe.textbbox((0, 0), text, font=font)
        if right - left <= max_width or size <= 8:
            return font, (int(left), int(top), int(right), int(bottom))
        size = max(8, int(size * 0.88))


def render_greeting(
    image: ImageArray,
    look: Look,
    palette: Palette,
    occasion: str,
    text: str,
    amount: float,
    seed: int,
) -> ImageArray:
    """Place a greeting banner at the top or bottom of the picture."""
    greeting = clean_greeting(text)
    position = look.param_str("position", "bottom")
    if position not in POSITIONS:
        raise PackError(f"look {look.id}: position must be top or bottom")
    height, width = image.shape[:2]
    start = int(min(width, height) * max(0.04, min(0.14, look.param_float("text_size", 0.08))))
    font, (left, top, right, bottom) = _fit_font(greeting, int(width * 0.8), start)
    text_w, text_h = right - left, bottom - top
    pad = max(4, text_h // 2)
    banner_h = text_h + pad * 2
    motifs = look.param_names("motifs", look.motifs)
    with_motifs = bool(motifs) and banner_h > 12
    side = banner_h if with_motifs else pad * 2
    banner_w = text_w + side * 2
    bx0 = max(0, (width - banner_w) // 2)
    margin = int(height * 0.04)
    by0 = margin if position == "top" else max(0, height - banner_h - margin)
    bx1, by1 = min(width, bx0 + banner_w), min(height, by0 + banner_h)
    layer = Layer(bx0, by0, bx1, by1)
    band = with_alpha(palette.rgb(look.param_str("banner_colour", "dark")), 0.45 + 0.4 * amount)
    radius = banner_h / 2.0
    layer.ellipse(bx0 + radius, by0 + radius, radius, radius, band)
    layer.ellipse(bx1 - radius, by0 + radius, radius, radius, band)
    corners = [(bx0 + radius, by0), (bx1 - radius, by0), (bx1 - radius, by1), (bx0 + radius, by1)]
    layer.polygon(corners, band)
    if with_motifs:
        size = banner_h * 0.7
        left_motif = motif_shapes(occasion, motifs[0], seed)
        right_motif = motif_shapes(occasion, motifs[-1], seed + 1)
        stamp(layer, left_motif, bx0 + radius * 1.1, by0 + radius, size)
        stamp(layer, right_motif, bx1 - radius * 1.1, by0 + radius, size)
    out = composite(image, layer, opacity=1.0)
    return _draw_text(out, greeting, font, (bx0 + side - left, by0 + pad - top), palette, look)


def _draw_text(
    image: ImageArray,
    text: str,
    font: FontType,
    origin: tuple[int, int],
    palette: Palette,
    look: Look,
) -> ImageArray:
    canvas = Image.fromarray(image)
    draw = ImageDraw.Draw(canvas)
    colour = palette.rgb(look.param_str("text_colour", "light"))
    draw.text(origin, text, font=font, fill=colour)
    result: ImageArray = np.asarray(canvas, dtype=np.uint8).copy()
    return result
