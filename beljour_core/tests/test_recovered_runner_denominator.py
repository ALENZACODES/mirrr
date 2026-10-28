"""A recovered face is still one frozen observation, never one new face per crop."""
from __future__ import annotations

import sys
from importlib import import_module
from pathlib import Path

import numpy as np
from PIL import Image

from plumb_api.vision.box_first import DetectionResult

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests" / "realface"))
lib = import_module("realface_lib")


def mesh() -> np.ndarray:
    theta = np.linspace(0, 2 * np.pi, 478, endpoint=False)
    points = np.column_stack((.5 + .18 * np.cos(theta), .5 + .2 * np.sin(theta), np.zeros_like(theta)))
    points[468, :2] = [.44, .46]
    points[473, :2] = [.56, .46]
    return points


def test_runner_counts_recovered_primary_in_same_fixed_denominator(tmp_path, monkeypatch) -> None:
    image = tmp_path / "drawn.png"
    Image.fromarray(np.zeros((256, 256, 3), dtype=np.uint8)).save(image)
    result = DetectionResult(faces=[mesh()], used_fallback=True,
                             attempts=[{"stage": "upscaled_centre", "matched": True, "recovered_faces": 1}])

    class Detector:
        def __init__(self, models: Path) -> None:
            self.models = models

        def detect(self, frame: np.ndarray) -> DetectionResult:
            assert frame.shape[:2] == (256, 256)
            return result

    monkeypatch.setattr(lib, "Detectors", Detector)
    bench = lib.Bench(tmp_path, modules=("landmarks", "posture"), run_id="frozen-crop")
    face = lib.Face(image, "synthetic", "own", "ordinary", row={"face_id": "one-frozen-face"})
    rows = bench.run(face)
    detect = next(item for item in rows if item["module"] == "landmarks" and item["check"] == "detect")
    assert detect["detected"] is True
    assert detect["used_fallback"] is True
    assert detect["crop_attempts"] == 1
    assert detect["faces"] == 1
    assert len({row["face_id"] for row in rows}) == 1
    assert len({row["run_id"] for row in rows}) == 1
    assert next(item for item in rows if item["module"] == "posture")["pass"] is False


def test_no_mesh_is_counted_as_failed_face_without_synthetic_success(tmp_path, monkeypatch) -> None:
    image = tmp_path / "empty.png"
    Image.fromarray(np.zeros((256, 256, 3), dtype=np.uint8)).save(image)

    class Detector:
        def __init__(self, models: Path) -> None:
            pass

        def detect(self, frame: np.ndarray) -> DetectionResult:
            return DetectionResult()

    monkeypatch.setattr(lib, "Detectors", Detector)
    bench = lib.Bench(tmp_path, modules=("landmarks", "proportions", "warp_turn"),
                      run_id="frozen-no-face")
    rows = bench.run(lib.Face(image, "synthetic", "own", "ordinary", row={"face_id": "one-frozen-face"}))
    assert sum(row["module"] == "landmarks" and row["check"] == "detect" for row in rows) == 1
    for module in ("proportions", "warp_turn"):
        assert any(row["module"] == module and row["check"] == "dependency_missing"
                   and row["pass"] is False for row in rows)
    assert len({row["face_id"] for row in rows}) == 1


def test_count_only_recovery_audit_reports_no_extra_observation() -> None:
    recovery_audit = import_module("face_recovery")
    reported = DetectionResult(
        faces=[mesh()],
        used_fallback=True,
        attempts=[{"stage": "upscaled_centre", "matched": True}],
    )
    result, audit = recovery_audit.recover(object(), np.zeros((32, 32, 3), dtype=np.uint8), reported)
    assert result is reported
    assert audit.counts() == {
        "detected": True,
        "recovered_meshes": 0,
        "retry_attempts": 0,
        "reason_code": "recovered",
        "candidate_count": 1,
    }
    assert all("face_id" not in key for key in audit.counts())


def test_count_only_recovery_audit_missing_face_is_not_a_pass() -> None:
    recovery_audit = import_module("face_recovery")
    empty = DetectionResult(faces=[], boxes=[], attempts=[])
    _, audit = recovery_audit.recover(object(), np.zeros((32, 32, 3), dtype=np.uint8), empty)
    assert audit.detected is False
    assert audit.reason_code == "no_face_found"
    assert audit.candidate_count == 0
