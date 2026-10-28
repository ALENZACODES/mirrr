"""BELJOUR 61-filter golden evidence audit on original owned image references.

The hashes are checked independently of render similarity. All fixtures are
synthetic. These tests never rewrite repository reference images.
Created by John Khan.
"""
from __future__ import annotations

import copy
import hashlib
import json
import shutil
from pathlib import Path

import numpy as np
import pytest

from plumb_api.filters.qa import fixtures, goldens
from plumb_api.filters.recipe import registry

CAT = registry.default()


def one_filter_folder(tmp_path: Path, recipe_id: str = "C08") -> tuple[Path, registry.Catalogue]:
    recipe = CAT.get(recipe_id)
    subset = registry.Catalogue((recipe,), CAT.addons, CAT.ranking, CAT.files)
    original = goldens.load_manifest()
    rows = {
        name: copy.deepcopy(value)
        for name, value in original["goldens"].items()
        if value["recipe"] == recipe_id
    }
    document = {**original, "goldens": rows}
    for name in rows:
        shutil.copy2(goldens.FOLDER / name, tmp_path / name)
    (tmp_path / goldens.MANIFEST).write_text(json.dumps(document), encoding="utf-8")
    return tmp_path, subset


def write_manifest(folder: Path, mutation: object) -> None:
    path = folder / goldens.MANIFEST
    data = json.loads(path.read_text(encoding="utf-8"))
    if callable(mutation):
        mutation(data)
    path.write_text(json.dumps(data), encoding="utf-8")


@pytest.mark.parametrize("recipe_id", CAT.ids())
def test_each_built_filter_has_both_png_references(recipe_id: str) -> None:
    doc = goldens.load_manifest()
    recipe = CAT.get(recipe_id)
    for variant, shape in (
        ("atlas", [fixtures.ATLAS_H, fixtures.ATLAS_W, 3]),
        ("face", [goldens.FACE_H, goldens.FACE_W, 3]),
    ):
        name = f"{recipe_id}-{variant}.png"
        assert name in doc["goldens"]
        row = doc["goldens"][name]
        assert row["recipe"] == recipe["id"]
        assert row["version"] == recipe["version"]
        assert row["shape"] == shape
        assert (goldens.FOLDER / name).is_file()


def test_complete_manifest_integrity_without_rerendering() -> None:
    assert len(CAT.recipes) == 61
    assert len(goldens.load_manifest()["goldens"]) == 122
    assert goldens.manifest_problems() == []


def test_references_are_real_png_decoded_rgb_bytes() -> None:
    doc = goldens.load_manifest()
    for name, entry in doc["goldens"].items():
        raw = (goldens.FOLDER / name).read_bytes()
        assert raw.startswith(b"\x89PNG\r\n\x1a\n"), name
        assert hashlib.sha256(raw).hexdigest() == entry["png_sha256"], name
        image = goldens.read_png(goldens.FOLDER / name)
        assert image.dtype == np.uint8
        assert list(image.shape) == entry["shape"], name
        assert hashlib.sha256(image.tobytes()).hexdigest() == entry["output_sha256"], name


def test_mutated_png_bytes_are_detected(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)
    path = folder / "C08-atlas.png"
    data = bytearray(path.read_bytes())
    data[-8] ^= 1
    path.write_bytes(data)
    problems = goldens.manifest_problems(folder, cat)
    assert any("C08-atlas.png: PNG checksum mismatch" in p for p in problems)


def test_changed_recipe_version_is_detected(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)

    def change(document: dict[str, object]) -> None:
        rows = document["goldens"]
        assert isinstance(rows, dict)
        rows["C08-face.png"]["version"] = 0

    write_manifest(folder, change)
    assert any("recipe ID or version mismatch" in p for p in goldens.manifest_problems(folder, cat))


def test_changed_recipe_id_is_detected(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)

    def change(document: dict[str, object]) -> None:
        rows = document["goldens"]
        assert isinstance(rows, dict)
        rows["C08-face.png"]["recipe"] = "M01"

    write_manifest(folder, change)
    assert any("recipe ID or version mismatch" in p for p in goldens.manifest_problems(folder, cat))


def test_declared_dimensions_are_checked_independently(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)

    def change(document: dict[str, object]) -> None:
        rows = document["goldens"]
        assert isinstance(rows, dict)
        rows["C08-atlas.png"]["shape"] = [1, 1, 3]

    write_manifest(folder, change)
    assert any("declared shape mismatch" in p for p in goldens.manifest_problems(folder, cat))


