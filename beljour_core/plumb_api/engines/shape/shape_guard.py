"""Conservative per-control shape search with unchanged fold and seam thresholds.

The preview evaluates its actual pixels. Failed edits are reduced by control,
not by silently replacing the entire image with an identity result.
Face-mapping inspiration: FLAME (separating shape parameters from appearance).
concept only, no code copied.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ...quality.metrics import q1_outside_mask, q4_seam
from ..core import regions
from ..warp import field as warp_field
from ..warp import mesh as warp_mesh
from ..warp import regularize

Floats = NDArray[np.float64]
Pixels = NDArray[np.uint8]
SEAM_MAXIMUM = 1.5
MIN_STRENGTH = 0.05
SCALE_STOPS = (1.0, 0.75, 0.5, 0.35, 0.25, 0.125, 0.0625)


@dataclass(frozen=True)
class ShapeTrial:
    """The candidate image and independently checked safety measurements."""

    image: Pixels
    targets: Floats
    scales: dict[str, float]
    guard_strength: float
    seam_ratio: float
    triangle_ratio: float
    jacobian_min: float
    q1_pass: bool
    q4_pass: bool
    fold_pass: bool
    affected_pixels: int

    @property
    def passed(self) -> bool:
        return (
            self.guard_strength >= MIN_STRENGTH
            and self.q1_pass
            and self.q4_pass
            and self.fold_pass
        )


class ShapeSafetyRefusal(ValueError):
    """A particular photo/control combination cannot meet the existing rules."""



def needs_local_projection(source: Floats, proposed: Floats, *, iod: float) -> bool:
    """Detect isolated extreme strain without inspecting pixel colour or group labels.

    Thirty-fold local displacement differences are pathological relative to
    the nearest positive landmark spacing. Ordinary authored targets are kept
    byte-identical, preserving historical parity and gentle-level semantics.
    """
    delta = proposed - source
    if not np.any(delta):
        return False
    graph = regularize.neighbour_graph(source, iod)
    for i, j, distance in graph.edges:
        if distance <= 1e-6 or distance >= iod:
            continue
        difference = float(np.linalg.norm(delta[j] - delta[i]))
        if difference > 30.0 * distance and difference > 0.02 * iod:
            return True
    return False


def local_shape_targets(source: Floats, proposed: Floats, *, iod: float) -> Floats:
    """Project extreme local differences without globally scaling other edits.

    Dangerous neighbours are corrected with the existing local-spacing projection.
    Valid neighbours keep the requested field; this is not a replacement for Q3.
    """
    if source.shape != (478, 2) or proposed.shape != source.shape:
        raise ValueError("shape projection needs matching 478-point coordinates")
    if not np.isfinite(source).all() or not np.isfinite(proposed).all():
        raise ValueError("shape coordinates must be finite")
    if not np.isfinite(iod) or iod < 1:
        raise ValueError("interocular distance must be positive")
    delta = proposed - source
    if not np.any(delta):
        return proposed.copy()
    graph = regularize.neighbour_graph(source, iod)
    strained = np.zeros(len(source), dtype=bool)
    for i, j, length in graph.edges:
        if length < 1e-7:
            continue
        difference = float(np.linalg.norm(delta[j] - delta[i]))
        if difference > 0.4 * length:
            if np.linalg.norm(delta[i]) >= np.linalg.norm(delta[j]):
                strained[i] = True
            else:
                strained[j] = True
    if not strained.any():
        return proposed.copy()
    stable = regularize.regularize_targets(source, proposed, reference_scale=iod).points
    result = proposed.copy()
    result[strained] = stable[strained]
    # Move duplicate vertices together, or a triangulation may choose the wrong one.
    groups: dict[tuple[float, float], list[int]] = {}
    for idx, point in enumerate(source):
        groups.setdefault((float(point[0]), float(point[1])), []).append(idx)
    for indices in groups.values():
        if len(indices) <= 1:
            continue
        if any(strained[index] for index in indices):
            result[indices] = stable[indices]
    return result


def _trial(
    image: Pixels,
    source: Floats,
    requested: Floats,
    mask: np.ndarray,
    scales: Mapping[str, float],
    lay: warp_mesh.MeshLayout,
) -> ShapeTrial:
    height, width = image.shape[:2]
    warp = warp_mesh.mesh_warp(height, width, source, requested, lay=lay)
    output = warp_field.apply(image, warp.result.field)
    edited = (warp.result.field.move() > 1e-6).astype(np.float32)
    q1 = q1_outside_mask(image, output, edited)
    q4 = q4_seam(image, output, mask, maximum=SEAM_MAXIMUM)
    return ShapeTrial(
        output,
        requested.copy(),
        dict(scales),
        warp.strength_used,
        float(q4.measured["ratio"]),
        float(warp.flips.min_area_ratio),
        float(warp.jacobian.min_det),
        q1.passed,
        q4.passed,
        warp.flips.passed and warp.jacobian.passed,
        int(np.count_nonzero(edited)),
    )


def guarded_shape_render(
    image: Pixels,
    source: Floats,
    values: Mapping[str, float],
    make_target: Callable[[Floats, Mapping[str, float]], Floats],
) -> ShapeTrial:
    """Keep the largest validated per-control setting that clears the old rules.

    Each evaluation renders actual full-resolution output. For multiple edits the
    search removes only the control responsible for the worst Q4/Q3 violation.
    Neither the 1.5 seam limit nor the minimum edit strength can be overridden.
    """
    if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError("shape preview needs uint8 RGB or RGBA pixels")
    if image.shape[0] < 4 or image.shape[1] < 4:
        raise ValueError("shape image is too small")
    if not values:
        raise ValueError("shape search needs at least one control")
    height, width = image.shape[:2]
    lay = warp_mesh.layout(source, width, height)
    outline = regions.region_mask(
        "face_oval", source, height, width, normalized=False, supersample=2
    )
    components = {
        key: make_target(source, {key: level}) - source
        for key, level in values.items()
    }
    scales = {key: 1.0 for key in values}
    cache: dict[tuple[float, ...], ShapeTrial] = {}
    names = tuple(sorted(values))

    def evaluate(settings: Mapping[str, float]) -> ShapeTrial:
        key = tuple(settings[name] for name in names)
        if key in cache:
            return cache[key]
        displacement = np.zeros_like(source)
        for name in names:
            displacement += components[name] * settings[name]
        candidate = source + displacement
        outcome = _trial(image, source, candidate, outline, settings, lay)
        cache[key] = outcome
        return outcome

    best = evaluate(scales)
    if best.passed:
        return best
    # Check one control at a time, preserving every unaffected control's setting.
    for name in names:
        if best.passed:
            break
        selected = best
        for level in SCALE_STOPS[1:]:
            candidate = dict(scales)
            candidate[name] = level
            trial = evaluate(candidate)
            if trial.passed:
                return trial
            if trial.seam_ratio < selected.seam_ratio and trial.guard_strength >= MIN_STRENGTH:
                selected = trial
        scales[name] = selected.scales[name]
        best = selected
    if best.passed:
        return best
    raise ShapeSafetyRefusal("shape edit cannot satisfy fold, seam and strength checks")
