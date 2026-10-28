"""Verifiable aggregate-only receipt tests for generated scene artifacts. Author: John Khan."""

from __future__ import annotations

import hashlib
import io
import threading
from dataclasses import replace
from pathlib import Path

import pytest
from PIL import Image

from .contracts import GenerationRefused, SceneRequest
from .pipeline import GeneratedBatch, SafeScenePipeline
from .receipts import make_receipt
from .rights import AllowedModel
from .test_support import AllowedReviews, DrawnRuntime, make_bundle, scene_request


def _rendered(tmp_path: Path) -> tuple[AllowedModel, SceneRequest, GeneratedBatch]:
    bundle = make_bundle(tmp_path)
    backend = DrawnRuntime()
    backend.begin("black-forest-labs/FLUX.1-schnell", "b" * 40)
    request = scene_request(gpu_rate=2.0, images=2)
    pipeline = SafeScenePipeline(
        backend, AllowedReviews(), AllowedReviews(), model_revision="b" * 40,
    )
    return bundle.approved, request, pipeline.render(request, threading.Event())


def test_generation_receipt_has_no_prompt_photo_or_subject(tmp_path: Path) -> None:
    model, request, result = _rendered(tmp_path)
    receipt = make_receipt(model, request, result)
    report = receipt.public()
    assert report["quality"] == "NOT_SCORED"
    assert report["human_review"] == "NOT_RUN"
    assert report["images"] == 2
    assert len(report["outputs_sha256"]) == 2
    assert len(report["document_sha256"]) == 64
    assert receipt.measured_cost_usd == pytest.approx(2 * 12 / 3_600_000 * 2)
    assert request.prompt not in repr(report)
    assert "image_bytes" not in repr(report)
    assert "subject" not in repr(report)


def test_receipt_rejects_mutated_output_bytes(tmp_path: Path) -> None:
    model, request, result = _rendered(tmp_path)
    damaged = replace(result.scenes[0], pixels=result.scenes[0].pixels + b"x")
    tampered = replace(result, scenes=(damaged, result.scenes[1]))
    with pytest.raises(GenerationRefused, match="changed"):
        make_receipt(model, request, tampered)


def test_receipt_rejects_forged_runtime_status(tmp_path: Path) -> None:
    model, request, result = _rendered(tmp_path)
    with pytest.raises(GenerationRefused):
        make_receipt(model, request, replace(result, model_status="FALLBACK_UNVERIFIED"))


def test_receipt_rejects_missing_image_review(tmp_path: Path) -> None:
    model, request, result = _rendered(tmp_path)
    changed = replace(result.scenes[0], image_review_digest="")
    with pytest.raises(GenerationRefused, match="review"):
        make_receipt(model, request, replace(result, scenes=(changed, result.scenes[1])))


def test_receipt_cost_is_null_when_gpu_timings_absent(tmp_path: Path) -> None:
    bundle = make_bundle(tmp_path)
    backend = DrawnRuntime()
    backend.gpu_ms = None
    backend.begin("black-forest-labs/FLUX.1-schnell", "b" * 40)
    request = scene_request(gpu_rate=5.0)
    pipeline = SafeScenePipeline(backend, AllowedReviews(), AllowedReviews(), model_revision="b" * 40)
    receipt = make_receipt(bundle.approved, request, pipeline.render(request, threading.Event()))
    assert receipt.public()["measured_cost_usd"] is None


def test_receipt_sha_matches_actual_exported_pixels(tmp_path: Path) -> None:
    model, request, result = _rendered(tmp_path)
    receipt = make_receipt(model, request, result)
    for scene, digest in zip(result.scenes, receipt.generation_outputs, strict=True):
        assert hashlib.sha256(scene.pixels).hexdigest() == digest
        with Image.open(io.BytesIO(scene.pixels)) as picture:
            assert not picture.getexif()


def test_receipt_refuses_output_count_inconsistency(tmp_path: Path) -> None:
    model, request, result = _rendered(tmp_path)
    with pytest.raises(GenerationRefused):
        make_receipt(model, request, replace(result, scenes=result.scenes[:1]))


def test_receipt_rejects_missing_prompt_review(tmp_path: Path) -> None:
    model, request, result = _rendered(tmp_path)
    with pytest.raises(GenerationRefused, match="prompt_review"):
        make_receipt(model, request, replace(result, prompt_review_digest=""))


def test_public_receipt_records_both_review_domains(tmp_path: Path) -> None:
    model, request, result = _rendered(tmp_path)
    record = make_receipt(model, request, result).public()
    assert record["prompt_reviewer_sha256"] == "a" * 64
    assert record["reviewers_sha256"] == ["a" * 64, "a" * 64]
