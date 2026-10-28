"""Cross-stage reliability and all-or-nothing cost-accounting regressions. Author: John Khan."""

from __future__ import annotations

import io
import threading

import pytest
from PIL import Image

from .contracts import GenerationRefused, SceneRequest
from .meter import meter_image
from .pipeline import SafeScenePipeline
from .runtime import GeneratedPixels
from .safety import ReviewVerdict, verify_and_label_output
from .test_support import AllowedReviews, DrawnRuntime, scene_request


def _runtime_and_pipeline() -> tuple[DrawnRuntime, SafeScenePipeline]:
    runtime = DrawnRuntime()
    runtime.begin("black-forest-labs/FLUX.1-schnell", "b" * 40)
    return runtime, SafeScenePipeline(
        runtime, AllowedReviews(), AllowedReviews(), model_revision="b" * 40,
    )


def test_two_image_cost_admission_is_all_or_nothing() -> None:
    _, pipeline = _runtime_and_pipeline()
    item = meter_image("c" * 64, output_bytes=800, gpu_ms=1.0, operator_rate=1.0)
    for _ in range(255):
        pipeline.ledger.record(item)
    with pytest.raises(GenerationRefused, match="full"):
        pipeline.render(scene_request(images=2, gpu_rate=1.0), threading.Event())
    assert pipeline.ledger.public()["images"] == 255


def test_exact_remaining_capacity_accepts_atomically() -> None:
    _, pipeline = _runtime_and_pipeline()
    item = meter_image("d" * 64, output_bytes=800, gpu_ms=1.0, operator_rate=1.0)
    for _ in range(254):
        pipeline.ledger.record(item)
    result = pipeline.render(scene_request(images=2, gpu_rate=1.0), threading.Event())
    assert len(result.scenes) == 2
    assert pipeline.ledger.public()["images"] == 256


def test_boolean_gpu_timing_is_not_a_measurement() -> None:
    with pytest.raises(GenerationRefused, match="measurement"):
        meter_image("c" * 64, output_bytes=200, gpu_ms=True, operator_rate=1.0)


def test_output_review_runtime_failure_is_fixed_refusal_code() -> None:
    class CrashedReviewer:
        def review(self, picture: Image.Image, purpose: str) -> ReviewVerdict:
            raise RuntimeError("private mock failure should not escape")

    image = Image.new("RGB", (256, 256), (40, 90, 50))
    buffer = io.BytesIO()
    image.save(buffer, "PNG")
    with pytest.raises(GenerationRefused, match="review_unavailable"):
        verify_and_label_output(
            buffer.getvalue(), purpose="place", width=256, height=256,
            reviewer=CrashedReviewer(), cancelled=lambda: False,
        )


def test_runtime_outputs_must_match_requested_dimension() -> None:
    class WrongSizedRuntime(DrawnRuntime):
        def generate(
            self, request: SceneRequest, cancelled: threading.Event,
        ) -> tuple[GeneratedPixels, ...]:
            with io.BytesIO() as output:
                Image.new("RGB", (512, 512)).save(output, "PNG")
                data = output.getvalue()
            return (GeneratedPixels(data, 5.0),)

    runtime = WrongSizedRuntime()
    runtime.begin("black-forest-labs/FLUX.1-schnell", "b" * 40)
    pipeline = SafeScenePipeline(
        runtime, AllowedReviews(), AllowedReviews(), model_revision="b" * 40,
    )
    with pytest.raises(GenerationRefused, match="size"):
        pipeline.render(scene_request(), threading.Event())
    assert pipeline.ledger.public()["images"] == 0


def test_live_model_runtime_does_not_hide_synthetic_fallback() -> None:
    runtime, pipeline = _runtime_and_pipeline()
    runtime.ready_value = False
    with pytest.raises(GenerationRefused, match="not_ready"):
        pipeline.render(scene_request(), threading.Event())
    assert runtime.generated == 0


def test_reviewed_image_not_released_if_cancelled_after_inference() -> None:
    class CancelDuringGeneration(DrawnRuntime):
        def __init__(self, signal: threading.Event) -> None:
            super().__init__()
            self.signal = signal

        def generate(
            self, request: SceneRequest, cancelled: threading.Event,
        ) -> tuple[GeneratedPixels, ...]:
            result = super().generate(request, cancelled)
            self.signal.set()
            return result

    event = threading.Event()
    runtime = CancelDuringGeneration(event)
    runtime.begin("black-forest-labs/FLUX.1-schnell", "b" * 40)
    pipeline = SafeScenePipeline(
        runtime, AllowedReviews(), AllowedReviews(), model_revision="b" * 40,
    )
    with pytest.raises(GenerationRefused, match="cancelled"):
        pipeline.render(scene_request(), event)
    assert pipeline.ledger.public()["images"] == 0
