"""Negative-control tests for prompt, cost, quota and encrypted bundle boundaries. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
import threading
from dataclasses import replace
from pathlib import Path

import pytest

from .contracts import GenerationRefused
from .meter import meter_image
from .pipeline import SafeScenePipeline
from .queue import BoundedSceneQueue
from .rights import MAX_SHARDS, admit_model
from .safety import ReviewVerdict, check_prompt
from .test_support import AllowedReviews, DrawnRuntime, make_bundle, scene_request


@pytest.mark.parametrize("bad", [
    "FLUX.1 [dev]", "FLUX.1 Fill [dev]", "another diffusion engine",
    "noncommercial generated portrait", "malicious child face", "violent portrait scene",
    "celebrity look-alike", "brand logo", "weapon display",
])
def test_scene_moderation_refuses_known_nonscene_text(bad: str) -> None:
    request = replace(scene_request(), prompt=f"Make a {bad} in a park")
    class NoReview:
        def review(self, text: str, purpose: str) -> ReviewVerdict:
            raise ValueError("operator denied")

    with pytest.raises(GenerationRefused):
        check_prompt(request, NoReview())


def test_refuse_misleading_unreviewed_approval_token() -> None:
    class Forged:
        def review(self, text: str, purpose: str) -> ReviewVerdict:
            return ReviewVerdict(True, False, "approved", "a" * 64)

    with pytest.raises(GenerationRefused, match="review"):
        check_prompt(scene_request(), Forged())


@pytest.mark.parametrize("name", [
    "../sealed-escape.bjev", "/tmp/sealed-absolute.bjev", "model.pt",
    "sealed-中文.bjev", "sealed-plain.npz", "sealed-a.bjev/../a",
])
def test_model_bundle_rejects_paths_outside_sealed_dir(tmp_path: Path, name: str) -> None:
    fixture = make_bundle(tmp_path)
    document = json.loads(fixture.manifest.read_text())
    document["shards"][0]["file"] = name
    fixture.manifest.write_text(json.dumps(document))
    with pytest.raises(GenerationRefused):
        admit_model(
            fixture.manifest, encrypted_root=fixture.encrypted_root,
            ledger=fixture.ledger, store=fixture.store,
            rights_review_file=fixture.rights,
        )


def test_duplicated_shard_filename_rejected(tmp_path: Path) -> None:
    fixture = make_bundle(tmp_path)
    document = json.loads(fixture.manifest.read_text())
    document["shards"][1]["file"] = document["shards"][0]["file"]
    fixture.manifest.write_text(json.dumps(document))
    with pytest.raises(GenerationRefused, match="shards"):
        admit_model(
            fixture.manifest, encrypted_root=fixture.encrypted_root,
            ledger=fixture.ledger, store=fixture.store,
            rights_review_file=fixture.rights,
        )


def test_shard_count_is_explicitly_bounded(tmp_path: Path) -> None:
    fixture = make_bundle(tmp_path)
    document = json.loads(fixture.manifest.read_text())
    document["shards"] = [document["shards"][0]] * (MAX_SHARDS + 1)
    fixture.manifest.write_text(json.dumps(document))
    with pytest.raises(GenerationRefused, match="shards"):
        admit_model(
            fixture.manifest, encrypted_root=fixture.encrypted_root,
            ledger=fixture.ledger, store=fixture.store,
            rights_review_file=fixture.rights,
        )


def test_rate_zero_is_measured_free_compute_only_when_gpu_ms_present() -> None:
    digest = hashlib.sha256(b"synthetic").hexdigest()
    measured = meter_image(digest, output_bytes=1200, gpu_ms=300.0, operator_rate=0.0)
    assert measured.measured_cost_usd == 0.0
    unknown = meter_image(digest, output_bytes=1200, gpu_ms=None, operator_rate=0.0)
    assert unknown.measured_cost_usd is None


def test_different_generations_never_reuse_a_consumed_receipt() -> None:
    runtime = DrawnRuntime()
    runtime.begin("black-forest-labs/FLUX.1-schnell", "b" * 40)
    pipeline = SafeScenePipeline(
        runtime, AllowedReviews(), AllowedReviews(), model_revision="b" * 40,
    )
    with BoundedSceneQueue(pipeline) as queue:
        identifiers = []
        for _ in range(12):
            identifiers.append(queue.submit(scene_request()))
        assert len(set(identifiers)) == 12
        for identifier in identifiers:
            queue.dismiss(identifier)
        assert pipeline.ledger.public()["images"] <= 12
        for identifier in identifiers:
            with pytest.raises(GenerationRefused, match="unknown"):
                queue.status(identifier)


def test_cancelled_processing_never_produces_export() -> None:
    runtime = DrawnRuntime()
    runtime.begin("black-forest-labs/FLUX.1-schnell", "b" * 40)
    pipeline = SafeScenePipeline(
        runtime, AllowedReviews(), AllowedReviews(), model_revision="b" * 40,
    )
    flag = threading.Event()
    flag.set()
    with pytest.raises(GenerationRefused, match="cancelled"):
        pipeline.render(scene_request(), flag)
    assert pipeline.ledger.public()["images"] == 0
