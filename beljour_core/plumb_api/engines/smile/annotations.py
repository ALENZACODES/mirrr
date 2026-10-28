"Checked dental annotation helpers for R16B.\n\nAutomatic teeth/gum segmentation is intentionally excluded because the binding\nfeature spec did not provide a commercially cleared model. The user's checked local\npolygons are therefore first-class evidence and remain local to the session.\nAuthor: John Khan.\n"

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

import numpy as np

from .contracts import SmileAnnotation


@dataclass(frozen=True)
class AnnotationStats:
    tooth_width: float
    tooth_height: float
    gum_height: float
    tooth_area: float
    gum_area: float
    centre_x: float
    centre_y: float
    midline_error: float | None
    overlap_fraction: float

def polygon_area(points: tuple[tuple[float, float], ...]) -> float:
    if len(points) < 3:
        return 0.0
    x = np.asarray([p[0] for p in points], dtype=np.float64)
    y = np.asarray([p[1] for p in points], dtype=np.float64)
    return abs(float(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1))) / 2.0)

def bounds(points: tuple[tuple[float, float], ...]) -> tuple[float, float, float, float]:
    if len(points) < 3:
        raise ValueError('polygon needs at least three points')
    p = np.asarray(points, dtype=np.float64)
    return (float(np.min(p[:, 0])), float(np.min(p[:, 1])), float(np.max(p[:, 0])), float(np.max(p[:, 1])))

def centre(points: tuple[tuple[float, float], ...]) -> tuple[float, float]:
    p = np.asarray(points, dtype=np.float64)
    return (float(p[:, 0].mean()), float(p[:, 1].mean()))

def _bbox_overlap(a: tuple[float, float, float, float], b: tuple[float, float, float, float]) -> float:
    x0 = max(a[0], b[0])
    y0 = max(a[1], b[1])
    x1 = min(a[2], b[2])
    y1 = min(a[3], b[3])
    if x1 <= x0 or y1 <= y0:
        return 0.0
    overlap = (x1 - x0) * (y1 - y0)
    area = max((a[2] - a[0]) * (a[3] - a[1]), 1e-12)
    return float(np.clip(overlap / area, 0.0, 1.0))

def stats(annotation: SmileAnnotation) -> AnnotationStats:
    tooth_bounds = bounds(annotation.teeth)
    tooth_centre = centre(annotation.teeth)
    gum_bounds = bounds(annotation.gum) if annotation.gum else (0.0, 0.0, 0.0, 0.0)
    midline_error = None if annotation.midline_x is None else abs(tooth_centre[0] - annotation.midline_x)
    overlap = _bbox_overlap(tooth_bounds, gum_bounds) if annotation.gum else 0.0
    return AnnotationStats(tooth_width=tooth_bounds[2] - tooth_bounds[0], tooth_height=tooth_bounds[3] - tooth_bounds[1], gum_height=max(0.0, gum_bounds[3] - gum_bounds[1]), tooth_area=polygon_area(annotation.teeth), gum_area=polygon_area(annotation.gum), centre_x=tooth_centre[0], centre_y=tooth_centre[1], midline_error=midline_error, overlap_fraction=overlap)

def validate_for_feature(annotation: SmileAnnotation, feature: str) -> list[str]:
    warnings: list[str] = []
    measured = stats(annotation)
    if measured.tooth_width < 0.03 or measured.tooth_height < 0.008:
        warnings.append('The checked tooth region is very small; a closer photo will make the guide more useful.')
    if feature in {'W50', 'W53'} and (not annotation.gum):
        warnings.append('No gum polygon is checked; gum-line comparison is unavailable.')
    if feature == 'W52' and annotation.midline_x is None:
        warnings.append('No smile midline is checked; gap alignment is shown without a midline comparison.')
    if measured.midline_error is not None and measured.midline_error > 0.08:
        warnings.append('The checked tooth region and checked midline are far apart; verify the annotation before using the guide.')
    return warnings

def serialize(annotation: SmileAnnotation) -> dict[str, object]:
    return {'teeth': [list(point) for point in annotation.teeth], 'gum': [list(point) for point in annotation.gum], 'midline_x': annotation.midline_x, 'source': 'user_checked_local_annotation'}

def sequence_hash(annotations: Iterable[SmileAnnotation]) -> str:
    """Small deterministic evidence fingerprint; not a cryptographic privacy boundary."""
    import hashlib
    import json
    payload = json.dumps([serialize(item) for item in annotations], sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()
