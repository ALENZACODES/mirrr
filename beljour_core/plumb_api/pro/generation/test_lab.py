"""Local lab end-to-end encrypted-model and moderation entry tests. Author: John Khan."""

from __future__ import annotations

import time
from pathlib import Path

import pytest

from .contracts import GenerationRefused
from .queue import BoundedSceneQueue
from .scene_lab import open_generation_lab
from .test_support import AllowedReviews, DrawnRuntime, make_bundle, scene_request


def _wait(queue: BoundedSceneQueue, identifier: str) -> None:
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        current = queue.status(identifier)
        if current["state"] in ("complete", "refused", "cancelled"):
            return
        time.sleep(0.01)
    raise AssertionError("local lab test job incomplete")


def test_public_lab_requires_approved_encrypted_model(tmp_path: Path) -> None:
    fixture = make_bundle(tmp_path)
    runtime = DrawnRuntime()
    with open_generation_lab(
        manifest_file=fixture.manifest,
        encrypted_root=fixture.encrypted_root,
        rights_review_file=fixture.rights,
        ledger=fixture.ledger,
        store=fixture.store,
        make_backend=lambda: runtime,
        prompt_reviewer=AllowedReviews(),
        image_reviewer=AllowedReviews(),
    ) as session:
        identifier = session.queue.submit(scene_request(gpu_rate=1.0))
        _wait(session.queue, identifier)
        assert session.queue.status(identifier)["state"] == "complete"
        assert session.public()["model"]["status"] == "ADMITTED_NOT_RENDERED"
        assert session.public()["release_gate"] == "NOT_RUN"
        result = session.queue.take(identifier)
        assert len(result.scenes) == 1
        assert session.costs.public()["images"] == 1
    assert runtime.closed


def test_lab_without_box_ledger_entry_never_initializes_runtime(tmp_path: Path) -> None:
    fixture = make_bundle(tmp_path)
    fixture.ledger["models"].clear()
    runtime = DrawnRuntime()
    with pytest.raises(GenerationRefused):
        with open_generation_lab(
            manifest_file=fixture.manifest,
            encrypted_root=fixture.encrypted_root,
            rights_review_file=fixture.rights,
            ledger=fixture.ledger,
            store=fixture.store,
            make_backend=lambda: runtime,
            prompt_reviewer=AllowedReviews(),
            image_reviewer=AllowedReviews(),
        ):
            pytest.fail("unapproved model was admitted")
    assert not runtime.begun


def test_lab_receipt_requires_actual_encoded_and_reviewed_output(tmp_path: Path) -> None:
    fixture = make_bundle(tmp_path)
    runtime = DrawnRuntime()
    with open_generation_lab(
        manifest_file=fixture.manifest,
        encrypted_root=fixture.encrypted_root,
        rights_review_file=fixture.rights,
        ledger=fixture.ledger,
        store=fixture.store,
        make_backend=lambda: runtime,
        prompt_reviewer=AllowedReviews(),
        image_reviewer=AllowedReviews(),
    ) as session:
        request = scene_request()
        job = session.queue.submit(request)
        _wait(session.queue, job)
        completed = session.queue.take(job)
        receipt = session.receipt(request, completed)
        assert receipt.images == 1
        assert receipt.public()["human_review"] == "NOT_RUN"
        assert receipt.public()["prompt_reviewer_sha256"] == "a" * 64
