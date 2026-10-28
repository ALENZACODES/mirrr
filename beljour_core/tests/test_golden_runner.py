"""The new golden-ratio gate is executable, not merely criteria-validation prose.

Synthetic images only. A missing independent identity method cannot pass the
new acceptance definition or change a historic module's result.
"""
from __future__ import annotations

import sys
from importlib import import_module
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from plumb_api.engines.shape.synthetic_heads import drawn_head
from plumb_api.vision.box_first import DetectionResult

REALFACE = Path(__file__).resolve().parents[2] / "tests" / "realface"
sys.path.insert(0, str(REALFACE))
bench_library = import_module("realface_lib")
cli = import_module("run_realface")
gate = import_module("golden_gate")


def test_optional_definition_is_loadable_for_actual_selected_run() -> None:
    active = cli.load_active_definitions(("proportions_control",), REALFACE / "pass_definitions")
    assert tuple(active) == ("proportions_control",)
    assert active["proportions_control"].content["expected_check_names"] == ["level_3.0"]
    assert "proportions_control" not in bench_library.MODULES
    assert "proportions_control" in bench_library.OPTIONAL_MODULES


def test_without_independent_identity_measurement_is_not_quality_pass() -> None:
    xyz, image = drawn_head(0, width=220, height=240)
    observed = gate.measure(image, xyz[:, :2], detected_faces=1)
    assert observed["level"] == 3.0
    assert observed["identity_similarity"] is None
    assert observed["identity_source"] == "unavailable"
    assert observed["reason_code"] == "identity_evidence_missing"
    assert isinstance(observed["fold_count"], int)
    assert observed["nan"] is False
    assert observed["target_ratio_distance_reduction"] is not None
    assert not gate.qualifies(observed)
    definition = cli.load_active_definitions(("proportions_control",), REALFACE / "pass_definitions")[
        "proportions_control"
    ]
    stamped = {**observed, "check": "level_3.0", "metric_pass": gate.qualifies(observed),
               "definition_sha256": definition.sha256}
    assert definition.row_problems(stamped)


def test_multi_face_never_forges_bystander_clearance() -> None:
    xyz, image = drawn_head(0, width=220, height=240)
    measured = gate.measure(image, xyz[:, :2], detected_faces=2)
    assert measured["bystanders_unchanged"] is False
    assert not gate.qualifies(measured)


@pytest.mark.parametrize("identity", (float("nan"), float("inf"), -0.1, 1.1, True))
def test_independent_evidence_input_is_bounded(identity: object) -> None:
    xyz, image = drawn_head(0, width=220, height=240)
    with pytest.raises(ValueError):
        gate.measure(image, xyz[:, :2], detected_faces=1, independent_identity=identity)


def test_bench_runs_new_row_and_leaves_historic_denominator_intact(tmp_path, monkeypatch) -> None:
    xyz, pixels = drawn_head(0, width=220, height=240)
    photo = tmp_path / "drawn.png"
    Image.fromarray(pixels).save(photo)
    normalized = xyz / np.array([pixels.shape[1], pixels.shape[0], pixels.shape[1]])

    class DrawnDetector:
        def __init__(self, models: Path) -> None:
            self.models = models

        def detect(self, image: np.ndarray) -> DetectionResult:
            assert image.shape == pixels.shape
            return DetectionResult(faces=[normalized], used_fallback=True)

    monkeypatch.setattr(bench_library, "Detectors", DrawnDetector)
    bench = bench_library.Bench(tmp_path, modules=("landmarks", "proportions_control"), run_id="drawn-run")
    face = bench_library.Face(photo, "synthetic", "own", "ordinary", row={"face_id": "single-frozen"})
    rows = bench.run(face)
    proof = [row for row in rows if row["module"] == "proportions_control"]
    assert len(proof) == 1
    assert proof[0]["check"] == "level_3.0"
    assert proof[0]["pass"] is False
    assert proof[0]["identity_similarity"] is None
    assert proof[0]["definition_sha256"] == bench.definitions["proportions_control"].sha256
    assert {row["face_id"] for row in rows} == {"single-frozen"}
    assert len([row for row in rows if row["module"] == "landmarks" and row["check"] == "detect"]) == 1


def test_no_face_adds_failed_optional_gate_row_without_inflating_count(tmp_path, monkeypatch) -> None:
    photo = tmp_path / "empty.png"
    Image.fromarray(np.zeros((96, 96, 3), dtype=np.uint8)).save(photo)

    class EmptyDetector:
        def __init__(self, models: Path) -> None:
            self.models = models

        def detect(self, image: np.ndarray) -> DetectionResult:
            return DetectionResult()

    monkeypatch.setattr(bench_library, "Detectors", EmptyDetector)
    bench = bench_library.Bench(tmp_path, modules=("landmarks", "proportions_control"), run_id="empty-run")
    rows = bench.run(bench_library.Face(photo, "synthetic", "own", "ordinary",
                                        row={"face_id": "one-frozen-face"}))
    proof = [row for row in rows if row["module"] == "proportions_control"]
    assert len(proof) == 1
    assert proof[0]["check"] == "dependency_missing" and proof[0]["pass"] is False
    assert {row["face_id"] for row in rows} == {"one-frozen-face"}


def test_multiface_reference_labels_are_supplied_and_frozen() -> None:
    scope = import_module("face_set")
    runs = import_module("run_state")
    manifest = bench_library.Face(Path("/synthetic/not-loaded.png"), "synthetic", "own", "ordinary",
                                  row={"multi_face": "yes", "derived_n_faces_yunet": "3"})
    assert runs.face_labels(manifest)["multi_face"] == "yes"
    manifest.row.pop("multi_face")
    assert runs.face_labels(manifest)["multi_face"] == "unknown"
    payload = ("sha256,multi_face\n" + "0" * 64 + ",yes\n").encode("utf8")
    sidecar = scope.parse_sidecar(payload)
    assert sidecar.rows["0" * 64]["multi_face"] == "yes"
    with pytest.raises(scope.ScopeError, match="multi_face"):
        scope.parse_sidecar(payload.replace(b",yes", b",maybe"))
