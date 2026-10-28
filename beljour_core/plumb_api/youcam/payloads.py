"""Builders for YouCam task payloads. Each one validates its input so a bad request
fails here, for free, instead of at YouCam.

Shapes follow the docs pages for skin analysis, skin tone, face attributes, face reshape
and makeup VTO (checked Oct 22, 2026). src_file_id is added by the client.
"""
from __future__ import annotations

import re

from .units import SD_CONCERNS

HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")

# Skin --------------------------------------------------------------------
DEFAULT_SKIN_CONCERNS: tuple[str, ...] = (
    "acne", "moisture", "oiliness", "pore", "redness", "texture", "wrinkle", "dark_circle_v2",
)  # 8 concerns = 12 units (SD)


def skin_analysis(concerns: list[str] | tuple[str, ...] = DEFAULT_SKIN_CONCERNS) -> dict:
    concerns = list(dict.fromkeys(concerns))
    unknown = [c for c in concerns if c not in SD_CONCERNS]
    if unknown:
        raise ValueError(f"unknown skin concerns: {', '.join(unknown)}")
    if not 1 <= len(concerns) <= 16:
        raise ValueError("choose between 1 and 16 concerns")
    return {"dst_actions": concerns, "miniserver_args": {"enable_mask_overlay": False}, "format": "json"}


# Colour ------------------------------------------------------------------
def skin_tone() -> dict:
    return {"face_angle_strictness_level": "high"}


# Face attributes ----------------------------------------------------------
PROPORTION_FEATURES: tuple[str, ...] = (
    "faceShape", "horizontalThird", "verticalFifth", "faceAspectRatio", "eyeAspectRatio",
    "eyebrowArch", "noseAspectRatio", "noseWidthToMouthWidth", "noseToLipToChin", "upperLipToLowerLip",
)  # 10 features = 20 units

FACE_ATTR_FEATURES = frozenset({
    "eyeShape", "eyeSize", "eyeAngle", "eyeDistance", "eyelid", "eyebrowShape", "eyebrowThickness",
    "eyebrowDistance", "eyebrowShortness", "cheekbones", "faceShape", "lipShape", "noseWidth",
    "noseLength", "age", "gender", "eyeColor", "lipColor", "eyebrowColor", "hairColor",
    "horizontalThird", "verticalFifth", "faceAspectRatio", "eyeAspectRatio", "eyebrowPosition",
    "eyebrowArch", "eyeHeightToEyebrowDistance", "noseAspectRatio", "noseWidthToMouthWidth",
    "noseToLipToChin", "upperLipToLowerLip",
})


def face_attributes(features: tuple[str, ...] = PROPORTION_FEATURES) -> dict:
    bad = [f for f in features if f not in FACE_ATTR_FEATURES]
    if bad:
        raise ValueError(f"unknown face features: {', '.join(bad)}")
    return {"face_angle_strictness_level": "high", "features": list(dict.fromkeys(features))}


# Face reshape -------------------------------------------------------------
RESHAPE_PARAMS = frozenset({
    "nose_bridge_width", "nose_lift", "nose_size", "nose_tip", "nose_tip_width", "nose_wing",
    "lip_size", "lip_width", "lip_peak", "lip_height_top", "lip_height_bottom",
    "eye_size_left", "eye_size_right", "eye_distance", "eye_angle", "eye_height", "eye_width",
    "face_width", "face_reshape_left", "face_reshape_right", "chin_reshape_left",
    "chin_reshape_right", "chin_length", "cheekbones", "jaw",
})
ZERO_TO_HUNDRED = frozenset({"cheekbones", "jaw"})


def face_reshape(features: dict[str, int]) -> dict:
    clean: dict[str, int] = {}
    for name, value in features.items():
        if name not in RESHAPE_PARAMS:
            raise ValueError(f"unknown reshape parameter: {name}")
        low = 0 if name in ZERO_TO_HUNDRED else -100
        clean[name] = max(low, min(100, int(round(value))))
    if not any(clean.values()):
        raise ValueError("at least one reshape value must be non zero")
    return {"version": "1.0", "features": clean,
            "global": {"skin_smooth_strength": 0, "skin_smooth_color_intensity": 0}}


