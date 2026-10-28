"""R19c parametric hairline, neckline, crown and parting *illustrations*.

The effects are tonal coordinates, not segmentation, follicle synthesis, or
physical predictions. All caller-visible differences are applied subsequently
by render_style within a separately authorized hair/scalp mask. In particular,
this module must never infer the scalp from colour, age, sex, or a face image.

The spatial algorithms are independently mirrored in detailing.ts. Their
profiles are opt-in; None/"natural" yields zero for legacy recipes.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np

Edge = Literal["natural", "square", "rounded", "peaked", "asymmetric"]
Neckline = Literal["natural", "tapered", "blocked", "rounded", "v-shaped", "drop"]
Temple = Literal["natural", "close", "wide", "arched", "soft"]
Parting = Literal["none", "fine-left", "fine-right", "broad-left", "broad-right"]

EDGES: frozenset[str] = frozenset({"natural", "square", "rounded", "peaked", "asymmetric"})
NECKLINES: frozenset[str] = frozenset({"natural", "tapered", "blocked", "rounded", "v-shaped", "drop"})
TEMPLES: frozenset[str] = frozenset({"natural", "close", "wide", "arched", "soft"})
PARTINGS: frozenset[str] = frozenset({"none", "fine-left", "fine-right", "broad-left", "broad-right"})


@dataclass(frozen=True, slots=True)
class HairDetail:
    """Independent coordinates for a stylist reference; no measurements inferred.

    Values of 0..100 are *illustration knobs*, not percentages of real hair,
    millimetres of clipper length, or clinical scalp-coverage estimates.
    """

    edge: Edge = "natural"
    neckline: Neckline = "natural"
    temple: Temple = "natural"
    parting: Parting = "none"
    crown_volume: int = 0
    fringe_drop: int = 0
    texture_tightness: int = 0
    edge_softness: int = 50
    temple_width: int = 50
    nape_height: int = 50
    part_contrast: int = 50
    part_offset: int = 50
    direction: int = 0

    def validate(self) -> None:
        if self.edge not in EDGES or self.neckline not in NECKLINES:
            raise ValueError("invalid haircut line shape")
        if self.temple not in TEMPLES or self.parting not in PARTINGS:
            raise ValueError("invalid temple or parting style")
        for key in ("crown_volume", "fringe_drop", "texture_tightness", "edge_softness",
                    "temple_width", "nape_height", "part_contrast", "part_offset"):
            val = getattr(self, key)
            if type(val) is not int or not 0 <= val <= 100:
                raise ValueError(f"{key} must be an integer 0..100")
        if type(self.direction) is not int or not -100 <= self.direction <= 100:
            raise ValueError("direction must be an integer -100..100")

    def active(self) -> bool:
        return (self.edge != "natural" or self.neckline != "natural" or
                self.temple != "natural" or self.parting != "none" or
                self.crown_volume > 0 or self.fringe_drop > 0 or self.texture_tightness > 0)


def _smooth(lo: float, hi: float, value: np.ndarray) -> np.ndarray:
    t = np.clip((value - lo) / (hi - lo), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def _ridge(target: np.ndarray | float, value: np.ndarray, width: float) -> np.ndarray:
    """Continuous narrow highlight with no discontinuity at the support border."""
    return 1.0 - _smooth(width * 0.30, width, np.abs(value - target))


def _hairline(u: np.ndarray, v: np.ndarray, config: HairDetail) -> np.ndarray:
    if config.edge == "natural":
        return np.zeros_like(u)
    upper = 0.10 + (100 - config.fringe_drop) / 100.0 * 0.035
    boundary: np.ndarray = np.zeros_like(u) + upper
    if config.edge == "square":
        boundary += 0.045 * _smooth(0.70, 1.05, np.abs(u))
    elif config.edge == "rounded":
        boundary += 0.075 * u * u
    elif config.edge == "peaked":
        boundary += 0.055 * (1.0 - _smooth(0.05, 0.55, np.abs(u)))
    elif config.edge == "asymmetric":
        boundary += 0.045 * u
    width = 0.033 + (config.edge_softness / 100.0) * 0.053
    ridge = _ridge(boundary, v, width)
    width_gate = 1.0 - _smooth(0.68, 1.09, np.abs(u))
    return ridge * width_gate * (0.16 + config.fringe_drop / 100.0 * 0.17)


def _neckline(u: np.ndarray, v: np.ndarray, config: HairDetail) -> np.ndarray:
    if config.neckline == "natural":
        return np.zeros_like(u)
    offset = (config.nape_height - 50) / 100.0 * 0.23
    boundary: np.ndarray = np.zeros_like(u) + 1.23 + offset
    if config.neckline == "tapered":
        boundary -= 0.09 * np.abs(u)
    elif config.neckline == "rounded":
        boundary -= 0.12 * u * u
    elif config.neckline == "v-shaped":
        boundary += 0.11 * (1.0 - np.abs(u))
    elif config.neckline == "drop":
        boundary += 0.07 * _smooth(0.33, 0.93, np.abs(u))
    elif config.neckline == "blocked":
        boundary += 0.0
    width = 0.045 + config.edge_softness / 100.0 * 0.045
    line = _ridge(boundary, v, width)
    return 0.32 * line * (1.0 - _smooth(0.75, 1.13, np.abs(u)))


def _temple(u: np.ndarray, v: np.ndarray, config: HairDetail) -> np.ndarray:
    if config.temple == "natural":
        return np.zeros_like(u)
    width = 0.23 + config.temple_width / 100.0 * 0.20
    distance = np.abs(np.abs(u) - (0.89 if config.temple != "wide" else 0.78))
    gate = 1.0 - _smooth(width * 0.25, width, distance)
    if config.temple == "close":
        longitudinal = 1.0 - _smooth(0.37, 0.86, np.abs(v - 0.50))
    elif config.temple == "arched":
        longitudinal = _ridge(0.48 + 0.13 * u * u, v, 0.36)
    elif config.temple == "soft":
        longitudinal = 1.0 - _smooth(0.35, 1.20, np.abs(v - 0.64))
    else:
        longitudinal = 1.0 - _smooth(0.43, 1.10, np.abs(v - 0.63))
    return 0.30 * gate * longitudinal


def _parting(u: np.ndarray, v: np.ndarray, config: HairDetail) -> np.ndarray:
    if config.parting == "none":
        return np.zeros_like(u)
    side = -1.0 if config.parting.endswith("left") else 1.0
    spread = 0.15 + config.part_offset / 100.0 * 0.25
    drift = 0.10 * (config.direction / 100.0) * _smooth(0.03, 0.58, v)
    line = side * spread + drift
    broad = config.parting.startswith("broad")
    width = (0.060 if broad else 0.023) + config.edge_softness / 100.0 * 0.025
    upper_gate = 1.0 - _smooth(0.28, 0.83, v)
    line_response = _ridge(line, u, width)
    return (0.20 + config.part_contrast / 100.0 * 0.40) * line_response * upper_gate


def _crown(u: np.ndarray, v: np.ndarray, config: HairDetail) -> np.ndarray:
    if config.crown_volume == 0:
        return np.zeros_like(u)
    x = u * (1.0 + config.direction / 100.0 * 0.13)
    ellipse = np.sqrt((x / 0.75) ** 2 + ((v - 0.24) / 0.46) ** 2)
    return (config.crown_volume / 100.0) * 0.32 * (1.0 - _smooth(0.22, 1.0, ellipse))


def _fringe(u: np.ndarray, v: np.ndarray, config: HairDetail) -> np.ndarray:
    if config.fringe_drop == 0:
        return np.zeros_like(u)
    line = 0.13 + config.fringe_drop / 100.0 * 0.27 + (config.direction / 100.0) * u * 0.06
    transverse = 1.0 - _smooth(0.48, 1.04, np.abs(u))
    return 0.26 * (config.fringe_drop / 100.0) * _ridge(line, v, 0.14) * transverse


def _texture(u: np.ndarray, v: np.ndarray, width: int, height: int, config: HairDetail) -> np.ndarray:
    if config.texture_tightness == 0:
        return np.zeros_like(u)
    yy, xx = np.mgrid[0:height, 0:width]
    # Integer arithmetic ensures no entropy source and identical Python/TS parity.
    phase = config.direction + 100
    a = (xx * (7 + config.texture_tightness // 20) + yy * 11 + phase * 3) % 61
    b = (xx * 13 + yy * (3 + config.texture_tightness // 25) + phase * 7) % 47
    variation = (a / 60.0 * 0.55 + b / 46.0 * 0.45)
    volume = (1.0 - _smooth(0.33, 0.96, np.abs(u))) * (1.0 - _smooth(0.54, 1.08, v))
    return 0.25 * (config.texture_tightness / 100.0) * variation * volume


def detail_field(u: np.ndarray, v: np.ndarray, width: int, height: int,
                 config: HairDetail) -> np.ndarray:
    """Return a bounded intensity guide, independent of masks and source pixels.

    The MAX operator is intentional: independent lines may cross without
    additive intensity spikes.  A caller must still multiply by its validated
    support mask, so a synthetic fringe cannot draw hair on a real forehead.
    """
    config.validate()
    if u.shape != (height, width) or v.shape != (height, width):
        raise ValueError("detail grids must match image dimensions")
    if not config.active():
        return np.zeros((height, width), dtype=np.float64)
    fields = (
        _hairline(u, v, config), _neckline(u, v, config),
        _temple(u, v, config), _parting(u, v, config),
        _crown(u, v, config), _fringe(u, v, config),
        _texture(u, v, width, height, config),
    )
    result = np.max(np.stack(fields, axis=0), axis=0)
    return np.clip(result, 0.0, 1.0)
