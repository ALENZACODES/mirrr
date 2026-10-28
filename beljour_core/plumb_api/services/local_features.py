"""Local replacements for the retired analysis and face-preview routes.

These handlers never use recorded faces, infer a biological age or invent cosmetic
concern scores. A landmark-dependent operation requires the browser's measured mesh.
The source image is immutable, previews are bounded to 512 px, and every output carries
Local simulation provenance. This compatibility layer calls the existing local engines;
it does not add another model or a second geometry table. Author: John Khan.
"""
from __future__ import annotations

import io
import math
from collections.abc import Mapping
from typing import Any

import numpy as np
from PIL import Image

from ..engines.core import regions
from ..engines.core.filters import box_mean
from ..engines.proportions import ratios
from ..engines.repair.analyse import analyse
from ..engines.repair.condition import classify_photo
from ..engines.shade import measure_shade
from ..engines.shape import age, geometry
from ..errors import PlumbError
from ..provenance import local
from . import imaging, procedures, shade, skin, warp

PREVIEW_SIDE = 512
LOCAL_LABEL = "Local simulation"
# Semantically equivalent original controls only. Nose, eyelid and lip-volume edits
# without an implemented local control remain unavailable; no unrelated effect is used.
SHAPE_PROCEDURES: Mapping[str, Mapping[str, float]] = {
    "chin_augment": {"chin_length": 60},
    "chin_reduce": {"chin_length": -60},
    "chin_slim": {"chin_width": -50},
    "jaw_slim": {"jaw_width_left": -55, "jaw_width_right": -55},
    "jaw_filler": {"jaw_width_left": 25, "jaw_width_right": 25},
    "cheekbone_contour": {"cheek_fullness": -60},
    "cheek_filler": {"cheek_fullness": 25},
    "face_slim": {"face_width": -40},
    "facelift": {"jowl_fullness": -45, "cheek_fullness": 15},
    "skin_tightening": {"jowl_fullness": -25},
}
LOCAL_WARPS = frozenset({"brow_lift", "lip_lift", "buccal_fat_removal", "otoplasty", "cleft_chin"})


def metadata(endpoint: str) -> dict[str, Any]:
    return {"source": "local", "units_spent": 0, "synthetic": False,
            "endpoint": endpoint, "lifecycle": "active", "provenance": local(endpoint).to_json()}


def preview_rgb(data: bytes) -> np.ndarray:
    with Image.open(io.BytesIO(data)) as image:
        rgb = image.convert("RGB")
        rgb.thumbnail((PREVIEW_SIDE, PREVIEW_SIDE), Image.Resampling.LANCZOS)
        return np.asarray(rgb, dtype=np.uint8).copy()


def measured_mesh(points: object | None, width: int, height: int) -> np.ndarray:
    if points is None:
        raise PlumbError(422, "face_points_required",
                         "This local tool needs face points from your browser. Choose a clear front-facing photo.")
    try:
        mesh = np.asarray(points, dtype=np.float64)
    except (TypeError, ValueError) as exc:
        raise PlumbError(422, "bad_landmarks", "The face points could not be read. Choose the photo again.") from exc
    if mesh.shape not in ((478, 2), (478, 3)) or not np.isfinite(mesh).all() or np.any((mesh[:, :2] < 0) | (mesh[:, :2] > 1)):
        raise PlumbError(422, "bad_landmarks", "This local tool needs 478 finite face points inside the photo.")
    pixel = mesh[:, :2] * np.array([width, height], dtype=np.float64)
    try:
        face_frame = geometry.frame(pixel)
    except ValueError as exc:
        raise PlumbError(422, "bad_landmarks", "The face points do not describe a usable face.") from exc
    if face_frame.iod < 8 or face_frame.length < 24:
        raise PlumbError(422, "face_too_small", "The face is too small for a reliable local preview. Use a closer photo.")
    return pixel


def skin_analysis(data: bytes) -> dict[str, Any]:
    image = preview_rgb(data)
    analysis = analyse(image)
    condition = classify_photo(image, analysis)
    return {"scores": [], "overall": None, "skin_age": None, "skin_type": None,
            "routine": skin.routine([]), "photo_analysis": analysis.to_json(),
            "photo_condition": condition.to_json(),
            "about_scores": "Local photo checks describe lighting, blur and noise. No skin health score or age is inferred.",
            **metadata("local-photo-check")}


def shade_analysis(data: bytes, points: object | None) -> dict[str, Any]:
    image = preview_rgb(data)
    mesh = measured_mesh(points, image.shape[1], image.shape[0])
    measurement = measure_shade(image, mesh)
    if measurement.refused or measurement.measured_lab is None:
        raise PlumbError(422, "shade_not_confident", "The local shade estimate is not confident enough. Try even daylight.",
                         {"reason": measurement.reason, "label": "not tested against real products"})
    skin_hex = shade.rgb_to_hex(shade.lab_to_rgb(measurement.measured_lab))
    # The original catalogue contains only our own demo names. Preserve its IDs for
    # existing Makeup choices, but remove lighter recommendations before ranking.
    candidates = shade.match(skin_hex, "foundation", top=100)
    foundation = [row for row in candidates if shade.hex_to_lab(row["hex"])[0] <= measurement.measured_lab[0] + 1][:3]
    for row in foundation:
        row["shop"] = None
    tone = shade.undertone(skin_hex)
    if measurement.undertone:
        tone["undertone"] = measurement.undertone["undertone"]
    return {"colors": {"skin_color": skin_hex}, "tone": tone, "foundation": foundation, "lip": [],
            "range_stats": shade.catalogue_stats(skin_hex), "measurement": measurement.to_json(),
            "note": "Local simulation. Our own reference shades, not tested against real products. Test two swatches in daylight.",
            **metadata("local-shade")}