# Makeup -------------------------------------------------------------------
LIP_TEXTURES = frozenset({"matte", "gloss", "holographic", "metallic", "satin", "sheer", "shimmer"})


def _pct(v: float) -> int:
    return max(0, min(100, int(round(v))))


def _hex(color: str) -> str:
    if not HEX.match(color):
        raise ValueError(f"colour must look like #A1B2C3, got {color!r}")
    return color.upper()


def foundation_effect(color: str, intensity: int = 60, coverage: int = 50, glow: int = 20) -> dict:
    return {"category": "foundation", "palettes": [{
        "color": _hex(color), "colorIntensity": _pct(intensity),
        "glowIntensity": _pct(glow), "coverageIntensity": _pct(coverage)}]}


def lip_effect(color: str, intensity: int = 70, texture: str = "matte",
               shape: str = "plump") -> dict:
    # Only matte, satin and metallic-free textures are offered in the UI for now: gloss,
    # sheer and shimmer need extra required fields (gloss, transparencyIntensity, shimmer*).
    if texture not in {"matte", "satin"}:
        raise ValueError("lip texture must be matte or satin for now")
    # NOTE: "plump" is the shape name used in the docs example; check the lip shape
    # catalogue before relying on other names.
    return {"category": "lip_color", "shape": {"name": shape}, "style": {"type": "full"},
            "palettes": [{"color": _hex(color), "texture": texture, "colorIntensity": _pct(intensity)}]}


def blush_effect(color: str, intensity: int = 40, pattern: str = "1color1") -> dict:
    return {"category": "blush", "pattern": {"name": pattern},
            "palettes": [{"color": _hex(color), "texture": "matte", "colorIntensity": _pct(intensity)}]}


def makeup(effects: list[dict]) -> dict:
    if not effects:
        raise ValueError("choose at least one product to try on")
    categories = [e["category"] for e in effects]
    if len(set(categories)) != len(categories):
        raise ValueError("one product per category at a time")
    return {"version": "1.0", "effects": effects}


# Skin simulation -----------------------------------------------------------
# Docs (checked Oct 22, 2026): flat top level properties, each 0..1, not all zero.
SIMULATION_KEYS = ("wrinkle", "radiance", "oiliness", "acne", "eye_bags", "dark_circle",
                   "spots", "pores", "texture", "redness")
# our skin analysis concern -> simulation property
CONCERN_TO_SIMULATION = {
    "wrinkle": "wrinkle", "radiance": "radiance", "oiliness": "oiliness", "acne": "acne",
    "eye_bag": "eye_bags", "dark_circle_v2": "dark_circle", "age_spot": "spots",
    "pore": "pores", "texture": "texture", "redness": "redness",
}


def skin_simulation(strengths: dict[str, float]) -> dict:
    clean: dict[str, float] = {}
    for name, value in strengths.items():
        if name not in SIMULATION_KEYS:
            raise ValueError(f"unknown simulation concern: {name}")
        v = round(max(0.0, min(1.0, float(value))) * 10) / 10  # steps of 0.1 for caching
        if v:
            clean[name] = v
    if not clean:
        raise ValueError("choose at least one concern above zero")
    return dict(sorted(clean.items()))


# Aging --------------------------------------------------------------------
def aging() -> dict:
    """POST /s2s/v2.0/task/aging takes only the source image (docs, Oct 22, 2026)."""
    return {}


# Face lift ----------------------------------------------------------------
# Field names from YouCam's published MCP tool schema for AI Face Lift (the docs page
# itself doesn't list them): version, type ("custom"), features 0..100, global.
FACE_LIFT_PARAMS = ("eye_bag", "cheek", "forehead", "shape", "mouth")


def face_lift(features: dict[str, float]) -> dict:
    clean: dict[str, int] = {}
    for name, value in features.items():
        if name not in FACE_LIFT_PARAMS:
            raise ValueError(f"unknown face lift parameter: {name}")
        v = max(0, min(100, int(round(value))))
        if v:
            clean[name] = v
    if not clean:
        raise ValueError("at least one face lift value must be above zero")
    return {"version": "1.0", "type": "custom", "features": clean,
            "global": {"skin_smooth_strength": 0, "skin_smooth_color_intensity": 0}}
