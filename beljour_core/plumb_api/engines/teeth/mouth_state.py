"""Mesh-observed open-mouth state for conservative local teeth previews.

Mouth closure uses vertical inner-lip separation divided by corner-to-corner
width, never pixel brightness or presumed demographics. The threshold is
ASSUMED and must be assessed on authorized faces before release.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np

from ..core import regions
from .whiten import Result, whiten

State = Literal["open", "closed"]
CLOSED_GAP_RATIO = 0.04


@dataclass(frozen=True)
class Observation:
    state: State
    gap_ratio: float
    reason_code: str

    @property
    def not_applicable(self) -> bool:
        return self.state == "closed"


def observe(points: np.ndarray) -> Observation:
    """Observe an input mesh measured in pixels (or consistent normalized units)."""
    vertices = np.asarray(points, dtype=np.float64)
    if (vertices.ndim != 2 or vertices.shape[0] not in (468, 478)
            or vertices.shape[1] < 2 or not np.isfinite(vertices).all()):
        raise ValueError("mouth observation requires finite 468/478-point landmarks")
    upper, lower = vertices[13, :2], vertices[14, :2]
    left, right = vertices[61, :2], vertices[291, :2]
    width = float(np.linalg.norm(right - left))
    if width <= 1e-9:
        raise ValueError("mouth observation requires a measurable lip width")
    gap = lower - upper
    span = right - left
    perpendicular_gap = abs(float(span[0] * gap[1] - span[1] * gap[0])) / width
    ratio = perpendicular_gap / width
    state: State = "closed" if ratio < CLOSED_GAP_RATIO else "open"
    return Observation(state, ratio, "mouth_closed" if state == "closed" else "observed_open")


def render(image: np.ndarray, points: np.ndarray, *, strength: float = 100.0) -> Result:
    """Select a safe mouth opening from the mesh, then apply the local renderer."""
    observation = observe(points)
    if observation.not_applicable:
        return whiten(image, np.zeros(image.shape[:2], dtype=np.float32),
                             strength=strength, mouth_state="closed")
    opening = regions.region_mask("mouth_opening", points, image.shape[0], image.shape[1],
                                  normalized=False)
    return whiten(image, opening, strength=strength, mouth_state="open")
