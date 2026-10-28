"""Pack data model: SeasonalPack, Look, Palette and strength levels.

Strength uses the app's level scale, 1.0 to 5.0 in steps of 0.1. Every value
is checked when the object is built, and errors name the field that failed.
Author: John Khan.
"""

from __future__ import annotations

import math
import re
from collections.abc import Mapping
from dataclasses import dataclass, field
from enum import StrEnum
from types import MappingProxyType

from .forbidden import forbidden_problems
from .occasions import is_occasion

STRENGTH_MIN = 1.0
STRENGTH_MAX = 5.0
STRENGTH_STEP = 0.1
# ASSUMED: the app's level slider opens at 3.0 when a look does not say otherwise.
STRENGTH_DEFAULT = 3.0
# Strength 1.0 must still show the look, so the amount curve starts above zero.
AMOUNT_FLOOR = 0.2

LOOK_ID = re.compile(r"^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$")
HEX_COLOUR = re.compile(r"^#[0-9a-fA-F]{6}$")

ParamValue = float | int | str | bool | tuple[str, ...] | tuple[float, ...]


class PackError(ValueError):
    """A pack, look or palette failed validation."""


class LookKind(StrEnum):
    """The five look families the photo editor offers."""

    FRAME = "frame"
    GRADE = "grade"
    ACCESSORY = "accessory"
    LIGHT = "light"
    GREETING = "greeting"

    @property
    def needs_face(self) -> bool:
        """Accessories and light effects are placed around the chosen face."""
        return self in (LookKind.ACCESSORY, LookKind.LIGHT)

    @property
    def whole_image(self) -> bool:
        """Frames, grades and greetings act on the whole picture."""
        return not self.needs_face


class StrengthCurve(StrEnum):
    """How a strength level maps to the 0..1 amount a renderer uses."""

    LINEAR = "linear"
    EASE_IN = "ease_in"
    EASE_OUT = "ease_out"
    SMOOTH = "smooth"


def validate_strength(value: float) -> float:
    """Check a level is within 1.0-5.0 and on the 0.1 grid; return it rounded."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise PackError(f"strength must be a number, got {type(value).__name__}")
    if not math.isfinite(value):
        raise PackError("strength must be finite")
    if not STRENGTH_MIN - 1e-9 <= value <= STRENGTH_MAX + 1e-9:
        raise PackError(f"strength {value} is outside {STRENGTH_MIN}-{STRENGTH_MAX}")
    steps = (value - STRENGTH_MIN) / STRENGTH_STEP
    if abs(steps - round(steps)) > 1e-6:
        raise PackError(f"strength {value} is not on the {STRENGTH_STEP} step grid")
    return round(STRENGTH_MIN + round(steps) * STRENGTH_STEP, 1)


def strength_amount(strength: float, curve: StrengthCurve = StrengthCurve.LINEAR) -> float:
    """Map a level to an amount in [AMOUNT_FLOOR, 1.0], rising with the level."""
    level = validate_strength(strength)
    t = (level - STRENGTH_MIN) / (STRENGTH_MAX - STRENGTH_MIN)
    if curve is StrengthCurve.EASE_IN:
        shaped = t * t
    elif curve is StrengthCurve.EASE_OUT:
        shaped = 1.0 - (1.0 - t) * (1.0 - t)
    elif curve is StrengthCurve.SMOOTH:
        shaped = t * t * (3.0 - 2.0 * t)
    else:
        shaped = t
    return AMOUNT_FLOOR + (1.0 - AMOUNT_FLOOR) * shaped


def hex_to_rgb(colour: str) -> tuple[int, int, int]:
    """Parse '#rrggbb' into an RGB triple."""
    if not HEX_COLOUR.match(colour):
        raise PackError(f"colour {colour!r} must look like #rrggbb")
    return (int(colour[1:3], 16), int(colour[3:5], 16), int(colour[5:7], 16))


@dataclass(frozen=True)
class Palette:
    """Named colour roles for a pack. Renderers pick colours by role name."""

    primary: str
    secondary: str
    accent: str
    dark: str
    light: str

    def __post_init__(self) -> None:
        for role in ("primary", "secondary", "accent", "dark", "light"):
            colour = getattr(self, role)
            if not isinstance(colour, str) or not HEX_COLOUR.match(colour):
                raise PackError(f"palette {role} {colour!r} must look like #rrggbb")

    def rgb(self, role: str) -> tuple[int, int, int]:
        """The RGB triple of a role, or of a literal '#rrggbb' colour."""
        if role.startswith("#"):
            return hex_to_rgb(role)
        if role not in ("primary", "secondary", "accent", "dark", "light"):
            raise PackError(f"unknown palette role {role!r}")
        return hex_to_rgb(str(getattr(self, role)))

    def roles(self) -> tuple[str, ...]:
        """All five colours in role order."""
        return (self.primary, self.secondary, self.accent, self.dark, self.light)


def _freeze_params(params: Mapping[str, ParamValue]) -> Mapping[str, ParamValue]:
    checked: dict[str, ParamValue] = {}
    for key, value in params.items():
        if not isinstance(key, str) or not LOOK_ID.match(key):
            raise PackError(f"parameter name {key!r} must be lower snake case")
        if isinstance(value, tuple):
            if any(not isinstance(item, (str, int, float)) for item in value):
                raise PackError(f"parameter {key!r} holds an unsupported tuple item")
        elif not isinstance(value, (str, int, float, bool)):
            raise PackError(f"parameter {key!r} has unsupported type {type(value).__name__}")
        if isinstance(value, float) and not math.isfinite(value):
            raise PackError(f"parameter {key!r} must be finite")
        checked[key] = value
    return MappingProxyType(checked)


@dataclass(frozen=True)
class Look:
    """One selectable look: what it is, which renderer draws it and its knobs."""

    id: str
    kind: LookKind
    title: str
    renderer: str
    params: Mapping[str, ParamValue] = field(default_factory=dict)
    motifs: tuple[str, ...] = ()
    default_strength: float = STRENGTH_DEFAULT
    curve: StrengthCurve = StrengthCurve.LINEAR

    def __post_init__(self) -> None:
        if not isinstance(self.id, str) or not LOOK_ID.match(self.id):
            raise PackError(f"look id {self.id!r} must be lower snake case")
        if not isinstance(self.kind, LookKind):
            raise PackError(f"look {self.id}: kind must be a LookKind")
        if not isinstance(self.title, str) or not self.title.strip() or len(self.title) > 40:
            raise PackError(f"look {self.id}: title must be 1-40 characters")
        if not isinstance(self.renderer, str) or not self.renderer:
            raise PackError(f"look {self.id}: renderer name is required")
        if not isinstance(self.curve, StrengthCurve):
            raise PackError(f"look {self.id}: curve must be a StrengthCurve")
        try:
            object.__setattr__(self, "default_strength", validate_strength(self.default_strength))
        except PackError as error:
            raise PackError(f"look {self.id}: {error}") from error
        object.__setattr__(self, "params", _freeze_params(self.params))
        problems = forbidden_problems(self.motifs)
        if problems:
            raise PackError(f"look {self.id}: {problems[0]}")

    def amount(self, strength: float | None = None) -> float:
        """The renderer amount for a level, or for this look's default level."""
        level = self.default_strength if strength is None else strength
        return strength_amount(level, self.curve)

    def param_float(self, name: str, default: float) -> float:
        """A numeric parameter, falling back to a default."""
        value = self.params.get(name, default)
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise PackError(f"look {self.id}: parameter {name!r} must be a number")
        return float(value)

    def param_str(self, name: str, default: str) -> str:
        """A text parameter, falling back to a default."""
        value = self.params.get(name, default)
        if not isinstance(value, str):
            raise PackError(f"look {self.id}: parameter {name!r} must be text")
        return value

    def param_names(self, name: str, default: tuple[str, ...]) -> tuple[str, ...]:
        """A tuple-of-text parameter such as a motif list."""
        value = self.params.get(name, default)
        if not isinstance(value, tuple) or any(not isinstance(item, str) for item in value):
            raise PackError(f"look {self.id}: parameter {name!r} must be a tuple of text")
        return tuple(str(item) for item in value)


