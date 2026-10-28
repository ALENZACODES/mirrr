"""E08 first fifteen anatomically grouped 2D face-shape controls, Python reference.

Face-mapping inspiration: 3DDFA_V2 (dense correspondence), FLAME (separate shape and
pose), DECA (parametric facial changes), and face-alignment (aligned local face frame).
concept only, no code copied. We use R4's regions.py contours and R5's generated
anatomy.py, MLS similarity and anchor ring rather than creating a second mesh table.

All controls are photo-only simulations, not cosmetic outcomes or anatomical facts.
Author: John Khan.
"""

from __future__ import annotations

import json
import math
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from ..core import regions
from ..core.refusal import DegenerateInput
from ..proportions import anatomy
from ..warp import mesh as warp_mesh
from ..warp import mls
from .shape_guard import guarded_shape_render, local_shape_targets, needs_local_projection

Floats = NDArray[np.float64]
CONTROL_SPEC = Path(__file__).with_name("controls.json")
VERSION = "shape-spike-r6/1"
SIMULATION = "Face shape simulation; results from one photo are not a prediction."


def controls() -> tuple[dict, ...]:
    """The same authored JSON that scripts/sync_r6_data.py emits for TypeScript."""
    return tuple(json.loads(CONTROL_SPEC.read_text(encoding="utf-8"))["controls"])


CONTROLS = controls()
CONTROL_BY_ID = {spec["id"]: spec for spec in CONTROLS}
REGION_PAIRS = anatomy.region_pairs()


@dataclass(frozen=True)
class Frame:
    top: Floats
    axis_down: Floats
    axis_across: Floats
    centre: Floats
    length: float
    iod: float

    def uv(self, pt: Floats) -> tuple[float, float]:
        return float(np.dot(pt - self.centre, self.axis_across)), float(
            np.dot(pt - self.top, self.axis_down) / self.length
        )


def check_face(face: object) -> Floats:
    arr = np.asarray(face, dtype=np.float64)
    if arr.shape != (anatomy.MESH_POINTS, 2) or not np.all(np.isfinite(arr)):
        raise ValueError("a face must have 478 finite pixel-space [x,y] landmarks")
    if np.max(np.abs(arr)) > 1e6:
        raise ValueError("pixel landmarks exceed supported coordinate limit")
    return arr


def frame(face: object) -> Frame:
    arr = check_face(face)
    top, chin = arr[anatomy.LANDMARKS["mesh_top"]], arr[anatomy.LANDMARKS["chin"]]
    vertical = chin - top
    length = float(np.linalg.norm(vertical))
    if length < 1:
        raise DegenerateInput("no_face_length", "face top and chin must be distinct")
    down = vertical / length
    across = np.array([down[1], -down[0]])
    right = arr[anatomy.LANDMARKS["right_pupil"]]
    left = arr[anatomy.LANDMARKS["left_pupil"]]
    iod = float(np.linalg.norm(left - right))
    if iod < 1:
        raise DegenerateInput("eyes_coincide", "pupil distance must be at least one pixel")
    return Frame(top, down, across, (left + right) / 2, length, iod)


def _indices(region: str, face: Floats, f: Frame) -> list[int]:
    """Pick landmarks from the *canonical* contour and R5 anatomy, not another index loop."""
    oval = list(regions.FACE_OVAL)
    v = {i: f.uv(face[i])[1] for i in oval}
    if region == "outline":
        return oval
    if region == "outline_midline":
        return sorted(set(oval).union(anatomy.MIDLINE))
    if region == "cheeks":
        ids = {i for i in oval if 0.33 <= v[i] <= 0.77}
        ids.update(i for pair in REGION_PAIRS["cheeks"] for i in pair)
        return sorted(ids)
    if region.startswith("jaw"):
        ids = {i for i in oval if v[i] >= 0.55}
        ids.update(i for pair in REGION_PAIRS["jaw"] for i in pair)
        if region.endswith("midline"):
            ids.update(i for i in anatomy.MIDLINE if f.uv(face[i])[1] > 0.7)
        return sorted(ids)
    if region.startswith("chin"):
        ids = {i for i in oval if v[i] >= 0.79}
        if region.endswith("midline"):
            ids.update(i for i in anatomy.MIDLINE if f.uv(face[i])[1] > 0.85)
        return sorted(ids)
    if region.startswith("forehead"):
        ids = {i for i in oval if v[i] <= 0.36}
        ids.update(i for pair in REGION_PAIRS["forehead"] for i in pair)
        if region.endswith("midline"):
            ids.update(i for i in anatomy.MIDLINE if f.uv(face[i])[1] < 0.3)
        return sorted(ids)
    raise ValueError(f"unknown shape region: {region}")