def test_missing_manifest_is_explicit_failure(tmp_path: Path) -> None:
    _, cat = one_filter_folder(tmp_path)
    (tmp_path / goldens.MANIFEST).unlink()
    assert "golden manifest is missing" in goldens.manifest_problems(tmp_path, cat)


def test_broken_json_fails_closed(tmp_path: Path) -> None:
    _, cat = one_filter_folder(tmp_path)
    (tmp_path / goldens.MANIFEST).write_text("{broken", encoding="utf-8")
    assert any("could not be read" in p for p in goldens.manifest_problems(tmp_path, cat))


def test_missing_file_is_reported_not_rebuilt(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)
    (folder / "C08-face.png").unlink()
    assert any("golden PNG missing" in p for p in goldens.manifest_problems(folder, cat))
    assert not (folder / "C08-face.png").exists()


def test_unregistered_file_is_not_promoted(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)
    shutil.copy2(folder / "C08-face.png", folder / "unknown-face.png")
    assert any("unregistered golden PNG" in p for p in goldens.manifest_problems(folder, cat))


def test_no_extra_manifest_reference_is_accepted(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)

    def change(document: dict[str, object]) -> None:
        rows = document["goldens"]
        assert isinstance(rows, dict)
        rows["C00-face.png"] = rows["C08-face.png"]

    write_manifest(folder, change)
    assert any("not in built catalogue" in p for p in goldens.manifest_problems(folder, cat))


def test_evidence_provenance_and_format_are_required(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)

    def change(document: dict[str, object]) -> None:
        document["author"] = ""
        document["format"] = "legacy"

    write_manifest(folder, change)
    errors = goldens.manifest_problems(folder, cat)
    assert "golden provenance is missing" in errors
    assert "unexpected golden manifest format" in errors


def test_byte_hash_differs_when_stored_reference_is_modified(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)
    path = folder / "C08-face.png"
    pixels = goldens.read_png(path).copy()
    pixels[4, 4] = (pixels[4, 4] + 3).astype(np.uint8)
    path.write_bytes(goldens.png_bytes(pixels))
    errors = goldens.manifest_problems(folder, cat)
    assert any("PNG checksum mismatch" in p for p in errors)
    assert any("decoded RGB checksum mismatch" in p for p in errors)


def test_duplicate_manifest_keys_are_rejected(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)
    path = folder / goldens.MANIFEST
    raw = path.read_text(encoding="utf-8")
    # JSON's ordinary decoder discards duplicate keys; the evidence audit must not.
    altered = raw.replace('"author": "John Khan"',
                          '"author": "John Khan", "author": "Other"')
    path.write_text(altered, encoding="utf-8")
    assert any("could not be read" in p for p in goldens.manifest_problems(folder, cat))


def test_duplicate_nested_golden_metadata_is_rejected(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)
    path = folder / goldens.MANIFEST
    raw = path.read_text(encoding="utf-8")
    needle = '"recipe": "C08"'
    path.write_text(raw.replace(needle, needle + ', "recipe": "C09"', 1), encoding="utf-8")
    assert any("could not be read" in p for p in goldens.manifest_problems(folder, cat))


def test_combined_golden_check_returns_error_for_corrupt_manifest(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)
    (folder / goldens.MANIFEST).write_text("broken{", encoding="utf-8")
    problems = goldens.check(folder, cat)
    assert any("manifest could not be read" in p for p in problems)


def test_combined_golden_check_returns_error_for_missing_manifest(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)
    (folder / goldens.MANIFEST).unlink()
    problems = goldens.check(folder, cat)
    assert any("golden manifest is missing" in p for p in problems)


def test_combined_golden_check_detects_replaced_reference_despite_new_hashes(tmp_path: Path) -> None:
    folder, cat = one_filter_folder(tmp_path)
    path = folder / "C08-face.png"
    pixels = goldens.read_png(path).copy()
    pixels[10:50, 20:80] = (17, 98, 237)
    binary = goldens.png_bytes(pixels)
    path.write_bytes(binary)

    def rewrite(document: dict[str, object]) -> None:
        rows = document["goldens"]
        assert isinstance(rows, dict)
        rows["C08-face.png"]["png_sha256"] = hashlib.sha256(binary).hexdigest()
        rows["C08-face.png"]["output_sha256"] = hashlib.sha256(pixels.tobytes()).hexdigest()

    write_manifest(folder, rewrite)
    assert goldens.manifest_problems(folder, cat) == []
    problems = goldens.check(folder, cat)
    assert any("moved by mean ΔE2000" in problem for problem in problems)
