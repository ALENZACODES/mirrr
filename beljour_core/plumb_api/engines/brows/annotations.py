"""Manual observed-hair correction, clipped to the shared brow contours.

Only explicit user strokes are accepted. The serializable annotation object has
no photograph, name, biometrics identifier or free-text fields. Author: John Khan.
"""
from __future__ import annotations

import json
import math
from typing import Any

import numpy as np

from .contracts import BrowEvidence, boolean, choice, number, photo, validate_evidence
from .geometry import brow_frames, draw_path, union

ANNOTATION_FORMAT = "beljour-brow-observations/1"
MAX_MARKS = 256
MAX_POINTS = 512
MAX_JSON_BYTES = 1_048_576
MODES = ("hair", "grey", "erase")


def validate_marks(marks: Any) -> list[dict[str, Any]]:
    if not isinstance(marks, list) or len(marks) > MAX_MARKS:
        raise ValueError("annotations need a list of at most 256 marks")
    result: list[dict[str, Any]] = []
    for mark in marks:
        if not isinstance(mark, dict) or set(mark) != {"mode", "radius", "points", "opacity"}:
            raise ValueError("annotation fields must be mode, radius, points and opacity")
        mode = choice(mark["mode"], "mode", MODES)
        radius = number(mark["radius"], "radius", 0.0005, 0.05)
        opacity = number(mark["opacity"], "opacity", 0, 1)
        points = mark["points"]
        if not isinstance(points, list) or not 1 <= len(points) <= MAX_POINTS:
            raise ValueError("each annotation needs 1..512 points")
        converted = []
        for point in points:
            if not isinstance(point, (tuple, list)) or len(point) != 2:
                raise ValueError("annotation points are normalized x,y pairs")
            converted.append([number(point[0], "x", 0, 1), number(point[1], "y", 0, 1)])
        result.append({"mode": mode, "radius": radius, "points": converted, "opacity": opacity})
    if sum(len(mark["points"]) for mark in result) > 4096:
        raise ValueError("annotations may contain at most 4096 total points")
    return result


def annotate_brows(image: Any, landmarks: Any, marks: Any, *,
                   base: BrowEvidence | None = None, reviewed: bool = False) -> BrowEvidence:
    img = photo(image)
    boolean(reviewed, "reviewed")
    validated = validate_marks(marks)
    height, width = img.shape[:2]
    region = union(brow_frames(landmarks, height, width))
    if base is None:
        coverage = np.zeros((height, width), dtype=float)
        grey = np.zeros_like(coverage)
    else:
        previous = validate_evidence(base, img, region)
        coverage, grey = previous.coverage.copy(), previous.grey.copy()
    for mark in validated:
        points = [(point[0] * width, point[1] * height) for point in mark["points"]]
        if len(points) == 1:
            points.append(points[0])
        alpha = np.zeros((height, width), dtype=float)
        diameter = max(0.25, mark["radius"] * min(height, width) * 2)
        draw_path(alpha, points, diameter, mark["opacity"], region)
        if mark["mode"] == "erase":
            coverage *= 1 - alpha
            grey *= 1 - alpha
        else:
            coverage = np.maximum(coverage, alpha)
            if mark["mode"] == "grey":
                grey = np.maximum(grey, alpha)
            else:
                grey *= 1 - alpha
    notes = ("Visible hair coverage manually checked on this photo.",) if reviewed else (
        "Manual marks are incomplete until you confirm review of both brows.",)
    evidence = BrowEvidence(coverage, np.minimum(grey, coverage), "manual" if reviewed else "contrast",
                            1.0 if reviewed else 0.0, notes)
    return validate_evidence(evidence, img, region)


def observation_document(width: Any, height: Any, marks: Any, *, reviewed: bool = False) -> dict[str, Any]:
    w = number(width, "width", 8, 4096)
    h = number(height, "height", 8, 4096)
    if int(w) != w or int(h) != h or w * h > 4_194_304:
        raise ValueError("annotation image dimensions exceed the photo contract")
    return {"format": ANNOTATION_FORMAT, "author": "John Khan", "width": int(w), "height": int(h),
            "reviewed": boolean(reviewed, "reviewed"), "marks": validate_marks(marks)}


def export_observations(document: Any) -> str:
    checked = parse_observations(document)
    encoded = json.dumps(checked, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
    if len(encoded.encode()) > MAX_JSON_BYTES:
        raise ValueError("annotation document exceeds 1 MiB")
    return encoded


def parse_observations(value: Any, *, expected_size: tuple[int, int] | None = None) -> dict[str, Any]:
    if isinstance(value, str):
        if len(value.encode()) > MAX_JSON_BYTES:
            raise ValueError("annotation document exceeds 1 MiB")
        try:
            value = json.loads(value)
        except (ValueError, TypeError) as exc:
            raise ValueError("invalid annotation JSON") from exc
    if not isinstance(value, dict) or set(value) != {"format", "author", "width", "height", "reviewed", "marks"}:
        raise ValueError("unknown annotation document fields")
    if value["format"] != ANNOTATION_FORMAT or value["author"] != "John Khan":
        raise ValueError("unknown annotation format or author")
    result = observation_document(value["width"], value["height"], value["marks"], reviewed=value["reviewed"])
    if expected_size is not None and (result["width"], result["height"]) != expected_size:
        raise ValueError("annotation dimensions do not match the current photo")
    return result


def simplify_mark(points: list[list[float]], minimum_distance: float = 0.001) -> list[list[float]]:
    """Reduce redundant pointer events while keeping the exact first/last anchors."""
    distance = number(minimum_distance, "minimum_distance", 0, 0.05)
    checked = validate_marks([{"mode": "hair", "radius": 0.005, "opacity": 1, "points": points}])[0]["points"]
    result = [checked[0]]
    for point in checked[1:-1]:
        if math.hypot(point[0] - result[-1][0], point[1] - result[-1][1]) >= distance:
            result.append(point)
    if len(checked) > 1 and checked[-1] != result[-1]:
        result.append(checked[-1])
    return result
