"""CPU budgets on tiny drawn preview images, and honest timed measurement.
Author: John Khan.
"""

from __future__ import annotations

import statistics
from time import perf_counter

import numpy as np

from plumb_api.commands.cleanup import CleanupProcessor
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.performance import PerformanceBudget, PerformanceRecorder
from plumb_api.commands.upscale import UpscaleProcessor


def noisy_picture(size: int) -> ImageFrame:
    yy, xx = np.indices((size, size))
    gray = (50 + 3 * xx + 2 * yy + ((xx * 31 + yy * 17) % 13) * 3) % 256
    rgb = np.stack((gray, (gray + 24) % 256, (gray + 47) % 256), axis=-1).astype(np.uint8)
    return ImageFrame(size, size, 3, rgb.tobytes())


def measure_cleanup(size: int, dose: float, repeats: int = 7) -> dict[str, float | bool]:
    frame = noisy_picture(size)
    processor = CleanupProcessor()
    processor.cleanup(frame, dose=dose, preview=True)
    timings: list[float] = []
    for _ in range(repeats):
        start = perf_counter()
        processor.cleanup(frame, dose=dose, preview=True)
        timings.append((perf_counter() - start) * 1000)
    middle = statistics.median(timings)
    return {"median_ms": middle, "budget_ms": 100.0, "within_budget": middle <= 100.0}


def measure_upscale(size: int, scale: int, repeats: int = 7) -> dict[str, float | bool]:
    frame = noisy_picture(size)
    processor = UpscaleProcessor(tile_size=64)
    processor.upscale(frame, scale=scale, preview=True)
    timings: list[float] = []
    for _ in range(repeats):
        start = perf_counter()
        processor.upscale(frame, scale=scale, preview=True)
        timings.append((perf_counter() - start) * 1000)
    middle = statistics.median(timings)
    return {"median_ms": middle, "budget_ms": 100.0, "within_budget": middle <= 100.0}


def test_preview_cleanup_reference_budget_on_drawn_64_square() -> None:
    budget = measure_cleanup(64, 0.6)
    assert budget["median_ms"] >= 0.0
    assert budget["within_budget"]


def test_preview_upscale_reference_budget_on_drawn_32_square() -> None:
    budget = measure_upscale(32, 2)
    assert budget["median_ms"] >= 0.0
    assert budget["within_budget"]


def test_performance_recorder_uses_real_monotonic_durations() -> None:
    recorder = PerformanceRecorder()
    budget = PerformanceBudget(preview_ms=100.0)
    started = recorder.start()
    observation = recorder.finish(started, "preview", budget, cache_hit=False, work_steps=2)
    assert observation.elapsed_ms >= 0
    assert observation.target_ms == 100
    assert observation.work_steps == 2
    assert len(recorder.samples) == 1
    assert recorder.samples[0] is observation


def test_working_set_is_bounded_by_selected_tiles() -> None:
    frame = noisy_picture(128)
    processor = UpscaleProcessor(tile_size=32)
    processor.upscale(frame, scale=4, preview=False)
    report = processor.last_report
    assert report is not None
    assert report.tile_count == 16 * 16
    assert report.largest_tile_bytes < 1_000_000
    assert report.output_pixels == 512 * 512
