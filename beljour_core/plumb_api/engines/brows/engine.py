"""Single typed dispatch for the six local brow features. Author: John Khan."""
from __future__ import annotations

from dataclasses import replace
from typing import Any

from .assessment import shape_options
from .contracts import FEATURES, BrowEvidence, BrowResult, choice, photo, validate_evidence
from .evidence import observe_brows
from .geometry import brow_frames, union
from .lamination import render_lamination
from .pigment import render_pigment
from .progress import render_progress
from .shape import render_shape
from .tint import render_tint


def render_brows(image: Any, landmarks: Any, feature: str, settings: dict[str, Any] | None = None,
                 evidence: BrowEvidence | None = None) -> BrowResult:
    choice(feature, "feature", FEATURES)
    img = photo(image)
    frames = brow_frames(landmarks, img.shape[0], img.shape[1])
    if feature in ("W71", "W72"):
        return render_pigment(img, frames, feature, settings)
    if feature == "W73":
        result = render_shape(img, frames, settings)
        return replace(result, details={**result.details, "alternatives": shape_options(landmarks, img.shape[0], img.shape[1])})
    measured = observe_brows(img, landmarks) if evidence is None else validate_evidence(evidence, img, union(frames))
    if feature == "W69":
        return render_tint(img, measured, frames, settings)
    if feature == "W70":
        return render_lamination(img, measured, frames, settings)
    return render_progress(img, measured, frames, settings)
