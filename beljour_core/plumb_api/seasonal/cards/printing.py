"""Print-safe export: CMYK-friendly colours, 300 dpi, bleed and crop marks.

print_safe_roles pulls every palette colour inside a conservative print gamut (CIELAB chroma
at most PRINT_MAX_CHROMA, lightness between PRINT_MIN_L and PRINT_MAX_L), then restores WCAG
AA text contrast by moving the ink. export_print_png renders the card at the trim size,
extends the edge pixels into the bleed and draws crop marks in a white slug.
Author: John Khan.
"""

from __future__ import annotations

import io
import math
from dataclasses import replace

import numpy as np
from PIL import Image, ImageDraw, PngImagePlugin

from .access import accessible
from .colour import (
    RGB,
    WCAG_AA_TEXT,
    best_ink,
    contrast_ratio,
    from_lab,
    mix,
    parse_hex,
    to_hex,
    to_lab,
)
from .compose import compose
from .export import APP, AUTHOR
from .grammar import CardDesign
from .render_raster import render_raster
from .service import Card

PRINT_MAX_CHROMA = 62.0
PRINT_MIN_L = 10.0
PRINT_MAX_L = 97.0
DPI = 300
TRIM_WIDTH_IN = 4.0
BLEED_IN = 0.125
SLUG_IN = 0.25
MARK_LEN_IN = 0.18


def print_safe_colour(rgb: RGB) -> RGB:
    """Clamp chroma and lightness in CIELAB, keeping the hue."""
    lightness, a, b = to_lab(rgb)
    chroma = math.hypot(a, b)
    if chroma > PRINT_MAX_CHROMA:
        a, b = a * PRINT_MAX_CHROMA / chroma, b * PRINT_MAX_CHROMA / chroma
    lightness = min(PRINT_MAX_L, max(PRINT_MIN_L, lightness))
    return from_lab((lightness, a, b))


def print_safe_roles(roles: dict[str, str]) -> dict[str, str]:
    """Palette roles moved into the print gamut, with AA contrast for the ink restored."""
    safe = {k: print_safe_colour(parse_hex(v)) for k, v in roles.items()}
    surface = safe["plate"]
    ink = safe["ink"]
    if contrast_ratio(ink, surface) < WCAG_AA_TEXT:
        target = best_ink(surface, dark=(28, 26, 30), light=(246, 244, 240))
        step = 0.0
        while contrast_ratio(ink, surface) < WCAG_AA_TEXT and step < 1.0:
            step = min(1.0, step + 0.1)
            ink = mix(safe["ink"], target, step)
        safe["ink"] = ink
    return {k: to_hex(v) for k, v in safe.items()}


def print_safe_design(design: CardDesign) -> CardDesign:
    """The same design with print-safe palette roles."""
    roles = print_safe_roles(design.palette.as_dict())
    ordered = tuple((name, roles[name]) for name, _ in design.palette.roles)
    return replace(design, palette=replace(design.palette, roles=ordered))


def _pixels(inches: float) -> int:
    return int(round(inches * DPI))


def print_image(card: Card) -> Image.Image:
    """Trim-size render plus edge-extended bleed and crop marks in a white slug."""
    design = print_safe_design(card.design)
    comp = accessible(compose(design, card.text, card.provider))
    # Trim width is fixed; the height follows the card format (5 inches for portrait).
    trim_w = _pixels(TRIM_WIDTH_IN)
    trim_h = _pixels(TRIM_WIDTH_IN * design.height / design.width)
    art = render_raster(comp, card.photo, trim_w, card.face, card.fit)
    if art.size != (trim_w, trim_h):
        art = art.resize((trim_w, trim_h), Image.Resampling.LANCZOS)
    bleed = _pixels(BLEED_IN)
    padded = np.pad(np.asarray(art), ((bleed, bleed), (bleed, bleed), (0, 0)), mode="edge")
    slug = _pixels(SLUG_IN)
    sheet = Image.new("RGB", (trim_w + 2 * (bleed + slug), trim_h + 2 * (bleed + slug)),
                      (255, 255, 255))
    sheet.paste(Image.fromarray(padded), (slug, slug))
    draw = ImageDraw.Draw(sheet)
    mark = _pixels(MARK_LEN_IN)
    left, top = slug + bleed, slug + bleed
    right, bottom = left + trim_w, top + trim_h
    for x in (left, right):
        draw.line((x, 0, x, mark), fill=(0, 0, 0), width=2)
        draw.line((x, sheet.height - mark, x, sheet.height), fill=(0, 0, 0), width=2)
    for y in (top, bottom):
        draw.line((0, y, mark, y), fill=(0, 0, 0), width=2)
        draw.line((sheet.width - mark, y, sheet.width, y), fill=(0, 0, 0), width=2)
    return sheet


def trim_box(sheet_size: tuple[int, int]) -> tuple[int, int, int, int]:
    """Pixel box of the trimmed card inside a print sheet."""
    offset = _pixels(SLUG_IN) + _pixels(BLEED_IN)
    return (offset, offset, sheet_size[0] - offset, sheet_size[1] - offset)


def export_print_png(card: Card) -> bytes:
    """Print sheet at 300 dpi (4 x 5 inch for portrait) with 1/8 inch bleed and crop marks."""
    sheet = print_image(card)
    info = PngImagePlugin.PngInfo()
    info.add_text("Author", AUTHOR)
    info.add_text("Software", APP)
    buffer = io.BytesIO()
    sheet.save(buffer, format="PNG", pnginfo=info, dpi=(DPI, DPI))
    return buffer.getvalue()
