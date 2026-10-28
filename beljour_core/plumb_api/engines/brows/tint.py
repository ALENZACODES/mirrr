"""W69 tint existing observed brow coverage, with resistant grey observations.

This is a digital tint estimate, not a product recommendation. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from .contracts import BrowEvidence, BrowResult, byte, choice, colour, finish, number, options
from .evidence import evidence_summary, luminance
from .geometry import BrowFrame, union

STATES = ("settled", "first_week", "faded")


def tint_suggestion(image: np.ndarray, evidence: BrowEvidence, frames: tuple[BrowFrame, BrowFrame]) -> tuple[int, int, int]:
    selected = evidence.coverage >= 0.5
    skin = (union(frames) >= 0.5) & (evidence.coverage < 0.2)
    if not np.any(selected):
        return 92, 72, 59
    values = image[selected, :3].astype(np.float64)
    median = []
    for channel in range(3):
        sorted_values = sorted(float(v) for v in values[:, channel])
        median.append(sorted_values[(len(sorted_values) - 1) // 2])
    skin_light = float(np.mean(luminance(image[skin, :3]))) if np.any(skin) else 150
    # Maximum darkening is modest and relative to the observation, not skin identity.
    ratio = 0.85 if skin_light > 130 else 0.94
    return byte(median[0] * ratio), byte(median[1] * ratio), byte(median[2] * ratio)


def render_tint(image: np.ndarray, evidence: BrowEvidence, frames: tuple[BrowFrame, BrowFrame],
                settings: dict[str, Any] | None = None) -> BrowResult:
    opts = options(settings, {"amount", "colour", "state", "greyResistance"})
    amount = number(opts.get("amount", 0.5), "amount", 0, 1)
    state = choice(opts.get("state", "settled"), "state", STATES)
    resistance = number(opts.get("greyResistance", 0.65), "greyResistance", 0, 1)
    target = colour(opts.get("colour", tint_suggestion(image, evidence, frames)))
    intensity = {"settled": 0.52, "first_week": 0.82, "faded": 0.24}[state]
    coverage = evidence.coverage
    grey_share = np.divide(evidence.grey, coverage, out=np.zeros_like(coverage), where=coverage > 0)
    alpha = coverage * amount * intensity * (1 - grey_share * resistance)
    output = image.copy()
    for y, x in zip(*np.nonzero(alpha > 0), strict=True):
        for channel in range(3):
            output[y, x, channel] = byte(float(image[y, x, channel]) * (1 - alpha[y, x]) + target[channel] * alpha[y, x])
    metrics = evidence_summary(evidence, union(frames))
    metrics.update(state=state, grey_resistance=resistance, colour=list(target),
                   maximum_opacity=float(np.max(alpha)), skin_gap_unchanged=bool(np.array_equal(output[coverage == 0], image[coverage == 0])))
    warnings = list(evidence.notes)
    if metrics["observed_coverage_fraction"] < 0.12:
        warnings.append("Sparse areas remain sparse. Compare a separate pigment-stroke or powder simulation if wanted.")
    if state == "first_week":
        warnings.append("The first-week view intentionally looks darker; it is an illustrative state, not a duration guarantee.")
    status = "unavailable" if not np.any(coverage > 0) else "simulation"
    if status == "unavailable":
        warnings.append("No reliable brow hair coverage. Mark the visible hairs before applying tint.")
    return finish(image, output, alpha, metrics, warnings=tuple(warnings), status=status)
