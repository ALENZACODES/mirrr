"""Contact sheet of every look in a pack, drawn on a procedural portrait.

Used for the hand-off and for reviewing art changes. Each tile shows one look
at its default strength with its title underneath in the default font.
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from xml.sax.saxutils import escape

import numpy as np
from PIL import Image, ImageDraw

from .apply import apply_look
from .greeting import default_font
from .model import PackError, SeasonalPack
from .motifs import PackMotifProvider
from .raster import ImageArray
from .registry import list_packs
from .synthetic import single

LABEL_HEIGHT = 22
GAP = 6


def preview_tiles(
    pack: SeasonalPack, tile: int = 256, seed: int = 0
) -> list[tuple[str, ImageArray]]:
    """(title, image) for each look of a pack on the same drawn portrait."""
    if not 96 <= tile <= 1024:
        raise PackError("preview tile size must be 96-1024 pixels")
    base, target = single(tile)
    tiles: list[tuple[str, ImageArray]] = [("Original", base)]
    for look in pack.looks:
        tiles.append((look.title, apply_look(base, pack.occasion, look.id, target, seed=seed)))
    return tiles


def contact_sheet(tiles: Sequence[tuple[str, ImageArray]], columns: int = 4) -> ImageArray:
    """Lay tiles out in a grid with labels; all tiles must share one size."""
    if not tiles:
        raise PackError("contact sheet needs at least one tile")
    height, width = tiles[0][1].shape[:2]
    if any(image.shape[:2] != (height, width) for _, image in tiles):
        raise PackError("all tiles must be the same size")
    columns = max(1, min(columns, len(tiles)))
    rows = math.ceil(len(tiles) / columns)
    cell_w, cell_h = width + GAP, height + LABEL_HEIGHT + GAP
    sheet = Image.new("RGB", (columns * cell_w + GAP, rows * cell_h + GAP), (32, 32, 36))
    draw = ImageDraw.Draw(sheet)
    font = default_font(14)
    for index, (title, image) in enumerate(tiles):
        col, row = index % columns, index // columns
        x, y = GAP + col * cell_w, GAP + row * cell_h
        sheet.paste(Image.fromarray(image), (x, y))
        draw.text((x + 4, y + height + 3), title, font=font, fill=(235, 235, 235))
    result: ImageArray = np.asarray(sheet, dtype=np.uint8).copy()
    return result


def pack_sheet(pack: SeasonalPack, tile: int = 256, columns: int = 4) -> ImageArray:
    """Contact sheet for one pack."""
    return contact_sheet(preview_tiles(pack, tile), columns)


def all_sheets(tile: int = 192) -> dict[str, ImageArray]:
    """One contact sheet per registered pack, keyed by occasion id."""
    return {pack.occasion: pack_sheet(pack, tile) for pack in list_packs()}


def motif_gallery_svg(occasions: Sequence[str] | None = None, size: float = 72.0) -> str:
    """One SVG document with every motif of the given occasions, one row each.

    Labels use a generic font-family list, never a downloaded font. Used for
    reviewing art with the cards session.
    """
    provider = PackMotifProvider()
    chosen = list(occasions) if occasions is not None else [p.occasion for p in list_packs()]
    if not 16.0 <= size <= 512.0:
        raise PackError("gallery motif size must be 16-512")
    label_w = 120.0
    rows: list[str] = []
    widest = 0
    for row, occasion in enumerate(chosen):
        ids = provider.motif_ids(occasion)
        widest = max(widest, len(ids))
        y = row * (size + 8.0) + 4.0
        rows.append(
            f'<text x="4" y="{y + size / 2:.1f}" font-family="Helvetica, Arial, sans-serif" '
            f'font-size="12" fill="#333333">{escape(occasion)}</text>'
        )
        for column, motif in enumerate(ids):
            x = label_w + column * (size + 8.0)
            group = provider.motif_svg(occasion, motif, size, 0)
            rows.append(f'<g transform="translate({x:.1f} {y:.1f})">{group}</g>')
    width = label_w + widest * (size + 8.0)
    height = len(chosen) * (size + 8.0) + 8.0
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width:.0f}" height="{height:.0f}" '
        f'viewBox="0 0 {width:.0f} {height:.0f}">' + "".join(rows) + "</svg>"
    )
