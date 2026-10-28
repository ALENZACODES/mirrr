"""Observed-lash editing and original extension maps for W59-W63.

The extension profiles are design assumptions, not salon prescriptions. Lift and
mascara operate on explicitly observed traces; the face mesh alone does not contain
lash hairs and cannot justify inventing them. Author: John Khan.
"""
from __future__ import annotations

import math
from typing import Any

import numpy as np

from .contracts import EyeRequest, LashTrace, polyline_length
from .geometry import EyeFrame, interpolate
from .raster import bezier, combine, random_values, restore_trace_background, stroke

STYLES = ("cat", "doll", "wispy", "kitten", "fox")
EXTENSIONS = ("classic", "hybrid", "volume", "mega")
MAP_ZONES = 7


def style_profile(style: str, u: float) -> float:
    if style == "cat":
        return .65 + .50 * u
    if style == "doll":
        return .68 + .47 * math.sin(math.pi * u)
    if style == "wispy":
        return .75 + .24 * math.sin(math.pi * u) + .16 * max(0, math.cos(12 * math.pi * u))
    if style == "kitten":
        return .7 + .44 * math.exp(-((u - .73) / .29) ** 2)
    if style == "fox":
        return .60 + .60 * u * u
    raise ValueError("unsupported lash styling profile")


def choose_style(frame: EyeFrame, anatomy: str, desired: str = "") -> dict[str, Any]:
    if desired and desired not in STYLES:
        raise ValueError("unsupported lash style")
    chosen = desired or ("kitten" if frame.downturned or anatomy in ("hooded", "deep_set") else "doll")
    warnings = []
    why = "A central peak keeps the longest lashes above the open part of your eye."
    if chosen in ("cat", "fox"):
        why = "The length increases toward your outer corner."
    elif chosen == "kitten":
        why = "The longest section ends before the outer corner, so the tail stays lighter."
    elif chosen == "wispy":
        why = "Short and longer groups alternate; the measured lash line stays the anchor."
    if frame.downturned:
        warnings.append("Downturned outer corner: a long cat or fox tail may exaggerate the downward line.")
    if anatomy == "hooded":
        warnings.append("Hooded eye: check the curl and length with the eye open before choosing a set.")
    if anatomy == "monolid":
        why += " A gradual upright curl is placed from the lash line without inventing a crease."
    if anatomy == "deep_set":
        warnings.append("Deep-set eye: projected length may touch the upper fold; shorten the outer section if it does.")
    return {"style": chosen, "why": why, "warnings": warnings}


def extension_map(frame: EyeFrame, request: EyeRequest) -> dict[str, Any]:
    anatomy = request.anatomy[frame.side]
    if request.feature == "W60":
        recommendation = choose_style(frame, anatomy, request.style)
        style, family = recommendation["style"], "classic"
    else:
        family = request.style or "classic"
        if family not in EXTENSIONS:
            raise ValueError("extension style must be classic, hybrid, volume or mega")
        recommendation = choose_style(frame, anatomy)
        style = recommendation["style"]
    zones = []
    for i in range(MAP_ZONES):
        start, end = i / MAP_ZONES, (i + 1) / MAP_ZONES
        midpoint = (start + end) / 2
        length = request.length * style_profile(style, midpoint)
        if frame.downturned and midpoint > .8:
            length *= .78
        fans = {"classic": 1, "hybrid": 2 if i % 2 else 1, "volume": 3, "mega": 5}[family]
        zones.append({"zone": i + 1, "start": start, "end": end,
                      "length_eye_width": length, "length_px": length * frame.width,
                      "curl": request.curl, "fan_count": fans})
    warnings = list(recommendation["warnings"])
    if request.natural_density is None:
        warnings.append("Natural lash density has not been measured. Attachment suitability is unknown.")
    elif request.natural_density < .25 and family in ("volume", "mega"):
        warnings.append("Unrealistic on very sparse natural lashes: this simulated density may not be achievable.")
    if request.glasses_clearance is not None:
        projected = max(z["length_eye_width"] for z in zones) * (1 - .35 * request.curl)
        if projected > request.glasses_clearance:
            warnings.append("Possible glasses collision: the simulated lash projection exceeds your entered clearance.")
    return {"side": frame.side, "style": style, "family": family, "zones": zones,
            "warnings": warnings, "why": recommendation["why"], "physical_mm": None,
            "scale_note": "Lengths use measured eye width; millimetres require a known physical scale.",
            "professional_review": "An original visual lash map for discussion, not a treatment instruction."}


