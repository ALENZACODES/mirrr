"""R14 browser asset staging: synthetic bytes only, no model execution/network.

Pass definition: exact licensed bytes are the only bytes that may reach a public
path. Validation is complete before writing; linked, changed, pending or unknown
assets fail without creating a partial batch. Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from plumb_api.models.registry import ModelEntry, ModelRegistry, RegistryError
from plumb_api.models.staging import AssetPin, model_pins, read_runtime, runtime_pins, stage_assets

ROOT = Path(__file__).resolve().parents[2]
DATA = b"Synthetic staging fixture. This is not executable model data."
DIGEST = hashlib.sha256(DATA).hexdigest()
URL = "https://storage.googleapis.com/mediapipe-models/staging/1/synthetic.task"


def policy() -> dict:
    return {"policy": {"allowed": ["MIT"]}, "runtime": [
        {"name": "Synthetic test asset", "licence": "MIT", "status": "allowed", "urls": [URL]}
    ]}


def catalogue(**changes: object) -> ModelRegistry:
    return ModelRegistry({"format": "beljour-models/1", "version": 1, "models": [{
        "id": "synthetic-model", "task": "face-landmarks", "filename": "synthetic.task",
        "url": URL, "sha256": DIGEST, "bytes": len(DATA), "licenceName": "Synthetic test asset",
        "licence": "MIT", "status": "allowed", "runsOn": "browser", "note": "Synthetic bytes only",
        **changes,
    }]})


def asset(name: str = "synthetic.task", data: bytes = DATA) -> AssetPin:
    digest = hashlib.sha256(data).hexdigest()
    return AssetPin(name, name, f"{digest}/{name}", digest, len(data))


def test_public_asset_path_is_derived_from_hash_and_safe_filename() -> None:
    entry = catalogue().get("synthetic-model")
    assert entry.asset_path == f"/models/{DIGEST}/synthetic.task"
    assert model_pins(catalogue(), policy()) == (
        AssetPin("synthetic-model", "synthetic.task", f"{DIGEST}/synthetic.task", DIGEST, len(DATA)),
    )
    missing = catalogue(status="pending", sha256=None, bytes=None).get("synthetic-model")
    with pytest.raises(RegistryError, match="exact asset pin"):
        _ = missing.asset_path


def test_pinned_pending_model_still_cannot_stage() -> None:
    registry = catalogue(status="pending")
    assert model_pins(registry, policy()) == ()
    with pytest.raises(RegistryError, match="pending"):
        model_pins(registry, policy(), ["synthetic-model"])
    with pytest.raises(RegistryError, match="duplicate"):
        model_pins(catalogue(), policy(), ["synthetic-model"] * 2)
    with pytest.raises(RegistryError, match="unknown model"):
        model_pins(catalogue(), policy(), ["unknown-model"])


def test_staging_is_exact_idempotent_and_check_only_needs_no_source(tmp_path: Path) -> None:
    source, output = tmp_path / "cache", tmp_path / "site"
    source.mkdir()
    (source / "synthetic.task").write_bytes(DATA)
    pin = asset()
    first = stage_assets([pin], source=source, output=output)
    destination = output / pin.destination
    assert destination.read_bytes() == DATA
    assert first[0].copied and first[0].path == f"/models/{pin.destination}"
    timestamp = destination.stat().st_mtime_ns
    assert not stage_assets([pin], source=source, output=output)[0].copied
    assert destination.stat().st_mtime_ns == timestamp
    assert not stage_assets([pin], source=tmp_path / "absent", output=output, check_only=True)[0].copied
    assert not list(output.rglob(".stage-*"))


@pytest.mark.parametrize("changed", [DATA[:-1], DATA + b"x", bytes([DATA[0] ^ 1]) + DATA[1:]])
def test_invalid_source_creates_no_partial_batch(tmp_path: Path, changed: bytes) -> None:
    source, output = tmp_path / "cache", tmp_path / "site"
    source.mkdir()
    (source / "first.task").write_bytes(DATA)
    (source / "second.task").write_bytes(changed)
    with pytest.raises(RegistryError, match="mismatch"):
        stage_assets([asset("first.task"), asset("second.task")], source=source, output=output)
    assert not output.exists()


def test_existing_altered_asset_is_not_silently_replaced(tmp_path: Path) -> None:
    source, output = tmp_path / "cache", tmp_path / "site"
    source.mkdir()
    (source / "synthetic.task").write_bytes(DATA)
    pin = asset()
    stage_assets([pin], source=source, output=output)
    target = output / pin.destination
    altered = DATA[:-1] + b"!"
    target.write_bytes(altered)
    with pytest.raises(RegistryError, match="SHA-256"):
        stage_assets([pin], source=source, output=output)
    assert target.read_bytes() == altered
    with pytest.raises(RegistryError, match="SHA-256"):
        stage_assets([pin], source=source, output=output, check_only=True)


@pytest.mark.parametrize("part", ["source-file", "source-parent", "output-parent", "output-file"])
def test_linked_files_and_directories_are_rejected(tmp_path: Path, part: str) -> None:
    source, output = tmp_path / "cache", tmp_path / "site"
    source.mkdir()
    original = tmp_path / "original.task"
    original.write_bytes(DATA)
    pin = asset()
    if part == "source-file":
        (source / pin.source).symlink_to(original)
    else:
        (source / pin.source).write_bytes(DATA)
    if part == "source-parent":
        alias = tmp_path / "alias"
        alias.symlink_to(source, target_is_directory=True)
        source = alias
    if part == "output-parent":
        output.symlink_to(source, target_is_directory=True)
    if part == "output-file":
        target = output / pin.destination
        target.parent.mkdir(parents=True)
        target.symlink_to(original)
    with pytest.raises(RegistryError, match="linked"):
        stage_assets([pin], source=source, output=output)
    assert original.read_bytes() == DATA


@pytest.mark.parametrize("path", ["../outside.task", "/absolute.task", "a/../b.task", "a//b.task",
                                   "a\\b.task", "a/%2f.task", "a/./b.task"])
def test_unsafe_asset_paths_are_rejected(path: str) -> None:
    with pytest.raises(RegistryError, match="safe relative"):
        AssetPin("synthetic", path, "valid.task", DIGEST, len(DATA))
    with pytest.raises(RegistryError, match="safe relative"):
        AssetPin("synthetic", "valid.task", path, DIGEST, len(DATA))


@pytest.mark.parametrize("filename", ["%2fsynthetic.task", "%2esynthetic.task", "..synthetic.task", "synthetic%23.task"])
def test_encoded_or_ambiguous_public_model_filenames_are_rejected(filename: str) -> None:
    entry = catalogue().get("synthetic-model").public()
    entry.update(filename=filename, url=f"https://storage.googleapis.com/mediapipe-models/1/{filename}")
    with pytest.raises(RegistryError, match="file name"):
        ModelEntry.parse(entry)


def test_runtime_pin_requires_exact_archive_ledger_and_unique_safe_paths() -> None:
    ledger = json.loads((ROOT / "licences.json").read_text())
    runtime = read_runtime()
    pins = runtime_pins(runtime, ledger)
    assert len(pins) == 5
    assert all(pin.destination.startswith(f"runtime/{runtime['package']['sha256']}/") for pin in pins)
    changed = json.loads(json.dumps(runtime))
    changed["package"]["sha256"] = "0" * 64
    with pytest.raises(RegistryError, match="licence ledger"):
        runtime_pins(changed, ledger)
    changed = json.loads(json.dumps(runtime))
    changed["files"].append(changed["files"][0])
    with pytest.raises(RegistryError, match="duplicate"):
        runtime_pins(changed, ledger)
    changed = json.loads(json.dumps(runtime))
    changed["files"][0]["path"] = "../outside.js"
    with pytest.raises(RegistryError, match="safe relative"):
        runtime_pins(changed, ledger)


def test_model_evidence_matches_catalogue_ledger_and_clearance_boundary() -> None:
    ledger = json.loads((ROOT / "licences.json").read_text())
    evidence = json.loads((ROOT / "api/plumb_api/models/provenance.json").read_text())
    registry = ModelRegistry.read()
    assert evidence["author"] == "John Khan"
    assert len(evidence["models"]) == 5
    for record in evidence["models"]:
        entry = registry.get(record["id"])
        assert record["sha256"] == entry.sha256 and record["bytes"] == entry.bytes
        matched = next(row for row in ledger["runtime"] if row["name"] == entry.licence_name)
        assert matched["sha256"] == entry.sha256 and matched["bytes"] == entry.bytes
        assert record["status"] == entry.status
        if entry.status == "allowed":
            assert record["guideArtifactMatchesPin"] is True
            assert record["cardLicence"] == "Apache-2.0" and record["blocker"] is None
        else:
            assert record["blocker"] and entry.licence == "Unverified"
    assert registry.get("migan-512-places2").sha256 is None
