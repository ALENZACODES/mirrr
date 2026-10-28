"""R18 mask-limited short-sides length/grade guide.

The geometry is an explicitly parametric *illustration*, not a physical prediction.
Each value is a normalized clipper-grade guide (0..4) relative to head landmarks.
The caller's independent, licensed hair/scalp mask is the only pixel authorization.
No facial features, identities, biological characteristics or lengths in millimetres
are inferred. The matching TypeScript implementation is graded.ts.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Literal

import numpy as np

if TYPE_CHECKING:
    from .render import HairAnchors

FadeShape = Literal["classic", "skin", "drop", "burst", "temple", "shadow"]
FADE_SHAPES: frozenset[str] = frozenset({"classic", "skin", "drop", "burst", "temple", "shadow"})
FADE_STARTS: dict[str, float] = {"low": 0.80, "mid": 0.62, "high": 0.43}


@dataclass(frozen=True, slots=True)
class GradedField:
    """Arrays have image shape, are finite and allocated fresh for each render."""

    grade: np.ndarray
    blend: np.ndarray
    side: np.ndarray
    transition: np.ndarray


def _ease(low: float | np.ndarray, high: float | np.ndarray, value: np.ndarray) -> np.ndarray:
    t = np.clip((value - low) / (high - low), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def _frame(width: int, height: int, anchors: HairAnchors) -> tuple[np.ndarray, np.ndarray]:
    # Matches the original headFrame algebra exactly, using pixel centres.
    yy, xx = np.mgrid[:height, :width]
    centre = (anchors.left_temple[0] + anchors.right_temple[0]) / 2.0
    half = max((anchors.right_temple[0] - anchors.left_temple[0]) / 2.0, 0.01)
    ear = (anchors.left_ear[1] + anchors.right_ear[1]) / 2.0
    u = ((xx + 0.5) / width - centre) / half
    v = ((yy + 0.5) / height - anchors.crown[1]) / max(ear - anchors.crown[1], 0.01)
    return u, v


def _side_gate(u: np.ndarray, shape: FadeShape) -> np.ndarray:
    side = _ease(0.34, 0.94, np.abs(u))
    if shape == "temple":
        # The temple is in front of the ear, so avoid darkening centre or neck.
        temple = 1.0 - _ease(0.08, 0.48, np.abs(np.abs(u) - 0.94))
        return np.clip(side * (0.35 + 0.65 * temple), 0.0, 1.0)
    if shape == "burst":
        # Arc around each ear in frontal projection; no invented rear scalp pixels.
        around_ear = 1.0 - _ease(0.12, 0.65, np.abs(np.abs(u) - 1.04))
        return np.clip(side * (0.28 + 0.72 * around_ear), 0.0, 1.0)
    return side


def graded_field(width: int, height: int, anchors: HairAnchors, *,
                 fade: str, shape: FadeShape = "classic", side_grade: int = 1,
                 top_grade: int = 4, blend_width: int = 45) -> GradedField:
    """Calculate a monotone graded transition from crown/top toward ear/nape.

    The mask is NOT reconstructed from these values; none of the arrays grants
    permission to modify a pixel. Fade height is a per-column control and
    grade never increases as image y increases. A skin grade means only a
    stronger *tonal* indication of shorter sides, not baldness removal.
    """
    if (type(width) is not int or type(height) is not int or width < 8 or height < 8 or
            width * height > 24_000_000):
        raise ValueError("grade map needs bounded positive image dimensions")
    anchors.validate()
    if fade not in FADE_STARTS or shape not in FADE_SHAPES:
        raise ValueError("unsupported fade placement or shape")
    if (type(side_grade) is not int or type(top_grade) is not int or
            not 0 <= side_grade < top_grade <= 4):
        raise ValueError("graded sides must progress from grade 0..3 to a higher top grade")
    if type(blend_width) is not int or not 1 <= blend_width <= 100:
        raise ValueError("blend width must be an integer in 1..100")
    if shape == "skin" and side_grade != 0:
        raise ValueError("skin fade starts at grade zero")
    u, v = _frame(width, height, anchors)
    start: float | np.ndarray = FADE_STARTS[fade]
    if shape == "drop":
        # A relative downward curve toward the centre line; no 3-D back view.
        start = start + 0.13 * (1.0 - _ease(0.28, 0.93, np.abs(u)))
    elif shape == "burst":
        start = start - 0.07
    elif shape == "temple":
        start = start + 0.045
    elif shape == "shadow":
        start = start + 0.10
    width_n = 0.065 + 0.0016 * blend_width
    # Strictly monotone because cubic smoothstep is increasing on every column.
    progress = _ease(start - width_n, start + width_n, v)
    grade = top_grade + (side_grade - top_grade) * progress
    gate = _side_gate(u, shape)
    # Mask independent modulation, intended only for explicitly authorized pixels.
    blend = progress * gate
    transition = 4.0 * progress * (1.0 - progress) * gate
    return GradedField(grade, blend, gate, transition)


def fade_grade_map(width: int, height: int, anchors: HairAnchors, *,
                   fade: str, shape: FadeShape = "classic", side_grade: int = 1,
                   top_grade: int = 4, blend_width: int = 45) -> np.ndarray:
    """Public grade-map contract, returned independently of any image or masks."""
    return graded_field(width, height, anchors, fade=fade, shape=shape,
                        side_grade=side_grade, top_grade=top_grade,
                        blend_width=blend_width).grade


def grade_diagnostics(result: GradedField) -> dict[str, float | bool]:
    """Honest geometric diagnostics; never an on-face accuracy result."""
    d = np.diff(result.grade, axis=0)
    return {
        "grade_min": float(result.grade.min()),
        "grade_max": float(result.grade.max()),
        "bottom_is_shorter": bool(np.all(d <= 1e-12)),
        "blend_coverage": float(np.mean(result.blend)),
        "transition_coverage": float(np.mean(result.transition)),
    }
