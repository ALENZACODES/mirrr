"""Public dispatcher for eleven local eye/lash simulations. Author: John Khan."""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import replace
from typing import Any

import numpy as np

from .contracts import LABEL, VERSION, EyeRequest, EyeResult, parse_request, validate_photo
from .geometry import eye_protection, frames, native_placement
from .lashes import render_lashes
from .liner import COLOURED, graphic_mask, liner_mask
from .observations import trace_summary
from .raster import combine, paint
from .shadow import shadow_fields
from .visibility import display_support, occlusion_field, visibility_report


def render_eyes(photo: np.ndarray, landmarks: Any, request: Mapping[str, Any] | EyeRequest, *,
                occlusion_mask: Any = None) -> EyeResult:
    """Render without changing caller buffers, eye colour, alpha or facial geometry.

    Float masks and report numbers have Python/TypeScript parity tests. A zero
    amount is byte-exact identity, but malformed inputs are still rejected.
    """
    image = validate_photo(photo)
    options = parse_request(request)
    height, width = image.shape[:2]
    eye_frames = frames(landmarks, width, height)
    occlusion = occlusion_field(occlusion_mask, width, height)
    eye_frames, visibility = visibility_report(eye_frames, options, width, height, occlusion, supplied=occlusion_mask is not None)
    protection = eye_protection(height, width, eye_frames)
    observations = trace_summary(options.observed_lashes, width, height)
    if observations["duplicate_traces"]:
        raise ValueError("duplicate observed lash traces")
    untouched = np.zeros((height, width), dtype=np.float64)
    result = image.copy()
    coverage = untouched.copy()
    report: dict[str, Any] = {
        "feature": options.feature, "version": VERSION, "label": LABEL,
        "provider": "local_procedural_simulation", "status": "simulation",
        "real_face_quality": "Not tested", "geometry_changed": False,
        "eye_colour_changed": False, "anatomy_source": "user_selection",
        "warnings": [], "sides": [], "amount": options.amount, "observations": observations, "visibility": visibility,
    }
    if options.amount == 0:
        report["status"] = "identity"
        return EyeResult(result, coverage, report)
    safe = (protection == 0).astype(np.float64) * (1 - occlusion)
    if options.feature in ("W59", "W60", "W61", "W62", "W63"):
        cleaned, mask, detail = render_lashes(image, eye_frames, options, protection)
        removal = detail.pop("removal_coverage")
        mask *= (1 - occlusion)
        removal *= (1 - occlusion)
        if occlusion_mask is not None:
            cleaned = paint(image, 1 - occlusion, cleaned[:, :, :3])
        result = paint(cleaned, mask, options.colour, options.amount)
        coverage = combine(mask * options.amount, removal * options.amount)
        report.update(detail)
        report["sides"] = [native_placement(frame, options.anatomy[frame.side]) for frame in eye_frames]
    elif options.feature in ("W64", "W65", "W75", "W76"):
        colour = options.colour
        if options.feature == "W76":
            chosen = options.style or "navy"
            if chosen not in COLOURED:
                raise ValueError("coloured eye style must be navy, burgundy or forest")
            colour = COLOURED[chosen]
        for frame in eye_frames:
            mask, side_report = graphic_mask(height, width, frame, options) if options.feature == "W65" else liner_mask(height, width, frame, options)
            mask *= safe
            result = paint(result, mask, colour, options.amount)
            coverage = combine(coverage, mask * options.amount)
            report["sides"].append(side_report)
        if options.feature == "W76":
            mascara_options = replace(options, style="tubing")
            _, mask, detail = render_lashes(image, eye_frames, mascara_options, protection)
            detail.pop("removal_coverage")
            mask *= (1 - occlusion)
            result = paint(result, mask, colour, options.amount)
            coverage = combine(coverage, mask * options.amount)
            report["mascara"] = detail
            if detail["status"] == "unavailable":
                report["warnings"].append("Coloured liner is shown. Trace your visible lashes to preview coloured mascara.")
        if options.feature == "W75":
            report["artist_validation"] = "Not tested; expert and real-model review is required before a quality claim."
    else:
        for frame in eye_frames:
            mask, colour_field, side_report = shadow_fields(image, frame, options)
            mask *= safe
            result = paint(result, mask, colour_field, options.amount)
            coverage = combine(coverage, mask * options.amount)
            report["sides"].append(side_report)
    # Fully transparent input pixels remain untouched and cannot count as a
    # successful effect. The alpha channel is copied, not recomputed by paint.
    if image.shape[2] == 4:
        hidden = image[:, :, 3] == 0
        result[hidden] = image[hidden]
        coverage[hidden] = 0
    report["display_support"] = display_support(image, result, coverage, eye_frames)
    for item in [*report.get("sides", []), *report.get("maps", []), *visibility["sides"]]:
        report["warnings"].extend(item.get("warnings", []))
        report["warnings"].extend(item.get("payoff", {}).get("warnings", []))
    if not any(frame.visible for frame in eye_frames):
        report["status"] = "unavailable"
        report["reason"] = "Both eyes are closed or too small for a reliable preview."
    report["changed_pixels"] = int(np.count_nonzero(np.any(result[:, :, :3] != image[:, :, :3], axis=2)))
    report["coverage_pixels"] = int(np.count_nonzero(coverage > 0))
    report["protected_eye_pixels"] = int(np.count_nonzero(protection > 0))
    report["warnings"] = list(dict.fromkeys(report["warnings"]))
    return EyeResult(result, coverage, report)
