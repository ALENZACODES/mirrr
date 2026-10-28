"""Trace evidence diagnostics; never a learned lash counter. Author: John Khan."""
from __future__ import annotations

import math
from collections.abc import Sequence
from typing import Any

import numpy as np

from .contracts import LashTrace, polyline_length


def trace_summary(traces: Sequence[LashTrace], width: int, height: int) -> dict[str, Any]:
    if width < 8 or height < 8:
        raise ValueError("trace summary needs positive image dimensions")
    counts = {"right_upper": 0, "right_lower": 0, "left_upper": 0, "left_lower": 0}
    low_confidence = 0
    duplicates = 0
    seen: set[tuple] = set()
    lengths = []
    sharp_turns = 0
    for item in traces:
        key = (item.side, item.lower, item.points)
        if key in seen:
            duplicates += 1
        seen.add(key)
        if item.confidence < .5:
            low_confidence += 1
            continue
        counts[f'{item.side}_{"lower" if item.lower else "upper"}'] += 1
        points = [(x * width, y * height) for x, y in item.points]
        lengths.append(polyline_length(points))
        for a, b, c in zip(points, points[1:], points[2:], strict=False):
            first, second = np.array(b) - a, np.array(c) - b
            den = float(np.linalg.norm(first) * np.linalg.norm(second))
            if den > 1e-9 and float(np.dot(first, second)) / den < -.5:
                sharp_turns += 1
    return {"observed": counts, "low_confidence": low_confidence, "duplicate_traces": duplicates,
            "sharp_turns": sharp_turns, "length_min_px": min(lengths, default=None),
            "length_max_px": max(lengths, default=None), "source": "explicit_observed_traces",
            "automatic_lash_count": None, "quality_note": "Manual traces require visual checking; no automatic lash model is used."}


def resample_trace(points: Sequence[Sequence[float]], count: int = 17) -> list[tuple[float, float]]:
    """Arc-length resampling for drawing overlays, without changing measured length metadata."""
    if not 2 <= count <= 64 or isinstance(count, bool):
        raise ValueError("resample count must be 2..64")
    array = np.asarray(points, dtype=np.float64)
    if array.ndim != 2 or array.shape[1] != 2 or len(array) < 2 or not np.all(np.isfinite(array)):
        raise ValueError("resampling needs finite trace points")
    segments = [math.dist(a, b) for a, b in zip(array, array[1:], strict=False)]
    total = sum(segments)
    if total <= 1e-9:
        raise ValueError("cannot resample a zero-length trace")
    cumulative = [0.0]
    for distance in segments:
        cumulative.append(cumulative[-1] + distance)
    output = []
    cursor = 0
    for index in range(count):
        target = index * total / (count - 1)
        while cursor < len(segments) - 1 and cumulative[cursor + 1] < target:
            cursor += 1
        share = (target - cumulative[cursor]) / max(segments[cursor], 1e-12)
        value = array[cursor] * (1 - share) + array[cursor + 1] * share
        output.append((float(value[0]), float(value[1])))
    return output


def photometric_trace_evidence(photo: np.ndarray, trace: LashTrace) -> dict[str, Any]:
    """Contrast disclosure for manual review, including grey/low-contrast hairs.

    A dark-line heuristic cannot validate every lash and never deletes a trace.
    It is a diagnostic, not training data, an identity metric or an eligibility gate.
    """
    height, width = photo.shape[:2]
    values = []
    missing = 0
    points = resample_trace([(x * width, y * height) for x, y in trace.points])
    luminance = photo[:, :, :3] @ np.array((.2126, .7152, .0722))
    for index, (x, y) in enumerate(points):
        previous = points[max(0, index - 1)]
        following = points[min(len(points) - 1, index + 1)]
        dx, dy = following[0] - previous[0], following[1] - previous[1]
        norm = max(math.hypot(dx, dy), 1e-12)
        normal = (-dy / norm * 2, dx / norm * 2)
        samples = [(x, y), (x + normal[0], y + normal[1]), (x - normal[0], y - normal[1])]
        coords = [(int(math.floor(a)), int(math.floor(b))) for a, b in samples]
        if any(a < 0 or a >= width or b < 0 or b >= height for a, b in coords):
            missing += 1
            continue
        centre, first, second = (float(luminance[b, a]) for a, b in coords)
        values.append((first + second) / 2 - centre)
    return {"samples": len(values), "missing": missing,
            "median_dark_line_contrast": float(np.median(values)) if values else None,
            "classification": "diagnostic_only", "trace_removed": False,
            "warning": "Grey or low-contrast lashes can score weakly; confirm the trace visually."}
