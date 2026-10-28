"""A small scene type for card companions (envelope, gift tag): shapes plus text runs.

Scenes are painted by the same primitive helpers as cards, to SVG and to a Pillow image.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass

from PIL import Image, ImageDraw

from .colour import parse_hex
from .glyphs import draw_line
from .shapes import Shape, draw_shapes, shapes_svg
from .text import FONT_FAMILY, font, xml_escape

SVG_ANCHOR = {"ms": "middle", "ls": "start", "rs": "end"}


@dataclass(frozen=True)
class TextRun:
    """One line of text at an anchor point (Pillow anchor code: ms, ls or rs)."""

    text: str
    x: float
    baseline: float
    size: int
    anchor: str = "ms"
    bold: bool = False


@dataclass(frozen=True)
class Scene:
    """Width, height, palette roles, background colour, primitives and text runs."""

    kind: str
    width: float
    height: float
    roles: dict[str, str]
    shapes: tuple[Shape, ...]
    texts: tuple[TextRun, ...]


def _n(value: float) -> str:
    return f"{value:.2f}".rstrip("0").rstrip(".") or "0"


def scene_svg(scene: Scene) -> str:
    """The scene as one self-contained SVG document."""
    ink = scene.roles["ink"]
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {_n(scene.width)} '
        f'{_n(scene.height)}" width="{_n(scene.width)}" height="{_n(scene.height)}" '
        f'data-kind="{scene.kind}">',
        f"<desc>BELJOUR {scene.kind}. Author: John Khan.</desc>",
        f'<g data-layer="art">{shapes_svg(scene.shapes, scene.roles)}</g>',
        f'<g data-layer="text" font-family="{FONT_FAMILY}" fill="{ink}">',
    ]
    for run in scene.texts:
        weight = "700" if run.bold else "400"
        parts.append(f'<text x="{_n(run.x)}" y="{_n(run.baseline)}" font-size="{run.size}" '
                     f'font-weight="{weight}" text-anchor="{SVG_ANCHOR[run.anchor]}">'
                     f"{xml_escape(run.text)}</text>")
    parts.append("</g></svg>")
    return "".join(parts)


def scene_image(scene: Scene, width: int) -> Image.Image:
    """The scene as an RGBA image width pixels wide (transparent outside the art)."""
    scale = width / scene.width
    height = int(round(scene.height * scale))
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas, "RGBA")
    draw_shapes(draw, scene.shapes, scene.roles, scale)
    ink = parse_hex(scene.roles["ink"])
    for run in scene.texts:
        size = max(6, int(round(run.size * scale)))
        draw_line(draw, run.x * scale, run.baseline * scale, run.text, font(size), size,
                  ink + (255,), run.anchor)
    return canvas
