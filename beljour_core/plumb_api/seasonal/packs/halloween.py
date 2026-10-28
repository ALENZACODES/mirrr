"""Halloween pack, the Oct 31 demo hero: pumpkins, bats and a moonlit night.

Eight looks: pumpkin frame, moonlit grade, witch hat, cat ears, cheek web
face paint, star freckles, floating bats and a greeting. All art is drawn in
code.
Author: John Khan.
"""

from __future__ import annotations

from .model import Look, LookKind, Palette, SeasonalPack, StrengthCurve

PALETTE = Palette(
    primary="#e8741c",
    secondary="#6a2c91",
    accent="#f2c94c",
    dark="#1b1424",
    light="#f4efe6",
)

LOOKS = (
    Look(
        id="pumpkin_frame",
        kind=LookKind.FRAME,
        title="Pumpkin frame",
        renderer="frame.border",
        params={
            "style": "band",
            "motifs": ("pumpkin", "bat", "star"),
            "corner": "moon",
            "band_colour": "dark",
            "band_opacity": 0.72,
            "rule_colour": "primary",
            "band": 0.11,
        },
        motifs=("pumpkin", "bat", "star", "moon"),
    ),
    Look(
        id="moonlit_grade",
        kind=LookKind.GRADE,
        title="Moonlit night",
        renderer="grade.split_tone",
        params={
            "shadow_tint": "#27408b",
            "highlight_tint": "#9fb4e8",
            "tint": 0.18,
            "desaturate": 0.3,
            "shadow_depth": 0.25,
            "vignette": 0.35,
        },
        curve=StrengthCurve.EASE_OUT,
    ),
    Look(
        id="witch_hat",
        kind=LookKind.ACCESSORY,
        title="Witch hat",
        renderer="accessory.wear",
        params={"style": "witch_hat"},
        default_strength=5.0,
    ),
    Look(
        id="cat_ears",
        kind=LookKind.ACCESSORY,
        title="Cat ears",
        renderer="accessory.wear",
        params={"style": "cat_ears"},
        default_strength=5.0,
    ),
    Look(
        id="cheek_web",
        kind=LookKind.ACCESSORY,
        title="Cheek web paint",
        renderer="accessory.paint",
        params={"motifs": ("web",), "placement": "left_cheek", "colour": "dark", "size": 0.24},
        motifs=("web",),
        curve=StrengthCurve.SMOOTH,
    ),
    Look(
        id="star_freckles",
        kind=LookKind.ACCESSORY,
        title="Star freckles",
        renderer="accessory.paint",
        params={
            "motifs": ("star",),
            "placement": "freckles",
            "colour": "primary",
            "count": 5,
            "size": 0.28,
        },
        motifs=("star",),
    ),
    Look(
        id="floating_bats",
        kind=LookKind.LIGHT,
        title="Floating bats",
        renderer="light.particles",
        params={"motion": "orbit", "motifs": ("bat",), "count": 9, "size": 0.2, "speed": 0.03},
        motifs=("bat",),
    ),
    Look(
        id="halloween_greeting",
        kind=LookKind.GREETING,
        title="Halloween greeting",
        renderer="greeting.banner",
        params={"motifs": ("pumpkin", "star"), "banner_colour": "dark", "text_colour": "accent"},
        motifs=("pumpkin", "star"),
    ),
)

PACK = SeasonalPack(
    occasion="halloween",
    title="Halloween",
    palette=PALETTE,
    motifs=("pumpkin", "bat", "moon", "web", "star"),
    looks=LOOKS,
    greeting="Happy Halloween",
)
