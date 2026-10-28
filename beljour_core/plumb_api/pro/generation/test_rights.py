"""Encrypted-weight admission, tampering and zeroization tests. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from .contracts import GenerationRefused
from .rights import admit_model
from .runtime import load_runtime
from .test_support import DrawnRuntime, make_bundle


def test_local_approved_bundle_and_memory_only_loading(tmp_path: Path) -> None:
    fixture = make_bundle(tmp_path)
    runtime = DrawnRuntime()
    with load_runtime(fixture.approved, fixture.store, lambda: runtime) as backend:
        assert backend is runtime
        assert runtime.ready()
        assert len(runtime.parts) == 2
        assert runtime.parts[0] == b"synthetic-no-real-model-bytes"
        assert all(not any(part) for part in runtime.read_memory)
        assert fixture.approved.public()["status"] == "ADMITTED_NOT_RENDERED"
    assert runtime.closed
    assert b"synthetic-no-real-model-bytes" not in (
        fixture.encrypted_root / "sealed-model-0.bjev"
    ).read_bytes()


@pytest.mark.parametrize("key,value", [
    ("model", "black-forest-labs/FLUX.1-dev"),
    ("model", "another-variant"),
    ("licence", "noncommercial"),
    ("revision", "short"),
    ("schema", "unreviewed"),
    ("key_id", "invalid"),
])
def test_forbidden_or_unauthenticated_model_variant(
    tmp_path: Path, key: str, value: str,
) -> None:
    fixture = make_bundle(tmp_path)
    document = json.loads(fixture.manifest.read_text())
    document[key] = value
    fixture.manifest.write_text(json.dumps(document))
    with pytest.raises(GenerationRefused):
        admit_model(
            fixture.manifest,
            encrypted_root=fixture.encrypted_root,
            ledger=fixture.ledger,
            store=fixture.store,
            rights_review_file=fixture.rights,
        )


@pytest.mark.parametrize("mutate", ["missing", "different_license", "different_commit", "different_hash"])
def test_ledger_incomplete_or_changed(tmp_path: Path, mutate: str) -> None:
    fixture = make_bundle(tmp_path)
    row = fixture.ledger["models"][0]
    if mutate == "missing":
        fixture.ledger["models"].clear()
    elif mutate == "different_license":
        row["licence"] = "unreviewed"
    elif mutate == "different_commit":
        row["sourceCommit"] = "c" * 40
    else:
        row["manifestSha256"] = "0" * 64
    with pytest.raises(GenerationRefused):
        admit_model(
            fixture.manifest,
            encrypted_root=fixture.encrypted_root,
            ledger=fixture.ledger,
            store=fixture.store,
            rights_review_file=fixture.rights,
        )


def test_review_change_refuses(tmp_path: Path) -> None:
    fixture = make_bundle(tmp_path)
    fixture.rights.write_bytes(b"new review")
    with pytest.raises(GenerationRefused, match="review"):
        admit_model(
            fixture.manifest,
            encrypted_root=fixture.encrypted_root,
            ledger=fixture.ledger,
            store=fixture.store,
            rights_review_file=fixture.rights,
        )


def test_ciphertext_changed_between_admission_and_loading(tmp_path: Path) -> None:
    fixture = make_bundle(tmp_path)
    path = fixture.encrypted_root / "sealed-model-1.bjev"
    content = bytearray(path.read_bytes())
    content[-1] ^= 1
    path.write_bytes(content)
    runtime = DrawnRuntime()
    with pytest.raises(GenerationRefused):
        with load_runtime(fixture.approved, fixture.store, lambda: runtime):
            pytest.fail("modified ciphertext was loaded")
    assert runtime.closed


def test_cross_shard_swap_rejected_by_gcm(tmp_path: Path) -> None:
    fixture = make_bundle(tmp_path)
    first = fixture.encrypted_root / "sealed-model-0.bjev"
    second = fixture.encrypted_root / "sealed-model-1.bjev"
    first.write_bytes(second.read_bytes())
    runtime = DrawnRuntime()
    with pytest.raises(GenerationRefused):
        with load_runtime(fixture.approved, fixture.store, lambda: runtime):
            pytest.fail("swapped encrypted shards were accepted")
    assert runtime.closed


def test_file_symlink_refused(tmp_path: Path) -> None:
    fixture = make_bundle(tmp_path)
    file = fixture.encrypted_root / "sealed-model-0.bjev"
    original = tmp_path / "other.bjev"
    original.write_bytes(file.read_bytes())
    file.unlink()
    file.symlink_to(original)
    with pytest.raises(GenerationRefused):
        admit_model(
            fixture.manifest,
            encrypted_root=fixture.encrypted_root,
            ledger=fixture.ledger,
            store=fixture.store,
            rights_review_file=fixture.rights,
        )


def test_runtime_failure_disposes_loaded_parts(tmp_path: Path) -> None:
    fixture = make_bundle(tmp_path)
    runtime = DrawnRuntime()
    runtime.ready_value = False
    with pytest.raises(GenerationRefused):
        with load_runtime(fixture.approved, fixture.store, lambda: runtime):
            pytest.fail("unready runtime was accepted")
    assert runtime.closed


def test_rights_sha_matches_verified_file(tmp_path: Path) -> None:
    fixture = make_bundle(tmp_path)
    actual = hashlib.sha256(fixture.rights.read_bytes()).hexdigest()
    assert actual == fixture.approved.bundle.rights_review_sha256
