"""W69-W74 input contracts, ownership and conservative resource limits.

Every effect is a local procedural simulation. Measurements derived from a photo
are distinguished from user-selected hypothetical outcomes. Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

U8 = NDArray[np.uint8]
F64 = NDArray[np.float64]
MAX_PIXELS = 4_194_304
MAX_SIDE = 4096
FEATURES = ("W69", "W70", "W71", "W72", "W73", "W74")
VERSION = "brows-r15b/1"
LABEL = "Brow simulation. Placement and colour are illustrative, not a treatment prediction."


@dataclass(frozen=True)
class BrowEvidence:
    """Observed photo coverage; these are pixels, never inferred biological counts."""

    coverage: F64
    grey: F64
    origin: str = "contrast"
    confidence: float = 0.0
    notes: tuple[str, ...] = ()


@dataclass(frozen=True)
class BrowResult:
    image: U8
    support: F64
    metrics: dict[str, Any]
    warnings: tuple[str, ...] = ()
    label: str = LABEL
    status: str = "simulation"
    details: dict[str, Any] = field(default_factory=dict)


def photo(image: Any) -> U8:
    arr = np.asarray(image)
    if arr.dtype != np.uint8 or arr.ndim != 3 or arr.shape[2] not in (3, 4):
        raise ValueError("brows require an RGB or RGBA uint8 image")
    height, width = arr.shape[:2]
    if min(height, width) < 8 or max(height, width) > MAX_SIDE or height * width > MAX_PIXELS:
        raise ValueError("brow image must be 8..4096 pixels per side and at most 4194304 pixels")
    return arr


def number(value: Any, name: str, low: float, high: float) -> float:
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, (int, float, np.number)):
        raise ValueError(f"{name} must be a number")
    out = float(value)
    if not math.isfinite(out) or not low <= out <= high:
        raise ValueError(f"{name} must be finite in {low}..{high}")
    return out


def choice(value: Any, name: str, allowed: tuple[str, ...]) -> str:
    if not isinstance(value, str) or value not in allowed:
        raise ValueError(f"{name} must be one of {', '.join(allowed)}")
    return value


def boolean(value: Any, name: str) -> bool:
    if not isinstance(value, bool):
        raise ValueError(f"{name} must be a boolean")
    return value


def colour(value: Any) -> tuple[int, int, int]:
    if not isinstance(value, (list, tuple, np.ndarray)) or len(value) != 3:
        raise ValueError("colour must be three RGB bytes")
    values = [number(v, "colour", 0, 255) for v in value]
    if any(v != int(v) for v in values):
        raise ValueError("colour components must be integer bytes")
    return int(values[0]), int(values[1]), int(values[2])


def options(value: Any, allowed: set[str]) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, dict) or any(not isinstance(k, str) for k in value):
        raise ValueError("brow options must be an object")
    if any(item is None for item in value.values()):
        raise ValueError("brow options cannot contain null values")
    unknown = set(value) - allowed
    if unknown:
        raise ValueError("unknown brow option: " + ", ".join(sorted(unknown)))
    return dict(value)


def mask(value: Any, height: int, width: int, name: str) -> F64:
    arr = np.asarray(value, dtype=np.float64)
    if arr.shape != (height, width) or not np.all(np.isfinite(arr)):
        raise ValueError(f"{name} must be a finite image-sized mask")
    if np.any(arr < 0) or np.any(arr > 1):
        raise ValueError(f"{name} must stay in 0..1")
    return arr.copy()


def validate_evidence(evidence: BrowEvidence, image: U8, region: F64) -> BrowEvidence:
    if not isinstance(evidence, BrowEvidence):
        raise ValueError("brow evidence must be BrowEvidence")
    height, width = image.shape[:2]
    coverage = mask(evidence.coverage, height, width, "coverage")
    grey = mask(evidence.grey, height, width, "grey")
    choice(evidence.origin, "evidence origin", ("contrast", "manual"))
    confidence = number(evidence.confidence, "confidence", 0, 1)
    if (not isinstance(evidence.notes, (list, tuple)) or len(evidence.notes) > 8
            or any(not isinstance(note, str) or len(note) > 200 for note in evidence.notes)):
        raise ValueError("evidence notes must be at most eight short strings")
    if np.any(coverage[region == 0] > 0):
        raise ValueError("observed hair coverage must stay inside the brow contour")
    if np.any(grey > coverage + 1e-12):
        raise ValueError("grey coverage cannot exceed observed hair coverage")
    if image.shape[2] == 4:
        coverage *= image[..., 3] / 255
        grey = np.minimum(grey, coverage)
    return BrowEvidence(coverage, grey, evidence.origin, confidence, tuple(evidence.notes))


def byte(value: float) -> int:
    return min(255, max(0, int(math.floor(value + 0.5))))


def finish(image: U8, output: U8, support: F64, metrics: dict[str, Any], *,
           warnings: tuple[str, ...] = (), status: str = "simulation",
           details: dict[str, Any] | None = None) -> BrowResult:
    """Enforce image ownership, unchanged alpha and explicit support at one exit."""
    if output.shape != image.shape or output.dtype != np.uint8:
        raise ValueError("brow output violates the photo contract")
    if image.shape[2] == 4:
        output[..., 3] = image[..., 3]
        output[image[..., 3] == 0] = image[image[..., 3] == 0]
        support = support.copy()
        support[image[..., 3] == 0] = 0
    changed = np.any(output != image, axis=2)
    if np.any(changed & (support <= 0)):
        raise ValueError("brow renderer modified pixels outside its support")
    data = dict(metrics)
    data.update(changed_pixels=int(np.count_nonzero(changed)),
                outside_unchanged=bool(np.array_equal(output[support == 0], image[support == 0])),
                alpha_unchanged=bool(image.shape[2] == 3 or np.array_equal(image[..., 3], output[..., 3])),
                finite_output=True, geometry_changed=False)
    return BrowResult(output.copy(), support.copy(), data, warnings, LABEL, status, details or {})
