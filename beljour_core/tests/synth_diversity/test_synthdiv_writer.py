"""Atomic JSONL, filesystem refusal, provenance and PNG integrity tests.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from lab.synth_diversity.compose import compose_face
from lab.synth_diversity.fixtures import make_drawn_face, save_drawn_fixture
from lab.synth_diversity.plan import make_plans
from lab.synth_diversity.types import SyntheticInputError
from lab.synth_diversity.writer import (
    checked_output_dir,
    load_bases,
    load_manifest,
    repository_root,
    verify_manifest,
    write_batch,
)


def test_export_round_trip_and_provenance(tmp_path: Path) -> None:
    face = make_drawn_face()
    generated = compose_face(face, make_plans(1, 24)[0])
    directory = tmp_path / "sample-output"
    manifest = write_batch(directory, [generated])
    assert manifest.name == "manifest.jsonl"
    rows = load_manifest(directory)
    assert len(rows) == 1
    row = rows[0]
    assert row["base_id"] == face.base_id
    assert row["seed"] == generated.plan.seed
    assert row["base_source_id"] == "S02"
    assert row["source_id"] == "S21"
    assert row["licence"] == "Own work, John Khan"
    assert row["test_only"] is True
    assert row["train_allowed"] is False
    assert row["tags"] == generated.plan.tags
    assert set(row["occlusion_masks"]) == {"head_covering", "beard", "glasses"}
    assert verify_manifest(directory) == []
    picture = np.asarray(Image.open(directory / row["image"]).convert("RGB"), np.uint8)
    np.testing.assert_array_equal(picture, generated.image)
    assert row["image_sha256"] == hashlib.sha256(
        (directory / row["image"]).read_bytes()
    ).hexdigest()


def test_writer_is_deterministic_between_fresh_folders(tmp_path: Path) -> None:
    result = compose_face(make_drawn_face(), make_plans(1, 82)[0])
    first = tmp_path / "first"
    second = tmp_path / "second"
    write_batch(first, [result])
    write_batch(second, [result])
    first_files = {path.name: path.read_bytes() for path in first.iterdir()}
    second_files = {path.name: path.read_bytes() for path in second.iterdir()}
    assert first_files == second_files
    assert len(first_files) == 14


def test_manifest_detects_bad_pixel_bytes(tmp_path: Path) -> None:
    result = compose_face(make_drawn_face(), make_plans(1, 49)[0])
    folder = tmp_path / "sample"
    write_batch(folder, [result])
    image = folder / "sample-000000.png"
    image.write_bytes(image.read_bytes() + b"tampered")
    assert any("digest mismatch" in item for item in verify_manifest(folder))


def test_manifest_detects_changed_training_flags(tmp_path: Path) -> None:
    result = compose_face(make_drawn_face(), make_plans(1, 55)[0])
    folder = tmp_path / "sample"
    write_batch(folder, [result])
    manifest = folder / "manifest.jsonl"
    row = json.loads(manifest.read_text())
    row["train_allowed"] = True
    manifest.write_text(json.dumps(row) + "\n")
    assert any("safety flags" in item for item in verify_manifest(folder))


def test_writer_rejects_repo_or_existing_path(tmp_path: Path) -> None:
    result = compose_face(make_drawn_face(), make_plans(1, 12)[0])
    with pytest.raises(SyntheticInputError, match="inside the repo"):
        write_batch(repository_root() / "forbidden", [result])
    folder = tmp_path / "existing"
    folder.mkdir()
    with pytest.raises(SyntheticInputError, match="already exists"):
        write_batch(folder, [result])
    with pytest.raises(SyntheticInputError, match="base directory"):
        checked_output_dir(tmp_path / "bases" / "generated", tmp_path / "bases")


def test_writer_rejects_repo_symlink(tmp_path: Path) -> None:
    alias = tmp_path / "inside"
    alias.symlink_to(repository_root(), target_is_directory=True)
    with pytest.raises(SyntheticInputError, match="inside the repo"):
        checked_output_dir(alias / "forbidden")


def test_declared_base_fixture_loader(tmp_path: Path) -> None:
    base = make_drawn_face(base_id="test_sample")
    folder = tmp_path / "bases"
    save_drawn_fixture(folder, base)
    loaded = load_bases(folder)
    assert len(loaded) == 1
    assert loaded[0].base_id == base.base_id
    assert loaded[0].source_id == "S02"
    np.testing.assert_array_equal(loaded[0].image, base.image)
    np.testing.assert_array_equal(loaded[0].skin_mask, base.skin_mask)


def test_loader_rejects_non_synthetic_declaration(tmp_path: Path) -> None:
    base = make_drawn_face(base_id="test_sample")
    folder = tmp_path / "bases"
    save_drawn_fixture(folder, base)
    metadata = folder / "test_sample.base.json"
    value = json.loads(metadata.read_text())
    value["synthetic_only"] = False
    metadata.write_text(json.dumps(value))
    with pytest.raises(SyntheticInputError, match="synthetic provenance"):
        load_bases(folder)


def test_loader_rejects_broken_png_and_unsafe_metadata(tmp_path: Path) -> None:
    base = make_drawn_face(base_id="test_sample")
    folder = tmp_path / "bases"
    save_drawn_fixture(folder, base)
    (folder / "test_sample.png").write_bytes(b"not a PNG")
    with pytest.raises(SyntheticInputError):
        load_bases(folder)


def test_manifest_rejects_rehashed_non_png_bytes(tmp_path: Path) -> None:
    result = compose_face(make_drawn_face(), make_plans(1, 37)[0])
    folder = tmp_path / "generated"
    write_batch(folder, [result])
    name = "sample-000000.png"
    (folder / name).write_bytes(b"invalid-png-but-matching-checksum")
    manifest = folder / "manifest.jsonl"
    row = json.loads(manifest.read_text())
    row["image_sha256"] = hashlib.sha256((folder / name).read_bytes()).hexdigest()
    manifest.write_text(json.dumps(row, sort_keys=True) + "\n")
    assert any("invalid PNG encoding" in item for item in verify_manifest(folder))


def test_manifest_rejects_unrecognised_trait_tag(tmp_path: Path) -> None:
    result = compose_face(make_drawn_face(), make_plans(1, 28)[0])
    folder = tmp_path / "generated"
    write_batch(folder, [result])
    manifest = folder / "manifest.jsonl"
    row = json.loads(manifest.read_text())
    row["tags"]["head_covering"] = "unknown"
    manifest.write_text(json.dumps(row, sort_keys=True) + "\n")
    assert any("declared tags invalid" in item for item in verify_manifest(folder))


def test_empty_manifest_is_invalid(tmp_path: Path) -> None:
    folder = tmp_path / "generated"
    folder.mkdir()
    (folder / "manifest.jsonl").write_text("")
    assert "manifest has no synthetic samples" in verify_manifest(folder)
