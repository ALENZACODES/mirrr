"""C16 item (a), ported to the current mesh-recovery ladder (vision/mesh_recovery.py).

Pass definition: a box whose first crops return no mesh gets at most 12 extra
mesh calls (24 per photo); a mesh found on a rotated, upscaled, grey-padded,
contrast-prepared or 2x input is mapped back onto the photo, associates with
its box and records the stage that found it; the fixed rotation nearest the
YuNet eye roll is tried first; a face matched on its first crop makes no extra
call and is deterministic; a mesh partly outside the photo is never clipped
and never accepted; a photo with no face returns a reason code. Drawn images
and fake detector sources only. The C16 originals (opt-in ladder, recover_*
stage names) are kept at commit 4c97dad. Author: John Khan.
"""
from __future__ import annotations

import math
import sys
import time
from pathlib import Path
from typing import Any

import numpy as np
import pytest
from gatefix_drawing import (
    FakeMeshes,
    boxes_for,
    draw_face,
    ellipse_mesh,
    enclosed,
    head_box,
    level_and_upright,
)

from plumb_api.vision import box_first as bf
from plumb_api.vision import mesh_recovery as mr
from plumb_api.vision import recovery_policy as rp

REALFACE = Path(__file__).resolve().parents[3] / "tests" / "realface"


def detector(boxes: list[list[float]], meshes: FakeMeshes) -> bf.BoxFirstDetector:
    return bf.BoxFirstDetector(boxes_for(*boxes), meshes)


def extra_rows(result: bf.DetectionResult) -> list[dict[str, object]]:
    return [row for row in result.attempts if row.get("extra_call")]


def first_pass_failed(result: bf.DetectionResult) -> bool:
    first = [row for row in result.attempts if not row.get("extra_call")]
    return bool(first) and not any(row["matched"] for row in first)


def assert_on_head(result: bf.DetectionResult, box: list[float], width: int, height: int) -> None:
    assert len(result.faces) == 1
    target = bf.FaceBox(box[0], box[1], box[2], box[3])
    assert bf.associated(result.faces[0], target, width, height) >= 0.6
    assert result.reason_code == "recovered"
    assert mr.frame_share(result.faces[0]) >= mr.MIN_FRAME_SHARE


def matched_stage(result: bf.DetectionResult) -> dict[str, object]:
    matched = [row for row in extra_rows(result) if row["matched"]]
    assert len(matched) == 1
    return matched[0]


def yunet_row(cx: float, cy: float, rx: float, ry: float, angle: float, half: float) -> list[float]:
    """A 15-column YuNet row whose eye points follow the drawn head's roll."""
    cos, sin = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    eyes = []
    for u in (-0.4 * rx, 0.4 * rx):
        v = -0.25 * ry
        eyes.append((cx + u * cos + v * sin, cy - u * sin + v * cos))
    return [cx - half, cy - half, 2 * half, 2 * half, *eyes[0], *eyes[1], *([0.0] * 6), 0.93]


@pytest.mark.parametrize("turn,levelling", ((90.0, -90.0), (-90.0, 90.0)))
def test_rotated_face_is_recovered_by_a_fixed_angle_and_mapped_back(
        turn: float, levelling: float) -> None:
    # A head lying on either side, with the YuNet eye points every real box carries.
    image = draw_face(240, 240, 120, 120, 40, 52, angle=turn)
    row = yunet_row(120, 120, 40, 52, turn, 52)
    result = detector([row], FakeMeshes(level_and_upright)).detect(image)
    assert first_pass_failed(result)
    assert_on_head(result, row, 240, 240)
    found = matched_stage(result)
    assert found["stage"] == "rotated_crop"
    assert found["angle"] == levelling
    # The levelling turn is the first rotation tried, well inside the 12-call box budget.
    rotations = [r for r in extra_rows(result) if r["stage"] == "rotated_crop"]
    assert rotations[0] is found and len(extra_rows(result)) <= 4


def test_eye_roll_from_the_box_points_orders_the_fixed_angles() -> None:
    angle, cx, cy, rx, ry = 37.0, 130.0, 120.0, 44.0, 56.0
    row = yunet_row(cx, cy, rx, ry, angle, 62)
    box = bf.prepare_boxes([row], 260, 250)[0]
    # Eye line measured at -37 degrees (y down): the nearest levelling turn is -30.
    assert mr.angles(box)[:2] == (-30.0, -15.0)
    image = draw_face(250, 260, cx, cy, rx, ry, angle=angle)
    result = detector([row], FakeMeshes(level_and_upright)).detect(image)
    rotations = [r for r in extra_rows(result) if r["stage"] == "rotated_crop"]
    assert rotations[0]["angle"] == -30.0
    # A head rolled by 30 degrees is levelled by the first rotation tried.
    level = yunet_row(cx, cy, rx, ry, 30.0, 62)
    found = detector([level], FakeMeshes(level_and_upright)).detect(
        draw_face(250, 260, cx, cy, rx, ry, angle=30.0))
    assert_on_head(found, level, 260, 250)
    first = [r for r in extra_rows(found) if r["stage"] == "rotated_crop"][0]
    assert first["angle"] == -30.0 and first["matched"]


