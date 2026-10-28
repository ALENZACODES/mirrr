"""Contact sheet of "make another" variants, for the demo screen and design review.

contact_sheet takes one card, asks the uniqueness engine for count - 1 more designs with
the same photo and text, and lays the thumbnails out in a grid on a neutral sheet.
Author: John Khan.
"""

from __future__ import annotations

import math

from PIL import Image

from .errors import CardOptionError
from .export import png_bytes
from .service import Card, make_another, render_card

SHEET_BACKGROUND = (238, 236, 232)
MAX_VARIANTS = 24


def variants(card: Card, count: int) -> list[Card]:
    """The card followed by count - 1 new unique designs (same photo and text)."""
    if not 1 <= count <= MAX_VARIANTS:
        raise CardOptionError(f"count must be 1..{MAX_VARIANTS}")
    out = [card]
    while len(out) < count:
        out.append(make_another(out[-1]))
    return out


def contact_sheet(card: Card, count: int = 6, columns: int = 3,
                  thumb_width: int = 360, gap: int = 24) -> tuple[Image.Image, list[Card]]:
    """Grid image of count variants and the cards it shows."""
    if columns < 1:
        raise CardOptionError("columns must be at least 1")
    cards = variants(card, count)
    thumb_height = int(round(thumb_width * card.design.height / card.design.width))
    rows = math.ceil(len(cards) / columns)
    width = columns * thumb_width + (columns + 1) * gap
    height = rows * thumb_height + (rows + 1) * gap
    sheet = Image.new("RGB", (width, height), SHEET_BACKGROUND)
    for index, variant in enumerate(cards):
        row, col = divmod(index, columns)
        thumb = render_card(variant, thumb_width)
        sheet.paste(thumb, (gap + col * (thumb_width + gap), gap + row * (thumb_height + gap)))
    return sheet, cards


def export_contact_sheet_png(card: Card, count: int = 6, columns: int = 3) -> bytes:
    """The contact sheet as PNG bytes (author and app metadata only)."""
    sheet, _ = contact_sheet(card, count, columns)
    return png_bytes(sheet)