def _direction(mode: str, u: float, v: float, iod: float, side: str) -> tuple[float, float]:
    sign = 1 if u > 1e-9 else -1 if u < -1e-9 else 0
    if mode == "symmetric_x":
        return sign * min(1, abs(u) / (0.2 * iod)), 0
    if mode == "length":
        return 0, (v - 0.5) * 2
    if mode == "puff":
        return sign, -0.16
    if mode == "side_x":
        return (sign if ((side == "right" and u < 0) or (side == "left" and u > 0)) else 0), 0
    if mode == "corner":
        return sign, -0.26
    if mode == "slope":
        return 0, min(1.0, abs(u) / iod)
    if mode == "jowl":
        return sign, 0.30
    if mode == "lower_y":
        return 0, 1
    if mode == "projection":
        return 0.55, -0.20
    if mode == "pointed":
        return -sign, 0.22
    if mode == "upper_y":
        return 0, -1
    raise ValueError(f"unknown shape mode {mode}")


def _clamp_magnitude(vec: Floats, limit: float) -> Floats:
    length = float(np.linalg.norm(vec))
    return vec * (limit / length) if length > limit else vec


def target_mesh(face: object, values: Mapping[str, float], *, strength: float = 1, spread: float = 0.22) -> Floats:
    """Compute continuous signed -100..100 recipe targets in the face-aligned frame.

    Only the selected contour landmarks receive direct motion. An MLS similarity field
    connects neighbouring landmarks inside a Gaussian falloff, and R5's anchor ring
    guarantees a fixed exterior in the actual raster warp. The original mesh is not changed.
    """
    src = check_face(face)
    if not (math.isfinite(strength) and 0 <= strength <= 1 and math.isfinite(spread) and 0 <= spread <= 1):
        raise ValueError("strength and spread must be in [0,1]")
    for name, value in values.items():
        if (
            name not in CONTROL_BY_ID
            or not isinstance(value, (int, float))
            or isinstance(value, bool)
            or not math.isfinite(value)
            or not -100 <= value <= 100
        ):
            raise ValueError(f"unknown or invalid shape amount: {name}")
    f = frame(src)
    delta = np.zeros_like(src)
    for key, amount in values.items():
        if abs(amount) < 1e-12:
            continue
        spec = CONTROL_BY_ID[key]
        amplitude = float(amount) / 100 * strength * spec["cap_iod"] / 100 * f.iod
        for idx in _indices(spec["region"], src, f):
            u, v = f.uv(src[idx])
            if spec.get("side") == "right" and u >= 0 or spec.get("side") == "left" and u <= 0:
                continue
            falloff = math.exp(-0.5 * ((v - spec["center_v"]) / spec["sigma_v"]) ** 2)
            if falloff < 0.025:
                continue
            dx, dy = _direction(spec["mode"], u, v, f.iod, spec.get("side", "none"))
            delta[idx] += amplitude * falloff * (dx * f.axis_across + dy * f.axis_down)
    limit = f.iod * 0.12
    for idx in range(len(delta)):
        delta[idx] = _clamp_magnitude(delta[idx], limit)
    changed = np.flatnonzero(np.linalg.norm(delta, axis=1) > 0.02)
    if not len(changed):
        return src.copy()
    if spread > 0:
        # Sparse MLS handles, fixed central features and a fixed R5 anchor ring.
        stable = [i for i in anatomy.MIDLINE if i not in changed and 0.30 <= f.uv(src[i])[1] <= 0.76]
        anchors = warp_mesh.anchor_ring(src)
        handles = np.vstack((src[changed], src[stable], anchors))
        outputs = np.vstack((src[changed] + delta[changed], src[stable], anchors))
        # Avoid duplicate handles on synthetic fixtures and near-degenerate real meshes.
        unique: list[int] = []
        for i, p in enumerate(handles):
            if not unique or bool(np.all(np.sum((p - handles[unique]) ** 2, axis=1) > 1e-8)):
                unique.append(i)
        if len(unique) >= 2:
            predicted = mls.deform(src, handles[unique], outputs[unique], mode="similarity")
            radius = 0.30 * f.iod
            distances = np.min(np.linalg.norm(src[changed][None, :, :] - src[:, None, :], axis=2), axis=1)
            for i, p in enumerate(src):
                if i in changed:
                    continue
                distance = float(distances[i])
                falloff = math.exp(-0.5 * (distance / radius) ** 2)
                if falloff > 0.03:
                    delta[i] += spread * falloff * _clamp_magnitude(predicted[i] - p, limit)
    moved = src + delta
    if any(amount <= -75 for amount in values.values()) and needs_local_projection(
        src, moved, iod=f.iod
    ):
        moved = local_shape_targets(src, moved, iod=f.iod)
    if not np.all(np.isfinite(moved)):
        raise ValueError("nonfinite shape output")
    return moved


