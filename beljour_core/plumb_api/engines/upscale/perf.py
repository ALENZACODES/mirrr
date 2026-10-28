"""R18B deterministic performance planning for classical upscale. Author: John Khan.

The functions here do not claim device speed. They provide allocation/work-unit
estimates and a local timing harness so the box can compare implementations
without weakening image-quality gates.
"""
from __future__ import annotations

import math
import statistics
import time
from collections.abc import Callable, Sequence
from dataclasses import dataclass

import numpy as np

from .tiling import memory_budget, plan, recommended_tile_side


@dataclass(frozen=True)
class WorkEstimate:
    width: int
    height: int
    scale: int
    tile_side: int
    overlap: int
    tile_count: int
    input_pixels_read: int
    output_pixels_written: int
    overlap_pixels_read: int
    peak_bytes_estimate: int

    @property
    def overlap_fraction(self) -> float:
        useful = self.width * self.height
        if useful <= 0:
            return 0.0
        return max(0.0, (self.input_pixels_read - useful) / useful)


@dataclass(frozen=True)
class TimingSummary:
    samples_ms: tuple[float, ...]
    median_ms: float
    minimum_ms: float
    maximum_ms: float
    p90_ms: float

    def validate(self) -> None:
        if not self.samples_ms:
            raise ValueError("timing summary requires samples")
        if any(not math.isfinite(value) or value < 0 for value in self.samples_ms):
            raise ValueError("timing samples must be finite non-negative values")
        if not self.minimum_ms <= self.median_ms <= self.maximum_ms:
            raise ValueError("timing order invalid")


def estimate(width: int, height: int, scale: int, *, tile_side: int | None = None, overlap: int = 12) -> WorkEstimate:
    if width < 1 or height < 1:
        raise ValueError("image dimensions must be positive")
    if scale not in (2, 4):
        raise ValueError("scale must be 2 or 4")
    chosen = tile_side if tile_side is not None else recommended_tile_side(width, height, scale)
    tiles = plan(width, height, chosen, overlap)
    input_pixels = 0
    output_pixels = 0
    for tile in tiles:
        input_pixels += (tile.read_x1 - tile.read_x0) * (tile.read_y1 - tile.read_y0)
        output_pixels += tile.width * scale * tile.height * scale
    peak = memory_budget(chosen, overlap, scale)["peak_bytes_estimate"]
    return WorkEstimate(
        width=width,
        height=height,
        scale=scale,
        tile_side=chosen,
        overlap=overlap,
        tile_count=len(tiles),
        input_pixels_read=input_pixels,
        output_pixels_written=output_pixels,
        overlap_pixels_read=max(0, input_pixels - width * height),
        peak_bytes_estimate=peak,
    )


def candidate_estimates(
    width: int,
    height: int,
    scale: int,
    *,
    candidates: Sequence[int] = (1024, 768, 640, 512, 384, 256),
    overlap: int = 12,
    max_peak_mb: float = 96.0,
) -> tuple[WorkEstimate, ...]:
    if not math.isfinite(max_peak_mb) or max_peak_mb <= 0:
        raise ValueError("max_peak_mb must be positive finite")
    limit = int(max_peak_mb * 1024 * 1024)
    rows: list[WorkEstimate] = []
    for tile_side in candidates:
        if tile_side < 64 or tile_side > 4096 or overlap * 2 >= tile_side:
            continue
        row = estimate(width, height, scale, tile_side=tile_side, overlap=overlap)
        if row.peak_bytes_estimate <= limit:
            rows.append(row)
    return tuple(rows)


def choose_lowest_work(
    width: int,
    height: int,
    scale: int,
    *,
    candidates: Sequence[int] = (1024, 768, 640, 512, 384, 256),
    overlap: int = 12,
    max_peak_mb: float = 96.0,
) -> WorkEstimate:
    rows = candidate_estimates(
        width,
        height,
        scale,
        candidates=candidates,
        overlap=overlap,
        max_peak_mb=max_peak_mb,
    )
    if not rows:
        raise ValueError("no tile candidate fits the memory budget")
    return min(rows, key=lambda row: (row.input_pixels_read, row.tile_count, -row.tile_side))


def _percentile(values: Sequence[float], fraction: float) -> float:
    if not values:
        raise ValueError("values required")
    if not 0 <= fraction <= 1:
        raise ValueError("fraction must be 0..1")
    ordered = sorted(float(value) for value in values)
    if len(ordered) == 1:
        return ordered[0]
    position = fraction * (len(ordered) - 1)
    low = int(math.floor(position))
    high = int(math.ceil(position))
    if low == high:
        return ordered[low]
    weight = position - low
    return ordered[low] * (1.0 - weight) + ordered[high] * weight


def benchmark(
    operation: Callable[[], np.ndarray],
    *,
    warmups: int = 1,
    repeats: int = 5,
    clock: Callable[[], float] = time.perf_counter,
) -> TimingSummary:
    if warmups < 0 or repeats < 1 or repeats > 50:
        raise ValueError("unsupported benchmark counts")
    for _ in range(warmups):
        result = operation()
        if not isinstance(result, np.ndarray):
            raise TypeError("benchmark operation must return ndarray")
    samples: list[float] = []
    for _ in range(repeats):
        started = clock()
        result = operation()
        ended = clock()
        if not isinstance(result, np.ndarray):
            raise TypeError("benchmark operation must return ndarray")
        elapsed = (ended - started) * 1000.0
        if elapsed < 0 or not math.isfinite(elapsed):
            raise ValueError("clock produced invalid duration")
        samples.append(elapsed)
    summary = TimingSummary(
        samples_ms=tuple(samples),
        median_ms=float(statistics.median(samples)),
        minimum_ms=min(samples),
        maximum_ms=max(samples),
        p90_ms=_percentile(samples, 0.90),
    )
    summary.validate()
    return summary


def speedup(reference: TimingSummary, candidate: TimingSummary) -> float:
    reference.validate()
    candidate.validate()
    if candidate.median_ms <= 0:
        return math.inf if reference.median_ms > 0 else 1.0
    return reference.median_ms / candidate.median_ms


def budget_margin(summary: TimingSummary, budget_ms: float) -> dict[str, float | bool]:
    summary.validate()
    if not math.isfinite(budget_ms) or budget_ms <= 0:
        raise ValueError("budget_ms must be positive finite")
    margin = budget_ms - summary.p90_ms
    return {
        "budget_ms": budget_ms,
        "p90_ms": summary.p90_ms,
        "margin_ms": margin,
        "margin_fraction": margin / budget_ms,
        "passes": margin >= 0,
    }