def test_small_face_is_recovered_by_an_upscaled_crop() -> None:
    image = draw_face(200, 200, 100, 100, 30, 38)
    box = head_box(100, 100, 30, 38)
    meshes = FakeMeshes(lambda patch: min(patch.shape[:2]) >= 400)
    result = detector([box], meshes).detect(image)
    assert first_pass_failed(result)
    assert_on_head(result, box, 200, 200)
    # The first crop is rendered at 256; every recovery crop is enlarged within the cap.
    assert meshes.calls[0] == (256, 256, 3)
    assert max(max(call[:2]) for call in meshes.calls) <= mr.MAX_INPUT_SIDE
    assert min(meshes.calls[len(result.attempts) - 1][:2]) >= 400


def test_edge_face_is_recovered_by_a_grey_padded_crop() -> None:
    image = draw_face(200, 220, 22, 100, 40, 52)
    box = [0.0, 48.0, 62.0, 104.0, 0.92]
    result = detector([box], FakeMeshes(enclosed)).detect(image)
    assert len(result.faces) == 1
    found = matched_stage(result)
    assert found["stage"] == "padded_crop"
    assert found["pad"] == "grey"
    # The mesh covers the visible head; the padded border did not invent face area.
    assert result.faces[0][:, 0].min() > -0.02


def faded_contrast(patch: np.ndarray) -> bool:
    return float(patch.mean(axis=2).std()) >= 5.5


def test_faded_face_is_recovered_by_the_luminance_clahe_copy() -> None:
    image = draw_face(220, 220, 110, 110, 48, 60, skin=(150, 128, 112), ground=(128, 128, 128))
    assert not faded_contrast(image)
    box = head_box(110, 110, 48, 60)
    result = detector([box], FakeMeshes(faded_contrast)).detect(image)
    assert_on_head(result, box, 220, 220)
    assert matched_stage(result)["stage"] == "contrast_crop"


def test_missed_face_is_recovered_by_the_2x_full_image_pass() -> None:
    image = draw_face(120, 160, 80, 60, 26, 33)
    box = head_box(80, 60, 26, 33)
    result = detector([box], FakeMeshes(lambda p: p.shape[:2] == (240, 320))).detect(image)
    assert_on_head(result, box, 160, 120)
    found = matched_stage(result)
    assert found["stage"] == "scaled_full_image"
    assert found["scale"] == 2.0


def ladders(result: bf.DetectionResult) -> list[list[dict[str, object]]]:
    """Split extra calls into per-box ladders; each box's ladder opens with its tight crop."""
    groups: list[list[dict[str, object]]] = []
    for row in extra_rows(result):
        if row["stage"] == "tight_crop" or not groups:
            groups.append([])
        groups[-1].append(row)
    return groups


def test_ladder_respects_the_per_box_and_per_photo_budgets() -> None:
    image = draw_face(400, 600, 300, 200, 30, 38)
    boxes = [head_box(70 + 150 * i, 200, 30, 38, 0.9) for i in range(4)]
    meshes = FakeMeshes(lambda _: False)
    result = detector(boxes, meshes).detect(image)
    assert not result.faces
    assert result.reason_code == "face_box_without_mesh"
    # The detector's live ceilings are the frozen 12/24 contract of recovery_policy.
    assert (mr.MAX_EXTRA_PER_BOX, mr.MAX_EXTRA_PER_PHOTO) == (rp.MAX_BOX_CALLS,
                                                             rp.MAX_PHOTO_CALLS) == (12, 24)
    calls = extra_rows(result)
    assert len(calls) == mr.MAX_EXTRA_PER_PHOTO
    assert len(meshes.calls) == 4 * 2 + 1 + len(calls)
    per_box = [len(group) for group in ladders(result)]
    assert per_box == [mr.MAX_EXTRA_PER_BOX, mr.MAX_EXTRA_PER_BOX]
    # Several failing boxes still get the 0.5x and 2x full-image pass.
    assert [r["scale"] for r in calls if r["stage"] == "scaled_full_image"][:2] == [0.5, 2.0]


def test_single_box_never_exceeds_twelve_extra_calls() -> None:
    image = draw_face(240, 240, 120, 120, 40, 52)
    meshes = FakeMeshes(lambda _: False)
    result = detector([head_box(10, 10, 9, 9, 0.9)], meshes).detect(image)
    assert len(extra_rows(result)) <= mr.MAX_EXTRA_PER_BOX