def displacement(face: object, target: object) -> dict[str, float]:
    before, after = check_face(face), check_face(target)
    d = np.linalg.norm(after - before, axis=1)
    iod = frame(before).iod
    return {
        "max_iod_percent": float(np.max(d)) / iod * 100,
        "mean_iod_percent": float(d.mean()) / iod * 100,
        "moving_landmarks": float(np.sum(d > 0.02)),
    }


def raster_warp(
    image: np.ndarray, face: object, values: Mapping[str, float], *, strength: float = 1, spread: float = 0.22
) -> tuple[np.ndarray, dict[str, float]]:
    """Apply the guarded R5 mesh warp to an image, reporting *actual* strength used."""
    src = check_face(face)
    if image.ndim != 3 or image.shape[2] not in (3, 4) or image.dtype != np.uint8:
        raise ValueError("image must be RGB or RGBA uint8")
    dst = target_mesh(src, values, strength=strength, spread=spread)
    if np.array_equal(dst, src):
        return image.copy(), {
            "strength_used": strength,
            "guard_scale": 1.0,
            "min_area_ratio": 1.0,
            "max_iod_percent": 0.0,
        }
    if any(amount <= -75 for amount in values.values()):
        def make_target(before: Floats, settings: Mapping[str, float]) -> Floats:
            return target_mesh(before, settings, strength=strength, spread=spread)

        outcome = guarded_shape_render(image, src, values, make_target)
        retained = min(outcome.scales.values())
        moved = src + (outcome.targets - src) * outcome.guard_strength
        stats = displacement(src, moved)
        return outcome.image, {
            "strength_used": strength * retained * outcome.guard_strength,
            "guard_scale": outcome.guard_strength,
            "effect_fraction": retained,
            "min_area_ratio": outcome.triangle_ratio,
            "seam_ratio": outcome.seam_ratio,
            "q4_pass": float(outcome.q4_pass),
            "q1_pass": float(outcome.q1_pass),
            **stats,
        }
    warp = warp_mesh.mesh_warp(image.shape[0], image.shape[1], src, dst)
    from ..warp import field  # local import avoids circular dependency in standalone runner

    output = field.apply(image, warp.result.field)
    stats = displacement(src, src + (dst - src) * warp.strength_used)
    return output, {
        "strength_used": strength * warp.strength_used,
        "guard_scale": warp.strength_used,
        "min_area_ratio": warp.flips.min_area_ratio,
        **stats,
    }
