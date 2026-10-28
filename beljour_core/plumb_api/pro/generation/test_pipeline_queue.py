"""Local scene lifecycle, cost and queue failure regressions. Author: John Khan."""

from __future__ import annotations

import hashlib
import io
import threading
import time
from dataclasses import replace

import pytest
from PIL import Image

from .contracts import GenerationRefused, SceneRequest
from .meter import CostLedger, meter_image
from .pipeline import SafeScenePipeline
from .queue import BoundedSceneQueue
from .runtime import GeneratedPixels
from .test_support import AllowedReviews, DrawnRuntime, scene_request


def _await_terminal(queue: BoundedSceneQueue, identifier: str) -> dict[str, object]:
    deadline = time.monotonic() + 5.0
    while time.monotonic() < deadline:
        status = queue.status(identifier)
        if status["state"] in {"complete", "refused", "cancelled"}:
            return status
        time.sleep(0.01)
    raise AssertionError("synthetic local queue did not terminate")


def _pipeline(
    runtime: DrawnRuntime, *, image_review: bool = True, prompt_review: bool = True,
) -> SafeScenePipeline:
    runtime.begin("black-forest-labs/FLUX.1-schnell", "b" * 40)
    return SafeScenePipeline(
        runtime, AllowedReviews(prompt_review), AllowedReviews(image_review), model_revision="b" * 40,
    )


def test_local_render_labeled_metadata_free_cost_real_measurement() -> None:
    runtime = DrawnRuntime()
    renderer = _pipeline(runtime)
    request = scene_request(gpu_rate=3.6)
    result = renderer.render(request, threading.Event())
    assert len(result.scenes) == 1
    assert result.model_status == "SCHNELL_LOCAL_MEASURED"
    image = result.scenes[0]
    assert image.audit.measured_gpu_ms == 12.0
    assert image.audit.measured_cost_usd == pytest.approx(0.000012)
    assert image.audit.cost_basis == "ACTUAL_GPU_MS_X_DECLARED_RATE"
    assert image.audit.output_sha256 == hashlib.sha256(image.pixels).hexdigest()
    assert b"private-exif-fixture" not in image.pixels
    with Image.open(io.BytesIO(image.pixels)) as decoded:
        assert decoded.size == (256, 256)
        assert not decoded.getexif()
        assert decoded.getpixel((5, 254)) != (60, 80, 120)
    public = renderer.ledger.public()
    assert public["images"] == 1
    assert public["images_cost_measured"] == 1
    assert "prompt" not in repr(public).lower()


def test_cost_unmeasured_when_runtime_omits_gpu_timer() -> None:
    runtime = DrawnRuntime()
    runtime.gpu_ms = None
    renderer = _pipeline(runtime)
    result = renderer.render(scene_request(gpu_rate=0.0), threading.Event())
    assert result.scenes[0].audit.measured_cost_usd is None
    assert renderer.ledger.public()["total_measured_cost_usd"] is None


@pytest.mark.parametrize("duration", [0.0, 1.5, 200.0])
def test_reported_gpu_ms_only_for_measured_values(duration: float) -> None:
    item = meter_image("a" * 64, output_bytes=512, gpu_ms=duration, operator_rate=6.0)
    assert item.measured_gpu_ms == duration
    assert item.measured_cost_usd == pytest.approx(duration / 3_600_000 * 6)


@pytest.mark.parametrize("bad", [-1.0, float("nan"), float("inf"), 3_700_000])
def test_invalid_gpu_measurements_rejected(bad: float) -> None:
    with pytest.raises(GenerationRefused):
        meter_image("a" * 64, output_bytes=50, gpu_ms=bad, operator_rate=1.0)


def test_partial_image_rejection_does_not_record_cost() -> None:
    runtime = DrawnRuntime()
    renderer = _pipeline(runtime, image_review=False)
    with pytest.raises(GenerationRefused, match="review"):
        renderer.render(scene_request(images=2, gpu_rate=4.0), threading.Event())
    assert renderer.ledger.public()["images"] == 0


def test_prompt_rejected_before_runtime() -> None:
    runtime = DrawnRuntime()
    renderer = _pipeline(runtime, prompt_review=False)
    with pytest.raises(GenerationRefused):
        renderer.render(scene_request(), threading.Event())
    assert runtime.generated == 0


def test_wrong_image_count_fails() -> None:
    class ShortRuntime(DrawnRuntime):
        def generate(
            self, request: SceneRequest, cancelled: threading.Event,
        ) -> tuple[GeneratedPixels, ...]:
            return super().generate(request, cancelled)[:1]

    runtime = ShortRuntime()
    renderer = _pipeline(runtime)
    with pytest.raises(GenerationRefused, match="count"):
        renderer.render(scene_request(images=2), threading.Event())
    assert renderer.ledger.public()["images"] == 0


