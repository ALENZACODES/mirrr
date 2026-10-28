"""Accessibility pass: measured text contrast with an automatic text plate fallback.

The palette arrangement already guarantees WCAG 2.2 AA (4.5:1) between the ink and the plain
card background. Patterns drawn behind the text can still lower it, so this pass renders the
card without text, reads the pixels behind every text line and compares them with the ink.
The 2nd percentile pixel (robust to anti-aliased edges) must reach 4.5:1; otherwise an opaque
plate in the plate colour is placed under the text block.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass, replace

import numpy as np
from numpy.typing import NDArray

from .colour import WCAG_AA_TEXT, parse_hex, relative_luminance
from .compose import PLATE_PAD, Composition, rounded_rect
from .geometry import Box
from .render_raster import pixel_box, render_raster
from .text import TextLayout, TextLine, text_width

MEASURE_WIDTH = 540
PERCENTILE = 2.0


@dataclass(frozen=True)
class LineContrast:
    """Measured contrast behind one text line."""

    text: str
    box: Box
    contrast: float


def line_box(line: TextLine, align: str) -> Box:
    """The box one laid-out line of text covers, in card units."""
    width = text_width(line.text, line.size)
    if align == "left":
        x = line.x
    elif align == "right":
        x = line.x - width
    else:
        x = line.x - width / 2
    return Box(x, line.top, width, line.height)


def _luminance(pixels: NDArray[np.uint8]) -> NDArray[np.float64]:
    c = pixels.astype(np.float64) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    lum: NDArray[np.float64] = lin[..., 0] * 0.2126 + lin[..., 1] * 0.7152 + lin[..., 2] * 0.0722
    return lum


def measure(comp: Composition, include_plate: bool = True,
            width: int = MEASURE_WIDTH) -> tuple[LineContrast, ...]:
    """Contrast between the ink and the pixels behind each text line."""
    if not comp.text.lines:
        return ()
    bare = replace(comp, text=TextLayout((), comp.text.bounds, comp.text.base_size),
                   plate=comp.plate if include_plate else (),
                   plate_box=comp.plate_box if include_plate else None)
    canvas = np.asarray(render_raster(bare, None, width))
    scale = width / comp.design.width
    ink = relative_luminance(parse_hex(comp.roles["ink"]))
    out: list[LineContrast] = []
    for line in comp.text.lines:
        box = line_box(line, comp.design.layout.align)
        x0, y0, x1, y1 = pixel_box(box, scale)
        region = canvas[max(0, y0):y1, max(0, x0):x1]
        if region.size == 0:
            continue
        lum = _luminance(region).ravel()
        hi = np.maximum(lum, ink)
        lo = np.minimum(lum, ink)
        ratios = (hi + 0.05) / (lo + 0.05)
        out.append(LineContrast(line.text, box, float(np.percentile(ratios, PERCENTILE))))
    return tuple(out)


def worst_contrast(comp: Composition, include_plate: bool = True) -> float:
    """Lowest measured line contrast (21.0 when there is no text)."""
    values = [m.contrast for m in measure(comp, include_plate)]
    return min(values) if values else 21.0


def with_plate(comp: Composition) -> Composition:
    """The same composition with an opaque plate under the text block."""
    if comp.plate or not comp.text.lines:
        return comp
    plate_box = comp.text.bounds.inset(-PLATE_PAD)
    return replace(comp, plate=(rounded_rect(plate_box, PLATE_PAD, "@plate"),),
                   plate_box=plate_box)


def accessible(comp: Composition) -> Composition:
    """Add a plate when the measured contrast behind the text is below AA."""
    if comp.plate or not comp.text.lines:
        return comp
    if worst_contrast(comp, include_plate=False) >= WCAG_AA_TEXT:
        return comp
    return with_plate(comp)