@dataclass(frozen=True)
class SeasonalPack:
    """All looks for one occasion plus the palette and motifs they draw from."""

    occasion: str
    title: str
    palette: Palette
    motifs: tuple[str, ...]
    looks: tuple[Look, ...]
    greeting: str

    def __post_init__(self) -> None:
        if not isinstance(self.occasion, str) or not is_occasion(self.occasion):
            raise PackError(f"pack occasion {self.occasion!r} is not a frozen occasion id")
        if not isinstance(self.palette, Palette):
            raise PackError(f"pack {self.occasion}: palette must be a Palette")
        if not self.title.strip():
            raise PackError(f"pack {self.occasion}: title is required")
        if not 1 <= len(self.looks) <= 12:
            raise PackError(f"pack {self.occasion}: needs 1-12 looks, has {len(self.looks)}")
        if any(not isinstance(look, Look) for look in self.looks):
            raise PackError(f"pack {self.occasion}: every look must be a Look")
        ids = [look.id for look in self.looks]
        duplicates = sorted({look_id for look_id in ids if ids.count(look_id) > 1})
        if duplicates:
            raise PackError(f"pack {self.occasion}: duplicate look ids {duplicates}")
        if len(set(self.motifs)) != len(self.motifs):
            raise PackError(f"pack {self.occasion}: duplicate motif ids")
        problems = forbidden_problems(self.motifs)
        if problems:
            raise PackError(f"pack {self.occasion}: {problems[0]}")
        known = set(self.motifs)
        for look in self.looks:
            missing = [motif for motif in look.motifs if motif not in known]
            if missing:
                raise PackError(
                    f"pack {self.occasion}: look {look.id} uses motifs {missing} "
                    "that the pack does not list"
                )
        if not self.greeting.strip() or len(self.greeting) > 60:
            raise PackError(f"pack {self.occasion}: greeting must be 1-60 characters")

    def look(self, look_id: str) -> Look:
        """The look with this id, or a PackError naming the valid ids."""
        for look in self.looks:
            if look.id == look_id:
                return look
        valid = ", ".join(look.id for look in self.looks)
        raise PackError(f"pack {self.occasion} has no look {look_id!r}; looks: {valid}")

    def look_ids(self) -> tuple[str, ...]:
        """Look ids in display order."""
        return tuple(look.id for look in self.looks)

    def kinds(self) -> tuple[LookKind, ...]:
        """The distinct look kinds this pack offers, in first-seen order."""
        seen: list[LookKind] = []
        for look in self.looks:
            if look.kind not in seen:
                seen.append(look.kind)
        return tuple(seen)