def test_source_cancelled_before_any_model_processing() -> None:
    runtime = DrawnRuntime()
    renderer = _pipeline(runtime)
    cancelled = threading.Event()
    cancelled.set()
    with pytest.raises(GenerationRefused, match="cancelled"):
        renderer.render(scene_request(), cancelled)
    assert runtime.generated == 0


def test_queue_one_time_output_and_prompt_disposal() -> None:
    runtime = DrawnRuntime()
    with BoundedSceneQueue(_pipeline(runtime)) as queue:
        identifier = queue.submit(scene_request())
        assert _await_terminal(queue, identifier)["state"] == "complete"
        pixels = queue.take(identifier)
        assert len(pixels.scenes) == 1
        with pytest.raises(GenerationRefused, match="unknown"):
            queue.status(identifier)
        with pytest.raises(GenerationRefused, match="unknown"):
            queue.take(identifier)


def test_queue_refusal_exposes_code_only_and_no_bytes() -> None:
    runtime = DrawnRuntime()
    with BoundedSceneQueue(_pipeline(runtime, image_review=False)) as queue:
        identifier = queue.submit(scene_request())
        result = _await_terminal(queue, identifier)
        assert result["state"] == "refused"
        assert result["count"] == 0
        assert result["reason"] == "output_review_refused"
        with pytest.raises(GenerationRefused, match="not_available"):
            queue.take(identifier)
        queue.dismiss(identifier)


def test_queue_queued_cancel_cannot_render() -> None:
    runtime = DrawnRuntime()
    gate = threading.Event()
    runtime.delay = gate
    with BoundedSceneQueue(_pipeline(runtime), pending_limit=2) as queue:
        first = queue.submit(scene_request())
        second = queue.submit(scene_request())
        queue.cancel(second)
        assert queue.status(second)["state"] == "cancelled"
        gate.set()
        assert _await_terminal(queue, first)["state"] == "complete"
        assert runtime.generated == 1


def test_queue_running_cancel_removes_result() -> None:
    runtime = DrawnRuntime()
    gate = threading.Event()
    runtime.delay = gate
    with BoundedSceneQueue(_pipeline(runtime)) as queue:
        identifier = queue.submit(scene_request())
        deadline = time.monotonic() + 5
        while queue.status(identifier)["state"] == "queued" and time.monotonic() < deadline:
            time.sleep(0.005)
        queue.cancel(identifier)
        gate.set()
        assert _await_terminal(queue, identifier)["state"] == "cancelled"
        with pytest.raises(GenerationRefused):
            queue.take(identifier)


def test_queue_pending_limit_and_no_background_retries() -> None:
    runtime = DrawnRuntime()
    gate = threading.Event()
    runtime.delay = gate
    with BoundedSceneQueue(_pipeline(runtime), pending_limit=1) as queue:
        active = queue.submit(scene_request())
        deadline = time.monotonic() + 5
        while queue.status(active)["state"] == "queued" and time.monotonic() < deadline:
            time.sleep(0.005)
        pending = queue.submit(scene_request())
        with pytest.raises(GenerationRefused, match="full"):
            queue.submit(scene_request())
        queue.cancel(pending)
        gate.set()
        assert _await_terminal(queue, active)["state"] == "complete"
        assert runtime.generated == 1


def test_no_permission_to_enqueue_new_work_after_close() -> None:
    runtime = DrawnRuntime()
    queue = BoundedSceneQueue(_pipeline(runtime))
    queue.close()
    with pytest.raises(GenerationRefused, match="closed"):
        queue.submit(scene_request())


def test_cost_ledger_bounded_without_silent_eviction() -> None:
    ledger = CostLedger()
    item = meter_image("a" * 64, output_bytes=4, gpu_ms=1.0, operator_rate=1.0)
    for _ in range(256):
        ledger.record(item)
    with pytest.raises(GenerationRefused, match="full"):
        ledger.record(item)
    assert ledger.public()["images"] == 256


def test_queue_status_contains_no_prompt_or_person_identifiers() -> None:
    runtime = DrawnRuntime()
    renderer = _pipeline(runtime)
    with BoundedSceneQueue(renderer) as queue:
        identifier = queue.submit(replace(scene_request(), prompt="Stone canyon at sunrise"))
        assert _await_terminal(queue, identifier)["state"] == "complete"
        assert "canyon" not in repr(queue.status(identifier)).lower()
