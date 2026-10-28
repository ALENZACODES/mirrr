"""Colour-vision safety report for card palettes.

Every look is checked under typical vision and simulated protanopia, deuteranopia and
tritanopia (Machado, Oliveira and Fernandes 2009, severity 1.0; see colour.py). For a sample
of palette arrangements the report keeps the worst text contrast (ink against the surface
behind the text) and the worst ornament visibility (CIE76 Delta E of the clearer of accent and
ornament against the background). Text must stay at WCAG AA 4.5:1 and ornaments at Delta E 12
or more under every vision type.
Author: John Khan.
"""

from __future__ import annotations

import random
from dataclasses import dataclass

from .colour import (
    MACHADO_2009,
    RGB,
    WCAG_AA_TEXT,
    contrast_ratio,
    delta_e,
    parse_hex,
    simulate_cvd,
)
from .grammar import arrange_palette
from .occasions import OCCASIONS, Look

VISIONS: tuple[str, ...] = ("typical",) + tuple(MACHADO_2009)
MIN_ORNAMENT_DELTA_E = 12.0
SAMPLE_ARRANGEMENTS = 24


@dataclass(frozen=True)
class LookVision:
    """Worst-case numbers for one look across its sampled palette arrangements."""

    occasion: str
    look: str
    text_contrast: dict[str, float]
    ornament_delta_e: dict[str, float]

    @property
    def text_ok(self) -> bool:
        return min(self.text_contrast.values()) >= WCAG_AA_TEXT

    @property
    def ornaments_ok(self) -> bool:
        return min(self.ornament_delta_e.values()) >= MIN_ORNAMENT_DELTA_E


def _seen(colour: RGB, vision: str) -> RGB:
    return colour if vision == "typical" else simulate_cvd(colour, vision)


def look_vision(occasion: str, look: Look, samples: int = SAMPLE_ARRANGEMENTS) -> LookVision:
    """Worst text contrast and ornament visibility for a look under each vision type."""
    text = {v: 21.0 for v in VISIONS}
    orn = {v: 1000.0 for v in VISIONS}
    for seed in range(samples):
        roles = {k: parse_hex(v) for k, v in arrange_palette(look, random.Random(seed)).roles}
        spec_plate = roles["plate"] != roles["background"]
        surface = roles["plate"] if spec_plate else roles["background"]
        for vision in VISIONS:
            ink = _seen(roles["ink"], vision)
            text[vision] = min(text[vision], contrast_ratio(ink, _seen(surface, vision)))
            bg = _seen(roles["background"], vision)
            best = max(delta_e(_seen(roles["accent"], vision), bg),
                       delta_e(_seen(roles["ornament"], vision), bg))
            orn[vision] = min(orn[vision], best)
    return LookVision(occasion, look.id, {k: round(v, 2) for k, v in text.items()},
                      {k: round(v, 1) for k, v in orn.items()})


def palette_report() -> list[LookVision]:
    """The vision report for every look of every occasion."""
    return [look_vision(occ.id, look) for occ in OCCASIONS.values() for look in occ.looks]


def report_markdown(rows: list[LookVision]) -> str:
    """Markdown table: worst text contrast and ornament Delta E per vision type."""
    head = "| Look | " + " | ".join(f"text {v[:4]}" for v in VISIONS) + " | " + \
        " | ".join(f"orn {v[:4]}" for v in VISIONS) + " | ok |"
    rule = "| --- " * (2 * len(VISIONS) + 2) + "|"
    lines = [head, rule]
    for row in rows:
        cells = [f"{row.text_contrast[v]:.2f}" for v in VISIONS]
        cells += [f"{row.ornament_delta_e[v]:.1f}" for v in VISIONS]
        ok = "yes" if row.text_ok and row.ornaments_ok else "no"
        lines.append(f"| {row.occasion}/{row.look} | " + " | ".join(cells) + f" | {ok} |")
    return "\n".join(lines)
