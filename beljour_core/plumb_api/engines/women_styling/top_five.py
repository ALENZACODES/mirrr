"""W39/W98/W28 opt-in pixel simulations with explicit caller-owned masks.

No face or curl classification, geometric warp, external API or automatic beauty
correction is performed. W39 protects texture luminance, W28 limits first-session
lift, and W98 may deliberately report an unfavourable lighting scenario.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from .geometry import checked_frame

ByteFrame = NDArray[np.uint8]
Feature = Literal["W39", "W98", "W28"]
Lighting = Literal["daylight", "office", "evening", "flash"]


@dataclass(frozen=True, slots=True)
class BrushStroke:
    start_x: float
    start_y: float
    end_x: float
    end_y: float
    radius: float

    def validate(self) -> None:
        values = (self.start_x, self.start_y, self.end_x, self.end_y, self.radius)
        if not all(isinstance(v, (int, float)) and isfinite(v) for v in values):
            raise ValueError("Brush coordinates must be finite")
        if not all(0 <= v <= 1 for v in values[:4]):
            raise ValueError("Brush positions must be normalized to 0..1")
        if not 0.015 <= self.radius <= 0.35:
            raise ValueError("Brush radius outside 0.015..0.35")


@dataclass(frozen=True, slots=True)
class TopFiveRequest:
    feature: Feature
    strength: int = 55
    rgb: tuple[int, int, int] = (132, 113, 106)
    lighting: Lighting = "daylight"
    base_depth: int = 5
    previously_coloured: bool = False
    strokes: tuple[BrushStroke, ...] = ()

    def validate(self) -> None:
        if self.feature not in ("W39", "W98", "W28"):
            raise ValueError("Unknown W feature")
        if type(self.strength) is not int or not 0 <= self.strength <= 100:
            raise ValueError("Strength must be an integer 0..100")
        if len(self.rgb) != 3 or any(type(v) is not int or not 0 <= v <= 255 for v in self.rgb):
            raise ValueError("User RGB swatch must contain three uint8 channels")
        if self.lighting not in ("daylight", "office", "evening", "flash"):
            raise ValueError("Unknown lighting mode")
        if type(self.base_depth) is not int or not 1 <= self.base_depth <= 10:
            raise ValueError("Base depth must be 1..10")
        if type(self.previously_coloured) is not bool:
            raise ValueError("Colour history must be explicit")
        if len(self.strokes) > 12:
            raise ValueError("At most 12 user strokes are supported")
        for stroke in self.strokes:
            stroke.validate()
        if self.feature == "W28" and not self.strokes:
            raise ValueError("W28 needs an explicitly painted hair placement")


@dataclass(frozen=True, slots=True)
class EditEvidence:
    feature: Feature
    changed_pixels: int
    outside_mask_changed: int
    changed_alpha: int
    max_channel_delta: int
    silhouette_preserved: bool
    still_her_score: int
    visible_risk: bool
    max_first_session_lift: int
    provider_calls: int = 0
    disclosure: str = "Local screen simulation; not a salon outcome or skin assessment."


@dataclass(frozen=True, slots=True)
class EditResult:
    pixels: ByteFrame
    evidence: EditEvidence


def first_session_lift(depth: int, history: bool) -> int:
    """Bound fictional preview lightness; not a chemical lift calculation."""
    if history:
        return 16
    if depth <= 4:
        return 22
    if depth <= 7:
        return 26
    return 30


def _brush_weight(x: float, y: float, stroke: BrushStroke) -> float:
    dx = stroke.end_x - stroke.start_x
    dy = stroke.end_y - stroke.start_y
    denom = dx * dx + dy * dy
    if denom < 1e-10:
        fraction = 0.0
    else:
        fraction = min(1.0, max(0.0, ((x - stroke.start_x) * dx + (y - stroke.start_y) * dy) / denom))
    px = stroke.start_x + dx * fraction
    py = stroke.start_y + dy * fraction
    distance = ((x - px) ** 2 + (y - py) ** 2) ** 0.5
    return max(0.0, 1.0 - distance / stroke.radius)


def _lighting_offset(mode: Lighting, x: float, y: float, channel: int) -> float:
    if mode == "daylight":
        return 0.0
    if mode == "office":
        return (-4.0, -2.0, 3.0)[channel] + 5.0 * (x - 0.5)
    if mode == "evening":
        return (-22.0, -17.0, -12.0)[channel] + 8.0 * (1.0 - y)
    radial = max(0.0, 1.0 - 1.7 * abs(x - 0.5) - 1.1 * abs(y - 0.35))
    return (15.0, 15.0, 16.0)[channel] + radial * 22.0


def edit_top_five(frame: ByteFrame, mask: ByteFrame, req: TopFiveRequest) -> EditResult:
    """Bounded, non-mutating RGB edit, exactly zero effect outside the mask.

    A validated opaque mask is required even for W98. Full-scene lighting only
    occurs when the caller authorizes a full-scene mask. Alpha never changes.
    Geometry and spatial sampling are untouched: Still Her is an *identity of
    coordinates* audit, never an attractiveness score.
    """
    req.validate()
    source = checked_frame(frame)
    h, w, channels = source.shape
    if not isinstance(mask, np.ndarray) or mask.shape != (h, w) or mask.dtype != np.uint8:
        raise ValueError("A same-sized uint8 region mask must be provided")
    if not bool(np.any(mask)):
        raise ValueError("Cannot run an unmasked edit")
    result = source.copy()
    changed = 0
    outside = 0
    max_delta = 0
    risk_count = 0
    lift_cap = first_session_lift(req.base_depth, req.previously_coloured)
    target_y = (req.rgb[0] * 3 + req.rgb[1] * 6 + req.rgb[2]) // 10
    for row in range(h):
        y = row / max(1, h - 1)
        for col in range(w):
            coverage = int(mask[row, col])
            if coverage == 0 or req.strength == 0:
                continue
            x = col / max(1, w - 1)
            power = coverage * req.strength / 25500.0
            if req.feature == "W28":
                brush = max(_brush_weight(x, y, stroke) for stroke in req.strokes)
                power *= brush
            pixel_changed = False
            source_y = (
                int(source[row, col, 0]) * 3
                + int(source[row, col, 1]) * 6
                + int(source[row, col, 2])
            ) / 10.0
            for channel in range(3):
                original = int(source[row, col, channel])
                if req.feature == "W39":
                    # An affine source-luminance term preserves strand order.
                    # Chroma-only renders could not produce requested dark shades.
                    chroma_shift = (req.rgb[channel] - target_y) * 0.75
                    luminance_shift = (target_y - source_y) * 0.45
                    desired = original + (chroma_shift + luminance_shift) * power
                    limit = 36
                elif req.feature == "W28":
                    desired = original + lift_cap * power
                    limit = lift_cap
                else:
                    desired = original + _lighting_offset(req.lighting, x, y, channel) * power
                    limit = 40
                rounded = int(np.floor(min(255.0, max(0.0, desired)) + 0.5))
                bounded = max(original - limit, min(original + limit, rounded))
                result[row, col, channel] = bounded
                delta = abs(bounded - original)
                max_delta = max(max_delta, delta)
                pixel_changed |= delta > 0
                if req.feature == "W98" and (bounded < 25 or bounded > 244):
                    risk_count += 1
            if pixel_changed:
                changed += 1
                if coverage == 0:
                    outside += 1
    alpha_changed = int(np.count_nonzero(result[..., 3] != source[..., 3])) if channels == 4 else 0
    structure_preserved = outside == 0 and alpha_changed == 0
    return EditResult(
        result,
        EditEvidence(
            feature=req.feature,
            changed_pixels=changed,
            outside_mask_changed=outside,
            changed_alpha=alpha_changed,
            max_channel_delta=max_delta,
            silhouette_preserved=structure_preserved,
            still_her_score=100 if structure_preserved else 0,
            visible_risk=req.feature == "W98" and risk_count > 0,
            max_first_session_lift=lift_cap if req.feature == "W28" else 0,
        ),
    )
