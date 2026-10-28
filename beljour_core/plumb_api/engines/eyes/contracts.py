"""Validated contracts for the local eyes, lashes and liner simulations.

All lengths are relative to the measured eye width unless a trace provides its own
length. There are no trained parameters, inferred ages, or product efficacy claims.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

import numpy as np

FEATURES = ("W59", "W60", "W61", "W62", "W63", "W64", "W65", "W66", "W67", "W75", "W76")
FEATURE_STYLES = {
    "W59": ("classic", "hybrid", "volume", "mega"),
    "W60": ("cat", "doll", "wispy", "kitten", "fox"),
    "W61": ("lifting", "tint"), "W62": ("strip", "cluster", "half_strip"),
    "W63": ("lengthening", "volumising", "tubing"),
    "W64": ("wing", "batwing", "tightline", "soft_wing"),
    "W65": ("floating", "double_wing", "smoked_pencil", "gel", "shadow"),
    "W66": ("cut_crease", "halo", "smokey"), "W67": ("foil", "duochrome"),
    "W75": (), "W76": ("navy", "burgundy", "forest"),
}
ANATOMIES = ("open", "hooded", "monolid", "deep_set")
SIDES = ("right", "left")
MAX_PIXELS = 4_194_304
MAX_LASHES = 256
LABEL = "Local eye simulation. Placement and colour are estimates, not a product result."
VERSION = "eyes-r15b/1"


@dataclass(frozen=True)
class LashTrace:
    side: str
    points: tuple[tuple[float, float], ...]
    lower: bool = False
    confidence: float = 1.0


@dataclass(frozen=True)
class EyeRequest:
    feature: str
    amount: float = 0.65
    style: str = ""
    anatomy: Mapping[str, str] = field(default_factory=lambda: {"right": "open", "left": "open"})
    colour: tuple[int, int, int] = (38, 31, 30)
    secondary_colour: tuple[int, int, int] = (103, 150, 118)
    observed_lashes: tuple[LashTrace, ...] = ()
    natural_density: float | None = None
    curl: float = 0.55
    length: float = 0.19
    thickness: float = 0.012
    blend: float = 0.35
    angle: float = 0.0
    transparency: float = 0.35
    smudge: float = 0.0
    lower: bool = False
    glasses_clearance: float | None = None
    skin_depth: float | None = None
    seed: int = 17


@dataclass
class EyeResult:
    image: np.ndarray
    coverage: np.ndarray
    report: dict[str, Any]


def number(value: Any, name: str, low: float, high: float) -> float:
    if isinstance(value, (bool, str)):
        raise ValueError(f"{name} must be a finite number")
    try:
        out = float(value)
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError(f"{name} must be a finite number") from exc
    if not math.isfinite(out) or not low <= out <= high:
        raise ValueError(f"{name} must be in {low}..{high}")
    return out


def rgb(value: Any, name: str) -> tuple[int, int, int]:
    if not isinstance(value, (list, tuple)) or len(value) != 3:
        raise ValueError(f"{name} must contain three byte channels")
    channels = tuple(number(v, name, 0, 255) for v in value)
    if any(v != int(v) for v in channels):
        raise ValueError(f"{name} must contain integer byte channels")
    return int(channels[0]), int(channels[1]), int(channels[2])


def trace(value: Any) -> LashTrace:
    if not isinstance(value, Mapping):
        raise ValueError("lash trace must be an object")
    if set(value) - {"side", "points", "lower", "confidence"}:
        raise ValueError("unknown lash trace field")
    side = value.get("side")
    if side not in SIDES:
        raise ValueError("lash trace side must be right or left")
    source = value.get("points")
    if not isinstance(source, (list, tuple)) or not 2 <= len(source) <= 64:
        raise ValueError("lash trace needs 2..64 observed points")
    points = []
    for point in source:
        if not isinstance(point, (list, tuple)) or len(point) != 2:
            raise ValueError("lash trace points must be pairs")
        points.append((number(point[0], "trace x", 0, 1), number(point[1], "trace y", 0, 1)))
    if sum(math.dist(a, b) for a, b in zip(points, points[1:], strict=False)) <= 1e-8:
        raise ValueError("lash trace must have nonzero length")
    lower = value.get("lower", False)
    if not isinstance(lower, bool):
        raise ValueError("lower must be a boolean")
    return LashTrace(str(side), tuple(points), lower, number(value.get("confidence", 1), "confidence", 0, 1))


def parse_request(value: Mapping[str, Any] | EyeRequest) -> EyeRequest:
    if isinstance(value, EyeRequest):
        from dataclasses import asdict
        value = asdict(value)
    if not isinstance(value, Mapping):
        raise ValueError("eye request must be an object")
    fields = set(EyeRequest.__dataclass_fields__)
    if set(value) - fields:
        raise ValueError("unknown eye request field")
    feature = value.get("feature")
    if feature not in FEATURES:
        raise ValueError("unsupported eye feature")
    style = value.get("style", "")
    if not isinstance(style, str) or len(style) > 40:
        raise ValueError("style must be a short identifier")
    if style and style not in FEATURE_STYLES[str(feature)]:
        raise ValueError("unsupported style for this eye feature")
    anatomy = value.get("anatomy", {"right": "open", "left": "open"})
    if not isinstance(anatomy, Mapping) or set(anatomy) != set(SIDES):
        raise ValueError("anatomy needs right and left selections")
    if any(v not in ANATOMIES for v in anatomy.values()):
        raise ValueError("unsupported eye anatomy")
    lower = value.get("lower", False)
    if not isinstance(lower, bool):
        raise ValueError("lower must be a boolean")
    observed = value.get("observed_lashes", ())
    if not isinstance(observed, (list, tuple)) or len(observed) > MAX_LASHES:
        raise ValueError("observed lash list is too large")
    seed = number(value.get("seed", 17), "seed", 0, 2**32 - 1)
    if seed != int(seed):
        raise ValueError("seed must be an integer")
    optional = {}
    for key in ("natural_density", "skin_depth", "glasses_clearance"):
        item = value.get(key)
        optional[key] = None if item is None else number(item, key, 0, 1)
    return EyeRequest(
        feature=str(feature), style=style, anatomy=dict(anatomy), lower=lower,
        observed_lashes=tuple(trace(v) for v in observed), seed=int(seed),
        colour=rgb(value.get("colour", (38, 31, 30)), "colour"),
        secondary_colour=rgb(value.get("secondary_colour", (103, 150, 118)), "secondary_colour"),
        amount=number(value.get("amount", .65), "amount", 0, 1),
        curl=number(value.get("curl", .55), "curl", 0, 1),
        length=number(value.get("length", .19), "length", .02, .4),
        thickness=number(value.get("thickness", .012), "thickness", .002, .05),
        blend=number(value.get("blend", .35), "blend", 0, 1),
        angle=number(value.get("angle", 0), "angle", -90, 90),
        transparency=number(value.get("transparency", .35), "transparency", 0, 1),
        smudge=number(value.get("smudge", 0), "smudge", 0, 1),
        **optional,
    )


def validate_photo(image: Any) -> np.ndarray:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8:
        raise ValueError("eye photo must be a uint8 array")
    if image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError("eye photo must be RGB or RGBA")
    h, w = image.shape[:2]
    if min(h, w) < 8 or h * w > MAX_PIXELS:
        raise ValueError("eye photo needs at least 8 pixels per side and at most 4 MP")
    return image


def validate_points(points: Any) -> np.ndarray:
    try:
        out = np.asarray(points, dtype=np.float64)
    except (TypeError, ValueError) as exc:
        raise ValueError("landmarks must be finite normalized points") from exc
    if out.shape not in ((468, 2), (478, 2)):
        raise ValueError("eye engine needs 468 or 478 two-dimensional landmarks")
    if not np.all(np.isfinite(out)) or np.any(out < -.25) or np.any(out > 1.25):
        raise ValueError("landmarks must be finite and close to the image")
    return out.copy()


def polyline_length(points: Sequence[Sequence[float]]) -> float:
    return sum(math.dist(a, b) for a, b in zip(points, points[1:], strict=False))
