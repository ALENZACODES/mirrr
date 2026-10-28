"""Original geometric colour guides for women's hairstyle consultations.

These guides show masked parting, shadow and highlight placements. They do not
create new hair, cut a silhouette or predict a salon result. Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal, TypeAlias

import numpy as np
from numpy.typing import NDArray

from .contracts import HairGeometry

FloatPlane: TypeAlias = NDArray[np.float64]
StyleKey: TypeAlias = Literal[
    "crescent_pixie",
    "swept_crop",
    "curtain_fringe",
    "temple_coils",
    "twist_taper",
    "underlayer_arc",
    "graduated_bob",
    "asymmetric_lob",
    "feathered_lob",
    "long_ribbons",
    "curly_shag",
    "sleek_side_part",
]
TextureKey: TypeAlias = Literal["straight", "wavy", "curly", "coily"]
STYLE_KEYS: tuple[StyleKey, ...] = (
    "crescent_pixie",
    "swept_crop",
    "curtain_fringe",
    "temple_coils",
    "twist_taper",
    "underlayer_arc",
    "graduated_bob",
    "asymmetric_lob",
    "feathered_lob",
    "long_ribbons",
    "curly_shag",
    "sleek_side_part",
)
TEXTURES: tuple[TextureKey, ...] = ("straight", "wavy", "curly", "coily")
SIMULATION_LABEL = "Illustrative hair placement simulation. No new hair or haircut is generated."


@dataclass(frozen=True)
class StyleDefinition:
    style_id: StyleKey
    title: str
    section: Literal["short", "mid", "long"]
    note: str
    orientation: float
    shadow: float
    highlight: float


DEFINITIONS: tuple[StyleDefinition, ...] = (
    StyleDefinition("crescent_pixie", "Crescent pixie", "short", "Curved temple shadow guide", -0.15, 15, 9),
    StyleDefinition("swept_crop", "Side-swept crop", "short", "Angled front and side guide", 0.45, 13, 11),
    StyleDefinition("curtain_fringe", "Curtain fringe", "mid", "Two-part fringe highlight guide", 0.15, 11, 12),
    StyleDefinition("temple_coils", "Tapered coils", "short", "Soft lower temple guide", 0.65, 17, 7),
    StyleDefinition("twist_taper", "Twist taper", "short", "Twist top and temple guide", 0.25, 17, 8),
    StyleDefinition("underlayer_arc", "Nape underlayer", "mid", "Lower arc shadow guide", 0.0, 18, 7),
    StyleDefinition("graduated_bob", "Graduated bob", "mid", "Layered lower edge guide", -0.25, 12, 11),
    StyleDefinition("asymmetric_lob", "Asymmetric lob", "mid", "Diagonal length placement guide", 0.4, 14, 10),
    StyleDefinition("feathered_lob", "Feathered lob", "mid", "Feathered side highlights guide", -0.35, 10, 13),
    StyleDefinition("long_ribbons", "Long ribbons", "long", "Long vertical movement guide", 0.1, 8, 15),
    StyleDefinition("curly_shag", "Curly shag", "long", "Staggered curl highlight guide", 0.65, 12, 12),
    StyleDefinition("sleek_side_part", "Sleek side part", "long", "Parting and surface sheen guide", -0.1, 10, 14),
)
_DEFINITIONS: dict[StyleKey, StyleDefinition] = {item.style_id: item for item in DEFINITIONS}


@dataclass(frozen=True)
class GuideField:
    """The three fields share absolute image coordinates, even when tiled."""

    zone: FloatPlane
    grade: FloatPlane
    tone: FloatPlane


def definition(style: StyleKey) -> StyleDefinition:
    if style not in _DEFINITIONS:
        raise ValueError("unknown consultation hairstyle")
    return _DEFINITIONS[style]


def validate_geometry(geometry: HairGeometry) -> None:
    """Validate all supplied landmarks, never infer geometry from a photograph."""
    for point in (geometry.crown, geometry.left_temple, geometry.right_temple, geometry.chin):
        if len(point) != 2 or not all(math.isfinite(float(value)) for value in point):
            raise ValueError("invalid head landmark")
        if not all(-0.25 <= float(value) <= 1.25 for value in point):
            raise ValueError("head landmark out of normalized range")
    if not geometry.left_temple[0] < geometry.right_temple[0]:
        raise ValueError("temple order is reversed")
    if geometry.chin[1] - geometry.crown[1] < 0.1:
        raise ValueError("head height is too small")
    if geometry.right_temple[0] - geometry.left_temple[0] < 0.05:
        raise ValueError("head width is too small")


def _clamp(value: FloatPlane) -> FloatPlane:
    return np.clip(value, 0.0, 1.0).astype(np.float64)


def _smooth(value: FloatPlane) -> FloatPlane:
    bounded = _clamp(value)
    return bounded * bounded * (3.0 - 2.0 * bounded)


def fields(
    style: StyleKey,
    geometry: HairGeometry,
    width: int,
    height: int,
    row_start: int = 0,
    row_stop: int | None = None,
) -> GuideField:
    """Compute deterministic per-pixel placement and tone using global rows.

    The output is pure geometry; it never reads a photo or estimates skin tone.
    Requesting adjacent row ranges yields exactly the same values as one frame.
    """
    chosen = definition(style)
    validate_geometry(geometry)
    if width < 16 or height < 16 or width * height > 12_000_000:
        raise ValueError("unsupported picture size")
    stop = height if row_stop is None else row_stop
    if not 0 <= row_start < stop <= height:
        raise ValueError("invalid row interval")
    yy, xx = np.mgrid[row_start:stop, :width]
    center_x = (geometry.left_temple[0] + geometry.right_temple[0]) * 0.5 * width
    half_width = max((geometry.right_temple[0] - geometry.left_temple[0]) * 0.5 * width, 1.0)
    top = geometry.crown[1] * height
    length = max((geometry.chin[1] - geometry.crown[1]) * height, 1.0)
    x = (xx - center_x) / half_width
    y = (yy - top) / length
    side = _clamp((np.abs(x) - 0.23) / 0.78)
    lower = _clamp((y - 0.35) / 0.82)
    middle = _clamp(1.0 - np.abs(x) / 1.35)
    front = _clamp((0.52 - y) / 0.58)
    sweep = _clamp((x + 0.68) / 1.5)
    wave = np.sin(5.3 * x + 7.1 * y)
    curve = np.cos(3.5 * x - 4.1 * y)

    if style == "crescent_pixie":
        zone = (side > 0.06) & (y > 0.01) & (y < 0.9)
        grade = _clamp(0.79 - 0.62 * side - 0.16 * lower + 0.08 * curve)
        ribbon = 0.64 * curve - 0.37
    elif style == "swept_crop":
        zone = (front > 0.04) & (y > -0.2) & (x > -1.05) & (x < 1.1)
        grade = _clamp(0.52 + 0.33 * x - 0.46 * front + 0.12 * wave)
        ribbon = 0.6 * wave + 0.15 * sweep
    elif style == "curtain_fringe":
        zone = (front > 0.08) & (np.abs(x) > 0.11) & (np.abs(x) < 1.03)
        grade = _clamp(0.44 + 0.37 * np.abs(x) - 0.3 * front)
        ribbon = 0.8 * np.cos(7.0 * np.abs(x) + 2.1 * y)
    elif style == "temple_coils":
        zone = (side > 0.02) & (y > 0.05) & (y < 0.93)
        grade = _clamp(0.84 - 0.53 * side - 0.35 * lower + 0.1 * wave)
        ribbon = 0.55 * wave - 0.46
    elif style == "twist_taper":
        zone = ((side > 0.06) | (middle > 0.7)) & (y > -0.06) & (y < 0.82)
        grade = _clamp(0.87 - 0.43 * side - 0.26 * front - 0.21 * lower)
        ribbon = np.cos(9.0 * x - 7.0 * y) * 0.53 - side * 0.23
    elif style == "underlayer_arc":
        arc = y - (0.4 + 0.19 * x * x)
        zone = (arc > -0.04) & (arc < 0.62) & (np.abs(x) < 1.13)
        grade = _clamp(0.68 - 0.92 * arc + 0.07 * curve)
        ribbon = -0.5 + 0.3 * np.sin(7.0 * x + y)
    elif style == "graduated_bob":
        zone = (y > 0.3) & (y < 1.11) & (np.abs(x) < 1.25)
        grade = _clamp(0.75 - 0.64 * lower - 0.09 * np.abs(x) + 0.07 * wave)
        ribbon = 0.58 * curve - 0.26 * lower
    elif style == "asymmetric_lob":
        diagonal = y - 0.43 + 0.28 * x
        zone = (diagonal > -0.02) & (diagonal < 0.73) & (np.abs(x) < 1.19)
        grade = _clamp(0.8 - 0.84 * diagonal + 0.07 * np.sin(3.1 * x))
        ribbon = 0.61 * np.sin(3.4 * x - 5.1 * y)
    elif style == "feathered_lob":
        zone = (side > 0.08) & (y > 0.25) & (y < 1.3)
        grade = _clamp(0.76 - 0.52 * lower - 0.14 * side + 0.11 * wave)
        ribbon = 0.6 * np.sin(10.0 * x + 9.0 * y) + 0.24
    elif style == "long_ribbons":
        zone = (y > 0.29) & (y < 1.39) & (np.abs(x) > 0.14) & (np.abs(x) < 1.2)
        grade = _clamp(0.88 - 0.48 * lower - 0.32 * side)
        ribbon = 0.7 * np.cos(11.0 * x - 2.0 * y) + 0.17
    elif style == "curly_shag":
        zone = (y > 0.09) & (y < 1.24) & (np.abs(x) < 1.21)
        grade = _clamp(0.6 - 0.24 * lower + 0.2 * wave + 0.06 * side)
        ribbon = 0.55 * np.cos(9.0 * x + 11.0 * y)
    else:
        part = np.abs(x + 0.3 + 0.09 * y)
        zone = (y > -0.08) & (y < 1.22) & (np.abs(x) < 1.13)
        grade = _clamp(0.38 + 0.28 * part + 0.17 * lower)
        ribbon = 0.58 * np.cos(8.0 * part) + 0.21

    if chosen.section == "short":
        feather = _smooth(_clamp((1.05 - np.abs(x)) / 0.18))
    elif chosen.section == "mid":
        feather = _smooth(_clamp((1.23 - np.abs(x)) / 0.2))
    else:
        feather = _smooth(_clamp((1.3 - np.abs(x)) / 0.23))
    final_zone = zone.astype(np.float64) * feather
    tone = _clamp((ribbon + 1.0) * 0.5) * 2.0 - 1.0
    return GuideField(final_zone, grade, tone)
