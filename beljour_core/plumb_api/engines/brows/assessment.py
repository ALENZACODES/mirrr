"""Geometry-led W73 alternatives and W74 photograph-comparability measurements.

These are observable geometry and imaging measurements, never treatment efficacy
or a diagnosis. Comparability limits are engineering assumptions. Author: John Khan.
"""
from __future__ import annotations

import math
from typing import Any

import numpy as np

from ..core.regions import landmark_points
from .contracts import BrowEvidence, number, photo, validate_evidence
from .evidence import luminance, observe_brows
from .geometry import brow_frames, union


def shape_options(landmarks: Any, height: int, width: int) -> dict[str, Any]:
    pts = landmark_points(landmarks, height, width)
    frames = brow_frames(landmarks, height, width)
    face_height = float(np.linalg.norm(pts[10] - pts[152]))
    cheek_width = float(np.linalg.norm(pts[234] - pts[454]))
    jaw_width = float(np.linalg.norm(pts[172] - pts[397]))
    if face_height < 8 or cheek_width < 6 or jaw_width < 3:
        raise ValueError("face geometry is too small for shape comparisons")
    elongation = face_height / cheek_width
    jaw_share = jaw_width / cheek_width
    right, left = frames
    # All suggestions retain at least the current thickness. They are opt-in
    # style alternatives with transparent geometry inputs, not a beauty score.
    alternatives = [
        {"id": "current_outline", "name": "Keep my outline", "arch": 0.0, "peak": 0.62,
         "tail": 0.0, "thickness": 1.0, "reason": "Starts from each brow independently; keeps its width and thickness."},
        {"id": "gentle_arch", "name": "Gentle arch", "arch": 0.07 if elongation < 1.5 else 0.045,
         "peak": 0.64, "tail": 0.0, "thickness": 1.0,
         "reason": "A modest arch guide follows the measured face proportions without thinning the brow."},
        {"id": "soft_tail", "name": "Soft tail", "arch": 0.04, "peak": 0.58,
         "tail": 0.08 if jaw_share > 0.75 else 0.04, "thickness": 1.0,
         "reason": "A small outward tail guide can be compared with the existing outline; it makes no lifting claim."},
        {"id": "full_outline", "name": "Full outline", "arch": 0.035, "peak": 0.60,
         "tail": 0.0, "thickness": 1.12,
         "reason": "Shows a slightly fuller outline as an explicit choice, with both brows retaining their own proportions."},
    ]
    return {"face_height_width_ratio": elongation, "jaw_cheek_ratio": jaw_share,
            "brow_width_difference_px": abs(right.width - left.width),
            "brow_height_difference_px": abs(right.height - left.height),
            "alternatives": alternatives, "automatic_selection": False,
            "note": "Styling guides from measured geometry. There is no ideal face shape or required symmetry."}


def photo_measurements(image: Any, landmarks: Any, evidence: BrowEvidence | None = None) -> dict[str, Any]:
    img = photo(image)
    height, width = img.shape[:2]
    frames = brow_frames(landmarks, height, width)
    measured = observe_brows(img, landmarks) if evidence is None else validate_evidence(evidence, img, union(frames))
    pts = landmark_points(landmarks, height, width)
    dx, dy = pts[263] - pts[33]
    roll = math.degrees(math.atan2(float(dy), float(dx)))
    light = luminance(img[..., :3].astype(float))
    sides = []
    for frame in frames:
        selected = frame.mask >= 0.5
        area = float(np.sum(frame.mask))
        covered = float(np.sum(measured.coverage * frame.mask))
        values = light[selected]
        outside_hair = selected & (measured.coverage < 0.2)
        skin = light[outside_hair]
        sides.append({"side": frame.side, "width_fraction": frame.width / width,
                      "height_width_ratio": frame.height / frame.width,
                      "coverage_fraction": covered / area if area else 0,
                      "coverage_per_width_squared": covered / frame.width ** 2,
                      "luminance_mean": float(np.mean(values)) if values.size else 0,
                      "skin_luminance_mean": float(np.mean(skin)) if skin.size else 0,
                      "texture_std": float(np.std(values)) if values.size else 0,
                      "observed_pixels": int(np.count_nonzero(measured.coverage * frame.mask >= 0.5))})
    return {"roll_degrees": roll, "sides": sides, "evidence_origin": measured.origin,
            "evidence_confidence": measured.confidence, "photo_stored": False,
            "biological_count": None, "units": "normalized image measurements"}


def compare_brow_photos(before: Any, before_face: Any, after: Any, after_face: Any, *,
                       before_evidence: BrowEvidence | None = None, after_evidence: BrowEvidence | None = None,
                       max_roll_difference: float = 5, max_exposure_difference: float = 15) -> dict[str, Any]:
    max_roll = number(max_roll_difference, "max_roll_difference", 0, 20)
    max_exposure = number(max_exposure_difference, "max_exposure_difference", 0, 50)
    first = photo_measurements(before, before_face, before_evidence)
    second = photo_measurements(after, after_face, after_evidence)
    roll_diff = abs(math.degrees(math.atan2(math.sin(math.radians(second["roll_degrees"] - first["roll_degrees"])),
                                          math.cos(math.radians(second["roll_degrees"] - first["roll_degrees"])))))
    reasons = []
    if roll_diff > max_roll:
        reasons.append("Head roll differs beyond the selected comparability limit.")
    if first["evidence_origin"] != second["evidence_origin"]:
        reasons.append("Observation methods differ; use the same manually checked mask method.")
    if min(first["evidence_confidence"], second["evidence_confidence"]) < 0.5:
        reasons.append("At least one photo has low-confidence hair observations.")
    pairs = []
    width_scales = []
    for a, b in zip(first["sides"], second["sides"], strict=True):
        exposure = b["skin_luminance_mean"] - a["skin_luminance_mean"]
        if abs(exposure) > max_exposure:
            reasons.append(f"{a['side'].capitalize()} brow lighting differs beyond the selected limit.")
        width_scales.append(b["width_fraction"] / a["width_fraction"])
        pairs.append({"side": a["side"], "coverage_fraction_change": b["coverage_fraction"] - a["coverage_fraction"],
                      "normalized_coverage_change": b["coverage_per_width_squared"] - a["coverage_per_width_squared"],
                      "skin_luminance_change": exposure,
                      "texture_std_change": b["texture_std"] - a["texture_std"],
                      "biological_growth_claim": False})
    if abs(width_scales[0] - width_scales[1]) > 0.08:
        reasons.append("The two brow scales changed differently; viewpoint or mesh placement may differ.")
    return {"comparable": not reasons, "reasons": reasons, "roll_difference_degrees": roll_diff,
            "sides": pairs, "attribution": False, "photos_stored": False,
            "limits_assumed": {"max_roll_degrees": max_roll, "max_skin_luminance_change": max_exposure,
                               "maximum_side_scale_disagreement": 0.08, "minimum_evidence_confidence": 0.5},
            "note": "Observable photo changes only. A matching pair does not prove serum efficacy or biological growth."}