def extension_strokes(frame: EyeFrame, request: EyeRequest) -> tuple[list[list[tuple[float, float]]], dict[str, Any]]:
    mapping = extension_map(frame, request)
    paths = []
    rng = random_values(request.seed + (17 if frame.side == "left" else 0), 48)
    for index in range(28):
        u = .045 + index / 27 * .91
        zone = mapping["zones"][min(MAP_ZONES - 1, int(u * MAP_ZONES))]
        v = interpolate(frame.upper, u)
        length = float(zone["length_eye_width"])
        for fan in range(int(zone["fan_count"])):
            spread = (fan - (zone["fan_count"] - 1) / 2) * .018
            lean = .03 + .07 * u + spread
            curl = request.curl
            end = frame.point(u + lean, v + length * (.72 + .28 * curl))
            control = frame.point(u + lean * .28, v + length * (.25 + .35 * curl))
            root = frame.point(u, v + .008)
            variation = .96 + .08 * rng[index]
            end = (root[0] + (end[0] - root[0]) * variation, root[1] + (end[1] - root[1]) * variation)
            paths.append(bezier(root, control, end))
    mapping["synthetic_strokes"] = len(paths)
    mapping["anchors"] = [list(path[0]) for path in paths]
    return paths, mapping


def strip_strokes(frame: EyeFrame, request: EyeRequest) -> tuple[list[list[tuple[float, float]]], dict[str, Any]]:
    style = request.style or "strip"
    if style not in ("strip", "cluster", "half_strip"):
        raise ValueError("strip style must be strip, cluster or half_strip")
    groups = 7 if style == "cluster" else 15
    begin = .46 if style == "half_strip" else .055
    paths = []
    anchors = []
    for i in range(groups):
        u = begin + (.94 - begin) * i / max(1, groups - 1)
        v = interpolate(frame.upper, u)
        anchors.append(frame.point(u, v))
        for j in range(4 if style == "cluster" else 2):
            shift = (j - (1.5 if style == "cluster" else .5)) * .025
            root = frame.point(u, v + .008)
            length = request.length * (.72 + .26 * math.sin(math.pi * u))
            end = frame.point(u + shift + .07 * u, v + length)
            control = frame.point(u + shift * .3, v + length * (.35 + .2 * request.curl))
            paths.append(bezier(root, control, end))
    warnings = []
    if request.glasses_clearance is not None and request.length > request.glasses_clearance:
        warnings.append("Possible glasses collision: shorten the lash or check the frame clearance.")
    return paths, {"side": frame.side, "style": style, "groups": groups,
                   "eye_width_px": frame.width, "anchors": [list(p) for p in anchors],
                   "synthetic_strokes": len(paths), "warnings": warnings,
                   "product": "Original generic shape; no product availability or exact fit is claimed."}


def observed_paths(frame: EyeFrame, request: EyeRequest, width: int, height: int) -> list[tuple[LashTrace, list[tuple[float, float]]]]:
    output = []
    for item in request.observed_lashes:
        if item.side != frame.side or item.confidence < .5 or (item.lower and not request.lower):
            continue
        path = [(p[0] * width, p[1] * height) for p in item.points]
        u, v = frame.local(*path[0])
        target = interpolate(frame.lower if item.lower else frame.upper, min(1, max(0, u)))
        if not -.04 <= u <= 1.04 or abs(v - target) > .08:
            raise ValueError("observed lash root is not on the measured lash line")
        if polyline_length(path) > frame.width * .55:
            raise ValueError("observed lash length is implausibly large for this eye")
        output.append((item, path))
    return output


def lifted_path(frame: EyeFrame, path: list[tuple[float, float]], curl: float, lower: bool) -> list[tuple[float, float]]:
    original_length = polyline_length(path)
    root = path[0]
    u, v = frame.local(*root)
    direction = -1 if lower else 1
    length = original_length / frame.width
    control = frame.point(u + length * .12, v + direction * length * (.18 + .50 * curl))
    end = frame.point(u + length * (.60 - .45 * curl), v + direction * length * (.45 + .52 * curl))
    curved = bezier(root, control, end)
    measured = polyline_length(curved)
    factor = original_length / max(measured, 1e-12)
    return [(root[0] + (x - root[0]) * factor, root[1] + (y - root[1]) * factor) for x, y in curved]


def mascara_path(path: list[tuple[float, float]], kind: str, amount: float) -> list[tuple[float, float]]:
    if kind != "lengthening":
        return list(path)
    tail = np.array(path[-1]) - np.array(path[-2])
    norm = float(np.linalg.norm(tail))
    extra = polyline_length(path) * .12 * amount
    end = np.array(path[-1]) + tail / max(norm, 1e-12) * extra
    return [*path, (float(end[0]), float(end[1]))]


