"""R12 external occluder annotations: synthetic input and evidence contracts.

Every photograph and PNG mask is drawn in a temporary external directory. Tests
require original-size validation, content-addressed preregistration, no inferred
category labels and actual measured turn evidence. No model or network is used.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from .test_realface_runner_r12 import drawn as drawn_fixture

drawn = drawn_fixture

REALFACE = Path(__file__).resolve().parents[2] / "tests" / "realface"
sys.path.insert(0, str(REALFACE))
import realface_lib as lib  # noqa: E402
import run_state  # noqa: E402


def photograph(tmp_path, size=(48, 36)):
    path = tmp_path / "synthetic.png"
    Image.new("RGB", size, (110, 132, 145)).save(path)
    return lib.Face(path, "drawn", "own work", "synthetic", row={})


def annotation(face, values=None, *, classes="glasses", name="segmentations/private-annotation.png"):
    if values is None:
        with Image.open(face.path) as source:
            width, height = source.size
        values = np.zeros((height, width), dtype=np.uint8)
        values[height // 3:height // 2, width // 4:3 * width // 4] = 255
    path = face.path.parent / name
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(values).save(path)
    face.row.update(protected_mask=name, protected_mask_classes=classes)
    return path


def frozen(drawn):
    return run_state.freeze([drawn.face], drawn.bench.definitions, lib.API.parent,
                            max_side=lib.MAX_SIDE, include=("synthetic",))


def turn_rows(drawn):
    drawn.bench.modules = ("warp_turn",)
    return [row for row in drawn.bench.run(drawn.face) if row["module"] == "warp_turn"]


def test_absent_annotation_has_no_mask_identity_or_invented_classes(tmp_path):
    face = photograph(tmp_path)
    values, metadata = lib.load_protected_mask(face, (36, 48, 3))
    assert values is None
    assert metadata == {"protected_mask_sha256": None, "protected_mask_classes": []}
    assert run_state.protected_mask_metadata(face) == metadata


def test_grayscale_values_and_explicit_classes_are_preserved(tmp_path):
    face = photograph(tmp_path, (3, 2))
    values = np.array([[0, 64, 255], [128, 192, 0]], dtype=np.uint8)
    path = annotation(face, values, classes="hijab| hair |glasses")
    mask, metadata = lib.load_protected_mask(face, (2, 3, 3))
    np.testing.assert_array_equal(mask, values.astype(np.float32) / np.float32(255))
    assert mask.dtype == np.float32
    assert metadata["protected_mask_sha256"] == hashlib.sha256(path.read_bytes()).hexdigest()
    assert metadata["protected_mask_classes"] == ["glasses", "hair", "hijab"]


def test_mask_without_class_is_allowed_but_does_not_claim_category(tmp_path):
    face = photograph(tmp_path)
    annotation(face, classes="")
    mask, metadata = lib.load_protected_mask(face, (36, 48, 3))
    assert mask is not None and np.count_nonzero(mask) > 0
    assert metadata["protected_mask_classes"] == []


@pytest.mark.parametrize("classes", ["skin", "hair|hair", "hair||glasses", "Hair"])
def test_unsupported_duplicate_or_empty_annotation_classes_are_rejected(tmp_path, classes):
    face = photograph(tmp_path)
    annotation(face, classes=classes)
    with pytest.raises(ValueError, match="classes"):
        run_state.protected_mask_metadata(face)


def test_classes_without_a_supplied_mask_are_rejected(tmp_path):
    face = photograph(tmp_path)
    face.row["protected_mask_classes"] = "hijab"
    with pytest.raises(ValueError, match="require a supplied mask"):
        run_state.protected_mask_reference(face)


@pytest.mark.parametrize("name", ["../outside.png", "/tmp/outside.png", "segmentations/mask.jpg"])
def test_mask_paths_cannot_escape_the_photo_folder_or_change_format(tmp_path, name):
    face = photograph(tmp_path)
    face.row["protected_mask"] = name
    with pytest.raises(ValueError, match="relative PNG"):
        run_state.protected_mask_reference(face)


def test_symlink_to_mask_outside_photo_folder_is_rejected(tmp_path):
    photo_folder = tmp_path / "photos"
    photo_folder.mkdir()
    face = photograph(photo_folder)
    outside = tmp_path / "outside.png"
    Image.new("L", (48, 36)).save(outside)
    (photo_folder / "mask.png").symlink_to(outside)
    face.row["protected_mask"] = "mask.png"
    with pytest.raises(ValueError, match="under the photograph folder"):
        run_state.protected_mask_reference(face)


def test_missing_supplied_mask_refuses_preregistration(drawn):
    drawn.face.row.update(protected_mask="segmentations/absent.png", protected_mask_classes="hair")
    with pytest.raises(ValueError, match="must exist"):
        frozen(drawn)


@pytest.mark.parametrize("mode", ["RGB", "RGBA", "I;16"])
def test_ambiguous_color_alpha_or_sixteen_bit_masks_are_not_converted_silently(tmp_path, mode):
    face = photograph(tmp_path)
    path = annotation(face)
    Image.new(mode, (48, 36)).save(path)
    with pytest.raises(ValueError, match="8-bit grayscale PNG"):
        lib.load_protected_mask(face, (36, 48, 3))


def test_wrong_original_size_cannot_be_stretched_to_the_working_image(tmp_path, monkeypatch):
    face = photograph(tmp_path, (48, 36))
    annotation(face, np.zeros((18, 24), dtype=np.uint8))
    monkeypatch.setattr(lib, "MAX_SIDE", 24)
    image = lib.load_rgb(face.path)
    assert image.shape == (18, 24, 3)
    with pytest.raises(ValueError, match="oriented original"):
        lib.load_protected_mask(face, image.shape)


def test_resize_uses_the_photo_geometry_and_retains_fractional_coverage(tmp_path, monkeypatch):
    face = photograph(tmp_path, (49, 35))
    path = annotation(face)
    monkeypatch.setattr(lib, "MAX_SIDE", 24)
    image = lib.load_rgb(face.path)
    mask, _ = lib.load_protected_mask(face, image.shape)
    with Image.open(path) as source:
        expected = np.asarray(source.resize((24, 17), Image.Resampling.LANCZOS), dtype=np.float32) / 255
    np.testing.assert_array_equal(mask, expected)
    assert mask.shape == image.shape[:2] == (17, 24)
    assert np.any((mask > 0) & (mask < 1)) and np.isfinite(mask).all()
    with pytest.raises(ValueError, match="working dimensions"):
        lib.load_protected_mask(face, (18, 24, 3))


def test_exif_oriented_photo_dimensions_are_the_annotation_contract(tmp_path):
    face = photograph(tmp_path, (40, 24))
    exif = Image.Exif()
    exif[274] = 6
    Image.new("RGB", (40, 24), (70, 110, 130)).save(face.path, exif=exif)
    mask_values = np.zeros((40, 24), dtype=np.uint8)
    mask_values[10:20, 5:18] = 255
    annotation(face, mask_values)
    image = lib.load_rgb(face.path)
    mask, _ = lib.load_protected_mask(face, image.shape)
    assert image.shape == (40, 24, 3)
    np.testing.assert_array_equal(mask, mask_values.astype(np.float32) / 255)
    annotation(face, np.zeros((24, 40), dtype=np.uint8))
    with pytest.raises(ValueError, match="oriented original"):
        lib.load_protected_mask(face, image.shape)


def test_mask_bytes_and_class_changes_invalidate_frozen_run_identity(drawn):
    path = annotation(drawn.face, classes="hair")
    original = frozen(drawn)
    original_face = original["faces"][0]
    assert original_face["protected_mask_sha256"] == run_state.file_hash(path)
    assert original_face["protected_mask_classes"] == ["hair"]
    assert "private-annotation" not in json.dumps(original)
    with Image.open(path) as source:
        values = np.array(source)
    values[0, 0] = 255
    Image.fromarray(values).save(path)
    changed_pixels = frozen(drawn)
    drawn.face.row["protected_mask_classes"] = "glasses"
    changed_classes = frozen(drawn)
    assert len({plan["run_id"] for plan in (original, changed_pixels, changed_classes)}) == 3
    assert len({plan["face_set_sha256"] for plan in (original, changed_pixels, changed_classes)}) == 3
    assert {plan["faces"][0]["face_id"] for plan in (original, changed_pixels, changed_classes)} == {original_face["face_id"]}


def test_annotation_only_change_cannot_resume_an_old_stream(drawn):
    annotation(drawn.face, classes="hair")
    original = frozen(drawn)
    stream = drawn.root / "synthetic-rows.jsonl"
    with run_state.open_stream(stream, original):
        pass
    drawn.face.row["protected_mask_classes"] = "hijab"
    with pytest.raises(ValueError, match="incompatible"):
        run_state.read_stream(stream, frozen(drawn))


def test_segmentations_are_not_discovered_as_additional_faces(tmp_path):
    folder = tmp_path / "synthetic-set"
    folder.mkdir()
    face = photograph(folder)
    annotation(face)
    (folder / "manifest.csv").write_text(
        "file,protected_mask,protected_mask_classes\n"
        "synthetic.png,segmentations/private-annotation.png,glasses\n", encoding="utf-8")
    faces = lib.discover(tmp_path, ("synthetic-set",))
    assert len(faces) == 1 and faces[0].path == face.path
    assert faces[0].row["protected_mask_classes"] == "glasses"


def test_actual_turn_rows_record_supplied_measured_mask_and_unrounded_ratio(drawn, monkeypatch):
    path = annotation(drawn.face)
    received = []
    native = drawn.bench.m["turn"].render_turn

    def capture(image, xyz, **kwargs):
        result = native(image, xyz, **kwargs)
        received.append((kwargs["protected_mask"].copy(), result))
        return result

    monkeypatch.setattr(drawn.bench.m["turn"], "render_turn", capture)
    rows = turn_rows(drawn)
    assert len(rows) == len(received) == 4
    for row, (mask, result) in zip(rows, received, strict=True):
        assert mask.shape == drawn.image.shape[:2] and mask.max() == 1
        assert row["protected_mask_sha256"] == run_state.file_hash(path)
        assert row["protected_mask_classes"] == ["glasses"]
        for name in ("occluder_mask_supplied", "occluder_mask_nonempty", "q4_occluder_measured",
                     "q4_occluder_evidence_pass"):
            assert row[name] is True
        assert type(row["protected_pixels"]) is int and row["protected_pixels"] > 0
        assert type(row["q4_occluder_band_pixels"]) is int and row["q4_occluder_band_pixels"] > 0
        assert row["q4_occluder_ratio_p90"] == result.metrics["q4_occluder_ratio_p90"]
        independent = drawn.bench.m["q4"](drawn.image, result.image, mask)
        assert row["q4_occluder_ratio_p90"] == independent.measured["ratio"]
    json.dumps(rows, allow_nan=False)


def test_empty_annotation_and_next_unannotated_face_never_claim_measured_seams(drawn):
    annotation(drawn.face, np.zeros(drawn.image.shape[:2], dtype=np.uint8), classes="hijab")
    empty = turn_rows(drawn)
    drawn.face.row.pop("protected_mask")
    drawn.face.row.pop("protected_mask_classes")
    absent = turn_rows(drawn)
    for row in empty + absent:
        assert row["q4_occluder_pass"] is True  # geometric no-boundary result remains valid
        assert row["q4_occluder_measured"] is False and row["q4_occluder_evidence_pass"] is False
        assert row["protected_pixels"] == row["q4_occluder_band_pixels"] == 0
    assert all(row["occluder_mask_supplied"] is True for row in empty)
    assert all(row["occluder_mask_supplied"] is False and row["protected_mask_sha256"] is None for row in absent)


def test_corrupt_supplied_mask_fails_turn_without_dropping_other_engine_rows(drawn):
    path = annotation(drawn.face, classes="hair")
    path.write_bytes(b"synthetic corrupt PNG")
    rows = drawn.bench.run(drawn.face)
    turn = [row for row in rows if row["module"] == "warp_turn"]
    assert len(turn) == 1 and turn[0]["check"] == "exception" and turn[0]["pass"] is False
    assert "cannot be decoded" in turn[0]["error"]
    assert any(row["module"] == "regions" and row["metric_pass"] is True for row in rows)
    assert not any(row.get("q4_occluder_evidence_pass") is True for row in turn)
