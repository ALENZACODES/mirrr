"""Synthetic-only Pro preview/export timing harness with explicit budget labels.

Does not benchmark face recognition or authorize a public-release gate. The
injected renderer is responsible for mandatory identity guarding and must
never use live provider units in synthetic benchmarks.
Author: John Khan.
"""

from __future__ import annotations

import math
import statistics
from collections.abc import Callable
from dataclasses import dataclass
from time import perf_counter
from typing import Literal

from .errors import CommandValidationError
from .frames import MAX_IMAGE_PIXELS, ImageFrame
from .performance import RenderQuality
from .pro_plan import ProPlan

RenderPort = Callable[[ProPlan, ImageFrame, RenderQuality], ImageFrame]
Clock = Callable[[], float]
BenchmarkOutcome = Literal["completed", "failed"]


@dataclass(frozen=True, slots=True)
class BenchmarkCase:
    plan: ProPlan
    width: int
    height: int
    channels: Literal[3, 4] = 3
    seed: int = 7
    quality: RenderQuality = "preview"
    repetitions: int = 5
    warmups: int = 1

    def __post_init__(self) -> None:
        if not isinstance(self.plan, ProPlan):
            raise CommandValidationError("invalid_benchmark", "Benchmark needs a typed Pro plan.")
        if any(type(value) is not int for value in (
            self.width, self.height, self.channels, self.seed, self.repetitions, self.warmups,
        )):
            raise CommandValidationError("invalid_benchmark", "Benchmark settings must be integers.")
        if self.width < 1 or self.height < 1 or self.width * self.height > MAX_IMAGE_PIXELS:
            raise CommandValidationError("invalid_benchmark", "Synthetic fixture dimensions are invalid.")
        if self.channels not in (3, 4) or not 0 <= self.seed < 2**32:
            raise CommandValidationError("invalid_benchmark", "Synthetic channels or seed is invalid.")
        if self.quality not in ("preview", "export"):
            raise CommandValidationError("invalid_benchmark", "Quality is invalid.")
        if not 1 <= self.repetitions <= 100 or not 0 <= self.warmups <= 20:
            raise CommandValidationError("invalid_benchmark", "Sample counts exceed the bounded range.")


@dataclass(frozen=True, slots=True)
class BenchmarkResult:
    outcome: BenchmarkOutcome
    quality: RenderQuality
    plan_fingerprint: str
    input_width: int
    input_height: int
    input_channels: int
    output_width: int | None
    output_height: int | None
    sample_count: int
    median_ms: float | None
    p95_ms: float | None
    max_ms: float | None
    budget_ms: float
    within_assumed_budget: bool | None
    failure_code: str | None

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": "beljour-pro-timing/1",
            "outcome": self.outcome,
            "quality": self.quality,
            "plan_fingerprint": self.plan_fingerprint,
            "input_width": self.input_width,
            "input_height": self.input_height,
            "input_channels": self.input_channels,
            "output_width": self.output_width,
            "output_height": self.output_height,
            "sample_count": self.sample_count,
            "median_ms": self.median_ms,
            "p95_ms": self.p95_ms,
            "max_ms": self.max_ms,
            "budget_ms": self.budget_ms,
            "within_assumed_budget": self.within_assumed_budget,
            "synthetic_only": True,
            "release_qualified": False,
            "failure_code": self.failure_code,
        }


def synthetic_fixture(width: int, height: int, channels: Literal[3, 4], seed: int) -> ImageFrame:
    """Reproducible patterned colour tiles; never a synthetic facial image."""
    if any(type(value) is not int for value in (width, height, channels, seed)):
        raise CommandValidationError("invalid_benchmark", "Fixture dimensions must be integers.")
    if not 1 <= width or not 1 <= height or width * height > MAX_IMAGE_PIXELS:
        raise CommandValidationError("invalid_benchmark", "Fixture exceeds pixel capacity.")
    if channels not in (3, 4) or not 0 <= seed < 2**32:
        raise CommandValidationError("invalid_benchmark", "Fixture format is invalid.")
    out = bytearray(width * height * channels)
    for row in range(height):
        for column in range(width):
            index = (row * width + column) * channels
            band = 31 if (column // 13 + row // 17) % 2 else 0
            out[index] = (column * 3 + row * 5 + seed + band) % 256
            out[index + 1] = (column * 7 + row * 2 + seed * 3 + band) % 256
            out[index + 2] = (column * 2 + row * 11 + seed * 5 + band) % 256
            if channels == 4:
                out[index + 3] = (row * 13 + column * 17 + seed) % 256
    return ImageFrame(width, height, channels, bytes(out))


class ProBenchmark:
    """Measure renderer work with no photographs, models or remote requests."""

    def __init__(
        self,
        renderer: RenderPort,
        *,
        clock: Clock = perf_counter,
        preview_budget_ms: float = 100.0,
        export_budget_ms: float = 2000.0,
    ) -> None:
        if not callable(renderer) or not callable(clock):
            raise CommandValidationError("invalid_benchmark", "Renderer and clock must be callable.")
        if any(
            type(value) not in (int, float) or not math.isfinite(value) or value <= 0
            for value in (preview_budget_ms, export_budget_ms)
        ):
            raise CommandValidationError("invalid_benchmark", "Budgets must be positive and finite.")
        self._renderer = renderer
        self._clock = clock
        self._preview_budget_ms = float(preview_budget_ms)
        self._export_budget_ms = float(export_budget_ms)

    def _sample(self, case: BenchmarkCase, fixture: ImageFrame) -> tuple[ImageFrame, float]:
        started = self._clock()
        output = self._renderer(case.plan, fixture, case.quality)
        ended = self._clock()
        if not isinstance(output, ImageFrame):
            raise CommandValidationError("invalid_benchmark_output", "Benchmark renderer returned no frame.")
        elapsed = (ended - started) * 1000.0
        if not math.isfinite(elapsed) or elapsed < 0:
            raise CommandValidationError("invalid_benchmark_clock", "Benchmark clock was invalid.")
        return output, elapsed

    def run(self, case: BenchmarkCase) -> BenchmarkResult:
        if not isinstance(case, BenchmarkCase):
            raise CommandValidationError("invalid_benchmark", "Benchmark case is invalid.")
        fixture = synthetic_fixture(case.width, case.height, case.channels, case.seed)
        budget = self._preview_budget_ms if case.quality == "preview" else self._export_budget_ms
        elapsed: list[float] = []
        last: ImageFrame | None = None
        error: str | None = None
        try:
            for _ in range(case.warmups):
                last, _ = self._sample(case, fixture)
            for _ in range(case.repetitions):
                last, milliseconds = self._sample(case, fixture)
                elapsed.append(milliseconds)
        except CommandValidationError as failure:
            error = failure.code
        except Exception:
            error = "renderer_unavailable"
        if error is not None or last is None or len(elapsed) != case.repetitions:
            return BenchmarkResult(
                "failed", case.quality, case.plan.fingerprint(),
                case.width, case.height, case.channels, None, None,
                len(elapsed), None, None, None, budget, None,
                error or "benchmark_incomplete",
            )
        ordered = sorted(elapsed)
        median = statistics.median(ordered)
        p95 = ordered[max(0, math.ceil(len(ordered) * 0.95) - 1)]
        return BenchmarkResult(
            "completed", case.quality, case.plan.fingerprint(),
            case.width, case.height, case.channels, last.width, last.height,
            len(elapsed), median, p95, max(ordered), budget,
            median <= budget, None,
        )
