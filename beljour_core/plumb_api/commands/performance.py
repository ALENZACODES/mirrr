"""Local-only performance observations and release-budget accounting.

Times are measured values, not fabricated quality claims. Optional benchmark
sampling is kept separate from real-face performance and release acceptance.
Author: John Khan.
"""

from __future__ import annotations

import math
import statistics
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from time import perf_counter
from typing import Literal

from .errors import CommandValidationError

RenderQuality = Literal["preview", "export"]
Clock = Callable[[], float]


@dataclass(frozen=True, slots=True)
class PerformanceBudget:
    preview_ms: float = 100.0
    export_ms: float = 2000.0
    preview_long_edge: int = 512

    def __post_init__(self) -> None:
        if not math.isfinite(self.preview_ms) or not math.isfinite(self.export_ms):
            raise CommandValidationError("invalid_budget", "Performance times must be finite.")
        if not 1.0 <= self.preview_ms <= 60000 or not 1.0 <= self.export_ms <= 60000:
            raise CommandValidationError("invalid_budget", "Performance budget is outside safe bounds.")
        if type(self.preview_long_edge) is not int or not 64 <= self.preview_long_edge <= 2048:
            raise CommandValidationError("invalid_budget", "Preview size is outside safe bounds.")

    def milliseconds(self, quality: RenderQuality) -> float:
        return self.preview_ms if quality == "preview" else self.export_ms


@dataclass(frozen=True, slots=True)
class TimingObservation:
    quality: RenderQuality
    elapsed_ms: float
    target_ms: float
    cache_hit: bool
    work_steps: int

    def __post_init__(self) -> None:
        if self.quality not in ("preview", "export"):
            raise CommandValidationError("invalid_quality", "Timing quality is invalid.")
        if not math.isfinite(self.elapsed_ms) or self.elapsed_ms < 0:
            raise CommandValidationError(
                "invalid_timing", "Elapsed time must be nonnegative and finite.",
            )
        if not math.isfinite(self.target_ms) or self.target_ms <= 0:
            raise CommandValidationError("invalid_timing", "Target time must be positive and finite.")
        if type(self.cache_hit) is not bool or type(self.work_steps) is not int or self.work_steps < 0:
            raise CommandValidationError("invalid_timing", "Timing count and cache flag must be valid.")

    @property
    def within_target(self) -> bool:
        return self.elapsed_ms <= self.target_ms

    def public_metadata(self) -> dict[str, object]:
        return {
            "quality": self.quality,
            "elapsed_ms": round(self.elapsed_ms, 3),
            "target_ms": self.target_ms,
            "within_target": self.within_target,
            "cache_hit": self.cache_hit,
            "work_steps": self.work_steps,
        }


class PerformanceRecorder:
    def __init__(self, *, clock: Clock = perf_counter, max_samples: int = 100) -> None:
        if type(max_samples) is not int or not 1 <= max_samples <= 1000:
            raise CommandValidationError("invalid_budget", "Timing sample capacity is invalid.")
        self._clock = clock
        self._max_samples = max_samples
        self._history: list[TimingObservation] = []

    def start(self) -> float:
        started = self._clock()
        if not math.isfinite(started):
            raise CommandValidationError("invalid_clock", "Performance clock is unavailable.")
        return started

    def finish(
        self,
        started: float,
        quality: RenderQuality,
        budget: PerformanceBudget,
        *,
        cache_hit: bool,
        work_steps: int,
    ) -> TimingObservation:
        ended = self._clock()
        elapsed = (ended - started) * 1000.0
        if not math.isfinite(elapsed) or elapsed < 0:
            raise CommandValidationError("invalid_clock", "Performance clock went backwards.")
        observation = TimingObservation(
            quality, elapsed, budget.milliseconds(quality), cache_hit, work_steps,
        )
        self._history.append(observation)
        if len(self._history) > self._max_samples:
            self._history.pop(0)
        return observation

    @property
    def samples(self) -> tuple[TimingObservation, ...]:
        return tuple(self._history)

    def summary(self, quality: RenderQuality) -> dict[str, object]:
        selected = [entry.elapsed_ms for entry in self._history if entry.quality == quality]
        if not selected:
            return {"quality": quality, "count": 0, "median_ms": None, "worst_ms": None}
        return {
            "quality": quality,
            "count": len(selected),
            "median_ms": round(statistics.median(selected), 3),
            "worst_ms": round(max(selected), 3),
        }


def inspect_timings(samples: Sequence[TimingObservation]) -> tuple[str, ...]:
    """Plain report, no external sink and no hidden CI acceptance changes."""
    return tuple(
        f"{item.quality}: {item.elapsed_ms:.3f} ms / {item.target_ms:.1f} ms "
        f"({'within' if item.within_target else 'over'} budget)"
        for item in samples
    )