def proportion_analysis(data: bytes, points: object | None) -> dict[str, Any]:
    image = preview_rgb(data)
    mesh = measured_mesh(points, image.shape[1], image.shape[0])
    report = ratios.measure(mesh)
    values = []
    for item in report.ratios:
        if item.reference is None or item.difference_percent is None:
            continue
        yours = item.value if isinstance(item.value, list) else [item.value, 1.0]
        reference = item.reference if isinstance(item.reference, list) else [item.reference, 1.0]
        if not all(math.isfinite(value) for value in [*yours, *reference, item.difference_percent]):
            continue
        values.append({"key": item.key, "label": item.label, "parts": item.parts, "yours": yours,
                       "reference": reference, "difference_percent": item.difference_percent, "plain": item.plain})
    return {"face_shape": None, "ratios": values, "note": report.note,
            **metadata("local-proportions")}


def procedure_catalogue() -> list[dict[str, Any]]:
    allowed = set(SHAPE_PROCEDURES) | LOCAL_WARPS
    return [{**row, "engine": "local", "approximate": True}
            for row in procedures.catalogue_json() if row["id"] in allowed]


def procedure_preview(data: bytes, selection: Mapping[str, float], points: object | None) -> dict[str, Any]:
    plan = procedures.build_plan(dict(selection))
    if not plan.applied:
        raise PlumbError(422, "nothing_selected", "Move at least one slider above zero to see a preview.")
    unavailable = [entry["name"] for entry in plan.applied if entry["id"] not in SHAPE_PROCEDURES and entry["id"] not in LOCAL_WARPS]
    if unavailable:
        raise PlumbError(422, "local_effect_unavailable", "This saved procedure has no cleared local preview yet.",
                         {"unavailable": unavailable})
    original = preview_rgb(data)
    height, width = original.shape[:2]
    mesh = measured_mesh(points, width, height)
    controls: dict[str, float] = {}
    for entry in plan.applied:
        for control, full in SHAPE_PROCEDURES.get(entry["id"], {}).items():
            controls[control] = float(np.clip(controls.get(control, 0) + full * entry["level"] / 100, -100, 100))
    image = original.copy()
    metrics: dict[str, Any] = {}
    if controls:
        image, metrics = geometry.raster_warp(image, mesh, controls)
    normalized = mesh / np.array([width, height])
    for entry in plan.applied:
        if entry["id"] in LOCAL_WARPS:
            image = warp.apply_local(image, normalized, entry["id"], entry["level"] / 100)
    encoded = imaging.to_jpeg(image)
    return {"image": imaging.data_url(imaging.burn_label(encoded, LOCAL_LABEL)),
            "applied": [{**entry, "engine": "local", "approximate": True} for entry in plan.applied],
            "reshape": {}, "warnings": [*plan.warnings, "Local photo simulation; not a forecast of a treatment result."],
            "not_yet_available": [], "honesty": imaging.honesty_meter(imaging.to_jpeg(original), encoded),
            "metrics": metrics, **metadata("local-procedure")}


def texture_preview(data: bytes, strengths: Mapping[str, float], points: object | None) -> dict[str, Any]:
    if set(strengths) != {"texture"}:
        raise PlumbError(422, "local_effect_unavailable", "Only the labelled local texture preview is available here.")
    strength = strengths["texture"]
    if isinstance(strength, bool) or not math.isfinite(strength) or not 0 < strength <= 1:
        raise PlumbError(422, "bad_request", "Texture strength must be above zero and at most one.")
    original = preview_rgb(data)
    mesh = measured_mesh(points, original.shape[1], original.shape[0])
    mask = regions.region_mask("skin", mesh, original.shape[0], original.shape[1], normalized=False)
    soft = np.stack([box_mean(original[..., channel].astype(float), 2) for channel in range(3)], axis=2)
    # Restrained texture change with no global tone, lightness or shape manipulation.
    image = np.clip(np.rint(original + (soft - original) * mask[..., None] * strength * 0.35), 0, 255).astype(np.uint8)
    encoded = imaging.to_jpeg(image)
    return {"image": imaging.data_url(imaging.burn_label(encoded, LOCAL_LABEL)), "strengths": {"texture": strength},
            "honesty": imaging.honesty_meter(imaging.to_jpeg(original), encoded),
            "note": "Local texture simulation. This does not estimate treatment results or skin health.",
            **metadata("local-texture")}


def age_preview(data: bytes, points: object | None) -> dict[str, Any]:
    original = preview_rgb(data)
    mesh = measured_mesh(points, original.shape[1], original.shape[0])
    frames = []
    for stop, label in ((-3, "Softer texture"), (1, "Light age-look texture"), (3, "Stronger age-look texture")):
        image, _, metrics = age.render(original, mesh, stop=stop)
        encoded = imaging.to_jpeg(image)
        frames.append({"age": None, "stop": stop, "label": label,
                       "image": imaging.data_url(imaging.burn_label(encoded, LOCAL_LABEL)), "metrics": metrics})
    return {"frames": frames, "estimated_age": None,
            "note": "Local procedural age-look simulation. It does not estimate your age or predict future appearance.",
            **metadata("local-age")}
