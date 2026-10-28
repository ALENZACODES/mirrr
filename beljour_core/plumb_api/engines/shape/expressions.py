"""Closed-mouth expressions: neutral and serious (feature 8), surprise, soft smile and raised
brows (feature 46), as named settings of the face part controls.

Each expression is a fixed set of part amounts (``expressions.json``) run through the guarded
part warp in ``parts.py``: the same hull regions, fixed pin ring, 6%-IOD movement cap, 12%
eye-opening cap, fold guard and identity proxy. Only existing pixels move; nothing is drawn, so
an expression that needs new content (open-mouth laugh with teeth, a closed eye for a wink) is
not offered. The photo's mouth must be closed (lip gap under ``OPEN_MOUTH_RATIO`` of the mouth
width) and the warp may not widen that gap. Every result is labelled an expression
simulation. Face-mapping inspiration: FLAME (expression kept apart from identity shape as its
own parameters); concept only, no code copied. Mesh index layout: MediaPipe Face Landmarker
(runtime data). Mirrored in ``web/src/engines/shape/expressions.ts``; shared vectors in
``api/tests/goldens/expressions.json``. Author: John Khan.
"""
from __future__ import annotations

import json
import math
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..core import regions
from . import parts
from .geometry import check_face

TABLE = json.loads(Path(__file__).with_name("expressions.json").read_text(encoding="utf-8"))
EXPRESSIONS: dict[str, dict[str, Any]] = {row["id"]: row for row in TABLE["expressions"]}
LABEL = str(TABLE["label"])
VERSION = "expressions/1"
OPEN_MOUTH_RATIO = 0.12     # lip gap over mouth width above which the mouth counts as open; ASSUMED
GAP_TOLERANCE = 1e-6        # pixels the warp may widen the lip gap by (float noise only)

REFUSALS = {
    "unknown_expression": "That expression is not in this set.",
    "mouth_open": "These expressions keep the mouth closed, and the mouth in this photo is open.",
    "mouth_opened": "This change would open the mouth, so it was not applied.",
}


class ExpressionRefusal(ValueError):
    """A coded refusal; part refusals (crowded, eye closed, fold guard...) keep their own codes."""

    def __init__(self, code: str) -> None:
        if code not in REFUSALS:
            raise ValueError(f"unknown expression refusal code {code!r}")
        self.code = code
        super().__init__(REFUSALS[code])


@dataclass(frozen=True)
class ExpressionOutcome:
    image: NDArray[np.uint8]
    targets: NDArray[np.float64]
    expression: str
    values: dict[str, float]
    metrics: dict[str, Any]
    labels: tuple[str, ...]


def lip_gap(points: NDArray[np.float64]) -> float:
    """Distance in pixels between the upper and lower inner lip centres."""
    a, b = regions.MOUTH_LIPS[:2]
    return float(np.hypot(*(points[b] - points[a])))


def mouth_gap(points: NDArray[np.float64]) -> float:
    """Lip gap over mouth width (inner lip centres over the two mouth corners)."""
    c, d = regions.MOUTH_LIPS[2:]
    width = float(np.hypot(*(points[d] - points[c])))
    return lip_gap(points) / width if width > 1e-9 else 0.0


def values_for(expression: str, amount: float = 100.0) -> dict[str, float]:
    """The part amounts of an expression at `amount` percent (0..100) of full expression."""
    if expression not in EXPRESSIONS:
        raise ExpressionRefusal("unknown_expression")
    if isinstance(amount, bool) or not isinstance(amount, (int, float)) or not math.isfinite(amount) or not 0 <= amount <= 100:
        raise ValueError("expression amount must be 0..100")
    return {name: float(v) * amount / 100.0 for name, v in EXPRESSIONS[expression]["values"].items()}


def render(image: NDArray[np.uint8], face: object, expression: str, *, amount: float = 100.0,
           strength: float = 1.0) -> ExpressionOutcome:
    """Guarded expression preview, or a coded refusal; the input image is never written."""
    src = check_face(face)
    values = values_for(expression, amount)
    ratio = mouth_gap(src)
    if ratio > OPEN_MOUTH_RATIO:
        raise ExpressionRefusal("mouth_open")
    out = parts.render(image, src, values, strength=strength, opted_in=True)
    before, after = lip_gap(src), lip_gap(out.targets)
    if after > before + GAP_TOLERANCE:
        raise ExpressionRefusal("mouth_opened")
    metrics = {**out.metrics, "expression": expression, "amount": amount, "mouth_gap_ratio": ratio,
               "lip_gap_before_px": before, "lip_gap_after_px": after}
    return ExpressionOutcome(out.image, out.targets, expression, values, metrics, (parts.SIMULATION, LABEL))


def catalogue(feature: int | None = None) -> list[Mapping[str, Any]]:
    return [row for row in TABLE["expressions"] if feature is None or row["feature"] == feature]
