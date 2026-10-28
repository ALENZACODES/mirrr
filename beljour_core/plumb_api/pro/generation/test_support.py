"""Drawn-pixel and encrypted-shard fixtures for generation tests. Author: John Khan."""

from __future__ import annotations

import hashlib
import io
import json
import os
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest
from PIL import Image

from ..training.sealed_store import SealedStore
from .contracts import MODEL_ID, MODEL_LICENCE, MODEL_SCHEMA, GenerationSettings, SceneRequest
from .rights import LEDGER_MODEL_NAME, AllowedModel, ModelBundle, admit_model
from .runtime import GeneratedPixels
from .safety import ReviewVerdict

REVISION = "b" * 40


@dataclass
class LocalBundleFixture:
    manifest: Path
    encrypted_root: Path
    rights: Path
    store: SealedStore
    ledger: dict[str, Any]
    approved: AllowedModel


def make_bundle(tmp_path: Path) -> LocalBundleFixture:
    suite = pytest.importorskip("cryptography.hazmat.primitives.ciphers.aead")
    tmp_path.mkdir(parents=True, exist_ok=True, mode=0o700)
    protected = tmp_path / "private_weights"
    protected.mkdir(mode=0o700)
    store = SealedStore(suite.AESGCM(os.urandom(32)), "TestKey001")
    review = tmp_path / "independent-rights.txt"
    review.write_bytes(b"Synthetic test review only; no external model cleared.")
    review_hash = hashlib.sha256(review.read_bytes()).hexdigest()
    pointer = ModelBundle(REVISION, review_hash, store.key_id, (), "")
    paths = []
    for index in range(2):
        file = protected / f"sealed-model-{index}.bjev"
        store.put(file, b"synthetic-no-real-model-bytes" * (index + 1),
                  kind="weights", binding=pointer.binding(index))
        paths.append({
            "file": file.name,
            "sha256": hashlib.sha256(file.read_bytes()).hexdigest(),
            "bytes": file.stat().st_size,
        })
    record = {
        "schema": MODEL_SCHEMA,
        "model": MODEL_ID,
        "licence": MODEL_LICENCE,
        "revision": REVISION,
        "review_sha256": review_hash,
        "key_id": store.key_id,
        "shards": paths,
    }
    manifest = tmp_path / "bundle.json"
    manifest.write_text(json.dumps(record))
    from .contracts import canonical_json

    digest = hashlib.sha256(canonical_json(record)).hexdigest()
    ledger: dict[str, Any] = {
        "models": [{
            "name": LEDGER_MODEL_NAME,
            "status": "allowed",
            "licence": MODEL_LICENCE,
            "sourceCommit": REVISION,
            "manifestSha256": digest,
            "independentReviewSha256": review_hash,
            "checked": "test-only synthetic rights receipt",
            "licenceSources": ["synthetic-fixture-only"],
        }]
    }
    approved = admit_model(
        manifest, encrypted_root=protected,
        ledger=ledger, store=store, rights_review_file=review,
    )
    return LocalBundleFixture(manifest, protected, review, store, ledger, approved)


class AllowedReviews:
    def __init__(self, accepted: bool = True) -> None:
        self.accepted = accepted
        self.calls = 0

    def review(self, text_or_pixels: object, purpose: str) -> ReviewVerdict:
        self.calls += 1
        return ReviewVerdict(self.accepted, True, "approved", "a" * 64)


class DrawnRuntime:
    def __init__(self) -> None:
        self.begun = False
        self.closed = False
        self.parts: list[bytes] = []
        self.read_memory: list[memoryview] = []
        self.generated = 0
        self.delay: threading.Event | None = None
        self.ready_value = True
        self.gpu_ms: float | None = 12.0

    def begin(self, model_id: str, revision: str) -> None:
        assert model_id == MODEL_ID
        assert revision == REVISION
        self.begun = True

    def feed_encrypted_shard(self, index: int, recovered: memoryview) -> None:
        self.read_memory.append(recovered)
        self.parts.append(bytes(recovered))

    def ready(self) -> bool:
        return self.begun and self.ready_value

    def generate(self, request: SceneRequest, cancelled: threading.Event) -> tuple[GeneratedPixels, ...]:
        if self.delay is not None:
            self.delay.wait(timeout=2.0)
        self.generated += 1
        image = Image.new("RGB", (request.settings.width, request.settings.height), (60, 80, 120))
        with io.BytesIO() as stream:
            image.save(stream, "PNG", exif=b"private-exif-fixture")
            data = stream.getvalue()
        return tuple(GeneratedPixels(data, self.gpu_ms) for _ in range(request.settings.images))

    def close(self) -> None:
        self.closed = True


def scene_request(*, purpose: str = "background", images: int = 1,
                  gpu_rate: float | None = None) -> SceneRequest:
    settings = GenerationSettings.from_mapping({
        "schema": "beljour-scene-settings/1",
        "width": 256,
        "height": 256,
        "steps": 2,
        "seed": 7,
        "images": images,
        "gpu_rate": gpu_rate,
    })
    return SceneRequest(purpose, "Quiet geometric landscape", settings)
