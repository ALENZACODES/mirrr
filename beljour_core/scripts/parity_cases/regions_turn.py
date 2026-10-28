"""Synthetic R12 cross-language vectors for visible masks and rendered turns.

No photos, model assets or external data. Full output bytes and full final maps
are kept so a convenient set of sample pixels cannot hide a porting discrepancy.
Generated JSON is a fixture, excluded from authored line counts.
Author: John Khan.
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "api"))
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from lab.python.beljour_lab.face_harness import synthetic_case  # noqa: E402
from plumb_api.engines.core import regions  # noqa: E402
from plumb_api.engines.shape.turn import render_turn  # noqa: E402
from plumb_api.engines.shape.turn_blend import support  # noqa: E402

PATH = ROOT / "parity/regions-turn-r12.json"


def clean(value: object) -> object:
    if isinstance(value, np.ndarray):
        return clean(value.tolist())
    if isinstance(value, (list, tuple)):
        return [clean(item) for item in value]
    if isinstance(value, dict):
        return {str(key): clean(item) for key, item in value.items()}
    if isinstance(value, float):
        return round(value, 8)
    return value


def yawed(xyz: np.ndarray, degrees: float, depth: bool = False) -> np.ndarray:
    """Turn the frontal mesh about a vertical cylinder (face edge at 65 degrees); with
    depth, z grows away from the camera as MediaPipe's does."""
    points = xyz[:, :2].copy()
    cx = (points[234, 0] + points[454, 0]) / 2
    radius = (points[454, 0] - points[234, 0]) / 2 / math.sin(math.radians(65))
    angle = np.arcsin(np.clip((points[:, 0] - cx) / radius, -1, 1)) + math.radians(degrees)
    points[:, 0] = cx + radius * np.sin(angle)
    if depth:
        points = np.column_stack([points, -radius * np.cos(angle)])
    return np.round(points, 8)


def narrow_left_eye(xyz: np.ndarray, depth: bool) -> np.ndarray:
    """A far eye squeezed to a third of its width but still on the face; with depth it lies
    well behind the near eye, so only the depth evidence can declare it hidden."""
    points = xyz[:, :2].copy()
    ids = [*regions.LEFT_EYE, 473, 474, 475, 476, 477]
    centre = points[list(regions.LEFT_EYE), 0].mean()
    points[ids, 0] = centre + (points[ids, 0] - centre) / 3
    if depth:
        z = np.zeros(len(points))
        z[list(regions.LEFT_EYE)] = 40.0
        points = np.column_stack([points, z])
    return np.round(points, 8)


def turned_cases(xyz: np.ndarray) -> list[tuple[str, np.ndarray]]:
    swapped = xyz[:, :2].copy()
    swapped[[33, 133]] = swapped[[133, 33]]
    return [("turn-50", yawed(xyz, 50)), ("turn-62-folded-oval", yawed(xyz, 62)),
            ("turn-75", yawed(xyz, 75)), ("turn-minus-75", yawed(xyz, -75)),
            ("turn-86-folded-eye", yawed(xyz, 86)), ("turn-50-depth", yawed(xyz, 50, depth=True)),
            ("narrow-eye-depth", narrow_left_eye(xyz, True)),
            ("narrow-eye-no-depth", narrow_left_eye(xyz, False)),
            ("frontal-swapped-corners", np.round(swapped, 8))]


def region_case(label: str, points: np.ndarray, height: int, width: int) -> dict:
    masks = regions.region_masks(points, height, width, normalized=False, supersample=2)
    diagnostics = regions.region_diagnostics(points, height, width, normalized=False, supersample=2)
    return {"id": label, "points": points, "masks": {key: value.ravel() for key, value in masks.items()},
            "diagnostics": diagnostics}


def build() -> dict:
    width, height = 72, 80
    original, _ = synthetic_case(1, width=144, height=160)
    xyz = np.round(original / 2, 8)
    yy, xx = np.mgrid[:height, :width]
    image = np.stack((40 + (xx % 16) * 4, 50 + (yy % 18) * 5,
                      60 + (xx % 13) * 3 + (yy % 11) * 2), -1).astype(np.uint8)
    regions_cases = []
    for label, shift in (("frontal", 0), ("far-eye", -10), ("invalid-eye", -20),
                         ("crossed-oval", 0), ("closed-eyes", 0), ("closed-mouth", 0)):
        points = xyz[:, :2].copy()
        ids = [*regions.RIGHT_EYE, 468, 469, 470, 471, 472]
        points[ids, 0] += shift
        if label == "crossed-oval":
            a, b = regions.FACE_OVAL[6], regions.FACE_OVAL[10]
            points[[a, b]] = points[[b, a]]
        elif label == "closed-eyes":
            for loop, iris in ((regions.RIGHT_EYE, (468, 469, 470, 471, 472)),
                               (regions.LEFT_EYE, (473, 474, 475, 476, 477))):
                level = points[list(loop), 1].mean()
                points[[*loop, *iris], 1] = level
        elif label == "closed-mouth":
            points[list(regions.LIPS_INNER), 1] = points[list(regions.LIPS_INNER), 1].mean()
        regions_cases.append(region_case(label, points, height, width))
    for label, points in turned_cases(xyz):
        regions_cases.append(region_case(label, points, height, width))
    turn_cases = []
    for label, yaw, pitch, locked in (("yaw", 8, 0, False), ("pitch", 0, -6, False),
                                      ("occlusion", -8, 0, True), ("zero", 0, 0, False)):
        protection = np.zeros((height, width), np.float32)
        if locked:
            protection[24:35, 22:25] = 1
            protection[24:35, 47:50] = 1
            protection[27:29, 24:48] = 1
        outcome = render_turn(image, xyz, yaw=yaw, pitch=pitch, protected_mask=protection)
        weights = support(height, width, xyz[:, :2], protected_mask=protection).weights
        turn_cases.append({"id": label, "yaw": yaw, "pitch": pitch,
                           "protected": protection.ravel(), "image": outcome.image.ravel(),
                           "map_x": outcome.field.map_x.ravel(), "map_y": outcome.field.map_y.ravel(),
                           "weights": weights.ravel(), "target": outcome.target, "metrics": outcome.metrics,
                           "effect_pass": outcome.checks["effect_pass"]})
    return clean({"format": "beljour-regions-turn-r12/1", "author": "John Khan", "synthetic": True,
                  "width": width, "height": height, "mesh": xyz, "image": image.ravel(),
                  "float_tolerance": 2e-6, "byte_tolerance": 1, "regions": regions_cases, "turns": turn_cases})
