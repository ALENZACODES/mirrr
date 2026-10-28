"""SVG renderer for event cards.

Paints a Composition as one self-contained SVG document. The photo, when present, is embedded
as a data URI of the already stripped and fitted tile; nothing is fetched from outside.
Author: John Khan.
"""

from __future__ import annotations

from .compose import Composition
from .photo import mask_path
from .shapes import shapes_svg
from .text import FONT_FAMILY, text_width, xml_escape

ANCHORS = {"centre": "middle", "left": "start", "right": "end"}
WEIGHTS = {"headline": "700", "to": "400", "message": "400", "from": "400"}


def _num(value: float) -> str:
    text = f"{value:.2f}".rstrip("0").rstrip(".")
    return text or "0"


def render_svg(comp: Composition, photo_uri: str | None = None) -> str:
    """The complete SVG document for a composed card."""
    design = comp.design
    roles = comp.roles
    w, h = _num(design.width), _num(design.height)
    clip_id = f"photo-{design.seed:016x}-{int(design.width)}x{int(design.height)}"
    box = comp.photo_box
    path = mask_path(comp.photo_shape, box, comp.corner)
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" '
        f'height="{h}" data-occasion="{design.occasion}" data-look="{design.look}">',
        "<desc>BELJOUR event card. Author: John Khan.</desc>",
        f'<defs><clipPath id="{clip_id}"><path d="{path}"/></clipPath></defs>',
        f'<rect width="{w}" height="{h}" fill="{roles["background"]}"/>',
        f'<g data-layer="pattern">{shapes_svg(comp.background, roles)}</g>',
    ]
    if photo_uri is not None:
        parts.append(
            f'<g data-layer="photo"><image href="{photo_uri}" x="{_num(box.x)}" '
            f'y="{_num(box.y)}" width="{_num(box.w)}" height="{_num(box.h)}" '
            f'preserveAspectRatio="none" clip-path="url(#{clip_id})"/></g>')
    else:
        parts.append(f'<g data-layer="photo"><path d="{path}" fill="#808080"/></g>')
    parts.append(f'<g data-layer="frame">{shapes_svg(comp.frame, roles)}</g>')
    ornament_parts: list[str] = []
    for art in comp.ornaments:
        if art.svg is not None:
            ornament_parts.append(art.svg)
        else:
            ornament_parts.append(f'<g data-motif="{art.ornament.motif_id}">'
                                  f"{shapes_svg(art.shapes, roles)}</g>")
    parts.append(f'<g data-layer="ornaments">{"".join(ornament_parts)}</g>')
    if comp.plate:
        parts.append(f'<g data-layer="plate">{shapes_svg(comp.plate, roles)}</g>')
    if comp.text.lines:
        anchor = ANCHORS[design.layout.align]
        parts.append(f'<g data-layer="text" font-family="{FONT_FAMILY}" fill="{roles["ink"]}" '
                     f'text-anchor="{anchor}">')
        for line in comp.text.lines:
            # textLength pins each line to the width measured for layout, so the viewer's font
            # cannot push a line past its box or plate.
            length = text_width(line.text, line.size)
            parts.append(f'<text x="{_num(line.x)}" y="{_num(line.baseline)}" '
                         f'font-size="{line.size}" font-weight="{WEIGHTS[line.role]}" '
                         f'textLength="{_num(length)}" lengthAdjust="spacingAndGlyphs" '
                         f'data-role="{line.role}">{xml_escape(line.text)}</text>')
        parts.append("</g>")
    parts.append("</svg>")
    return "".join(parts)