def comparable(result: bf.DetectionResult) -> dict[str, Any]:
    return {"faces": [f.tobytes() for f in result.faces], "blend": result.blendshapes,
            "boxes": result.boxes, "attempts": result.attempts,
            "fallback": result.used_fallback, "reason": result.reason_code}


def test_first_try_face_makes_no_extra_call_and_is_deterministic() -> None:
    image = draw_face(240, 240, 120, 120, 40, 52)
    box = head_box(120, 120, 40, 52)
    first, second = FakeMeshes(), FakeMeshes()
    before = detector([box], first).detect(image)
    after = detector([box], second).detect(image)
    assert comparable(before) == comparable(after)
    assert first.calls == second.calls == [(256, 256, 3)]
    assert not extra_rows(before) and not before.used_fallback
    assert before.reason_code == "detected"


def test_ladder_adds_no_time_for_first_try_faces() -> None:
    image = draw_face(320, 320, 160, 160, 50, 64)
    box = head_box(160, 160, 50, 64)
    plan = bf.crop_plan(bf.prepare_boxes([box], 320, 320)[0])

    def first_crop_only() -> None:
        raw, _ = FakeMeshes()(bf.crop_rgb(image, plan))
        plan.restore(raw[0], 320, 320)

    def seconds(work: Any) -> float:
        start = time.perf_counter()
        for _ in range(30):
            work()
        return time.perf_counter() - start

    engine = detector([box], FakeMeshes())
    seconds(lambda: engine.detect(image))
    baseline = min(seconds(first_crop_only) for _ in range(3))
    full = min(seconds(lambda: engine.detect(image)) for _ in range(3))
    # Same single mesh call (proved exactly above); the clock only guards against hidden work.
    assert full <= baseline * 1.5 + 0.05


