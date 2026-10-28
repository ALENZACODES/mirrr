"""Thanksgiving pack: autumn leaves and harvest colour.

Six looks: scattered leaf frame, harvest grade, leaf crown, falling leaves,
a painted cheek leaf and a greeting.
Author: John Khan.
"""

from __future__ import annotations

from .model import Look, LookKind, Palette, SeasonalPack, StrengthCurve

PALETTE = Palette(
    primary="#c8501e",
    secondary="#d9a441",
    accent="#8b3a1a",
    dark="#3b2412",
    light="#f6ead6",
)

LOOKS = (
    Look(
        id="leaf_frame",
        kind=LookKind.FRAME,
        title="Autumn leaf frame",
        renderer="frame.border",
        params={
            "style": "scatter",
            "motifs": ("maple_leaf", "oak_leaf", "acorn"),
            "density": 1.6,
            "band": 0.09,
            "motif_scale": 1.2,
        },
        motifs=("maple_leaf", "oak_leaf", "acorn"),
    ),
    Look(
        id="harvest_grade",
        kind=LookKind.GRADE,
        title="Harvest gold",
        renderer="grade.split_tone",
        params={
            "shadow_tint": "#4a2a10",
            "highlight_tint": "#f0b060",
            "tint": 0.16,
            "desaturate": 0.1,
            "shadow_depth": 0.18,
            "vignette": 0.15,
        },
        curve=StrengthCurve.SMOOTH,
    ),
    Look(
        id="leaf_crown",
        kind=LookKind.ACCESSORY,
        title="Leaf crown",
        renderer="accessory.wear",
        params={"style": "motif_wreath", "motifs": ("maple_leaf", "oak_leaf", "acorn"), "count": 9},
        motifs=("maple_leaf", "oak_leaf", "acorn"),
        default_strength=5.0,
    ),
    Look(
        id="falling_leaves",
        kind=LookKind.LIGHT,
        title="Falling leaves",
        renderer="light.particles",
        params={
            "motion": "fall",
            "motifs": ("maple_leaf", "oak_leaf"),
            "count": 22,
            "size": 0.14,
            "speed": 0.02,
            "sway": 0.12,
        },
        motifs=("maple_leaf", "oak_leaf"),
    ),
    Look(
        id="leaf_cheek",
        kind=LookKind.ACCESSORY,
        title="Painted leaf",
        renderer="accessory.paint",
        params={"motifs": ("maple_leaf",), "placement": "right_cheek", "colour": "primary"},
        motifs=("maple_leaf",),
    ),
    Look(
        id="thanksgiving_greeting",
        kind=LookKind.GREETING,
        title="Thanksgiving greeting",
        renderer="greeting.banner",
        params={"motifs": ("maple_leaf", "wheat"), "banner_colour": "accent"},
        motifs=("maple_leaf", "wheat"),
    ),
)

PACK = SeasonalPack(
    occasion="thanksgiving",
    title="Thanksgiving",
    palette=PALETTE,
    motifs=("maple_leaf", "oak_leaf", "acorn", "pumpkin", "wheat"),
    looks=LOOKS,
    greeting="Happy Thanksgiving",
)
