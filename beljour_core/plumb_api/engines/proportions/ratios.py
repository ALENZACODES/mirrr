"""E10 proportion checks on the 478-point mesh against a chosen reference set (J7 start).

Eight measured ratios (anatomy.RATIOS): face thirds and fifths, face length to width,
mouth to nose width, eye width and nose width to the gap between the eyes, nose-to-mouth
against mouth-to-chin, and upper to lower lip. Vertical lengths are measured along the
fitted midline and the fifths across it, so a tilted head (roll) reads the same; widths of
features are straight-line distances. Three reference sets: "golden" (phi), "classical"
(the neoclassical canons) and "custom" (the user's own numbers). A set may say nothing
about a ratio; then there is no comparison.

This describes the photo's geometry. It is never a score and never advice: a difference
from a reference is a measurement, and faces vary. The upper third starts at the mesh top
(upper forehead), not the hairline, so it reads short on every face; the copy says so.

Face-mapping credits (licences.json "concepts"): runtime data from MediaPipe Face
Landmarker (Bucket A); concept only, no code copied: Farkas anthropometry (thirds, fifths
and the neoclassical canons) and YouCam API documentation (the golden-ratio pairs Plumb
showed), from the book and the docs. Mirrored in `web/src/engines/proportions/ratios.ts`.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..core.refusal import DegenerateInput, Refusal
from . import anatomy
from .symmetry import Line, fit_midline, mesh

Floats = NDArray[np.float64]
Value = float | list[float]
CLOSE_PERCENT = 3.0
NOTICEABLE_PERCENT = 8.0


@dataclass(frozen=True)
class RatioMeasure:
    key: str
    label: str
    parts: str
    value: Value
    reference: Value | None
    difference_percent: float | None
    plain: str

    def to_json(self) -> dict[str, object]:
        return dict(self.__dict__)


@dataclass(frozen=True)
class ProportionReport:
    reference_set: str
    midline: Line
    ratios: tuple[RatioMeasure, ...]
    note: str

    def ratio(self, key: str) -> RatioMeasure:
        for r in self.ratios:
            if r.key == key:
                return r
        raise KeyError(key)


NOTE = ("Measured on the face mesh in this photo. Faces vary; a difference from a reference is not a problem "
        "to fix, and nothing here is a score. The upper third starts at the top of the mesh, not the hairline.")


def _distance(p: Floats, a: str, b: str) -> float:
    lm = anatomy.LANDMARKS
    return float(np.hypot(*(p[lm[b]] - p[lm[a]])))


def measure_values(points: object) -> tuple[Line, dict[str, Value]]:
    """The raw ratio values (and the midline used) for a pixel-space mesh."""
    p = mesh(points)
    lm = anatomy.LANDMARKS
    line = fit_midline(p)
    origin = np.array([line.cx, line.cy])

    def along(*names: str) -> float:
        q = np.mean([p[lm[n]] for n in names], axis=0)
        return float(line.frame(q - origin)[1])

    def across(name: str) -> float:
        return float(line.frame(p[lm[name]] - origin)[0])

    top, brow, base, chin = along("mesh_top"), along("brow_mid"), along("subnasale"), along("chin")
    stomion = along("stomion_upper", "stomion_lower")
    length = chin - top
    if length <= 1e-9:
        raise DegenerateInput("no_face_length", "the face has no length; the mesh is degenerate")
    thirds = [(brow - top) / length, (base - brow) / length, (chin - base) / length]
    edges = [across(n) for n in ("right_face_edge", "right_eye_outer", "right_eye_inner", "left_eye_inner",
                                 "left_eye_outer", "left_face_edge")]
    width = edges[-1] - edges[0]
    if width <= 1e-9:
        raise DegenerateInput("no_face_width", "the face has no width; the mesh is degenerate")
    fifths = [(b - a) / width for a, b in zip(edges, edges[1:], strict=False)]
    gap = _distance(p, "right_eye_inner", "left_eye_inner")
    nose = _distance(p, "right_ala", "left_ala")
    if gap <= 1e-9 or nose <= 1e-9:
        raise DegenerateInput("eyes_coincide", "eye gap and nose width must be positive")
    eye = (_distance(p, "right_eye_outer", "right_eye_inner") + _distance(p, "left_eye_inner", "left_eye_outer")) / 2
    lower_lip = along("lower_lip_bottom") - along("stomion_lower")
    values: dict[str, Value] = {
        "thirds": thirds,
        "fifths": fifths,
        "face_length_width": length / width,
        "mouth_nose_width": _distance(p, "right_mouth", "left_mouth") / nose,
        "eye_width_gap": eye / gap,
        "nose_width_gap": nose / gap,
        "lips_chin": (stomion - base) / (chin - stomion),
        "upper_lower_lip": (along("stomion_upper") - along("upper_lip_top")) / lower_lip if lower_lip > 1e-9 else math.inf,
    }
    return line, values


def difference(value: Value, reference: Value) -> float:
    """Percent difference for a single ratio; for shares, the largest share gap in points."""
    if isinstance(value, list) and isinstance(reference, list):
        if len(value) != len(reference):
            raise ValueError("reference must have one share per part")
        total = sum(reference)
        gaps = [100 * (v - r / total) for v, r in zip(value, reference, strict=True)]
        return max(gaps, key=abs)
    if isinstance(value, list) or isinstance(reference, list):
        raise ValueError("a share list needs a share list reference")
    return 100 * (value - reference) / reference


def plain(key: str, diff: float | None) -> str:
    if diff is None:
        return "This reference set has no value for this ratio."
    size = abs(diff)
    if size < CLOSE_PERCENT:
        return "Close to the reference."
    amount = "a little" if size < NOTICEABLE_PERCENT else "noticeably"
    if key in ("thirds", "fifths"):
        return f"One part is {amount} {'larger' if diff > 0 else 'smaller'} than an even split."
    return f"{amount.capitalize()} {'above' if diff > 0 else 'below'} the reference."


def check_custom(custom: Mapping[str, Value]) -> dict[str, Value]:
    out: dict[str, Value] = {}
    for key, value in custom.items():
        if key not in anatomy.RATIOS:
            raise ValueError(f"unknown ratio {key!r}")
        if key in ("thirds", "fifths"):
            parts = 3 if key == "thirds" else 5
            if not isinstance(value, (list, tuple)) or len(value) != parts or \
                    not all(isinstance(v, (int, float)) and math.isfinite(v) and v > 0 for v in value):
                raise ValueError(f"{key} needs {parts} positive numbers")
            out[key] = [float(v) for v in value]
        else:
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not (math.isfinite(value) and value > 0):
                raise ValueError(f"{key} needs one positive number")
            out[key] = float(value)
    return out


def measure(points: object, reference_set: str = "golden", custom: Mapping[str, Value] | None = None) -> ProportionReport:
    if reference_set not in anatomy.REFERENCE_SETS:
        raise ValueError(f"reference_set must be one of {', '.join(anatomy.REFERENCE_SETS)}")
    mine = check_custom(custom or {})
    line, values = measure_values(points)
    out = []
    for key, (label, parts, refs) in anatomy.RATIOS.items():
        reference = mine.get(key) if reference_set == "custom" else refs.get(reference_set)
        value = values[key]
        diff = None
        if reference is not None and not (isinstance(value, float) and not math.isfinite(value)):
            diff = difference(value, reference)
        out.append(RatioMeasure(key, label, parts, value, reference, diff, plain(key, diff)))
    return ProportionReport(reference_set, line, tuple(out), NOTE)


def measure_checked(points: object, reference_set: str = "golden",
                    custom: Mapping[str, Value] | None = None) -> ProportionReport | Refusal:
    """Typed refusal for a malformed mesh; does not change legacy measure().

    The frozen benchmark consumes this without letting a missing measure
    disappear from its denominator or from subgroup counts.
    """
    try:
        return measure(points, reference_set, custom)
    except DegenerateInput as exc:
        return Refusal("proportions", exc.code, str(exc))
    except (TypeError, ValueError, FloatingPointError) as exc:
        return Refusal("proportions", "invalid_geometry", str(exc)[:120])
