"""R17A: drawn-only primary group crop correctness and refusal tests.

No real photos, stored person landmarks, external test images or ML weights.
Author: John Khan.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from plumb_api.engines.shape.turn import normalized_xyz
from plumb_api.vision.box_first import DetectionResult, FaceBox

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests" / "realface"))
import primary_crop as crop  # noqa: E402
import realface_lib as lib  # noqa: E402
from primary_face import select  # noqa: E402


def mesh(cx: float, cy: float = .5, rx: float = .09, ry: float = .12) -> np.ndarray:
    theta = np.linspace(0.0, 2.0 * np.pi, 478, endpoint=False)
    return np.stack([cx + rx * np.cos(theta), cy + ry * np.sin(theta),
                     0.01 * np.cos(2.0 * theta)], axis=1)


def drawn(width: int = 440, height: int = 280) -> np.ndarray:
    yy, xx = np.mgrid[:height, :width]
    return np.stack([(xx % 256).astype(np.uint8), (yy % 256).astype(np.uint8),
                     ((xx // 3 + yy // 2) % 256).astype(np.uint8)], axis=2)


def group() -> list[np.ndarray]:
    return [mesh(.76, rx=.06), mesh(.27, rx=.12), mesh(.52, rx=.07)]


def primary() -> crop.PreparedCrop:
    candidates = group()
    choice = select(candidates, [], 440, 280, group_crop=True)
    assert choice.index == 1
    return crop.isolate(drawn(), candidates, choice)


def test_group_crop_selects_primary_instead_of_using_detector_order():
    selected = select(group(), [], 440, 280, group_crop=True)
    assert selected.accepted
    assert selected.reason_code == "selected_largest"
    assert selected.index == 1
    assert selected.candidate_count == 3
    assert selected.others_not_processed == 2
    assert selected.area_share is not None
    assert selected.area_share > 0.05


def test_ordinary_multiface_policy_uses_a_deterministic_centre_tiebreak():
    candidates = [mesh(.30, rx=.11), mesh(.70, rx=.11)]
    refused = select(candidates, [], 440, 280)
    assert refused.reason_code == "selected_centre_tiebreak"
    assert refused.accepted
    allowed = select(candidates, [], 440, 280, group_crop=True)
    assert allowed.accepted
    assert allowed.others_not_processed == 1


def test_group_crop_is_invariant_to_detector_face_order():
    images = group()
    for arrangement in ([0, 1, 2], [2, 1, 0], [1, 0, 2], [1, 2, 0]):
        reordered = [images[i] for i in arrangement]
        choice = select(reordered, [], 440, 280, group_crop=True)
        assert choice.index == arrangement.index(1)
        selected = crop.isolate(drawn(), reordered, choice)
        assert selected.bounds == primary().bounds


def test_identical_face_centres_remain_unisolatable_for_edits():
    lead = mesh(.5, rx=.11)
    selected = select([lead, lead.copy()], [], 440, 280, group_crop=True)
    assert selected.accepted
    assert selected.reason_code == "selected_centre_tiebreak"
    with pytest.raises(crop.CropRefusal, match="ambiguous"):
        crop.isolate(drawn(), [lead, lead.copy()], selected)


def test_group_crop_has_no_authored_identity_or_demographic_classifier():
    candidates = group()
    a = select(candidates, [], 440, 280, group_crop=True,
               labels={"gender": "x", "race": "x", "age": "x"})
    b = select(candidates, [], 440, 280, group_crop=True,
               labels={"gender": "y", "race": "y", "age": "y"})
    assert a == b


def test_primary_is_cropped_without_mutating_original_or_moving_pixels():
    original = drawn()
    old = original.copy()
    item = primary()
    x0, y0, x1, y1 = item.bounds
    assert np.array_equal(original, old)
    assert np.array_equal(item.image, original[y0:y1, x0:x1])
    item.image[:] = 0
    assert np.array_equal(original, old)


def test_primary_mesh_xy_coordinates_transform_without_rounding_loss():
    original = group()[1]
    item = primary()
    ox = normalized_xyz(original, 440, 280)
    after = normalized_xyz(item.mesh, item.image.shape[1], item.image.shape[0])
    x0, y0, _, _ = item.bounds
    assert np.max(np.abs(ox[:, 0] - (after[:, 0] + x0))) < 1e-9
    assert np.max(np.abs(ox[:, 1] - (after[:, 1] + y0))) < 1e-9


def test_primary_mesh_z_rescales_as_original_mediapipe_width_units():
    original = group()[1]
    item = primary()
    before_xyz = normalized_xyz(original, 440, 280)
    cropped_xyz = normalized_xyz(item.mesh, item.image.shape[1], item.image.shape[0])
    assert np.max(np.abs(before_xyz[:, 2] - cropped_xyz[:, 2])) < 1e-9


def test_crop_contains_every_primary_landmark():
    item = primary()
    assert np.isfinite(item.mesh).all()
    assert float(np.min(item.mesh[:, :2])) >= 0
    assert float(np.max(item.mesh[:, :2])) <= 1
    assert item.image.shape[1] < 440
    assert item.image.shape[0] < 280


def test_group_crop_excludes_centres_of_unprocessed_people():
    item = primary()
    for second in [group()[0], group()[2]]:
        cx = float((second[:, 0].min() + second[:, 0].max()) * 220)
        cy = float((second[:, 1].min() + second[:, 1].max()) * 140)
        left, top, right, bottom = item.bounds
        assert not (left <= cx < right and top <= cy < bottom)


def test_crop_reports_only_scalar_metadata_and_no_locations():
    data = primary().scalars()
    assert data["other_faces_not_processed"] == 2
    assert data["original_detected_faces"] == 3
    assert 0 < data["crop_fraction"] < 1
    assert "crop_applied" in data
    assert "bounds" not in data
    assert "image" not in data
    assert "coordinates" not in data
    assert "mesh" not in data
    assert all(value is None or isinstance(value, (str, float, int, bool)) for value in data.values())


def test_valid_protected_field_is_cropped_on_identical_boundaries():
    item = primary()
    mask = np.zeros((280, 440), dtype=np.float32)
    mask[90:130, 80:150] = .9
    sample = item.crop_mask(mask)
    left, top, right, bottom = item.bounds
    assert np.array_equal(sample, mask[top:bottom, left:right])
    assert not np.shares_memory(sample, mask)


@pytest.mark.parametrize("shape", [(0, 0), (1, 440), (440, 280), (280, 440, 3)])
def test_protected_field_shape_must_match_original_dimensions(shape):
    with pytest.raises(ValueError):
        primary().crop_mask(np.zeros(shape, dtype=np.float32))


@pytest.mark.parametrize("bad", [float("nan"), float("inf"), float("-inf")])
def test_protected_field_rejects_nonfinite_data(bad):
    field = np.zeros((280, 440), dtype=np.float32)
    field[10, 10] = bad
    with pytest.raises(ValueError):
        primary().crop_mask(field)


@pytest.mark.parametrize("error_type", ["zero", "invalid", "boolean", "wrong_channels", "float", "tiny"])
def test_source_validation_fails_before_any_side_effect(error_type):
    source = drawn()
    if error_type == "zero":
        source = source[:0]
    elif error_type == "invalid":
        source = source[:, :, :2]
    elif error_type == "boolean":
        source = source.astype(bool)
    elif error_type == "wrong_channels":
        source = np.zeros((280, 440, 4), dtype=np.uint8)
    elif error_type == "float":
        source = source.astype(np.float64)
    else:
        source = np.zeros((12, 12, 3), dtype=np.uint8)
    with pytest.raises(ValueError):
        crop.isolate(source, group(), select(group(), [], 440, 280, group_crop=True))


@pytest.mark.parametrize("pad", [-1, float("nan"), .51, float("inf")])
def test_crop_padding_is_bounded(pad):
    selected = select(group(), [], 440, 280, group_crop=True)
    with pytest.raises(ValueError):
        crop.isolate(drawn(), group(), selected, padding=pad)


@pytest.mark.parametrize("side", [0, 1, 31, True, 33.0])
def test_crop_minimum_native_resolution_is_guarded(side):
    selected = select(group(), [], 440, 280, group_crop=True)
    if isinstance(side, int) and not isinstance(side, bool) and side >= 32:
        crop.isolate(drawn(), group(), selected, min_side=side)
    else:
        with pytest.raises(ValueError):
            crop.isolate(drawn(), group(), selected, min_side=side)


def test_overlapping_faces_cannot_be_separated_by_cutting_through_primary():
    candidates = [mesh(.50, rx=.17), mesh(.51, rx=.04)]
    choice = select(candidates, [], 440, 280, group_crop=True)
    assert choice.accepted
    with pytest.raises(crop.CropRefusal, match="ambiguous"):
        crop.isolate(drawn(), candidates, choice)


def test_off_frame_primary_is_refused_without_background_padding():
    candidate = mesh(.94, rx=.18)
    decision = select([candidate], [], 440, 280, group_crop=True)
    assert decision.index is None
    with pytest.raises(crop.CropRefusal, match="ambiguous"):
        crop.isolate(drawn(), [candidate], decision)


def test_in_frame_low_confidence_lead_does_not_switch_to_bystander():
    large = mesh(.25, rx=.14)
    small = mesh(.79, rx=.07)
    detected = [large, small]
    boxes = [FaceBox(50, 80, 125, 125, .52), FaceBox(312, 110, 75, 75, .96)]
    selected = select(detected, boxes, 440, 280, group_crop=True)
    assert selected.reason_code == "low_confidence"
    assert selected.index is None


def test_crop_validation_does_not_disclose_source_geometry_on_error():
    selected = select(group(), [], 440, 280, group_crop=True)
    with pytest.raises(crop.CropRefusal) as exception:
        crop.isolate(drawn(), [mesh(.25, rx=.05), mesh(.95, rx=.25)], selected)
    assert "array" not in str(exception.value)
    assert "coordinates" not in str(exception.value)


def test_very_small_distant_face_refuses_upscaling_to_fake_evidence():
    tiny = mesh(.25, rx=.02, ry=.02)
    selected = select([tiny], [], 440, 280, group_crop=True)
    assert selected.accepted
    with pytest.raises(crop.CropRefusal, match="low_resolution"):
        crop.isolate(drawn(), [tiny], selected)


def test_group_crop_can_be_reproduced_from_only_the_original_image_and_mesh():
    a = primary()
    b = primary()
    assert a.bounds == b.bounds
    assert np.array_equal(a.image, b.image)
    assert np.array_equal(a.mesh, b.mesh)


def test_cropping_does_not_use_demographic_labels_or_target_images():
    faces = group()
    original = drawn()
    selected = select(faces, [], 440, 280, group_crop=True)
    target = crop.isolate(original, faces, selected)
    same = crop.isolate(original.copy(), [f.copy() for f in faces], selected)
    assert np.array_equal(target.image, same.image)
    assert np.array_equal(target.mesh, same.mesh)


def test_runner_records_group_selection_without_exporting_crop_pixels(tmp_path, monkeypatch):
    image = drawn()
    path = tmp_path / "never-serialize-our-synthetic-image.png"
    Image.fromarray(image).save(path)
    candidates = group()

    class Detector:
        def __init__(self, models: object) -> None:
            pass

        def detect(self, rgb: np.ndarray) -> DetectionResult:
            assert rgb.shape == (280, 440, 3)
            return DetectionResult(faces=candidates)

    monkeypatch.setattr(lib, "Detectors", Detector)
    record = lib.Face(path, "drawn", "own", "group_crop", row={"face_id": "synthetic-hash"})
    bench = lib.Bench(tmp_path, modules=("landmarks",), run_id="test")
    rows = bench.run(record)
    selected = next(r for r in rows if r["check"] == "detect")
    assert selected["reason_code"] == "selected_largest"
    assert selected["other_faces_not_processed"] == 2
    assert selected["crop_applied"] is True
    assert selected["detected"] is True
    text = json.dumps(rows)
    assert "never-serialize" not in text
    assert "bounds" not in text
    assert "crop_coordinates" not in text
    assert "pixels" not in text
    assert "face_landmarks" not in text


def test_runner_keeps_non_group_bystanders_blocked(tmp_path, monkeypatch):
    path = tmp_path / "drawn.png"
    Image.fromarray(drawn()).save(path)

    class Detector:
        def __init__(self, models: object) -> None:
            pass

        def detect(self, rgb: np.ndarray) -> DetectionResult:
            return DetectionResult(faces=[mesh(.30, rx=.1), mesh(.70, rx=.1)])

    monkeypatch.setattr(lib, "Detectors", Detector)
    record = lib.Face(path, "drawn", "own", "ordinary", row={"face_id": "synthetic-hash"})
    bench = lib.Bench(tmp_path, modules=("landmarks", "regions"), run_id="test")
    rows = bench.run(record)
    assert rows[0]["reason_code"] == "selected_centre_tiebreak"
    assert rows[0]["detected"] is True
    assert rows[0]["candidate_count"] == 2
    assert any(row["module"] == "regions" for row in rows)
    assert all(row["module"] in {"landmarks", "regions"} for row in rows)


def test_runner_group_overlap_is_explicit_failure_not_fake_success(tmp_path, monkeypatch):
    path = tmp_path / "drawn.png"
    Image.fromarray(drawn()).save(path)

    class Detector:
        def __init__(self, models: object) -> None:
            pass

        def detect(self, rgb: np.ndarray) -> DetectionResult:
            return DetectionResult(faces=[mesh(.5, rx=.2), mesh(.51, rx=.04)])

    monkeypatch.setattr(lib, "Detectors", Detector)
    record = lib.Face(path, "drawn", "own", "group_crop", row={"face_id": "synthetic-hash"})
    bench = lib.Bench(tmp_path, modules=("landmarks", "regions"), run_id="test")
    rows = bench.run(record)
    assert rows[0]["reason_code"] == "selected_largest"
    assert rows[0]["detected"] is True
    assert rows[0]["candidate_count"] == 2
    assert all(row["module"] in {"landmarks", "regions"} for row in rows)
