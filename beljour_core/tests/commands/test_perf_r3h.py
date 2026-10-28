"""Measured CPU budgets and deterministic budget-contract failures.

Synthetic observations do not certify real device performance or image quality.
Author: John Khan.
"""

from __future__ import annotations

import statistics
from time import perf_counter

import numpy as np

from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.performance import PerformanceBudget, PerformanceRecorder, TimingObservation
from plumb_api.commands.pose import PoseOnlyProcessor
from plumb_api.commands.pose_geometry import PoseEvidence, PoseHandle
from plumb_api.commands.studio import StudioQualityProcessor


def frame(size: int = 48) -> ImageFrame:
    yy, xx = np.indices((size, size))
    rgb = np.stack((20 + (xx * 5 + yy) % 140,
                    25 + (xx + yy * 3) % 140,
                    30 + (xx * 4 + yy * 2) % 140), axis=-1).astype(np.uint8)
    return ImageFrame(size, size, 3, rgb.tobytes())


def pose(source: ImageFrame) -> PoseOnlyProcessor:
    mask = bytes([255]) * (source.width * source.height)
    evidence = PoseEvidence(source.width, source.height, mask, (
        PoseHandle("one", 0.3, 0.6, 0.03, 0.0),
        PoseHandle("two", 0.7, 0.6, -0.03, 0.0),
    ), "synthetic_test")
    engine = PoseOnlyProcessor()
    engine.open_photo(source, evidence)
    return engine


def measure(engine: StudioQualityProcessor | PoseOnlyProcessor,
            source: ImageFrame, level: DecimalLevel) -> dict[str, float | bool]:
    engine.render(source, level=level, preview=True)
    values: list[float] = []
    for _ in range(5):
        started = perf_counter()
        engine.render(source, level=level, preview=True)
        values.append((perf_counter() - started) * 1000)
    median = statistics.median(values)
    return {"median_ms": median, "budget_ms": 100.0, "within_target": median <= 100.0}


def test_small_synthetic_studio_preview_has_measured_time() -> None:
    summary = measure(StudioQualityProcessor(), frame(), DecimalLevel(34))
    assert summary["median_ms"] >= 0
    assert summary["budget_ms"] == 100.0
    assert isinstance(summary["within_target"], bool)


def test_small_synthetic_pose_preview_has_measured_time() -> None:
    source = frame()
    summary = measure(pose(source), source, DecimalLevel(41))
    assert summary["median_ms"] >= 0
    assert summary["budget_ms"] == 100.0
    assert isinstance(summary["within_target"], bool)


def test_explicit_budgets_keep_export_separate_from_preview() -> None:
    budget = PerformanceBudget()
    assert budget.preview_ms == 100
    assert budget.export_ms == 2000
    fast = TimingObservation("preview", 50.0, budget.preview_ms, False, 1)
    slow = TimingObservation("preview", 101.0, budget.preview_ms, False, 1)
    export = TimingObservation("export", 1500.0, budget.export_ms, False, 1)
    assert fast.within_target
    assert not slow.within_target
    assert export.within_target


def test_injected_clock_produces_reproducible_over_budget_failure() -> None:
    clock = iter((1.0, 1.1001))
    recorder = PerformanceRecorder(clock=lambda: next(clock))
    started = recorder.start()
    observation = recorder.finish(started, "preview", PerformanceBudget(),
                                  cache_hit=False, work_steps=2)
    assert not observation.within_target
    assert observation.elapsed_ms > 100
    assert recorder.summary("preview")["count"] == 1


def test_test_fixture_median_does_not_claim_realface_success() -> None:
    source = frame()
    engine = StudioQualityProcessor()
    engine.render(source, level=DecimalLevel(50), preview=True)
    report = engine.last_report
    assert report is not None
    assert report.public_metadata()["realface_verified"] is False
    assert report.preview
