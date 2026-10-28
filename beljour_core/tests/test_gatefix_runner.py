"""Synthetic frozen-runner denominators and count-only recovery reporting.

All input images and annotations are fabricated in the temporary test folder.
Author: John Khan.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.vision.box_first import DetectionResult, FaceBox

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests" / "realface"))
import realface_lib as lib  # noqa: E402
import report as reporting  # noqa: E402


def synthetic_mesh(width: int = 400, height: int = 500) -> np.ndarray:
    coords = symmetric_face(float(width), float(height))
    points = np.zeros((478, 3), dtype=np.float64)
    points[:, :2] = coords / np.array([width, height])
    return points


def synthetic_image(width: int = 400, height: int = 500) -> np.ndarray:
    yy, xx = np.mgrid[:height, :width]
    return np.stack(((xx + 15) % 255, (yy * 2 + 20) % 255,
                     (xx // 2 + yy) % 255), axis=-1).astype(np.uint8)


def run_bench(tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
              result: DetectionResult, modules: tuple[str, ...]) -> list[dict[str, object]]:
    class Detector:
        def __init__(self, _models: Path) -> None:
            pass

        def detect(self, _rgb: np.ndarray) -> DetectionResult:
            return result

    monkeypatch.setattr(lib, "Detectors", Detector)
    path = tmp_path / "artificial-image.png"
    Image.fromarray(synthetic_image()).save(path)
    face = lib.Face(path, "synthetic", "own", "main",
                    row={"face_id": "artificial-case"})
    bench = lib.Bench(tmp_path, modules=modules, run_id="drawn-only")
    return bench.run(face)


def test_no_face_is_a_fail_with_coded_rows_for_each_required_module(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    expected = ("landmarks", "regions", "proportions", "warp_turn")
    detection = DetectionResult(reason_code="face_box_without_mesh",
                                boxes=[FaceBox(120, 40, 70, 90)],
                                attempts=[{"stage": "crop", "matched": False},
                                          {"stage": "tight_crop", "matched": False,
                                           "extra_call": True}])
    rows = run_bench(tmp_path, monkeypatch, detection, expected)
    assert len(rows) == len(expected)
    assert {row["module"] for row in rows} == set(expected)
    assert all(row["pass"] is False for row in rows)
    assert all(row["reason_code"] == "face_box_without_mesh" for row in rows)
    assert rows[0]["retry_stage_counts"] == {"crop": 1, "tight_crop": 1}
    assert rows[0]["faces"] == 0
    assert all(row.get("face_id") == "artificial-case" for row in rows)


def test_recovered_face_stays_one_preregistered_observation(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    meshes = [synthetic_mesh()]
    recovered = DetectionResult(
        faces=meshes, blendshapes=[{}], used_fallback=True,
        reason_code="recovered",
        attempts=[{"stage": "crop", "matched": False},
                  {"stage": "upscaled_crop", "matched": True, "extra_call": True}],
    )
    rows = run_bench(tmp_path, monkeypatch, recovered, ("landmarks", "proportions"))
    assert len([row for row in rows if row["module"] == "landmarks"
                and row["check"] == "detect"]) == 1
    assert rows[0]["faces"] == 1
    assert rows[0]["detected"] is True
    assert rows[0]["reason_code"] == "selected_largest"
    assert rows[0]["retry_stage_counts"] == {"crop": 1, "upscaled_crop": 1}
    assert len({row.get("face_id") for row in rows}) == 1
    assert not any(row["check"] == "dependency_missing" for row in rows)


def test_multi_face_runner_uses_one_subject_not_detector_face_zero(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    lead = synthetic_mesh()
    small = lead.copy()
    small[:, 0] = (small[:, 0] - 0.5) * 0.30 + 0.81
    small[:, 1] = (small[:, 1] - 0.5) * 0.30 + 0.50
    lead[:, 0] = (lead[:, 0] - 0.5) * 0.70 + 0.30
    lead[:, 1] = (lead[:, 1] - 0.5) * 0.70 + 0.50
    detection = DetectionResult(faces=[small, lead], blendshapes=[{}, {}])
    rows = run_bench(tmp_path, monkeypatch, detection, ("landmarks",))
    assert rows[0]["faces"] == 2
    assert rows[0]["reason_code"] == "selected_largest"
    assert rows[0]["candidate_count"] == 2
    assert rows[0]["detected"] is True
    assert len([row for row in rows if row["check"] == "detect"]) == 1


def test_stage_counts_are_aggregate_and_safe_for_reports() -> None:
    rows = [
        {"module": "landmarks", "check": "detect", "retry_stage_counts":
         {"crop": 2, "rotated_crop": 3}},
        {"module": "landmarks", "check": "detect", "retry_stage_counts":
         {"crop": 1, "rotated_crop": 1, "scaled_full_image": 2}},
        {"module": "proportions", "check": "golden_ratios", "retry_stage_counts":
         {"crop": 99}},
    ]
    assert reporting.stage_counts(rows) == {
        "crop": 3, "rotated_crop": 4, "scaled_full_image": 2,
    }
    text = json.dumps(reporting.stage_counts(rows))
    assert "image_path" not in text
    assert "path" not in text
    assert "identity" not in text


def test_out_of_frame_mesh_is_not_clamped_into_success(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    clipped = synthetic_mesh()
    clipped[:96, 0] = 1.03
    result = DetectionResult(faces=[clipped], reason_code="mesh_out_of_frame")
    rows = run_bench(tmp_path, monkeypatch, result, ("landmarks", "regions"))
    assert rows[0]["detected"] is False
    assert rows[0]["reason_code"] == "mesh_out_of_frame"
    assert any(row["module"] == "regions" and row["pass"] is False for row in rows)


def test_preregistered_reference_categories_are_not_inferred_from_colours(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    result = DetectionResult(reason_code="no_face")
    rows = run_bench(tmp_path, monkeypatch, result, ("landmarks", "regions"))
    assert rows[0]["reason_code"] == "no_face"
    assert rows[1]["reason_code"] == "no_face"
    assert rows[0].get("monk", "unknown") in ("", "unknown")
    assert rows[0].get("yaw", "unknown") in ("unknown", "")