def render_lashes(image: np.ndarray, eye_frames: tuple[EyeFrame, EyeFrame], request: EyeRequest,
                  protected: np.ndarray) -> tuple[np.ndarray, np.ndarray, dict[str, Any]]:
    height, width = image.shape[:2]
    mask = np.zeros((height, width), dtype=np.float64)
    remove = mask.copy()
    reports = []
    input_count = 0
    output_count = 0
    length_errors = []
    style = request.style or ("lifting" if request.feature == "W61" else "volumising")
    if request.feature in ("W63", "W76") and style not in ("lengthening", "volumising", "tubing", "navy", "burgundy", "forest"):
        raise ValueError("unsupported mascara type")
    if request.feature == "W61" and style not in ("lifting", "tint"):
        raise ValueError("lift style must be lifting or tint")
    for frame in eye_frames:
        if not frame.visible:
            reports.append({"side": frame.side, "status": "unavailable", "warnings": ["Open this eye for a reliable lash preview."]})
            continue
        if request.feature in ("W59", "W60", "W62"):
            paths, report = strip_strokes(frame, request) if request.feature == "W62" else extension_strokes(frame, request)
            for path in paths:
                mask = combine(mask, stroke(height, width, path, max(.3, request.thickness * frame.width / 2), taper=True))
            if request.feature == "W62" and (request.style or "strip") != "cluster":
                band = [frame.point(.05 + .90 * i / 24, interpolate(frame.upper, .05 + .90 * i / 24) + .008) for i in range(25)]
                mask = combine(mask, stroke(height, width, band, max(.3, .005 * frame.width)))
            report["fit"] = fit_metrics(frame, paths)
            report["warnings"].extend(report["fit"]["warnings"])
            reports.append(report)
            output_count += len(paths)
            continue
        observed = observed_paths(frame, request, width, height)
        input_count += len(observed)
        report = {"side": frame.side, "observed_count": len(observed), "warnings": []}
        for item, path in observed:
            radius = max(.3, request.thickness * frame.width / 2)
            target = path
            if request.feature == "W61" and style == "lifting":
                target = lifted_path(frame, path, request.curl, item.lower)
                remove = combine(remove, stroke(height, width, path, radius, taper=True))
                length_errors.append(abs(polyline_length(path) - polyline_length(target)))
            else:
                target = mascara_path(path, style, request.amount)
                radius *= (1 + 1.1 * request.amount) if style == "volumising" else (1 + .45 * request.amount)
            mask = combine(mask, stroke(height, width, target, radius, taper=style != "tubing"))
            if request.smudge > 0 and request.feature in ("W63", "W76"):
                u, v = frame.local(*path[0])
                shadow = [frame.point(u - .02, v - .045), frame.point(u + .025, v - .06)]
                mask = combine(mask, stroke(height, width, shadow, max(.4, frame.width * .025), softness=2) * request.smudge * .28)
            output_count += 1
        reports.append(report)
    # The eyeball is a strict invariant. A lash may hide behind the lid, but never
    # paints the iris, the sclera or an eye-colour change into this local fallback.
    safe = (protected == 0).astype(np.float64)
    mask *= safe
    remove *= safe
    cleaned, remnants = restore_trace_background(image, remove * request.amount, protected) if np.any(remove) else (image.copy(), 0)
    unavailable = request.feature in ("W61", "W63", "W76") and input_count == 0
    return cleaned, mask, {"maps": reports, "observed_count": input_count, "rendered_count": output_count,
                           "invented_natural_lashes": 0, "length_error_px": max(length_errors, default=0),
                           "unfilled_trace_pixels": remnants, "status": "unavailable" if unavailable else "simulation",
                           "reason": "Trace your visible lashes first; a face mesh cannot count them." if unavailable else "",
                           "removal_coverage": remove}


def fit_metrics(frame: EyeFrame, paths: list[list[tuple[float, float]]]) -> dict[str, Any]:
    """In-plane lash fit measurements, distinct from a guessed physical fit.

    The eye plane has no measured depth. These diagnostics cannot certify glasses
    clearance or safe attachment; they make visible overhang and brow overlap
    inspectable without claiming a three-dimensional or millimetre measurement.
    """
    if not paths:
        return {"strokes": 0, "root_error_px_max": None, "brow_clearance_eye_width": None,
                "outer_overhang_eye_width": None, "projection_kind": "image_plane", "warnings": []}
    root_errors = []
    maximum_u, maximum_v = float("-inf"), float("-inf")
    lengths = []
    for path in paths:
        if len(path) < 2:
            raise ValueError("lash fit needs complete paths")
        root_u, root_v = frame.local(*path[0])
        target_v = interpolate(frame.upper, min(1, max(0, root_u))) + .008
        root_errors.append(abs(root_v - target_v) * frame.width)
        lengths.append(polyline_length(path) / frame.width)
        for point in path:
            u, v = frame.local(*point)
            if not math.isfinite(u) or not math.isfinite(v):
                raise ValueError("lash fit paths must be finite")
            maximum_u = max(maximum_u, u)
            maximum_v = max(maximum_v, v)
    clearance = frame.brow_space - maximum_v
    overhang = max(0., maximum_u - 1)
    warnings = []
    if clearance < 0:
        warnings.append("Lash tips cross the estimated brow line in this image. Compare a shorter set or a different curl.")
    if overhang > .2:
        warnings.append("The outer overhang is large compared with the eye width. Check the visible tail before choosing a set.")
    return {"strokes": len(paths), "root_error_px_max": max(root_errors),
            "brow_clearance_eye_width": clearance, "outer_overhang_eye_width": overhang,
            "maximum_arc_length_eye_width": max(lengths), "projection_kind": "image_plane",
            "physical_fit_verified": False, "warnings": warnings}