def test_out_of_frame_mesh_is_restored_honestly_and_not_accepted() -> None:
    image = draw_face(200, 200, 30, 100, 40, 52)
    box = bf.FaceBox(0.0, 48.0, 70.0, 104.0, 0.9)
    trial = mr.crop_trial(image, box, 1.6, stage="normal_crop")
    restored = trial.restore(ellipse_mesh(0.22, 0.5, 0.3, 0.32), 200, 200, bf.valid_mesh)
    assert restored[:, 0].min() < 0, "points outside the photo are not clamped"
    assert mr.frame_share(restored) < mr.MIN_FRAME_SHARE

    def outside(patch: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        return [ellipse_mesh(0.22, 0.5, 0.3, 0.32)], [{}]

    result = bf.BoxFirstDetector(boxes_for([0.0, 48.0, 70.0, 104.0, 0.9]), outside).detect(image)
    assert result.faces == []
    assert result.reason_code == "mesh_out_of_frame"
    assert any(row.get("out_of_frame") for row in extra_rows(result))


def test_photo_without_a_face_returns_a_typed_no_face_result() -> None:
    blank = np.full((160, 200, 3), 96, dtype=np.uint8)
    result = detector([], FakeMeshes()).detect(blank)
    assert result.faces == []
    assert result.reason_code == "no_face"
    assert {str(r["stage"]) for r in extra_rows(result)} == {"scaled_full_image"}
    assert [r["scale"] for r in extra_rows(result)] == [0.5, 2.0]
    low = detector([[20, 20, 40, 40, 0.4]], FakeMeshes()).detect(blank)
    assert low.reason_code == "low_confidence"
    boxed = detector([[20, 20, 40, 40, 0.9]], FakeMeshes()).detect(blank)
    assert boxed.reason_code == "face_box_without_mesh"


RETIRE_BUDGET_CEILING = (
    "Retire: checks the C16 Budget(per_box=, per_photo=) ceiling arguments, which main's "
    "mesh_recovery.Budget does not have (its ceilings are module constants). The guarantee "
    "is held by tests/test_recovery_policy_a.py::test_budget_configuration_cannot_exceed_"
    "frozen_contract, tests/test_gatefix_mesh_recovery.py::test_budget_binds_at_every_boundary "
    "and the constant check in test_ladder_respects_the_per_box_and_per_photo_budgets above.")


@pytest.mark.skip(reason=RETIRE_BUDGET_CEILING)
def test_budget_object_refuses_a_larger_ceiling() -> None:
    with pytest.raises(ValueError, match="budget"):
        mr.Budget(per_box=13)
    with pytest.raises(ValueError, match="budget"):
        mr.Budget(per_photo=25)  # type: ignore[call-arg]


def test_rotation_round_trip_is_exact_for_mesh_points() -> None:
    image = draw_face(240, 240, 120, 120, 40, 52)
    box = bf.FaceBox(70.0, 60.0, 100.0, 120.0, 0.9)
    plain = mr.crop_trial(image, box, 1.6, stage="normal_crop")
    points = ellipse_mesh(0.4, 0.55, 0.2, 0.25)
    expected = plain.restore(points, 240, 240, bf.valid_mesh)
    size = plain.image.shape[0]
    for angle in (15.0, -30.0, 90.0, 180.0, -37.5):
        rotated = mr.rotate_trial(plain, angle)
        assert rotated.inverse is not None
        forward = np.vstack([rotated.inverse, [0.0, 0.0, 1.0]])
        forward = np.linalg.inv(forward)[:2]
        pixels = points[:, :2] * size
        moved = points.copy()
        moved[:, :2] = (pixels @ forward[:, :2].T + forward[:, 2]) / size
        np.testing.assert_allclose(rotated.restore(moved, 240, 240, bf.valid_mesh), expected, atol=1e-9)


def test_stage_counts_report_numbers_only() -> None:
    attempts: list[dict[str, object]] = [
        {"stage": "crop", "matched": False, "margin": 1.6},
        {"stage": "tight_crop", "matched": False, "extra_call": True, "raw_meshes": 1,
         "invalid_meshes": 0, "box": [1.0, 2.0, 3.0, 4.0]},
        {"stage": "rotated_crop", "matched": True, "extra_call": True, "angle": 15.0,
         "raw_meshes": 1, "invalid_meshes": 0, "confidence": 0.8}]
    assert mr.attempt_counts(attempts) == {"crop": 1, "rotated_crop": 1, "tight_crop": 1}
    summary = rp.summarize_attempts(attempts[1:])
    assert summary == {"attempt_count": 2, "matched_attempts": 1, "raw_meshes": 2,
                       "invalid_meshes": 0, "stages": {"rotated_crop": 1, "tight_crop": 1}}


class _NoFaceDetector:
    def detect(self, image: np.ndarray) -> bf.DetectionResult:
        result = bf.DetectionResult()
        result.attempts.append({"stage": "scaled_full_image", "matched": False, "extra_call": True})
        result.reason_code = "no_face"
        return result


def test_bench_rows_for_a_photo_with_no_mesh_carry_the_reason_code(tmp_path: Path) -> None:
    from PIL import Image

    if str(REALFACE) not in sys.path:
        sys.path.insert(0, str(REALFACE))
    import realface_lib as lib

    path = tmp_path / "drawn.png"
    Image.fromarray(np.full((64, 64, 3), 96, dtype=np.uint8)).save(path)
    bench: Any = object.__new__(lib.Bench)
    bench.det, bench.modules, bench.definitions = _NoFaceDetector(), ("landmarks", "regions"), {}
    bench.run_id, bench.quality_metrics, bench.landmark_self_check = "run", (), False
    rows = bench.run(lib.Face(path, "drawn", "CC0", "main"))
    detect = next(r for r in rows if r["check"] == "detect")
    missing = next(r for r in rows if r["module"] == "regions")
    assert detect["pass"] is False
    assert detect["reason_code"] == "no_face"
    assert detect["retry_stage_counts"] == {"scaled_full_image": 1}
    assert missing["check"] == "dependency_missing"
    assert missing["reason_code"] == "no_face"


def test_duplicate_recovered_mesh_is_not_counted_as_matched() -> None:
    image = draw_face(200, 200, 100, 100, 40, 52)
    box = bf.FaceBox(60.0, 48.0, 80.0, 104.0, 0.9)
    result = bf.DetectionResult(boxes=[box])
    result.faces.append(ellipse_mesh(0.5, 0.5, 0.2, 0.26))
    result.blendshapes.append({})
    trial = mr.crop_trial(image, box, 1.3, stage="tight_crop")
    success, _ = mr._try(trial, FakeMeshes(), result, (box,), 200, 200, mr.Budget(),
                         bf.associated, bf.mesh_box, bf.overlap, bf.valid_mesh, 6)
    assert not success
    assert result.attempts[-1]["matched"] is False
    assert len(result.faces) == len(result.blendshapes) == 1


def test_huge_box_keeps_recovery_crops_inside_the_budget() -> None:
    image = draw_face(64, 64, 32, 32, 12, 16)
    box = bf.FaceBox(0.0, 0.0, 13000.0, 13000.0, 0.9)
    wide = mr.crop_trial(image, box, 2.6, stage="wide_crop")
    assert wide.side == 32768.0
    assert wide.image.shape == (512, 512, 3)
    trials = mr._box_trials(image, box, [box])
    assert all(max(t.image.shape[:2]) <= mr.MAX_INPUT_SIDE for t in trials)
