"""Christmas pack: snow, evergreen and warm winter light.

Nine looks: evergreen frame, warm grade, knit hat, felt antlers, falling snow,
earmuffs, twinkle lights, snowflake cheek paint and a greeting. No religious
figures are used.
Author: John Khan.
"""

from __future__ import annotations

from .model import Look, LookKind, Palette, SeasonalPack, StrengthCurve

PALETTE = Palette(
    primary="#b3202a",
    secondary="#1f6b3a",
    accent="#e8c15a",
    dark="#14301f",
    light="#fbf7ef",
)

LOOKS = (
    Look(
        id="evergreen_frame",
        kind=LookKind.FRAME,
        title="Evergreen frame",
        renderer="frame.border",
        params={
            "style": "band",
            "motifs": ("evergreen", "ornament", "holly"),
            "corner": "gift",
            "band_colour": "secondary",
            "band_opacity": 0.78,
            "rule_colour": "accent",
            "spacing": 1.2,
        },
        motifs=("evergreen", "ornament", "holly", "gift"),
    ),
    Look(
        id="warm_grade",
        kind=LookKind.GRADE,
        title="Warm fireside",
        renderer="grade.split_tone",
        params={
            "shadow_tint": "#5a2a1a",
            "highlight_tint": "#ffd9a0",
            "tint": 0.14,
            "shadow_depth": 0.12,
            "vignette": 0.2,
        },
    ),
    Look(
        id="knit_hat",
        kind=LookKind.ACCESSORY,
        title="Knit hat",
        renderer="accessory.wear",
        params={"style": "knit_hat"},
        default_strength=5.0,
    ),
    Look(
        id="reindeer_antlers",
        kind=LookKind.ACCESSORY,
        title="Felt antlers",
        renderer="accessory.wear",
        params={"style": "antlers"},
        default_strength=5.0,
    ),
    Look(
        id="snow_fall",
        kind=LookKind.LIGHT,
        title="Falling snow",
        renderer="light.particles",
        params={
            "motion": "fall",
            "motifs": ("snowflake",),
            "count": 60,
            "size": 0.07,
            "speed": 0.025,
            "sway": 0.06,
        },
        motifs=("snowflake",),
        curve=StrengthCurve.EASE_IN,
    ),
    Look(
        id="earmuffs",
        kind=LookKind.ACCESSORY,
        title="Earmuffs",
        renderer="accessory.wear",
        params={"style": "earmuffs"},
        default_strength=5.0,
    ),
    Look(
        id="twinkle_lights",
        kind=LookKind.LIGHT,
        title="Twinkle lights",
        renderer="light.particles",
        params={"motion": "twinkle", "motifs": ("ornament",), "count": 22, "size": 0.11},
        motifs=("ornament",),
    ),
    Look(
        id="snowflake_cheeks",
        kind=LookKind.ACCESSORY,
        title="Snowflake cheeks",
        renderer="accessory.paint",
        params={"motifs": ("snowflake",), "placement": "both_cheeks", "colour": "#2a6fb0"},
        motifs=("snowflake",),
    ),
    Look(
        id="christmas_greeting",
        kind=LookKind.GREETING,
        title="Christmas greeting",
        renderer="greeting.banner",
        params={"motifs": ("holly", "ornament"), "banner_colour": "primary"},
        motifs=("holly", "ornament"),
    ),
)

PACK = SeasonalPack(
    occasion="christmas",
    title="Christmas",
    palette=PALETTE,
    motifs=("snowflake", "evergreen", "ornament", "gift", "holly"),
    looks=LOOKS,
    greeting="Merry Christmas",
)
