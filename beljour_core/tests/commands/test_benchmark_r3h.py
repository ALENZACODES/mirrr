"""Synthetic preview/export timing contracts, with no faces or online requests.

Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace
from typing import cast

import pytest

from plumb_api.commands.benchmark import BenchmarkCase, ProBenchmark, RenderPort, synthetic_fixture
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.performance import RenderQuality
from plumb_api.commands.pro_plan import ProPlan, parse_pro_commands


class PredictableClock:
    def __init__(self, milliseconds: float = 1.0) -> None:
        self.ms = milliseconds
        self.count = 0

    def __call__(self) -> float:
        self.count += 1
        return self.count * self.ms / 1000.0


def unchanged(plan: ProPlan, photo: ImageFrame, quality: RenderQuality) -> ImageFrame:
    assert plan.identity.enabled
    assert quality in ("preview", "export")
    return photo


def case(quality: RenderQuality = "preview") -> BenchmarkCase:
    return BenchmarkCase(parse_pro_commands("/cleanup 2.4"), 32, 29, 4, 13, quality, 5, 2)


def test_synthetic_pixels_deterministic() -> None:
    first = synthetic_fixture(32, 16, 4, 99)
    second = synthetic_fixture(32, 16, 4, 99)
    third = synthetic_fixture(32, 16, 4, 100)
    assert first.identical(second)
    assert not first.identical(third)
    assert first.channels == 4
    assert len(first.pixels) == 32 * 16 * 4


def test_zero_photo_data_in_report() -> None:
    clock = PredictableClock(1.0)
    result = ProBenchmark(unchanged, clock=clock).run(case())
    report = result.public_metadata()
    assert result.outcome == "completed"
    assert result.sample_count == 5
    assert result.median_ms == pytest.approx(1.0)
    assert result.p95_ms == pytest.approx(1.0)
    assert result.output_width == 32
    assert report["synthetic_only"] is True
    assert report["release_qualified"] is False
    assert "pixels" not in report
    assert "photo" not in report


def test_export_budget_report_only() -> None:
    report = ProBenchmark(unchanged, clock=PredictableClock(2.5)).run(case("export"))
    assert report.outcome == "completed"
    assert report.within_assumed_budget is True
    assert report.budget_ms == 2000.0


def test_budget_miss_does_not_claim_quality() -> None:
    report = ProBenchmark(unchanged, clock=PredictableClock(150.0)).run(case())
    assert report.outcome == "completed"
    assert report.within_assumed_budget is False
    assert report.public_metadata()["release_qualified"] is False


def test_renderer_failure_is_safe() -> None:
    def failure(_plan: ProPlan, _frame: ImageFrame, _quality: RenderQuality) -> ImageFrame:
        raise RuntimeError("some private detail")

    report = ProBenchmark(failure, clock=PredictableClock()).run(case())
    assert report.outcome == "failed"
    assert report.failure_code == "renderer_unavailable"
    assert "private" not in str(report.public_metadata())
    assert report.median_ms is None


def test_invalid_output_is_reported() -> None:
    def invalid(_plan: ProPlan, _frame: ImageFrame, _quality: RenderQuality) -> ImageFrame:
        return cast(ImageFrame, object())

    report = ProBenchmark(invalid, clock=PredictableClock()).run(case())
    assert report.outcome == "failed"
    assert report.failure_code == "invalid_benchmark_output"


def test_backwards_clock_is_failure() -> None:
    clock = PredictableClock(-1.0)
    report = ProBenchmark(unchanged, clock=clock).run(case())
    assert report.outcome == "failed"
    assert report.failure_code == "invalid_benchmark_clock"


def test_warmups_excluded_from_samples() -> None:
    clock = PredictableClock()
    report = ProBenchmark(unchanged, clock=clock).run(case())
    assert report.sample_count == 5
    assert clock.count == (5 + 2) * 2


@pytest.mark.parametrize("bad", [True, -1, 0, 1.5, "50", None])
def test_bad_repetitions(bad: object) -> None:
    with pytest.raises(CommandValidationError):
        replace(case(), repetitions=cast(int, bad))


@pytest.mark.parametrize("bad", [0, -1, True, 3.7, "11"])
def test_bad_width(bad: object) -> None:
    with pytest.raises(CommandValidationError):
        replace(case(), width=cast(int, bad))


def test_no_renderer_installed() -> None:
    with pytest.raises(CommandValidationError):
        ProBenchmark(cast(RenderPort, 123))


def test_no_bad_budgets() -> None:
    with pytest.raises(CommandValidationError):
        ProBenchmark(unchanged, preview_budget_ms=float("nan"))
    with pytest.raises(CommandValidationError):
        ProBenchmark(unchanged, export_budget_ms=0.0)


def test_no_model_or_face_resource() -> None:
    image = synthetic_fixture(24, 28, 3, 1)
    assert type(image.pixels) is bytes
    assert image.width == 24
    assert image.height == 28
    assert image.pixels != bytes(len(image.pixels))
