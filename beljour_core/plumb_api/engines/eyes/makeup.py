"""#35 Eyeshadow, eyeliner and mascara as one local eye look, on the existing eyes engine.

One call layers three of the engine's own renders, in the order a person applies them:

1. Eyeshadow: the W66 lid canvas (cut crease, halo or smokey), placed from each eye's own
   measured frame and the anatomy she picks for each eye (open, hooded, monolid, deep set).
2. Eyeliner: the W64 line along the measured upper lash line, with or without a wing.
3. Mascara: the W63 coat on lashes she has traced. The face mesh holds no lash hairs, so
   without traced lashes mascara is skipped with the code "needs_lash_trace" and no lash is
   invented (the eyes engine's own rule).

Each element has its own amount (0 leaves it out) under one strength 0-100. The eyeball
(iris and sclera) is protected by the engine, geometry never moves, the eye colour is never
changed and alpha is copied. Strength 0, or every element at 0, returns an exact copy. A
mesh no face tool should edit is refused with the core codes (engines/core/refusal.py);
closed or tiny eyes are refused with their own codes. Wrong arguments raise ValueError.

Landmarks and lash traces use the eyes engine's convention: 478 points normalised to 0..1.
The three named looks are original Beljour palettes; every colour and amount is ASSUMED
(chosen on drawn faces, not measured from products). This is the local route: it never
calls YouCam, which stays an optional styling route through providers/youcam.py only.
Local simulation, not a product result. web/src/engines/eyes/makeup.ts mirrors this file.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

import numpy as np

from ..core.refusal import Refusal, refusal_for
from .contracts import ANATOMIES, SIDES, validate_photo, validate_points
from .engine import render_eyes
from .geometry import frames
from .raster import combine

MODULE = "eyes.makeup"
LABEL = "Local eye makeup simulation. Placement and colour are estimates, not a product result."
ELEMENTS = ("shadow", "liner", "mascara")
FEATURE = {"shadow": "W66", "liner": "W64", "mascara": "W63"}
MESSAGES: dict[str, str] = {
    "zero_strength": "Strength is zero, so the photo is unchanged.",
    "nothing_chosen": "Eyeshadow, liner and mascara are all off, so the photo is unchanged.",
    "eyes_closed": "Both eyes are closed or too small for a reliable preview.",
    "eye_too_small": "The eyes are too small in this photo to place makeup.",
    "needs_lash_trace": "Trace your visible lashes first; a face mesh cannot show where they are.",
}


@dataclass(frozen=True)
class EyeLook:
    name: str
    shadow_style: str
    shadow_colour: tuple[int, int, int]
    liner_style: str
    liner_colour: tuple[int, int, int]
    liner_thickness: float
    liner_length: float
    mascara_style: str
    mascara_colour: tuple[int, int, int]


# Original named looks (ASSUMED colours and liner sizes, as shares of the eye width).
LOOKS: dict[str, EyeLook] = {
    "vezelay": EyeLook("Vézelay", "halo", (150, 112, 96), "soft_wing", (66, 44, 36), 0.010, 0.10,
                       "lengthening", (34, 26, 24)),
    "locronan": EyeLook("Locronan", "smokey", (78, 64, 72), "wing", (26, 22, 24), 0.014, 0.16,
                        "volumising", (18, 16, 17)),
    "rocamadour": EyeLook("Rocamadour", "cut_crease", (122, 80, 58), "tightline", (40, 28, 26), 0.012, 0.12,
                          "tubing", (30, 22, 20)),
}


@dataclass(frozen=True)
class EyeMakeupResult:
    image: np.ndarray                 # same shape and dtype as the input; alpha copied
    coverage: np.ndarray              # 0..1 per pixel: combined paint coverage
    label: str
    report: dict[str, Any] = field(default_factory=dict)

    @property
    def changed(self) -> bool:
        return bool(self.report.get("changed_pixels", 0))


def _amount(value: Any, name: str, high: float) -> float:
    if isinstance(value, (bool, str)) or not isinstance(value, (int, float)):
        raise ValueError(f"{name} must be a number")
    out = float(value)
    if not math.isfinite(out) or not 0 <= out <= high:
        raise ValueError(f"{name} must be 0..{high:g}")
    return out


def _colour(value: Any, name: str) -> tuple[int, int, int]:
    if not isinstance(value, (list, tuple)) or len(value) != 3:
        raise ValueError(f"{name} must contain three byte channels")
    out = []
    for channel in value:
        if isinstance(channel, bool) or not isinstance(channel, int) or not 0 <= channel <= 255:
            raise ValueError(f"{name} must contain three byte channels")
        out.append(int(channel))
    return out[0], out[1], out[2]


def _anatomy(value: Any) -> dict[str, str]:
    if value is None:
        return {"right": "open", "left": "open"}
    if not isinstance(value, Mapping) or set(value) != set(SIDES) or any(v not in ANATOMIES for v in value.values()):
        raise ValueError("anatomy needs right and left selections from open, hooded, monolid or deep_set")
    return {side: str(value[side]) for side in SIDES}


def _unchanged(image: np.ndarray, code: str, report: dict[str, Any]) -> EyeMakeupResult:
    report.update({"status": "unchanged", "reason_code": code, "message": MESSAGES[code], "changed_pixels": 0})
    return EyeMakeupResult(image.copy(), np.zeros(image.shape[:2], dtype=np.float64), LABEL, report)


def render_eye_makeup(image: np.ndarray, landmarks: Any, *, strength: float = 60.0, look: str = "vezelay",
                      shadow: float = 1.0, liner: float = 1.0, mascara: float = 1.0,
                      anatomy: Mapping[str, str] | None = None, lashes: Sequence[Mapping[str, Any]] = (),
                      colours: Mapping[str, Sequence[int]] | None = None) -> EyeMakeupResult | Refusal:
    """Eyeshadow, liner and mascara in one pass; see the module docstring for the rules."""
    source = validate_photo(image)
    level = _amount(strength, "strength", 100) / 100
    if look not in LOOKS:
        raise ValueError(f"look must be one of {', '.join(LOOKS)}")
    chosen = {"shadow": _amount(shadow, "shadow", 1), "liner": _amount(liner, "liner", 1),
              "mascara": _amount(mascara, "mascara", 1)}
    sides = _anatomy(anatomy)
    if not isinstance(lashes, (list, tuple)):
        raise ValueError("lashes must be a list of traced lashes")
    palette = LOOKS[look]
    tint = {"shadow": palette.shadow_colour, "liner": palette.liner_colour, "mascara": palette.mascara_colour}
    for key, value in (colours or {}).items():
        if key not in ELEMENTS:
            raise ValueError("colours may name shadow, liner or mascara only")
        tint[key] = _colour(value, f"{key} colour")
    points = validate_points(landmarks)
    height, width = source.shape[:2]
    early = refusal_for(MODULE, points * np.array((width, height)), height, width)
    if early is not None:
        return early
    report: dict[str, Any] = {"look": look, "look_name": palette.name, "strength": level * 100,
                              "anatomy": sides, "provider": "local", "simulation": True,
                              "geometry_changed": False, "eye_colour_changed": False,
                              "real_face_quality": "Not tested", "elements": {}, "skipped": {}, "warnings": []}
    if level == 0:
        return _unchanged(source, "zero_strength", report)
    if not any(chosen.values()):
        return _unchanged(source, "nothing_chosen", report)
    try:
        eye_frames = frames(points, width, height)
    except ValueError:
        return Refusal(MODULE, "eye_too_small", MESSAGES["eye_too_small"])
    if not any(frame.visible for frame in eye_frames):
        return Refusal(MODULE, "eyes_closed", MESSAGES["eyes_closed"])
    active = [name for name in ELEMENTS if chosen[name] > 0]
    if active == ["mascara"] and not lashes:
        return Refusal(MODULE, "needs_lash_trace", MESSAGES["needs_lash_trace"])
    styles = {"shadow": palette.shadow_style, "liner": palette.liner_style, "mascara": palette.mascara_style}
    current = source
    coverage = np.zeros((height, width), dtype=np.float64)
    for name in active:
        if name == "mascara" and not lashes:
            report["skipped"]["mascara"] = "needs_lash_trace"
            continue
        request: dict[str, Any] = {"feature": FEATURE[name], "amount": level * chosen[name], "style": styles[name],
                                   "anatomy": sides, "colour": list(tint[name])}
        if name == "liner":
            request.update(thickness=palette.liner_thickness, length=palette.liner_length)
        if name == "mascara":
            request.update(observed_lashes=list(lashes), lower=True)
        step = render_eyes(current, points, request)
        if step.report["status"] == "unavailable":
            report["skipped"][name] = "needs_lash_trace" if name == "mascara" else "eyes_closed"
            continue
        coverage = combine(coverage, step.coverage)
        report["elements"][name] = {"feature": FEATURE[name], "amount": request["amount"], "style": styles[name],
                                    "colour": list(tint[name]), "changed_pixels": step.report["changed_pixels"]}
        report["warnings"].extend(step.report["warnings"])
        current = step.image
    if not report["elements"]:
        return Refusal(MODULE, "needs_lash_trace", MESSAGES["needs_lash_trace"])
    if "mascara" in report["skipped"]:
        report["warnings"].append("Mascara is off until you trace your visible lashes; no lash is invented.")
    report["warnings"] = list(dict.fromkeys(report["warnings"]))
    report["status"] = "edited"
    report["reason_code"] = "edited"
    report["changed_pixels"] = int(np.count_nonzero(np.any(current[..., :3] != source[..., :3], axis=2)))
    return EyeMakeupResult(current, coverage, LABEL, report)
