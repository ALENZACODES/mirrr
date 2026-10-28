"""Runs a local engine over test photos and its stops, and scores it with the Q checks.

Per photo and stop: Q1 against the engine's own editMask, Q4 on the selection edge,
Q5 by running the engine twice, Q6 when the stop names a target colour, Q10 when a
skin mask is given. Across stops: Q9 on the mean colour change inside the selection.

Q10 thresholds follow the plan: 0.60 of the original texture at the first stop
("Natural"), 0.35 at the strongest, linearly in between (in-between values ASSUMED).

Until John's released photos arrive (decisions.md Q11) the harness runs on the
synthetic photos below; reports say so.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from functools import partial
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..engines.core.engine import LocalEngine, run_engine
from ..engines.core.masks import ellipse
from . import metrics
from .metrics import Check
from .report import PhotoResult, build_report

NATURAL_TEXTURE = 0.60
STRONGEST_TEXTURE = 0.35


@dataclass
class SamplePhoto:
    photo: str
    image: NDArray[np.uint8]
    masks: dict[str, NDArray[np.float32]]
    synthetic: bool = True
    landmarks: Any = None


@dataclass
class StopSpec:
    name: str
    params: dict[str, Any]
    target: str | None = None          # hex colour the stop should render, for Q6


@dataclass
class HarnessResult:
    report: dict[str, Any]
    checks: list[tuple[str, str | None, Check]] = field(default_factory=list)


def hash_noise(seed: int, height: int, width: int) -> NDArray[np.float64]:
    """Repeatable noise in [-0.5, 0.5) from 32-bit integer hashing.

    Every intermediate stays below 2**63, so NumPy int64 and the TypeScript port
    (Math.imul) compute the same bits on every platform."""
    yy, xx = np.mgrid[0:height, 0:width].astype(np.int64)
    h = (xx * 374761393 + yy * 668265263 + seed * 2246822519) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    h = h ^ (h >> 16)
    return (h % 10007) / 10007.0 - 0.5


def synthetic_photo(seed: int, height: int = 96, width: int = 80) -> SamplePhoto:
    """A soft background gradient, a skin-toned oval with fine texture, and its masks."""
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    base = np.stack([60 + 80 * xx / width, 70 + 60 * yy / height, 110 + 40 * (xx + yy) / (width + height)], -1)
    face = ellipse(height, width, width * 0.5, height * 0.5, width * 0.32, height * 0.38, feather=0.08)
    tone = np.array([196.0, 150.0, 128.0]) + (seed % 7) - 3
    texture = 16 * hash_noise(seed, height, width)[..., None]
    image = base * (1 - face[..., None]) + (tone + texture) * face[..., None]
    skin = ellipse(height, width, width * 0.5, height * 0.52, width * 0.24, height * 0.28)
    return SamplePhoto(f"synthetic-{seed:02d}", np.clip(np.rint(image), 0, 255).astype(np.uint8),
                       {"selection": face, "skin": skin})


def texture_minimum(index: int, count: int) -> float:
    if count <= 1:
        return NATURAL_TEXTURE
    t = index / (count - 1)
    return NATURAL_TEXTURE + (STRONGEST_TEXTURE - NATURAL_TEXTURE) * t


def score_photo(engine: LocalEngine, photo: SamplePhoto, stops: Sequence[StopSpec], *,
                seed: int = 0, selection: str = "selection",
                skin: str | None = None) -> list[tuple[StopSpec, list[Check]]]:
    out: list[tuple[StopSpec, list[Check]]] = []
    strengths = []
    select = photo.masks[selection]
    def render(params: dict[str, Any]) -> NDArray[np.uint8]:
        return run_engine(engine, photo.image, photo.landmarks, photo.masks, params, seed).image

    for index, stop in enumerate(stops):
        result = run_engine(engine, photo.image, photo.landmarks, photo.masks, stop.params, seed)
        checks = [
            metrics.q1_outside_mask(photo.image, result.image, result.editMask),
            metrics.q4_seam(photo.image, result.image, select),
            metrics.q5_determinism(partial(render, stop.params)),
        ]
        if stop.target:
            checks.append(metrics.q6_colour_accuracy(result.image, select, stop.target))
        if skin:
            checks.append(metrics.q10_texture_kept(photo.image, result.image, photo.masks[skin],
                                                   minimum=texture_minimum(index, len(stops))))
        strengths.append(metrics.effect_strength(photo.image, result.image, select))
        out.append((stop, checks))
    if len(stops) > 1:
        out[-1][1].append(metrics.q9_monotonic(strengths))
    return out


def run(tool: str, tool_version: str, engine: LocalEngine, photos: Sequence[SamplePhoto],
        stops: Sequence[StopSpec], *, seed: int = 0, skin: str | None = None,
        created: str | None = None, extra: Mapping[str, list[Check]] | None = None) -> HarnessResult:
    """Score `engine` and build a §17 report. `extra` adds checks per photo id (e.g. Q3)."""
    if not photos or not stops:
        raise ValueError("need at least one photo and one stop")
    entries: list[PhotoResult] = []
    flat: list[tuple[str, str | None, Check]] = []
    for photo in photos:
        for stop, checks in score_photo(engine, photo, stops, seed=seed, skin=skin):
            entries.append(PhotoResult(photo.photo, photo.synthetic, checks, stop.name))
            flat += [(photo.photo, stop.name, c) for c in checks]
        for check in (extra or {}).get(photo.photo, []):
            entries.append(PhotoResult(photo.photo, photo.synthetic, [check], None))
            flat.append((photo.photo, None, check))
    report = build_report(tool, tool_version, entries, created=created)
    return HarnessResult(report, flat)
