"""New Year pack: confetti, fireworks bokeh and party wear.

Eight looks: starlight frame, midnight grade, party hat, party glasses,
golden crown, confetti fall, fireworks bokeh and a greeting.
Author: John Khan.
"""

from __future__ import annotations

from .model import Look, LookKind, Palette, SeasonalPack, StrengthCurve

PALETTE = Palette(
    primary="#1b2a5c",
    secondary="#ff4d6d",
    accent="#e9b52b",
    dark="#0d1330",
    light="#fff8e1",
)

LOOKS = (
    Look(
        id="starlight_frame",
        kind=LookKind.FRAME,
        title="Starlight frame",
        renderer="frame.border",
        params={
            "style": "band",
            "motifs": ("star", "sparkle"),
            "corner": "balloon",
            "band_colour": "dark",
            "band_opacity": 0.8,
            "rule_colour": "accent",
            "spacing": 1.1,
        },
        motifs=("star", "sparkle", "balloon"),
    ),
    Look(
        id="midnight_grade",
        kind=LookKind.GRADE,
        title="Midnight glow",
        renderer="grade.split_tone",
        params={
            "shadow_tint": "#1b2a8c",
            "highlight_tint": "#ffcf70",
            "tint": 0.2,
            "shadow_depth": 0.2,
            "vignette": 0.3,
        },
        curve=StrengthCurve.EASE_OUT,
    ),
    Look(
        id="party_hat",
        kind=LookKind.ACCESSORY,
        title="Party hat",
        renderer="accessory.wear",
        params={"style": "party_hat"},
        default_strength=5.0,
    ),
    Look(
        id="party_glasses",
        kind=LookKind.ACCESSORY,
        title="Party glasses",
        renderer="accessory.wear",
        params={"style": "party_glasses"},
        default_strength=5.0,
    ),
    Look(
        id="golden_crown",
        kind=LookKind.ACCESSORY,
        title="Golden crown",
        renderer="accessory.wear",
        params={"style": "crown"},
        default_strength=5.0,
    ),
    Look(
        id="confetti_fall",
        kind=LookKind.LIGHT,
        title="Confetti",
        renderer="light.particles",
        params={
            "motion": "fall",
            "motifs": ("confetti",),
            "count": 26,
            "size": 0.24,
            "speed": 0.04,
        },
        motifs=("confetti",),
    ),
    Look(
        id="fireworks_bokeh",
        kind=LookKind.LIGHT,
        title="Fireworks bokeh",
        renderer="light.particles",
        params={"motion": "burst", "motifs": ("firework", "sparkle"), "count": 14, "size": 0.38},
        motifs=("firework", "sparkle"),
    ),
    Look(
        id="new_year_greeting",
        kind=LookKind.GREETING,
        title="New Year greeting",
        renderer="greeting.banner",
        params={
            "motifs": ("firework", "star"),
            "banner_colour": "primary",
            "text_colour": "accent",
        },
        motifs=("firework", "star"),
    ),
)

PACK = SeasonalPack(
    occasion="new_year",
    title="New Year",
    palette=PALETTE,
    motifs=("confetti", "firework", "star", "balloon", "sparkle"),
    looks=LOOKS,
    greeting="Happy New Year",
)
