"""R12 runner integration with drawn fixtures and mocked runtime adapters.

Pre-run definition: actual region, turn and Enhance engines must emit complete,
finite scalar observations under their committed rule schema; missing inputs,
definitions, metadata and incompatible streams cannot produce an accepted PASS.
Face set: one generated 478-point mesh/grid per test in a temporary external folder.
No real image, model, credential or network is opened. Author: John Khan.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest
from PIL import Image

from lab.python.beljour_lab.face_harness import synthetic_case
from plumb_api.vision.box_first import DetectionResult, FaceBox

REALFACE = Path(__file__).resolve().parents[2] / "tests" / "realface"
sys.path.insert(0, str(REALFACE))
import gates  # noqa: E402
import realface_lib as lib  # noqa: E402
import report  # noqa: E402
import run_realface as cli  # noqa: E402
import run_state  # noqa: E402

MODULES = ("landmarks", "regions", "warp_turn", "enhance")


@pytest.fixture
def drawn(tmp_path, monkeypatch):
    xyz, image = synthetic_case(3, width=96, height=108)
    # The R6 synthetic mesh contains deliberately wide support points; make this
    # fixture fully visible to exercise valid detection without changing its topology.
    xyz[:, 0] = 48 + (xyz[:, 0] - 48) * 0.6
    xyz[:, 2] *= 0.6
    normalized = xyz / np.array([96, 108, 96])
    calls = []

    class DrawnDetector:
        def __init__(self, models):
            calls.append(("mock_init", str(models)))

        def detect(self, rgb):
            assert rgb.dtype == np.uint8 and rgb.shape == image.shape
            calls.append(("mock_detect", rgb.shape))
            return DetectionResult([normalized.copy()], [{}], [FaceBox(8, 12, 80, 84)], [], False)

    monkeypatch.setattr(lib, "Detectors", DrawnDetector)
    path = tmp_path / "drawn.png"
    Image.fromarray(image).save(path)
    face = lib.Face(path, "drawn", "own work", "synthetic", gender="female", age="30-39",
                    row={"face_id": "synthetic-face", "monk": "6", "size_slice": "large",
                         "yaw_slice": "frontal", "occlusion": "none"})
    bench = lib.Bench(tmp_path / "absent-models", MODULES, run_id="synthetic-run")
    return SimpleNamespace(bench=bench, face=face, image=image, xyz=xyz, calls=calls, root=tmp_path)


def test_actual_region_turn_enhance_rows_satisfy_the_written_schema(drawn):
    rows = drawn.bench.run(drawn.face)
    expected = {"landmarks": 2, "regions": 1, "warp_turn": 4, "enhance": 3}
    assert {name: sum(row["module"] == name for row in rows) for name in MODULES} == expected
    assert all(row["check"] != "exception" for row in rows)
    for row in rows:
        assert drawn.bench.definitions[row["module"]].row_problems(row) == [], row
        assert row["metric_pass"] is True
        assert row["face_id"] == "synthetic-face" and row["run_id"] == "synthetic-run"
    json.dumps(rows, allow_nan=False)
    assert len(drawn.calls) == 2


def test_turn_rows_measure_the_final_renderer_and_nonzero_effect(drawn):
    rows = [row for row in drawn.bench.run(drawn.face) if row["module"] == "warp_turn"]
    assert {row["check"] for row in rows} == {s[0] for s in lib.TURN_SETTINGS}
    for row in rows:
        assert row["shape_ok"] and row["q1_pass"] and row["q3_pass"]
        assert row["q4_pass"] and row["q4_occluder_pass"] and row["effect_pass"]
        assert row["fold"] is False and row["nan"] is False
        assert row["turn_metrics"]["max_move_px"] > 0
        assert row["strength_used"] == row["turn_metrics"]["strength_used"]


def test_enhance_rows_capture_no_op_normal_and_no_exposure(drawn):
    rows = [row for row in drawn.bench.run(drawn.face) if row["module"] == "enhance"]
    assert {row["check"] for row in rows} == set(lib.ENHANCE_MODES)
    for row in rows:
        assert row["condition"] == "normal"
        assert row["normal_preserved"] is True and row["exposure_applied"] is False
        assert row["mean_abs_change"] == 0 and row["clip_increase"] == 0
        assert row["shape_ok"] and row["detail_kept"]


def test_unreadable_image_emits_failure_for_every_requested_module(drawn):
    drawn.face.path.write_bytes(b"not an image")
    rows = drawn.bench.run(drawn.face)
    assert {r["module"] for r in rows} == set(MODULES)
    assert all(r["metric_pass"] is False for r in rows)
    assert rows[0]["check"] == "open"
    assert len(drawn.calls) == 1, "unreadable images must not invoke a detector"


def test_missing_detection_emits_dependency_failures_without_engine_calls(drawn, monkeypatch):
    monkeypatch.setattr(drawn.bench.det, "detect", lambda _: DetectionResult())
    rows = drawn.bench.run(drawn.face)
    assert {r["module"] for r in rows} == set(MODULES)
    assert all(not r["metric_pass"] for r in rows)
    assert rows[0]["check"] == "detect" and rows[0]["detected"] is False
    assert all(r["check"] == "dependency_missing" for r in rows[1:])


def test_detector_failure_becomes_failed_rows_instead_of_dropping_the_face(drawn, monkeypatch):
    def broken(_):
        raise ValueError("synthetic detector refusal")
    monkeypatch.setattr(drawn.bench.det, "detect", broken)
    rows = drawn.bench.run(drawn.face)
    assert {r["module"] for r in rows} == set(MODULES)
    assert all(r["metric_pass"] is False for r in rows)
    assert any(r["module"] == "landmarks" and "ValueError" in r.get("error", "") for r in rows)


def test_invalid_mesh_geometry_becomes_failed_rows_without_aborting(drawn, monkeypatch):
    invalid = drawn.xyz / np.array([96, 108, 96])
    invalid[473] = invalid[468]
    result = DetectionResult([invalid], [{}], [], [], False)
    monkeypatch.setattr(drawn.bench.det, "detect", lambda _: result)
    rows = drawn.bench.run(drawn.face)
    invalid_rows = [r for r in rows if r["module"] == "landmarks" and r["check"] != "detect"]
    assert invalid_rows and all(not r["metric_pass"] for r in invalid_rows)
    assert all(not r["metric_pass"] for r in rows if r["module"] != "landmarks")


def test_fold_refusal_or_undefined_row_cannot_satisfy_a_quality_definition(drawn):
    d = drawn.bench.definitions["warp_turn"]
    row = next(r for r in drawn.bench.run(drawn.face) if r["module"] == "warp_turn")
    assert not d.row_problems(row)
    for bad in ({"fold": True}, {"effect_pass": False}, {"strength_used": 0}, {"check": "exception"}):
        assert d.row_problems({**row, **bad})


def test_report_has_unproven_banner_without_gate_evidence_and_no_image_filenames(drawn):
    rows = drawn.bench.run(drawn.face)
    text = report.markdown(rows, list(MODULES), title="Synthetic runner verification", notes=[])
    assert "Quality verdict: **UNPROVEN**" in text
    assert ".png" not in text
    assert "Detection by face size" in text and "Detection by annotated yaw" in text
    assert "Detection by occlusion" in text and "never inferred" in text


def test_predicted_face_size_does_not_supply_a_missing_reference_annotation(drawn, monkeypatch):
    drawn.face.row.pop("size_slice")
    found = drawn.bench.det.detect(drawn.image)
    found.boxes = [FaceBox(0, 0, 160, 180)]
    monkeypatch.setattr(drawn.bench.det, "detect", lambda _: found)
    drawn.bench.modules = ("landmarks",)
    rows = drawn.bench.run(drawn.face)
    detection = next(row for row in rows if row["check"] == "detect")
    assert detection["size"] == "unknown" and detection["size_source"] == "unknown"
    assert detection["predicted_size"] == "large_ge128"
    text = report.markdown(rows, ["landmarks"], title="Synthetic annotation test", notes=[])
    assert "Detection by face size: unknown" in text
    assert "YuNet-predicted size diagnostic (not reference labels or acceptance evidence): large_ge128" in text


def test_cli_missing_models_skips_without_calling_detector(tmp_path, monkeypatch, capsys):
    def forbid(*args, **kwargs):
        pytest.fail("runtime construction is forbidden in this synthetic missing-model test")
    monkeypatch.setattr(lib, "Detectors", forbid)
    code = cli.main(["--faces", str(tmp_path), "--modules", "regions"])
    output = capsys.readouterr()
    assert code == 0 and "SKIPPED" in output.out and "no PASS" in output.out


def test_cli_missing_definition_refuses_before_missing_model_skip(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(lib, "Detectors", lambda *_: pytest.fail("no runtime may load"))
    code = cli.main(["--faces", str(tmp_path), "--modules", "regions", "--definitions", str(tmp_path / "absent")])
    output = capsys.readouterr()
    assert code == 2 and "UNPROVEN" in output.err and "definition" in output.err
    assert "SKIPPED" not in output.out


def test_cli_definition_validation_reports_no_measurement(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(lib, "Detectors", lambda *_: pytest.fail("validation must not load a model"))
    code = cli.main(["--faces", str(tmp_path), "--modules", "enhance", "--validate-definitions"])
    output = capsys.readouterr()
    assert code == 0
    assert "No real-face quality result has been measured" in output.out
    assert "P0 PASS" not in output.out


def test_run_all_rejects_legacy_resume_before_constructing_runtime(drawn, monkeypatch):
    defs = drawn.bench.definitions
    plan = run_state.freeze([drawn.face], defs, lib.API.parent, max_side=lib.MAX_SIDE, include=("synthetic",))
    stream = drawn.root / "old.jsonl"
    stream.write_text(json.dumps({"module": "regions", "pass": True}) + "\n")
    monkeypatch.setattr(lib, "Detectors", lambda *_: pytest.fail("incompatible resume must be rejected first"))
    with pytest.raises(ValueError, match="unversioned|incompatible"):
        lib.run_all([drawn.face], drawn.root, MODULES, stream=stream, definitions=defs, plan=plan)


def test_run_all_requires_exact_definition_set_before_inference(drawn, monkeypatch):
    monkeypatch.setattr(lib, "Detectors", lambda *_: pytest.fail("definitions must be checked first"))
    with pytest.raises(ValueError, match="definition"):
        lib.run_all([drawn.face], drawn.root, MODULES, definitions={"regions": drawn.bench.definitions["regions"]})


def test_no_labels_or_baseline_cannot_turn_real_engine_rows_into_pass(drawn):
    drawn.face.row.pop("monk")
    drawn.face.row.pop("yaw_slice")
    drawn.face.row.pop("occlusion")
    plan = run_state.freeze([drawn.face], drawn.bench.definitions, lib.API.parent,
                            max_side=lib.MAX_SIDE, include=("synthetic",))
    rows = drawn.bench.run(drawn.face)
    evidence = gates.evaluate(rows, drawn.bench.definitions, plan)
    assert evidence["p0_status"] != "PASS"
    assert evidence["regression"]["status"] == "UNPROVEN"
    assert all(g["status"] != "PASS" for g in evidence["gates"])
    assert any("monk" in note for g in evidence["gates"] for note in g["missing_evidence"])


def test_malformed_baseline_is_not_accepted_as_regression_evidence(drawn):
    plan = run_state.freeze([drawn.face], drawn.bench.definitions, lib.API.parent,
                            max_side=lib.MAX_SIDE, include=("synthetic",))
    current = gates.evaluate(drawn.bench.run(drawn.face), drawn.bench.definitions, plan)
    for malformed in ([], 3, "old report"):
        status, reasons = gates.compare_baseline(current, malformed)
        assert status == "UNPROVEN" and reasons


def test_detector_adapter_calls_yunet_then_cropped_mesh(monkeypatch):
    detector = object.__new__(lib.Detectors)
    calls = []
    image = np.full((240, 320, 3), 100, dtype=np.uint8)
    xyz, _ = synthetic_case(3, width=96, height=108)
    xyz[:, 0] = 48 + (xyz[:, 0] - 48) * 0.6
    mesh = xyz / np.array([96, 108, 96])

    def boxes(rgb):
        calls.append(("box", rgb.shape))
        return [np.array([80, 50, 100, 120])]

    def landmarks(rgb):
        calls.append(("mesh", rgb.shape))
        return [mesh], [{"synthetic": 1.0}]

    monkeypatch.setattr(detector, "boxes", boxes)
    monkeypatch.setattr(detector, "_landmarks", landmarks)
    found = detector.detect(image)
    assert calls[0] == ("box", image.shape)
    assert calls[1][0] == "mesh" and calls[1][1] != image.shape
    assert calls[1][1][0] == calls[1][1][1]
    assert len(found.faces) == 1 and not found.used_fallback
    assert found.blendshapes == [{"synthetic": 1.0}]


def test_cli_malformed_baseline_refuses_before_inference(drawn, monkeypatch, capsys):
    model_dir = drawn.root / "_models"
    model_dir.mkdir()
    for name in ("face_landmarker.task", "yunet_2023mar.onnx"):
        (model_dir / name).write_bytes(b"synthetic availability sentinel, never loaded")
    baseline = drawn.root / "bad-baseline.json"
    baseline.write_text("[]")
    monkeypatch.setitem(sys.modules, "mediapipe", SimpleNamespace())
    monkeypatch.setattr(lib, "discover", lambda *_: [drawn.face])
    monkeypatch.setattr(lib, "run_all", lambda *args, **kwargs: pytest.fail("invalid baseline must stop before inference"))
    code = cli.main(["--faces", str(drawn.root), "--modules", "regions", "--baseline", str(baseline)])
    output = capsys.readouterr()
    assert code == 2 and "UNPROVEN" in output.err
