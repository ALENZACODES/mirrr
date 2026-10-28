"""Animated card: ornaments sway and breathe in a seamless loop; the photo never moves.

Each frame re-places every ornament with a small rotation and scale offset on a sine wave
(own phase per ornament), then renders the whole card. Pattern, frame, photo and text are
the same in every frame, so the chosen person's pixels stay identical across the loop.
Output is an animated PNG (lossless) or GIF (one shared 255-colour palette for the loop).
Author: John Khan.
"""

from __future__ import annotations

import io
import math
from dataclasses import replace

from PIL import Image, PngImagePlugin

from .compose import ornament_art
from .errors import CardOptionError
from .export import APP, AUTHOR
from .grammar import Ornament
from .provider import BuiltinMotifProvider, MotifProvider
from .render_raster import render_raster
from .service import Card, card_composition

SWAY_DEG = 7.0
BREATHE = 0.06
MIN_FRAMES = 2
MAX_FRAMES = 48
_BUILTIN = BuiltinMotifProvider()


def _moved(ornament: Ornament, index: int, t: float) -> Ornament:
    phase = 2 * math.pi * (t + index * 0.137)
    return replace(ornament, rotation=ornament.rotation + SWAY_DEG * math.sin(phase),
                   size=ornament.size * (1.0 + BREATHE * math.sin(phase + math.pi / 3)))


def frames(card: Card, count: int = 12, width: int = 540) -> list[Image.Image]:
    """count RGB frames of one loop at the given width."""
    if not MIN_FRAMES <= count <= MAX_FRAMES:
        raise CardOptionError(f"frame count must be {MIN_FRAMES}..{MAX_FRAMES}")
    comp = card_composition(card)
    provider: MotifProvider = card.provider if card.provider is not None else _BUILTIN
    out: list[Image.Image] = []
    for step in range(count):
        t = step / count
        arts = tuple(ornament_art(card.design, _moved(art.ornament, i, t), provider)
                     for i, art in enumerate(comp.ornaments))
        out.append(render_raster(replace(comp, ornaments=arts), card.photo, width, card.face,
                                 card.fit))
    return out


def export_animated(card: Card, fmt: str = "PNG", count: int = 12, width: int = 540,
                    duration_ms: int = 90) -> bytes:
    """Looping animation as APNG ("PNG") or GIF bytes."""
    if fmt not in ("PNG", "GIF"):
        raise CardOptionError("format must be PNG or GIF")
    images = frames(card, count, width)
    buffer = io.BytesIO()
    first, rest = images[0], images[1:]
    if fmt == "GIF":
        # One palette for the whole loop, no dithering: still pixels stay the same colour index
        # in every frame, so the photo does not flicker.
        shared = images[0].quantize(colors=255, method=Image.Quantize.MEDIANCUT)
        palette = [im.quantize(palette=shared, dither=Image.Dither.NONE) for im in images]
        palette[0].save(buffer, format="GIF", save_all=True, append_images=palette[1:],
                        duration=duration_ms, loop=0, disposal=1)
    else:
        info = PngImagePlugin.PngInfo()
        info.add_text("Author", AUTHOR)
        info.add_text("Software", APP)
        first.save(buffer, format="PNG", save_all=True, append_images=rest,
                   duration=duration_ms, loop=0, pnginfo=info)
    return buffer.getvalue()
