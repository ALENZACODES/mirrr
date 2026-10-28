"""W70 bounded transport of observed brow pixels, without synthetic extra hairs.

Disjoint pixel swaps conserve the RGB histogram exactly and do not interpolate
or smooth skin. Connected observations are not biological hair counts. Large
unseparated patches are refused instead of inventing a strand model.
Author: John Khan.
"""
from __future__ import annotations

import math
from typing import Any

import numpy as np

from .contracts import BrowEvidence, BrowResult, finish, number, options
from .evidence import components, evidence_summary
from .geometry import BrowFrame, union


def render_lamination(image: np.ndarray, evidence: BrowEvidence, frames: tuple[BrowFrame, BrowFrame],
                      settings: dict[str, Any] | None = None) -> BrowResult:
    opts = options(settings, {"amount", "angle"})
    amount = number(opts.get("amount", 0.5), "amount", 0, 1)
    angle = number(opts.get("angle", 60), "angle", 0, 85)
    height, width = image.shape[:2]
    support = np.zeros((height, width), dtype=np.float64)
    output = image.copy()
    used: set[tuple[int, int]] = set()
    swaps: list[tuple[int, int, int, int]] = []
    refused = 0
    measured_groups = 0
    max_move = 0.0
    for frame in frames:
        local = evidence.coverage * frame.mask
        for group in components(local):
            measured_groups += 1
            if len(group) < 2:
                refused += 1
                continue
            projections = [frame.project(x + 0.5, y + 0.5) for x, y in group]
            us = [u for u, _ in projections]
            vs = [v for _, v in projections]
            if max(us) - min(us) > 0.35 or max(vs) - min(vs) > 0.55:
                refused += 1
                continue
            root_index = min(range(len(group)), key=lambda i: (projections[i][1], projections[i][0]))
            root_x, root_y = group[root_index]
            cx = sum(x for x, _ in group) / len(group)
            cy = sum(y for _, y in group) / len(group)
            vx, vy = cx - root_x, cy - root_y
            if math.hypot(vx, vy) < 0.25:
                refused += 1
                continue
            current = math.atan2(vy, vx)
            # Desired comb direction remains outward as well as upward.
            desired = math.atan2(frame.up[1] * math.sin(math.radians(angle)) + frame.across[1] * math.cos(math.radians(angle)),
                                 frame.up[0] * math.sin(math.radians(angle)) + frame.across[0] * math.cos(math.radians(angle)))
            delta = math.atan2(math.sin(desired - current), math.cos(desired - current)) * amount
            delta = max(-math.pi / 3, min(math.pi / 3, delta))
            cos_a, sin_a = math.cos(delta), math.sin(delta)
            for x, y in sorted(group, key=lambda p: ((p[0] - root_x) ** 2 + (p[1] - root_y) ** 2, p[1], p[0]), reverse=True):
                dx, dy = x - root_x, y - root_y
                nx = int(math.floor(root_x + cos_a * dx - sin_a * dy + 0.5))
                ny = int(math.floor(root_y + sin_a * dx + cos_a * dy + 0.5))
                if (nx, ny) == (x, y) or (x, y) in used or (nx, ny) in used:
                    continue
                if not (0 <= nx < width and 0 <= ny < height):
                    continue
                u, v = frame.project(nx + 0.5, ny + 0.5)
                if not -0.05 <= u <= 1.05 or not -0.10 <= v <= 0.55:
                    continue
                if evidence.coverage[ny, nx] >= 0.5:
                    continue
                if image.shape[2] == 4 and (image[y, x, 3] != 255 or image[ny, nx, 3] != 255):
                    continue
                movement = math.hypot(nx - x, ny - y)
                if movement > frame.width * 0.25:
                    continue
                used.add((x, y))
                used.add((nx, ny))
                swaps.append((x, y, nx, ny))
                max_move = max(max_move, movement)
    if amount > 0:
        for x, y, nx, ny in swaps:
            output[y, x, :3] = image[ny, nx, :3]
            output[ny, nx, :3] = image[y, x, :3]
            support[y, x] = 1
            support[ny, nx] = 1
    else:
        swaps = []
    metrics = evidence_summary(evidence, union(frames))
    metrics.update(observed_components=measured_groups, refused_components=refused,
                   transported_pixels=len(swaps), maximum_movement_px=max_move if swaps else 0,
                   length_scale=1.0, smoothing_applied=False, rgb_histogram_conserved=True)
    warnings = list(evidence.notes)
    if metrics["observed_coverage_fraction"] < 0.12 or not swaps:
        warnings.append("Sparse, short or unseparated brows may show very little change. A pigment preview is a separate option.")
    if angle > 70 or amount > 0.75:
        warnings.append("A strongly upright direction can exceed the visible hair length; this preview does not lengthen it.")
    status = "unavailable" if amount > 0 and not swaps else "simulation"
    return finish(image, output, support, metrics, warnings=tuple(warnings), status=status)
