"""R4 E03: unknown, unlicensed and checksum-invalid models fail closed.

All test weights are artificial bytes; no downloads or YouCam API calls.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from plumb_api.models.registry import (ModelEntry, ModelRegistry, RegistryError,
                                       sha256_bytes, validate_file, verify_catalog_licences)

CANDIDATE = "https://storage.googleapis.com/mediapipe-models/face_landmarker/mock/1/dummy.task"
BYTES = b"LOCAL TEST DATA ONLY: NOT MODEL WEIGHTS"
HASH = hashlib.sha256(BYTES).hexdigest()


def item(**overrides: object) -> dict:
    result = {
        "id": "fake-model", "task": "face-landmarks", "filename": "dummy.task",
        "url": CANDIDATE, "sha256": HASH, "bytes": len(BYTES), "licenceName": "Fake test weights",
        "licence": "MIT", "status": "allowed", "runsOn": "browser", "note": "test only",
    }
    return {**result, **overrides}


def source(*entries: dict) -> dict:
    return {"format": "beljour-models/1", "version": 1, "models": list(entries)}


def ledger(*, name: str = "Fake test weights", licence: str = "MIT", status: str = "allowed", urls: list[str] | None = None) -> dict:
    return {"policy": {"allowed": ["MIT", "Apache-2.0"]}, "runtime": [
        {"name": name, "licence": licence, "status": status,
         "urls": urls or ["https://storage.googleapis.com/mediapipe-models/face_landmarker/"]}
    ]}


def test_current_catalogue_clears_verified_artifacts_and_blocks_unverified_bundles() -> None:
    root = Path(__file__).resolve().parents[2]
    actual = ModelRegistry.read(root / "api/plumb_api/models/catalog.json")
    policy = json.loads((root / "licences.json").read_text())
    assert len(actual.entries) == 6
    assert not verify_catalog_licences(actual, policy)
    cleared = {"face-detector-short", "face-landmarker-478", "hair-segmenter", "selfie-multiclass"}
    for name, entry in actual.entries.items():
        assert bool(entry.sha256 and entry.bytes) == (name != "migan-512-places2")
        if name in cleared:
            assert entry.status == "allowed" and entry.licence == "Apache-2.0"
            assert actual.require_allowed(name, policy) == entry
        else:
            assert entry.status == "pending"
            with pytest.raises(RegistryError, match="manual fallback required"):
                actual.require_allowed(name, policy)


def test_unknown_model_cannot_be_fetched_or_loaded(tmp_path: Path) -> None:
    registry = ModelRegistry(source(item()))
    with pytest.raises(RegistryError, match="unknown model"):
        registry.get("not-registered")
    with pytest.raises(RegistryError, match="unknown or ambiguous model file"):
        validate_file(tmp_path / "other.task", registry=registry, ledger=ledger())


def test_approved_bytes_must_match_size_and_hash(tmp_path: Path) -> None:
    registry = ModelRegistry(source(item()))
    assert registry.require_allowed("fake-model", ledger()).sha256 == HASH
    assert registry.check_file("fake-model", BYTES, ledger()) == BYTES
    path = tmp_path / "dummy.task"
    path.write_bytes(BYTES)
    assert validate_file(path, registry=registry, ledger=ledger()).id == "fake-model"
    path.write_bytes(BYTES + b"X")
    with pytest.raises(RegistryError, match="length mismatch"):
        validate_file(path, registry=registry, ledger=ledger())
    path.write_bytes(BYTES[:-1] + b"X")
    with pytest.raises(RegistryError, match="sha256 mismatch"):
        validate_file(path, registry=registry, ledger=ledger())
    assert sha256_bytes(memoryview(BYTES)) == HASH


def test_refuse_symlinks_and_size_overrides(tmp_path: Path) -> None:
    registry = ModelRegistry(source(item()))
    original = tmp_path / "source.task"
    original.write_bytes(BYTES)
    link = tmp_path / "dummy.task"
    link.symlink_to(original)
    with pytest.raises(RegistryError, match="linked model file"):
        validate_file(link, registry=registry, ledger=ledger())


@pytest.mark.parametrize("change,message", [
    ({"id": "Bad Id"}, "identifier"),
    ({"task": "speech"}, "unknown task"),
    ({"url": "http://storage.googleapis.com/model.task"}, "approved HTTPS"),
    ({"url": "https://evil.example.org/x.task"}, "approved HTTPS"),
    ({"url": CANDIDATE + "?signature=abc"}, "version-pinned"),
    ({"filename": "../dummy.task"}, "file name"),
    ({"filename": "wrong.task"}, "file name"),
    ({"sha256": "0" * 63}, "sha256"),
    ({"sha256": "A" * 64}, "sha256"),
    ({"bytes": 0}, "model size"),
    ({"bytes": True}, "model size"),
    ({"bytes": 130 * 1024 * 1024}, "model size"),
    ({"licenceName": ""}, "licence ledger"),
    ({"licence": ""}, "missing licence"),
    ({"status": "other"}, "status"),
    ({"runsOn": "server"}, "browser"),
    ({"sha256": None}, "allowed model needs"),
    ({"bytes": None}, "allowed model needs"),
    ({"note": "x" * 501}, "invalid note"),
])
def test_malformed_entry_is_rejected(change: dict, message: str) -> None:
    with pytest.raises(RegistryError, match=message):
        ModelRegistry(source(item(**change)))


def test_pending_with_null_checksum_is_legal_but_not_loadable() -> None:
    reg = ModelRegistry(source(item(status="pending", sha256=None, bytes=None,
                                    licence="Unverified")))
    notice = ledger(licence="Unverified", status="pending")
    assert verify_catalog_licences(reg, notice) == []
    with pytest.raises(RegistryError, match="pending"):
        reg.check_file("fake-model", BYTES, notice)


def test_licence_gate_refuses_cleared_catalogue_without_exact_ledger() -> None:
    reg = ModelRegistry(source(item()))
    for changed in (
        ledger(name="Different weights"), ledger(licence="Unverified"),
        ledger(status="pending"), ledger(urls=["https://storage.googleapis.com/unrelated/"]),
        ledger(licence="GPL-3.0"),
    ):
        assert verify_catalog_licences(reg, changed)
        with pytest.raises(RegistryError, match="licence"):
            reg.require_allowed("fake-model", changed)
    with pytest.raises(RegistryError, match="commercial licence"):
        reg.require_allowed("fake-model", {**ledger(), "policy": {"allowed": []}})


def test_duplicate_names_urls_and_bad_root_are_rejected() -> None:
    with pytest.raises(RegistryError, match="duplicate"):
        ModelRegistry(source(item(), item()))
    with pytest.raises(RegistryError, match="duplicate"):
        ModelRegistry(source(item(), item(id="another-model")))
    with pytest.raises(RegistryError, match="unsupported model registry"):
        ModelRegistry({"format": "other", "version": 1, "models": []})
    with pytest.raises(RegistryError, match="invalid model fields"):
        ModelRegistry(source({**item(), "secret": "never"}))
    with pytest.raises(RegistryError, match="array"):
        ModelRegistry({**source(item()), "models": {}})
