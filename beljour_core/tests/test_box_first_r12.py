"""R12 box-first contracts using injected fake detectors and drawn RGB arrays.

Pass definition: YuNet boxes precede bounded crops; mesh/depth coordinates restore
without crop-offset loss; every accepted mesh belongs to its target box; retries
are bounded, fallbacks explicit, malformed meshes never count as detections.
No live runtime, model, network, identity classifier or real face is used.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.vision import box_first as bf


def photo(height: int = 80, width: int = 120) -> np.ndarray:
    yy, xx = np.mgrid[:height, :width]
    return np.stack(((xx * 3) % 256, (yy * 5) % 256, (xx + yy) % 256), -1).astype(np.uint8)


def mesh(cx: float = 0.5, cy: float = 0.5, rx: float = 0.25, ry: float = 0.28) -> np.ndarray:
    angles = np.arange(478) * (2 * np.pi / 478)
    return np.stack((cx + rx * np.cos(angles), cy + ry * np.sin(angles), 0.05 * np.cos(angles)), -1)


def detector(responses: list[tuple[list[np.ndarray], list[dict]]], boxes: list[list[float]] | None = None):
    calls = []
    def boxes_fn(image):
        calls.append(("box", image.shape))
        return [[40, 20, 30, 35, 0.95]] if boxes is None else boxes
    def mesh_fn(image):
        calls.append(("mesh", image.shape))
        return responses.pop(0) if responses else ([], [])
    return bf.BoxFirstDetector(boxes_fn, mesh_fn), calls


def test_box_is_detected_before_a_bounded_square_mesh_crop() -> None:
    engine, calls = detector([([mesh()], [{"smile": 0.3}])])
    result = engine.detect(photo())
    assert calls == [("box", (80, 120, 3)), ("mesh", (256, 256, 3))]
    assert len(result.faces) == 1
    assert result.blendshapes == [{"smile": 0.3}]
    assert not result.used_fallback
    assert result.attempts[0]["matched"]
    assert result.attempts[0]["margin"] == 1.6
    assert bf.associated(result.faces[0], result.boxes[0], 120, 80) >= 0.15


def test_square_crop_restores_x_y_and_width_normalized_depth() -> None:
    plan = bf.Crop(-12, 8, 96, 256)
    raw = mesh()
    result = plan.restore(raw, 200, 100)
    np.testing.assert_allclose(result[:, 0], (raw[:, 0] * 96 - 12) / 200)
    np.testing.assert_allclose(result[:, 1], (raw[:, 1] * 96 + 8) / 100)
    np.testing.assert_allclose(result[:, 2], raw[:, 2] * 96 / 200)
    np.testing.assert_array_equal(raw, mesh())


def test_offset_padding_is_not_lost_or_clamped_in_restored_mesh() -> None:
    raw = mesh(cx=0.1, cy=0.1)
    restored = bf.Crop(-40, -30, 80, 256).restore(raw, 100, 100)
    assert restored[:, 0].min() < 0
    assert restored[:, 1].min() < 0
    assert restored[:, 0].max() < 0.1


def test_retry_uses_wider_crop_only_for_a_missing_target() -> None:
    engine, calls = detector([([], []), ([mesh()], [{}])])
    result = engine.detect(photo())
    assert len(calls) == 3
    assert [row["margin"] for row in result.attempts] == [1.6, 2.0]
    assert len(result.faces) == 1
    assert not result.used_fallback


def test_full_image_fallback_is_explicit_after_two_unmatched_crops() -> None:
    full = mesh(cx=55 / 120, cy=37.5 / 80, rx=12 / 120, ry=14 / 80)
    engine, calls = detector([([], []), ([], []), ([full], [{"jaw": 0.1}])])
    result = engine.detect(photo())
    assert len(calls) == 4
    assert calls[-1] == ("mesh", (80, 120, 3))
    assert result.used_fallback
    assert result.attempts[-1]["stage"] == "full_image_fallback"
    assert result.attempts[-1]["matched"]
    np.testing.assert_array_equal(result.faces[0], full)


def test_no_box_fallback_keeps_its_separate_provenance() -> None:
    engine, calls = detector([([mesh()], [{}])], boxes=[])
    result = engine.detect(photo())
    assert calls[1] == ("mesh", (80, 120, 3))
    assert result.used_fallback
    assert result.boxes == []
    assert len(result.faces) == 1
    assert len(result.attempts) == 1


def test_wrong_person_inside_a_crop_does_not_satisfy_the_box() -> None:
    wrong = mesh(cx=0.04, cy=0.08, rx=0.025, ry=0.025)
    engine, _ = detector([([wrong], [{}]), ([mesh()], [{"selected": 1}])])
    result = engine.detect(photo())
    assert not result.attempts[0]["matched"]
    assert result.attempts[1]["matched"]
    assert result.blendshapes == [{"selected": 1}]


def test_best_matching_mesh_wins_instead_of_first_found_face() -> None:
    wrong = mesh(cx=0.04, cy=0.08, rx=0.025, ry=0.025)
    engine, _ = detector([([wrong, mesh()], [{"selected": 0}, {"selected": 1}])])
    result = engine.detect(photo())
    assert len(result.faces) == 1
    assert result.blendshapes == [{"selected": 1}]
    assert result.attempts[0]["raw_meshes"] == 2


def test_bad_meshes_count_as_invalid_and_cannot_make_a_pass() -> None:
    bad = mesh(); bad[50, 2] = np.nan
    empty = np.zeros((478, 3))
    engine, _ = detector([([bad, empty, mesh()[:468]], []), ([], []), ([], [])])
    result = engine.detect(photo())
    assert not result.faces
    assert result.attempts[0]["invalid_meshes"] == 3
    assert not result.attempts[0]["matched"]
    assert result.used_fallback
    calls = [item for item in result.attempts if item.get("extra_call")]
    assert len(calls) <= 24
    assert all(not item["matched"] for item in calls)


def test_group_boxes_each_get_their_own_mesh_crop() -> None:
    boxes = [[5, 15, 20, 30, 0.95], [80, 20, 25, 35, 0.9]]
    engine, calls = detector([([mesh()], [{"id": 1}]), ([mesh()], [{"id": 2}])], boxes)
    result = engine.detect(photo())
    assert len(result.faces) == 2
    assert len(calls) == 3
    assert result.blendshapes == [{"id": 1}, {"id": 2}]
    assert bf.associated(result.faces[0], result.boxes[0], 120, 80) > 0.15
    assert bf.associated(result.faces[1], result.boxes[1], 120, 80) > 0.15
    assert bf.associated(result.faces[0], result.boxes[1], 120, 80) == 0


def test_fallback_deduplicates_and_respects_max_faces() -> None:
    faces = [mesh(cx=0.08 + 0.12 * i, cy=0.5, rx=0.04, ry=0.07) for i in range(8)]
    engine, _ = detector([([faces[0], faces[0], *faces[1:]], [])], boxes=[])
    result = engine.detect(photo())
    assert len(result.faces) == 6
    assert len(result.blendshapes) == 6
    for i, a in enumerate(result.faces):
        for b in result.faces[i + 1:]:
            assert bf.overlap(bf.mesh_box(a, 120, 80), bf.mesh_box(b, 120, 80)) <= 0.6


def test_nms_orders_by_score_and_accepts_opencv_fifteen_column_rows() -> None:
    yunet = [10, 10, 30, 30, *([0.0] * 10), 0.97]
    found = bf.prepare_boxes([[12, 12, 30, 30, 0.8], [80, 20, 25, 25, 0.9], yunet], 120, 80)
    assert len(found) == 2
    assert found[0].score == 0.97
    assert found[0].x == 10
    assert found[1].score == 0.9


def test_box_cleanup_clips_to_frame_and_rejects_invalid_rows() -> None:
    rows = [[-5, -3, 20, 20], [500, 500, 20, 20], [2, 2, -3, 20],
            [0, 0, 1, 1], [0, 0, 20, 20, 0.5], [0, 0, 20, np.inf], ["wrong"], []]
    result = bf.prepare_boxes(rows, 120, 80)
    assert result == [bf.FaceBox(0, 0, 15, 17)]


def test_nms_tie_order_is_stable_independent_of_input_order() -> None:
    rows = [[70, 30, 20, 20, 0.9], [10, 10, 20, 20, 0.9], [40, 10, 20, 20, 0.9]]
    a = bf.prepare_boxes(rows, 120, 80)
    b = bf.prepare_boxes(list(reversed(rows)), 120, 80)
    assert a == b
    assert [item.x for item in a] == [10, 40, 70]


def test_crop_sampling_uses_edge_replication_and_half_pixel_alignment() -> None:
    source = np.array([[[0, 10, 30], [200, 110, 70]], [[100, 210, 90], [240, 250, 130]]], np.uint8)
    result = bf.crop_rgb(source, bf.Crop(0, 0, 2, 32))
    np.testing.assert_array_equal(result[0, 0], source[0, 0])
    np.testing.assert_array_equal(result[-1, -1], source[-1, -1])
    x = (12.5 * 2 / 32) - 0.5
    y = (17.5 * 2 / 32) - 0.5
    expected = np.rint(source[0, 0] * (1 - x) * (1 - y) + source[0, 1] * x * (1 - y) +
                       source[1, 0] * (1 - x) * y + source[1, 1] * x * y).astype(np.uint8)
    np.testing.assert_array_equal(result[17, 12], expected)
    padded = bf.crop_rgb(source, bf.Crop(-10, -10, 22, 32))
    np.testing.assert_array_equal(padded[0, 0], source[0, 0])
    np.testing.assert_array_equal(padded[-1, -1], source[-1, -1])


def test_large_crop_allocates_only_the_bounded_output_grid(monkeypatch) -> None:
    original = bf.np.arange
    def bounded(stop, *args, **kwargs):
        assert stop <= 1024, "crop must not construct a full-side sampling grid"
        return original(stop, *args, **kwargs)
    monkeypatch.setattr(bf.np, "arange", bounded)
    result = bf.crop_rgb(np.full((2, 2, 3), 47, np.uint8), bf.Crop(-16000, -16000, 32768, 32))
    assert result.shape == (32, 32, 3)
    assert result.flags.c_contiguous
    assert np.all(result == 47)


def test_crop_resolution_and_margin_stay_within_written_budgets() -> None:
    tiny = bf.crop_plan(bf.FaceBox(1, 1, 3, 4))
    assert tiny.output_size == 256
    assert tiny.side == 7
    large = bf.crop_plan(bf.FaceBox(0, 0, 10000, 8000), margin=2)
    assert large.output_size == 512
    assert large.side == 20000
    with pytest.raises(ValueError, match="memory"):
        bf.crop_plan(bf.FaceBox(0, 0, 20000, 20000), margin=2)


@pytest.mark.parametrize("pixels,expected", ((None, "unknown"), (0, "unknown"), (float("nan"), "unknown"),
    (63.99, "small_lt64"), (64, "medium_64_127"), (127.99, "medium_64_127"), (128, "large_ge128")))
def test_face_size_slices_have_no_boundary_gaps(pixels, expected) -> None:
    assert bf.size_slice(pixels) == expected


@pytest.mark.parametrize("yaw,expected", ((None, "unknown"), (float("nan"), "unknown"), (-15, "frontal"),
    (15, "frontal"), (15.01, "angled"), (-44.99, "angled"), (45, "side"), (74.99, "side"), (75, "profile")))
def test_yaw_slices_keep_frontal_and_side_on_denominators_separate(yaw, expected) -> None:
    assert bf.yaw_slice(yaw) == expected


@pytest.mark.parametrize("limit", (0, 7, 1.5, True))
def test_face_count_limit_rejects_invalid_values(limit) -> None:
    with pytest.raises(ValueError, match="face limit"):
        bf.BoxFirstDetector(lambda _: [], lambda _: ([], []), max_faces=limit)
    with pytest.raises(ValueError, match="face limit"):
        bf.prepare_boxes([], 120, 80, limit=limit)


@pytest.mark.parametrize("values", ((0, 0, 1, 256), (0, 0, 32769, 256), (0, 0, 10, 31), (0, 0, 10, 1025), (0.5, 0, 10, 256)))
def test_direct_crop_construction_cannot_bypass_budgets(values) -> None:
    with pytest.raises(ValueError, match="crop"):
        bf.Crop(*values)


def test_invalid_rgb_inputs_fail_before_detector_callbacks() -> None:
    engine, calls = detector([])
    for source in (np.zeros((8, 8), np.uint8), np.zeros((8, 8, 4), np.uint8), np.zeros((8, 8, 3), float)):
        with pytest.raises(ValueError, match="uint8 RGB"):
            engine.detect(source)
    assert not calls
