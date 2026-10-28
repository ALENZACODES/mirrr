"""Easter pack: decorated eggs and spring flowers.

Eight looks: spring-flower frame, pastel grade, egg-pattern border, bunny
ears, flower crown, fluttering butterflies, a painted daisy and a greeting.
No religious symbols.
Author: John Khan.
"""

from __future__ import annotations

from .model import Look, LookKind, Palette, SeasonalPack, StrengthCurve

PALETTE = Palette(
    primary="#e98bb0",
    secondary="#8fc1e3",
    accent="#f5c518",
    dark="#5b4a6e",
    light="#fffaf2",
)

LOOKS = (
    Look(
        id="spring_flower_frame",
        kind=LookKind.FRAME,
        title="Spring flowers",
        renderer="frame.border",
        params={
            "style": "scatter",
            "motifs": ("tulip", "daisy", "leaf_sprig", "butterfly"),
            "density": 1.5,
            "motif_scale": 1.1,
        },
        motifs=("tulip", "daisy", "leaf_sprig", "butterfly"),
    ),
    Look(
        id="pastel_grade",
        kind=LookKind.GRADE,
        title="Soft pastel",
        renderer="grade.split_tone",
        params={
            "shadow_tint": "#7a6aa8",
            "highlight_tint": "#ffd6e8",
            "tint": 0.12,
            "desaturate": 0.2,
            "shadow_depth": 0.05,
        },
        curve=StrengthCurve.EASE_IN,
    ),
    Look(
        id="egg_border",
        kind=LookKind.FRAME,
        title="Egg border",
        renderer="frame.border",
        params={
            "style": "band",
            "motifs": ("egg",),
            "band_colour": "light",
            "band_opacity": 0.85,
            "rule_colour": "primary",
            "jitter": 0.0,
            "spacing": 1.15,
            "band": 0.09,
        },
        motifs=("egg",),
    ),
    Look(
        id="bunny_ears",
        kind=LookKind.ACCESSORY,
        title="Bunny ears",
        renderer="accessory.wear",
        params={"style": "bunny_ears"},
        default_strength=5.0,
    ),
    Look(
        id="flower_crown",
        kind=LookKind.ACCESSORY,
        title="Flower crown",
        renderer="accessory.wear",
        params={
            "style": "motif_wreath",
            "motifs": ("daisy", "tulip"),
            "count": 11,
            "motif_scale": 0.17,
        },
        motifs=("daisy", "tulip"),
        default_strength=5.0,
    ),
    Look(
        id="fluttering_butterflies",
        kind=LookKind.LIGHT,
        title="Butterflies",
        renderer="light.particles",
        params={
            "motion": "orbit",
            "motifs": ("butterfly",),
            "count": 9,
            "size": 0.28,
            "speed": 0.02,
        },
        motifs=("butterfly",),
    ),
    Look(
        id="daisy_cheek",
        kind=LookKind.ACCESSORY,
        title="Painted daisy",
        renderer="accessory.paint",
        params={"motifs": ("daisy",), "placement": "right_cheek", "colour": "dark", "size": 0.16},
        motifs=("daisy",),
    ),
    Look(
        id="easter_greeting",
        kind=LookKind.GREETING,
        title="Easter greeting",
        renderer="greeting.banner",
        params={"motifs": ("egg", "tulip"), "banner_colour": "dark", "text_colour": "light"},
        motifs=("egg", "tulip"),
    ),
)

PACK = SeasonalPack(
    occasion="easter",
    title="Easter",
    palette=PALETTE,
    motifs=("egg", "tulip", "daisy", "butterfly", "leaf_sprig"),
    looks=LOOKS,
    greeting="Happy Easter",
)
